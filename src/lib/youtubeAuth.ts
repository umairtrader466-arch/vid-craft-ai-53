import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = 'youtube_oauth_tokens';
const REDIRECT_URI = `${window.location.origin}/youtube-callback`;

interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getStoredTokens(): YouTubeTokens | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function storeTokens(tokens: YouTubeTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isTokenExpired(): boolean {
  const tokens = getStoredTokens();
  if (!tokens) return true;
  
  // Consider expired if less than 5 minutes remaining
  return Date.now() > tokens.expiresAt - 5 * 60 * 1000;
}

export async function initiateYouTubeAuth(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ authUrl: string }>('youtube-auth', {
    body: { 
      action: 'get-auth-url',
      redirectUri: REDIRECT_URI,
    },
  });

  if (error || !data?.authUrl) {
    throw new Error(error?.message || 'Failed to get YouTube auth URL');
  }

  // Open OAuth popup
  const width = 600;
  const height = 700;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  window.open(
    data.authUrl,
    'youtube-auth',
    `width=${width},height=${height},left=${left},top=${top},popup=1`
  );
}

export async function exchangeCodeForTokens(code: string): Promise<YouTubeTokens> {
  const { data, error } = await supabase.functions.invoke<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }>('youtube-auth', {
    body: { 
      action: 'exchange-code',
      code,
      redirectUri: REDIRECT_URI,
    },
  });

  if (error || !data) {
    throw new Error(error?.message || 'Failed to exchange code for tokens');
  }

  const tokens: YouTubeTokens = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };

  storeTokens(tokens);
  return tokens;
}

export async function refreshAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data, error } = await supabase.functions.invoke<{
    accessToken: string;
    expiresIn: number;
  }>('youtube-auth', {
    body: { 
      action: 'refresh-token',
      refreshToken: tokens.refreshToken,
    },
  });

  if (error || !data) {
    clearTokens();
    throw new Error('Failed to refresh token - please re-authenticate');
  }

  const updatedTokens: YouTubeTokens = {
    ...tokens,
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
  };

  storeTokens(updatedTokens);
  return data.accessToken;
}

export async function getValidAccessToken(): Promise<string> {
  const tokens = getStoredTokens();
  
  if (!tokens) {
    throw new Error('Not authenticated with YouTube');
  }

  if (isTokenExpired()) {
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
    title: string;
    privacyStatus: string;
  }>('youtube-upload', {
    body: { videoUrl, topic, script, accessToken, privacyStatus },
  });

  if (error || !data?.success) {
    throw new Error(error?.message || 'Failed to upload to YouTube');
  }

  return {
    videoId: data.videoId,
    youtubeUrl: data.youtubeUrl,
  };
}
