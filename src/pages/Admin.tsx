import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Users,
  Settings,
  Film,
  Shield,
  Loader2,
  Save,
} from "lucide-react";

interface UserRow {
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  monthlyLimit: number;
  monthlyCount: number;
  createdAt: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [elevenlabsEnabled, setElevenlabsEnabled] = useState(true);
  const [defaultLimit, setDefaultLimit] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingLimits, setEditingLimits] = useState<Record<string, number>>({});

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch all users via edge function (admin-only)
      const { data: usersData, error: usersError } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list-users' },
      });

      if (usersError) throw usersError;
      setUsers(usersData?.users || []);

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('key, value');

      if (settingsData) {
        settingsData.forEach((s) => {
          const val = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
          if (s.key === 'elevenlabs_enabled') setElevenlabsEnabled(val === 'true');
          if (s.key === 'default_monthly_video_limit') setDefaultLimit(parseInt(val) || 10);
        });
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast({ title: "Error loading admin data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
      return;
    }
    if (!roleLoading && isAdmin) {
      fetchData();
    }
  }, [roleLoading, isAdmin, navigate, fetchData]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await supabase
        .from('app_settings')
        .update({ value: JSON.stringify(elevenlabsEnabled), updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('key', 'elevenlabs_enabled');

      await supabase
        .from('app_settings')
        .update({ value: JSON.stringify(defaultLimit), updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('key', 'default_monthly_video_limit');

      toast({ title: "Settings saved!" });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateUserLimit = async (userId: string) => {
    const newLimit = editingLimits[userId];
    if (newLimit === undefined) return;

    try {
      const { error } = await supabase
        .from('user_limits')
        .update({ monthly_video_limit: newLimit, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.userId === userId ? { ...u, monthlyLimit: newLimit } : u
      ));
      setEditingLimits(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      toast({ title: "User limit updated!" });
    } catch {
      toast({ title: "Failed to update limit", variant: "destructive" });
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const totalVideosThisMonth = users.reduce((sum, u) => sum + u.monthlyCount, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">Manage users, limits, and settings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Film className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalVideosThisMonth}</p>
                <p className="text-xs text-muted-foreground">Videos This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Settings className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{elevenlabsEnabled ? 'On' : 'Off'}</p>
                <p className="text-xs text-muted-foreground">ElevenLabs Status</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Settings */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Global Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">ElevenLabs Voice</Label>
                <p className="text-xs text-muted-foreground">
                  When disabled, users will only see TTSMP3 voices
                </p>
              </div>
              <Switch
                checked={elevenlabsEnabled}
                onCheckedChange={setElevenlabsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Default Monthly Video Limit</Label>
                <p className="text-xs text-muted-foreground">
                  Applied to new users on signup
                </p>
              </div>
              <Input
                type="number"
                min={1}
                value={defaultLimit}
                onChange={(e) => setDefaultLimit(parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="bg-gradient-primary hover:opacity-90"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Videos This Month</TableHead>
                    <TableHead className="text-center">Monthly Limit</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.userId}>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{u.displayName || '—'}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          u.role === 'admin' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={u.monthlyCount >= u.monthlyLimit ? 'text-destructive font-bold' : ''}>
                          {u.monthlyCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min={0}
                          value={editingLimits[u.userId] ?? u.monthlyLimit}
                          onChange={(e) => setEditingLimits(prev => ({
                            ...prev,
                            [u.userId]: parseInt(e.target.value) || 0,
                          }))}
                          className="w-20 mx-auto text-center"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {editingLimits[u.userId] !== undefined && editingLimits[u.userId] !== u.monthlyLimit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateUserLimit(u.userId)}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
