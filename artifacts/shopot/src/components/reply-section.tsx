import { useState } from "react";
import { useGetReplies, useCreateReply, getGetRepliesQueryKey, getGetWhispersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { formatTimeAgo, cn } from "@/lib/utils";
import { Input } from "./ui-elements";

export function ReplySection({ whisperId }: { whisperId: string }) {
  const { data, isLoading } = useGetReplies(whisperId);
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useCreateReply({
    mutation: {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: getGetRepliesQueryKey(whisperId) });
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() }); // update counts
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({ id: whisperId, data: { content } });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }} 
      animate={{ opacity: 1, height: "auto" }} 
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 pt-4 border-t border-white/5 space-y-4 overflow-hidden"
    >
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data?.replies.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground/50 py-2">Пока нет ответов...</p>
        ) : (
          data?.replies.map((reply) => (
            <div key={reply.id} className="bg-black/20 rounded-xl p-3 text-sm flex flex-col gap-1 border border-white/5">
              <span className={cn("text-foreground/90", reply.isOwn && "text-primary/90")}>
                {reply.content}
              </span>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground/60">
                <span>{formatTimeAgo(reply.createdAt)}</span>
                {reply.isOwn && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px]">Ваш</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Оставить ответ..."
          className="pr-12 h-10 bg-black/40 text-sm"
          disabled={createMutation.isPending}
        />
        <button 
          type="submit" 
          disabled={!content.trim() || createMutation.isPending}
          className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </motion.div>
  );
}
