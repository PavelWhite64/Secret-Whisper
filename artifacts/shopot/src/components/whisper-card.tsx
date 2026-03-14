import { useState } from "react";
import { Heart, Flame, MessageCircle, MoreHorizontal, Hourglass, Skull } from "lucide-react";
import { useReactToWhisper, getGetWhispersQueryKey, getGetTopWhispersQueryKey, getGetProfileQueryKey, getGetMeQueryKey, type WhisperResponse, type UserResponse } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCountdown, TimeColor } from "@/hooks/use-countdown";
import { cn, formatTimeAgo } from "@/lib/utils";
import { ReplySection } from "./reply-section";
import { ExtendDialog, KillDialog } from "./market-dialogs";
import { AnimatePresence } from "framer-motion";

interface Props {
  whisper: WhisperResponse;
  currentUser: UserResponse | null;
}

export function WhisperCard({ whisper, currentUser }: Props) {
  const { timeLeft, color, isExpired } = useCountdown(whisper.createdAt, whisper.expiresAt);
  const [showReplies, setShowReplies] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [showKill, setShowKill] = useState(false);
  const queryClient = useQueryClient();

  const reactMutation = useReactToWhisper({
    mutation: {
      onSuccess: () => {
        // Optimistic update would be better here, but invalidation works fine for now
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTopWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        if (whisper.isOwn) {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      }
    }
  });

  const handleReact = (type: "heart" | "fire" | "wow") => {
    reactMutation.mutate({ id: whisper.id, data: { type } });
  };

  const colorStyles: Record<TimeColor, string> = {
    green: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    red: "text-destructive bg-destructive/10 border-destructive/20",
    gray: "text-muted-foreground bg-white/5 border-white/10"
  };

  if (isExpired) return null; // Whisper is dead, hide it

  return (
    <>
      <div className="glass-panel p-5 sm:p-6 transition-all duration-300 hover:border-primary/30 group">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={cn("px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5", colorStyles[color])}>
              <Hourglass className="w-3 h-3" />
              {timeLeft}
            </div>
            {whisper.isOwn && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70 bg-primary/10 px-2 py-1 rounded border border-primary/20">
                Ваш
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60 font-medium bg-black/40 px-2 py-1 rounded border border-white/5">
              {whisper.lifetime}
            </span>
            
            {currentUser && (
              <div className="flex gap-1">
                <button
                  onClick={() => setShowExtend(true)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-accent/10 text-accent hover:bg-accent hover:text-white rounded-lg transition-colors text-xs font-medium border border-accent/20 hover:border-accent"
                  title="Защитить — добавить время (1🪙 = +15 мин)"
                >
                  <Hourglass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">+15мин</span>
                </button>
                <button
                  onClick={() => setShowKill(true)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors text-xs font-medium border border-destructive/20 hover:border-destructive"
                  title={whisper.isOwn ? "Убить свой шёпот бесплатно" : "Проклясть — убрать время (1🪙 = −15 мин)"}
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{whisper.isOwn ? "Убить" : "−15мин"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[60px] flex items-center justify-center py-4">
          <p className="text-lg sm:text-xl font-serif text-center leading-relaxed text-foreground/90 px-4">
            "{whisper.content}"
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center border-t border-white/5 pt-4">
          <div className="flex gap-2 sm:gap-3">
            <button onClick={() => handleReact("heart")} disabled={reactMutation.isPending} className="flex items-center gap-1.5 text-muted-foreground hover:text-rose-400 bg-white/5 hover:bg-rose-400/10 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-transparent hover:border-rose-400/20 disabled:opacity-50">
              <Heart className="w-4 h-4" /> {whisper.reactions.heart}
            </button>
            <button onClick={() => handleReact("fire")} disabled={reactMutation.isPending} className="flex items-center gap-1.5 text-muted-foreground hover:text-orange-400 bg-white/5 hover:bg-orange-400/10 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-transparent hover:border-orange-400/20 disabled:opacity-50">
              <Flame className="w-4 h-4" /> {whisper.reactions.fire}
            </button>
            <button onClick={() => handleReact("wow")} disabled={reactMutation.isPending} className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-400 bg-white/5 hover:bg-blue-400/10 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-transparent hover:border-blue-400/20 disabled:opacity-50">
              <span className="text-sm leading-none -mt-0.5">😮</span> {whisper.reactions.wow}
            </button>
          </div>

          <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-medium px-2 py-1.5 transition-colors">
            <MessageCircle className="w-4 h-4" /> {whisper.replyCount} ответов
          </button>
        </div>

        {/* Inline Replies */}
        <AnimatePresence>
          {showReplies && <ReplySection whisperId={whisper.id} />}
        </AnimatePresence>
      </div>

      <ExtendDialog isOpen={showExtend} onClose={() => setShowExtend(false)} whisperId={whisper.id} userCoins={currentUser?.coins ?? 0} />
      <KillDialog isOpen={showKill} onClose={() => setShowKill(false)} whisperId={whisper.id} isOwn={whisper.isOwn ?? false} userCoins={currentUser?.coins ?? 0} />
    </>
  );
}
