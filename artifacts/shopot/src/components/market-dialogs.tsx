import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hourglass, Skull } from "lucide-react";
import { useExtendWhisper, useKillWhisper, getGetWhispersQueryKey, getGetTopWhispersQueryKey, getGetProfileQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "./ui-elements";
import { toast } from "sonner";

interface ExtendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  whisperId: string;
}

export function ExtendDialog({ isOpen, onClose, whisperId }: ExtendDialogProps) {
  const [hours, setHours] = useState(1);
  const queryClient = useQueryClient();
  
  const extendMutation = useExtendWhisper({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTopWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast.success(`Шёпот продлён. Осталось ${data.coinsRemaining} монет.`);
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.data?.error || "Не удалось продлить шёпот");
      }
    }
  });

  const cost = hours * 5;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-sm rounded-3xl p-6 relative z-10 border-t border-accent/30">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_20px_-5px_rgba(255,50,200,0.5)] mb-4">
                <Hourglass className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Продлить жизнь</h2>
              <p className="text-sm text-muted-foreground mt-2">Каждый час стоит 5 монет. Они будут списаны с вашего счёта.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">На сколько часов продлить?</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max="24" 
                    value={hours} 
                    onChange={(e) => setHours(parseInt(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <div className="w-16 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 font-bold text-lg">
                    {hours}
                  </div>
                </div>
              </div>

              <div className="bg-accent/10 rounded-xl p-4 flex justify-between items-center border border-accent/20">
                <span className="text-sm text-accent-foreground/80">Итоговая стоимость:</span>
                <span className="font-bold text-accent text-xl flex items-center gap-1">
                  🪙 {cost}
                </span>
              </div>

              <Button 
                variant="market" 
                className="w-full h-12 text-base"
                isLoading={extendMutation.isPending}
                onClick={() => extendMutation.mutate({ id: whisperId, data: { hours } })}
              >
                Оплатить жизнь
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface KillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  whisperId: string;
  isOwn: boolean;
}

export function KillDialog({ isOpen, onClose, whisperId, isOwn }: KillDialogProps) {
  const queryClient = useQueryClient();
  
  const killMutation = useKillWhisper({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTopWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast.success(data.message || "Шёпот уничтожен.");
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.data?.error || "Не удалось уничтожить шёпот");
      }
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-sm rounded-3xl p-6 relative z-10 border-t border-destructive/30">
            
            <div className="flex flex-col items-center text-center mb-6 mt-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive shadow-[0_0_20px_-5px_rgba(255,50,50,0.5)] mb-4">
                <Skull className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                {isOwn ? "Убить свой шёпот?" : "Заказное убийство"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {isOwn 
                  ? "Шёпот исчезнет навсегда. Это действие необратимо и бесплатно." 
                  : "Вы можете оборвать жизнь этого шёпота прямо сейчас за 20 монет. Это необратимо."}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Отмена
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                isLoading={killMutation.isPending}
                onClick={() => killMutation.mutate({ id: whisperId })}
              >
                {isOwn ? "Убить (Бесплатно)" : "Убить (20 🪙)"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
