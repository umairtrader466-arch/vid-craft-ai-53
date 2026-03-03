import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AppSettings {
  elevenlabsEnabled: boolean;
  longVideoEnabled: boolean;
  defaultMonthlyVideoLimit: number;
  minVideoDurationSeconds: number;
  maxVideoDurationSeconds: number;
}

interface UserLimits {
  monthlyVideoLimit: number;
  monthlyVideoCount: number;
  isBanned: boolean;
}

export function useAppSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    elevenlabsEnabled: true,
    longVideoEnabled: true,
    defaultMonthlyVideoLimit: 10,
    minVideoDurationSeconds: 30,
    maxVideoDurationSeconds: 1200,
  });
  const [userLimits, setUserLimits] = useState<UserLimits>({
    monthlyVideoLimit: 10,
    monthlyVideoCount: 0,
    isBanned: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
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
          longVideoEnabled: mapped['long_video_enabled'] !== 'false',
          defaultMonthlyVideoLimit: parseInt(mapped['default_monthly_video_limit'] || '10'),
          minVideoDurationSeconds: parseInt(mapped['min_video_duration_seconds'] || '30'),
          maxVideoDurationSeconds: parseInt(mapped['max_video_duration_seconds'] || '1200'),
        });
      }

      const { data: limitsData } = await supabase
        .from('user_limits')
        .select('monthly_video_limit, is_banned')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: countData } = await supabase.rpc('get_monthly_video_count', {
        _user_id: user.id,
      });

      setUserLimits({
        monthlyVideoLimit: limitsData?.monthly_video_limit ?? 10,
        monthlyVideoCount: (countData as number) ?? 0,
        isBanned: limitsData?.is_banned ?? false,
      });

      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  const canCreateVideo = !userLimits.isBanned && userLimits.monthlyVideoCount < userLimits.monthlyVideoLimit;
  const videosRemaining = userLimits.monthlyVideoLimit - userLimits.monthlyVideoCount;

  return { settings, userLimits, canCreateVideo, videosRemaining, loading };
}
