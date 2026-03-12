import { useGetProfile } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { WhisperCard } from "@/components/whisper-card";
import { Loader2, User, Coins, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export function Profile() {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError } = useGetProfile({
    query: { 
      retry: false,
    }
  });

  if (isError) {
    setLocation("/");
    return null;
  }

  return (
    <Layout>
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="glass-panel p-8 rounded-3xl border-t border-primary/30 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary shadow-[0_0_30px_-5px_rgba(120,50,255,0.5)] mb-4">
              <User className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
              {data.user.username}
            </h1>
            
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
                <span className="text-3xl font-bold text-accent mb-1">🪙 {data.user.coins}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Баланс монет</span>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
                <span className="text-3xl font-bold text-foreground mb-1">{data.stats.totalReactionsReceived}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Реакций собрано</span>
              </div>
            </div>
          </div>

          {/* Economy Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Coins className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Как заработать?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Получайте 1 монету за каждую реакцию на ваши шёпоты.
                </p>
              </div>
            </div>
            <div className="glass-panel p-5 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-accent/10 rounded-lg text-accent"><Activity className="w-5 h-5" /></div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Чёрный рынок</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Продление: 5 🪙/час.<br/>Убийство чужого: 20 🪙.
                </p>
              </div>
            </div>
          </div>

          {/* Own Whispers */}
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Ваши живые шёпоты</h2>
            <div className="space-y-6">
              {data.whispers.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                  <p>У вас нет активных шёпотов.</p>
                </div>
              ) : (
                data.whispers.map((whisper, index) => (
                  <motion.div
                    key={whisper.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <WhisperCard whisper={whisper} currentUser={data.user} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
