import { motion } from "framer-motion";
import { Video, Sparkles } from "lucide-react";

export function Header() {
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
          <p className="text-xs text-muted-foreground">Automated YouTube Creation</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Ready to create</p>
          <p className="text-xs text-primary">Upload CSV to start</p>
        </div>
      </div>
    </motion.header>
  );
}
