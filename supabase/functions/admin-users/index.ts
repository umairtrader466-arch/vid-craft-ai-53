import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Verify the requesting user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Not authenticated');

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error('Not authenticated');

    // Check admin role
    const { data: roleData } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) throw new Error('Not authorized - admin only');

    const { action } = await req.json();

    if (action === 'list-users') {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      // Get all auth users
      const { data: { users: authUsers }, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;

      // Get profiles
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('user_id, display_name');

      // Get roles
      const { data: roles } = await adminClient
        .from('user_roles')
        .select('user_id, role');

      // Get limits
      const { data: limits } = await adminClient
        .from('user_limits')
        .select('user_id, monthly_video_limit');

      // Get monthly video counts
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: videoCounts } = await adminClient
        .from('video_topics')
        .select('user_id, status, created_at')
        .gte('created_at', monthStart)
        .in('status', ['video_complete', 'uploaded', 'uploading']);

      const countMap: Record<string, number> = {};
      (videoCounts || []).forEach((v) => {
        countMap[v.user_id] = (countMap[v.user_id] || 0) + 1;
      });

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      const roleMap: Record<string, string> = {};
      (roles || []).forEach(r => {
        if (r.role === 'admin') roleMap[r.user_id] = 'admin';
        else if (!roleMap[r.user_id]) roleMap[r.user_id] = r.role;
      });
      const limitMap = Object.fromEntries((limits || []).map(l => [l.user_id, l.monthly_video_limit]));

      const users = authUsers.map(u => ({
        userId: u.id,
        email: u.email || '',
        displayName: profileMap[u.id]?.display_name || null,
        role: roleMap[u.id] || 'user',
        monthlyLimit: limitMap[u.id] ?? 10,
        monthlyCount: countMap[u.id] || 0,
        createdAt: u.created_at,
      }));

      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('Admin error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
