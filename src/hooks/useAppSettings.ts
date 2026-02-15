import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AppSettings {
  elevenlabsEnabled: boolean;
  defaultMonthlyVideoLimit: number;
}

interface UserLimits {
  monthlyVideoLimit: number;
  monthlyVideoCount: number;
}

export function useAppSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    elevenlabsEnabled: true,
    defaultMonthlyVideoLimit: 10,
  });
  const [userLimits, setUserLimits] = useState<UserLimits>({
    monthlyVideoLimit: 10,
    monthlyVideoCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      // Fetch app settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('key, value');

      if (settingsData) {
        const mapped: Record<string, string> = {};
        settingsData.forEach((s) => {
          mapped[s.key] = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
        });

        setSettings({
          elevenlabsEnabled: mapped['elevenlabs_enabled'] === 'true',
          defaultMonthlyVideoLimit: parseInt(mapped['default_monthly_video_limit'] || '10'),
        });
      }

      // Fetch user limits
      const { data: limitsData } = await supabase
        .from('user_limits')
        .select('monthly_video_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch monthly video count
      const { data: countData } = await supabase.rpc('get_monthly_video_count', {
        _user_id: user.id,
      });

      setUserLimits({
        monthlyVideoLimit: limitsData?.monthly_video_limit ?? 10,
        monthlyVideoCount: (countData as number) ?? 0,
      });

      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  const canCreateVideo = userLimits.monthlyVideoCount < userLimits.monthlyVideoLimit;
  const videosRemaining = userLimits.monthlyVideoLimit - userLimits.monthlyVideoCount;

  return { settings, userLimits, canCreateVideo, videosRemaining, loading };
}
