import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Flame, Sparkles, Clock, ShieldAlert } from "lucide-react";
import { useCountdown } from "@/hooks/use-countdown";
import { useReactToWhisper, type WhisperResponse } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWhispersQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface WhisperCardProps {
  whisper: WhisperResponse;
}

export function WhisperCard({ whisper }: WhisperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const timeLeft = useCountdown(whisper.expiresAt);
  const isExpired = timeLeft === "Истёк";
  const queryClient = useQueryClient();

  const { mutate: reactToWhisper, isPending: isReacting } = useReactToWhisper({
    mutation: {
      onSuccess: () => {
        // Invalidate the feed to show updated reaction counts
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
      }
    }
  });

  if (isExpired) return null;

  const handleReact = (e: React.MouseEvent, type: "fire" | "heart" | "wow") => {
    e.stopPropagation();
    if (isReacting) return;
    reactToWhisper({ id: whisper.id, data: { type } });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => setIsExpanded(!isExpanded)}
      className={cn(
        "glass-panel rounded-2xl p-6 cursor-pointer group transition-all duration-300",
        whisper.isOwn && "ring-1 ring-primary/30"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-xs font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span className="animate-pulse">{timeLeft}</span>
        </div>
        <div className="flex items-center space-x-3">
          {whisper.isOwn && (
            <span className="text-xs font-medium text-primary/80 bg-primary/10 px-2 py-1 rounded border border-primary/20">
              Ваш шёпот
            </span>
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {whisper.lifetime}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <p className={cn(
          "font-serif text-2xl text-foreground/90 leading-relaxed",
          !isExpanded && "line-clamp-3"
        )}>
          "{whisper.content}"
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => handleReact(e, "heart")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-rose-500/20 text-muted-foreground hover:text-rose-400 transition-colors"
          >
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">{whisper.reactions.heart}</span>
          </button>
          <button
            onClick={(e) => handleReact(e, "fire")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-orange-500/20 text-muted-foreground hover:text-orange-400 transition-colors"
          >
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">{whisper.reactions.fire}</span>
          </button>
          <button
            onClick={(e) => handleReact(e, "wow")}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{whisper.reactions.wow}</span>
          </button>
        </div>
        
        <div className="flex items-center text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <ShieldAlert className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}
