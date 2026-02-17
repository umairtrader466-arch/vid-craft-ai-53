import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function ProfileTab() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.display_name) setDisplayName(data.display_name);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || user?.email || "U").substring(0, 2).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto space-y-6"
    >
      {/* Avatar section */}
      <div className="glass rounded-xl p-8 text-center">
        <Avatar className="w-20 h-20 mx-auto mb-4">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">{displayName || "Set your name"}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        {user?.created_at && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" />
            Member since {format(new Date(user.created_at), 'MMMM yyyy')}
          </p>
        )}
      </div>

      {/* Edit form */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Profile Information
        </h3>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">{user?.email}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-xs text-muted-foreground">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
            className="bg-secondary/50"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary hover:opacity-90">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Profile
        </Button>
      </div>
    </motion.div>
  );
}
