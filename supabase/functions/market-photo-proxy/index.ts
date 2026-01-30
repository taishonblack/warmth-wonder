const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const photoRef = url.searchParams.get("ref");

    if (!photoRef) {
      return new Response(
        JSON.stringify({ error: "Missing 'ref' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      console.error("[market-photo-proxy] GOOGLE_PLACES_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the Google Places Photo URL
    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;

    // Fetch the photo from Google (this returns a redirect to the actual image)
    const response = await fetch(googlePhotoUrl, { redirect: "follow" });

    if (!response.ok) {
      console.error(`[market-photo-proxy] Google API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch photo" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the image data and content type
    const imageData = await response.arrayBuffer();
    const contentType = response.headers.get("Content-Type") || "image/jpeg";

    // Return the image with appropriate headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[market-photo-proxy] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
