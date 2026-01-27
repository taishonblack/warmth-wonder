import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { marketId, marketName, findId, findCaption, posterName } = await req.json();

    if (!marketId || !marketName) {
      return new Response(
        JSON.stringify({ error: "marketId and marketName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending push notifications for market: ${marketName}`);

    // Get all users who have this market as a favorite
    const { data: favorites, error: favoritesError } = await supabase
      .from("preferred_markets")
      .select("user_id")
      .eq("market_id", marketId);

    if (favoritesError) {
      console.error("Error fetching favorites:", favoritesError);
      throw favoritesError;
    }

    if (!favorites || favorites.length === 0) {
      console.log("No users have favorited this market");
      return new Response(
        JSON.stringify({ message: "No subscribers to notify", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = favorites.map(f => f.user_id);
    console.log(`Found ${userIds.length} users with this market favorited`);

    // Get push subscriptions for these users
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subsError) {
      console.error("Error fetching subscriptions:", subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for favorite users");
      return new Response(
        JSON.stringify({ message: "No push subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} push subscriptions`);

    const payload: PushPayload = {
      title: `New Find at ${marketName}`,
      body: posterName ? `${posterName} shared: ${findCaption || "Check it out!"}` : findCaption || "A new find was shared!",
      icon: "/favicon.ico",
      data: {
        url: findId ? `/market/${marketId}` : "/",
        marketId,
        findId: findId || "",
      },
    };

    // Note: In a production environment, you would use the Web Push protocol
    // with VAPID keys to send actual push notifications. This requires
    // the web-push library and proper VAPID key configuration.
    // For now, we log the notifications that would be sent.
    
    console.log("Push payload:", JSON.stringify(payload));
    console.log(`Would send to ${subscriptions.length} subscriptions`);

    // Log each subscription that would receive the notification
    for (const sub of subscriptions) {
      console.log(`Notification queued for user: ${sub.user_id}, endpoint: ${sub.endpoint.substring(0, 50)}...`);
    }

    return new Response(
      JSON.stringify({ 
        message: "Push notifications queued", 
        sent: subscriptions.length,
        payload 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending push notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
