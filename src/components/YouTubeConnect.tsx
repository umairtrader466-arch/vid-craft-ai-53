import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, LogOut, Check, Loader2 } from "lucide-react";
import { 
  getStoredTokens, 
  initiateYouTubeAuth, 
  clearTokens,
  isTokenExpired
} from "@/lib/youtubeAuth";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface YouTubeConnectProps {
  privacyStatus: 'public' | 'unlisted';
  onPrivacyChange: (status: 'public' | 'unlisted') => void;
}

export function YouTubeConnect({ privacyStatus, onPrivacyChange }: YouTubeConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const tokens = await getStoredTokens();
      const expired = await isTokenExpired();
      setIsConnected(!!tokens && !expired);
      setIsChecking(false);
    };
    checkConnection();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === 'youtube-auth-success') {
        setIsConnected(true);
        toast({ title: "YouTube Connected!", description: "You can now upload videos directly to YouTube." });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await initiateYouTubeAuth();
    } catch (error) {
      toast({ title: "Connection failed", description: error instanceof Error ? error.message : "Failed to connect", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await clearTokens();
    setIsConnected(false);
    toast({ title: "Disconnected", description: "YouTube account has been disconnected." });
  };

  if (isChecking) {
    return (
      <Card className="glass card-hover">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass card-hover">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" />
          YouTube Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-success text-sm">
              <Check className="w-4 h-4" />
              <span>Connected</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Default Privacy</label>
              <Select value={privacyStatus} onValueChange={(v) => onPrivacyChange(v as 'public' | 'unlisted')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleDisconnect}>
              <LogOut className="w-3 h-3 mr-1" /> Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={isConnecting} className="w-full bg-red-600 hover:bg-red-700 text-white">
            <Youtube className="w-4 h-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect YouTube"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
