import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Sword } from "lucide-react";
import { useExtendWhisper, useKillWhisper, getGetWhispersQueryKey, getGetTopWhispersQueryKey, getGetProfileQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui-elements";
import { toast } from "sonner";

const MINUTES_PER_COIN = 15;

function formatMinutes(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes} мин`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}ч ${m}мин` : `${h}ч`;
}

interface ExtendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  whisperId: string;
  userCoins?: number;
}

export function ExtendDialog({ isOpen, onClose, whisperId, userCoins = 0 }: ExtendDialogProps) {
  const [coins, setCoins] = useState(1);
  const queryClient = useQueryClient();

  const extendMutation = useExtendWhisper({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTopWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast.success(data.message || `Шёпот защищён. Осталось ${data.coinsRemaining} 🪙`);
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.data?.error || "Не удалось защитить шёпот");
      }
    }
  });

  const minutesAdded = coins * MINUTES_PER_COIN;
  const maxCoins = Math.min(userCoins, 500);

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
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Защитить шёпот</h2>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="text-accent font-semibold">1 монета = +15 минут жизни.</span><br />
                Другие могут проклясть — устройте битву!
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <label>Сколько монет потратить?</label>
                  <span className="text-accent font-semibold">У вас: 🪙 {userCoins}</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max={Math.max(maxCoins, 1)}
                    value={Math.min(coins, maxCoins)}
                    onChange={(e) => setCoins(parseInt(e.target.value))}
                    className="flex-1 accent-accent"
                    disabled={maxCoins < 1}
                  />
                  <div className="w-14 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 font-bold text-lg text-accent">
                    {Math.min(coins, maxCoins)}
                  </div>
                </div>
              </div>

              <div className="bg-accent/10 rounded-xl p-4 flex justify-between items-center border border-accent/20">
                <div>
                  <p className="text-xs text-muted-foreground">Добавит к жизни</p>
                  <p className="font-bold text-accent text-lg">+{formatMinutes(minutesAdded)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Стоимость</p>
                  <p className="font-bold text-accent text-xl">🪙 {Math.min(coins, maxCoins)}</p>
                </div>
              </div>

              {maxCoins < 1 && (
                <p className="text-center text-sm text-destructive">Недостаточно монет. Получайте монеты за реакции на шёпоты.</p>
              )}

              <Button
                variant="market"
                className="w-full h-12 text-base"
                isLoading={extendMutation.isPending}
                disabled={maxCoins < 1}
                onClick={() => extendMutation.mutate({ id: whisperId, data: { coins: Math.min(coins, maxCoins) } })}
              >
                <Shield className="w-4 h-4 mr-2" /> Защитить за {Math.min(coins, maxCoins)} 🪙
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
  userCoins?: number;
}

export function KillDialog({ isOpen, onClose, whisperId, isOwn, userCoins = 0 }: KillDialogProps) {
  const [coins, setCoins] = useState(isOwn ? 0 : 1);
  const queryClient = useQueryClient();

  const killMutation = useKillWhisper({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTopWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast.success(data.message || "Шёпот проклят.");
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.data?.error || "Не удалось проклясть шёпот");
      }
    }
  });

  const maxCoins = Math.min(userCoins, 500);
  const effectiveCoins = isOwn ? coins : Math.max(coins, 1);
  const minutesRemoved = effectiveCoins * MINUTES_PER_COIN;

  return (
    <AnimatePresence>
      {isOwn ? (
        isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-sm rounded-3xl p-6 relative z-10 border-t border-destructive/30">
              <div className="flex flex-col items-center text-center mb-6 mt-2">
                <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive shadow-[0_0_20px_-5px_rgba(255,50,50,0.5)] mb-4">
                  <Sword className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-foreground">Убить свой шёпот?</h2>
                <p className="text-sm text-muted-foreground mt-2">Шёпот исчезнет навсегда. Это действие необратимо.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onClose}>Отмена</Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  isLoading={killMutation.isPending}
                  onClick={() => killMutation.mutate({ id: whisperId, data: { coins: 0 } })}
                >
                  Убить бесплатно
                </Button>
              </div>
            </motion.div>
          </div>
        )
      ) : (
        isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel w-full max-w-sm rounded-3xl p-6 relative z-10 border-t border-destructive/30">
              <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive shadow-[0_0_20px_-5px_rgba(255,50,50,0.5)] mb-4">
                  <Sword className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-foreground">Проклясть шёпот</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-destructive font-semibold">1 монета = -15 минут жизни.</span><br />
                  Если время упадёт до 0 — шёпот умрёт мгновенно.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <label>Сколько монет потратить?</label>
                    <span className="text-destructive font-semibold">У вас: 🪙 {userCoins}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max={Math.max(maxCoins, 1)}
                      value={Math.min(effectiveCoins, maxCoins)}
                      onChange={(e) => setCoins(parseInt(e.target.value))}
                      className="flex-1 accent-destructive"
                      disabled={maxCoins < 1}
                    />
                    <div className="w-14 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 font-bold text-lg text-destructive">
                      {Math.min(effectiveCoins, maxCoins)}
                    </div>
                  </div>
                </div>

                <div className="bg-destructive/10 rounded-xl p-4 flex justify-between items-center border border-destructive/20">
                  <div>
                    <p className="text-xs text-muted-foreground">Отнимет жизни</p>
                    <p className="font-bold text-destructive text-lg">-{formatMinutes(minutesRemoved)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Стоимость</p>
                    <p className="font-bold text-destructive text-xl">🪙 {Math.min(effectiveCoins, maxCoins)}</p>
                  </div>
                </div>

                {maxCoins < 1 && (
                  <p className="text-center text-sm text-destructive">Недостаточно монет.</p>
                )}

                <Button
                  variant="destructive"
                  className="w-full h-12 text-base"
                  isLoading={killMutation.isPending}
                  disabled={maxCoins < 1}
                  onClick={() => killMutation.mutate({ id: whisperId, data: { coins: Math.min(effectiveCoins, maxCoins) } })}
                >
                  <Sword className="w-4 h-4 mr-2" /> Проклясть за {Math.min(effectiveCoins, maxCoins)} 🪙
                </Button>
              </div>
            </motion.div>
          </div>
        )
      )}
    </AnimatePresence>
  );
}
