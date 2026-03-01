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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ArrowLeft,
  Users,
  Settings,
  Film,
  Shield,
  Loader2,
  Save,
  Trash2,
  Ban,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface UserRow {
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  monthlyLimit: number;
  monthlyCount: number;
  isBanned: boolean;
  createdAt: string;
}

interface DailyStat {
  date: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Videos",
    color: "hsl(var(--primary))",
  },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [elevenlabsEnabled, setElevenlabsEnabled] = useState(true);
  const [defaultLimit, setDefaultLimit] = useState(10);
  const [minDuration, setMinDuration] = useState(30);
  const [maxDuration, setMaxDuration] = useState(1200);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingLimits, setEditingLimits] = useState<Record<string, number>>({});
  const [videoStats, setVideoStats] = useState<DailyStat[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [usersRes, statsRes] = await Promise.all([
        supabase.functions.invoke('admin-users', { body: { action: 'list-users' } }),
        supabase.functions.invoke('admin-users', { body: { action: 'get-video-stats' } }),
      ]);

      if (usersRes.error) throw usersRes.error;
      setUsers(usersRes.data?.users || []);

      if (!statsRes.error && statsRes.data?.stats) {
        setVideoStats(statsRes.data.stats);
      }

      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('key, value');

      if (settingsData) {
        settingsData.forEach((s) => {
          const val = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
          if (s.key === 'elevenlabs_enabled') setElevenlabsEnabled(val === 'true');
          if (s.key === 'default_monthly_video_limit') setDefaultLimit(parseInt(val) || 10);
          if (s.key === 'min_video_duration_seconds') setMinDuration(parseInt(val) || 30);
          if (s.key === 'max_video_duration_seconds') setMaxDuration(parseInt(val) || 1200);
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
      const now = new Date().toISOString();
      const updates = [
        { key: 'elevenlabs_enabled', value: JSON.stringify(elevenlabsEnabled) },
        { key: 'default_monthly_video_limit', value: JSON.stringify(defaultLimit) },
        { key: 'min_video_duration_seconds', value: JSON.stringify(minDuration) },
        { key: 'max_video_duration_seconds', value: JSON.stringify(maxDuration) },
      ];

      for (const u of updates) {
        await supabase
          .from('app_settings')
          .update({ value: u.value, updated_at: now, updated_by: user?.id })
          .eq('key', u.key);
      }

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

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete-user', userId },
      });
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.userId !== userId));
      toast({ title: "User deleted" });
    } catch (err) {
      toast({ title: "Failed to delete user", description: err instanceof Error ? err.message : '', variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    setActionLoading(userId);
    try {
      const action = currentlyBanned ? 'unban-user' : 'ban-user';
      const { error } = await supabase.functions.invoke('admin-users', {
        body: { action, userId },
      });
      if (error) throw error;
      setUsers(prev => prev.map(u =>
        u.userId === userId ? { ...u, isBanned: !currentlyBanned } : u
      ));
      toast({ title: currentlyBanned ? "User unbanned" : "User banned" });
    } catch (err) {
      toast({ title: "Failed to update ban status", description: err instanceof Error ? err.message : '', variant: "destructive" });
    } finally {
      setActionLoading(null);
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

        {/* Video Production Chart */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Daily Video Production (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={videoStats}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  className="text-muted-foreground"
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} className="text-muted-foreground" fontSize={11} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(val) => new Date(val).toLocaleDateString()}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

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

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Min Video Duration (seconds)</Label>
                <p className="text-xs text-muted-foreground">
                  Minimum duration users can select (≤60s = Shorts)
                </p>
              </div>
              <Input
                type="number"
                min={15}
                max={maxDuration}
                value={minDuration}
                onChange={(e) => setMinDuration(parseInt(e.target.value) || 30)}
                className="w-24"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Max Video Duration (seconds)</Label>
                <p className="text-xs text-muted-foreground">
                  Maximum duration users can select (1200 = 20 minutes)
                </p>
              </div>
              <Input
                type="number"
                min={minDuration}
                max={1200}
                value={maxDuration}
                onChange={(e) => setMaxDuration(parseInt(e.target.value) || 1200)}
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Videos</TableHead>
                    <TableHead className="text-center">Limit</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.userId} className={u.isBanned ? 'opacity-60' : ''}>
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
                      <TableCell>
                        {u.isBanned ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive">Banned</span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={u.monthlyCount >= u.monthlyLimit ? 'text-destructive font-bold' : ''}>
                          {u.monthlyCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Input
                            type="number"
                            min={0}
                            value={editingLimits[u.userId] ?? u.monthlyLimit}
                            onChange={(e) => setEditingLimits(prev => ({
                              ...prev,
                              [u.userId]: parseInt(e.target.value) || 0,
                            }))}
                            className="w-20 text-center"
                          />
                          {editingLimits[u.userId] !== undefined && editingLimits[u.userId] !== u.monthlyLimit && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateUserLimit(u.userId)}>
                              <Save className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {u.role !== 'admin' && (
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant={u.isBanned ? "outline" : "ghost"}
                              onClick={() => handleToggleBan(u.userId, u.isBanned)}
                              disabled={actionLoading === u.userId}
                              title={u.isBanned ? "Unban user" : "Ban user"}
                            >
                              {u.isBanned ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  disabled={actionLoading === u.userId}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete <strong>{u.email}</strong>? This will remove all their data and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u.userId)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
