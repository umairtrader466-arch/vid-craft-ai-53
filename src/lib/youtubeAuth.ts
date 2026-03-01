import { supabase } from "@/integrations/supabase/client";

const REDIRECT_URI = `${window.location.origin}/youtube-callback`;

interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Cache tokens in memory for the session
let cachedTokens: YouTubeTokens | null = null;

export async function getStoredTokens(): Promise<YouTubeTokens | null> {
  if (cachedTokens) return cachedTokens;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('youtube_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) return null;

  cachedTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at).getTime(),
  };

  return cachedTokens;
}

export async function storeTokens(tokens: YouTubeTokens): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const expiresAt = new Date(tokens.expiresAt).toISOString();

  const { error } = await supabase
    .from('youtube_tokens')
    .upsert({
      user_id: user.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw new Error('Failed to save YouTube tokens');
  cachedTokens = tokens;
}

export async function clearTokens(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('youtube_tokens').delete().eq('user_id', user.id);
  }
  cachedTokens = null;
}

export async function isTokenExpired(): Promise<boolean> {
  const tokens = await getStoredTokens();
  if (!tokens) return true;
  return Date.now() > tokens.expiresAt - 5 * 60 * 1000;
}

export async function initiateYouTubeAuth(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ authUrl: string }>('youtube-auth', {
    body: { action: 'get-auth-url', redirectUri: REDIRECT_URI },
  });

  if (error || !data?.authUrl) {
    throw new Error(error?.message || 'Failed to get YouTube auth URL');
  }

  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(data.authUrl, 'youtube-auth', `width=${width},height=${height},left=${left},top=${top},popup=1`);
}

export async function exchangeCodeForTokens(code: string): Promise<YouTubeTokens> {
  const { data, error } = await supabase.functions.invoke<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>('youtube-auth', {
    body: { action: 'exchange-code', code, redirectUri: REDIRECT_URI },
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to exchange code for tokens');
  }

  const tokens: YouTubeTokens = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };

  await storeTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data, error } = await supabase.functions.invoke<{
    accessToken: string;
    expiresIn: number;
  }>('youtube-auth', {
    body: { action: 'refresh-token', refreshToken: tokens.refreshToken },
  });

  if (error || !data) {
    await clearTokens();
    throw new Error('Failed to refresh token - please re-authenticate');
  }

  const updatedTokens: YouTubeTokens = {
    ...tokens,
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };

  await storeTokens(updatedTokens);
  return data.accessToken;
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = await getStoredTokens();
  if (!tokens) throw new Error('Not authenticated with YouTube');

  if (await isTokenExpired()) {
    return await refreshAccessToken();
  }

  return tokens.accessToken;
}

export async function uploadToYouTube(
  videoUrl: string,
  topic: string,
  script: string,
  privacyStatus: 'public' | 'unlisted' = 'unlisted'
): Promise<{ videoId: string; youtubeUrl: string }> {
  const accessToken = await getValidAccessToken();

  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    videoId: string;
    youtubeUrl: string;
  }>('youtube-upload', {
    body: { videoUrl, topic, script, accessToken, privacyStatus },
  });

  if (error || !data?.success) {
    throw new Error(error?.message || 'Failed to upload to YouTube');
  }

  return { videoId: data.videoId, youtubeUrl: data.youtubeUrl };
}
