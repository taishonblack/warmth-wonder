import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  birthday: string | null;
  zip_code: string | null;
  radius_miles: number;
  created_at: string;
  updated_at: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  preferredMarkets: string[];
  loading: boolean;
  saving: boolean;
  updateProfile: (updates: Partial<Pick<Profile, 'birthday' | 'zip_code' | 'radius_miles' | 'display_name' | 'avatar_url'>>) => Promise<void>;
  addPreferredMarket: (marketName: string) => Promise<void>;
  removePreferredMarket: (marketName: string) => Promise<void>;
  togglePreferredMarket: (marketName: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferredMarkets, setPreferredMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch preferred markets
      const { data: marketsData, error: marketsError } = await supabase
        .from("preferred_markets")
        .select("market_name")
        .eq("user_id", user.id);

      if (marketsError) throw marketsError;
      setPreferredMarkets(marketsData?.map(m => m.market_name) || []);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfile = async (updates: Partial<Pick<Profile, 'birthday' | 'zip_code' | 'radius_miles' | 'display_name' | 'avatar_url'>>) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addPreferredMarket = async (marketName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("preferred_markets")
        .insert({ user_id: user.id, market_name: marketName });

      if (error) throw error;
      setPreferredMarkets(prev => [...prev, marketName]);
    } catch (error: any) {
      console.error("Error adding market:", error);
      toast({
        title: "Error adding market",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removePreferredMarket = async (marketName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("preferred_markets")
        .delete()
        .eq("user_id", user.id)
        .eq("market_name", marketName);

      if (error) throw error;
      setPreferredMarkets(prev => prev.filter(m => m !== marketName));
    } catch (error: any) {
      console.error("Error removing market:", error);
      toast({
        title: "Error removing market",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePreferredMarket = async (marketName: string) => {
    if (preferredMarkets.includes(marketName)) {
      await removePreferredMarket(marketName);
    } else {
      await addPreferredMarket(marketName);
    }
  };

  return {
    profile,
    preferredMarkets,
    loading,
    saving,
    updateProfile,
    addPreferredMarket,
    removePreferredMarket,
    togglePreferredMarket,
    refetch: fetchProfile,
  };
}
