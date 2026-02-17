import { motion } from "framer-motion";
import { Video, Sparkles, Shield, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { useAdminRole } from "@/hooks/useAdminRole";

export function DashboardHeader() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between py-6"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
          </motion.div>
        </div>
        <div>
          <h1 className="text-xl font-bold gradient-text">VideoForge AI</h1>
          <p className="text-xs text-muted-foreground">Professional Dashboard</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Button>
        )}
        <UserMenu />
      </div>
    </motion.header>
  );
}
