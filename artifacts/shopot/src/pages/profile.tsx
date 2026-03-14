import { useEffect } from "react";
import { useGetProfile } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { WhisperCard } from "@/components/whisper-card";
import { Loader2, User, Sword, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export function Profile() {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetProfile({
    query: {
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) setLocation("/");
  }, [isError, setLocation]);

  return (
    <Layout>
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 rounded-3xl border-t border-primary/30 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary shadow-[0_0_30px_-5px_rgba(120,50,255,0.5)] mb-4">
              <User className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
              {data.user.username}
            </h1>
            <p className="text-sm text-muted-foreground">Анонимный шептун</p>

            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <div className="bg-black/40 border border-accent/20 rounded-2xl p-4 flex flex-col items-center min-w-[110px]">
                <span className="text-3xl font-bold text-accent mb-1">🪙 {data.user.coins}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Монеты</span>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[110px]">
                <span className="text-3xl font-bold text-foreground mb-1">{data.stats.totalCreated ?? 0}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Создано</span>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[110px]">
                <span className="text-3xl font-bold text-foreground mb-1">{data.stats.totalReactionsReceived}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Реакций</span>
              </div>
            </div>
          </motion.div>

          {/* Economy Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-3xl p-6 border-t border-primary/20"
          >
            <h2 className="text-lg font-serif font-bold text-foreground mb-4">⚔️ Чёрный рынок</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-black/40 rounded-xl p-4 border border-white/10 flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Заработок</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-yellow-400 font-bold">+1 🪙</span> за каждую реакцию на ваш шёпот
                  </p>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 border border-accent/20 flex items-start gap-3">
                <Shield className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Защита</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-accent font-bold">1 🪙 = +15 мин</span> к жизни шёпота.
                    Тратьте сколько хотите.
                  </p>
                </div>
              </div>
              <div className="bg-black/40 rounded-xl p-4 border border-destructive/20 flex items-start gap-3">
                <Sword className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Проклятие</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="text-destructive font-bold">1 🪙 = -15 мин</span> от чужого шёпота.
                    Если время → 0, шёпот умирает.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Несколько людей могут защищать или проклинать один шёпот — начинается настоящая битва.
            </p>
          </motion.div>

          {/* Own Whispers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Ваши живые шёпоты</h2>
            <div className="space-y-6">
              {data.whispers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                  <p>У вас нет активных шёпотов.</p>
                  <p className="text-sm mt-2 opacity-60">Прошепчите что-нибудь в Ленте.</p>
                </div>
              ) : (
                data.whispers.map((whisper, index) => (
                  <motion.div
                    key={whisper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <WhisperCard whisper={whisper} currentUser={data.user} />
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </Layout>
  );
}
