import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { exchangeCodeForTokens } from "@/lib/youtubeAuth";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function YouTubeCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setError('Authorization was denied or cancelled');
      return;
    }

    if (!code) {
      setStatus('error');
      setError('No authorization code received');
      return;
    }

    exchangeCodeForTokens(code)
      .then(() => {
        setStatus('success');
        // Notify parent window and close popup
        if (window.opener) {
          window.opener.postMessage({ type: 'youtube-auth-success' }, window.location.origin);
          setTimeout(() => window.close(), 1500);
        } else {
          setTimeout(() => navigate('/'), 2000);
        }
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-lg">Connecting to YouTube...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-success" />
            <p className="text-lg text-success">Successfully connected!</p>
            <p className="text-muted-foreground">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <p className="text-lg text-destructive">Connection failed</p>
            <p className="text-muted-foreground">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
