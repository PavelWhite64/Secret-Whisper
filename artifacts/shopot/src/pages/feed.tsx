import { useEffect } from "react";
import { useGetWhispers, useGetStats, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { WhisperCard } from "@/components/whisper-card";
import { Loader2, Wind } from "lucide-react";
import { motion } from "framer-motion";

export function Feed() {
  const { data: stats } = useGetStats({ query: { refetchInterval: 30000 } });
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data, isLoading, refetch } = useGetWhispers(
    { page: 1, limit: 50 }, 
    { query: { refetchInterval: 30000 } } // Auto-refresh feed every 30s
  );

  return (
    <Layout>
      {/* Global Stats Banner */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between backdrop-blur-sm"
        >
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Умерло шёпотов навсегда</span>
            <span className="text-3xl font-serif font-bold text-foreground flex items-center gap-2">
              🕯️ {stats.totalDied.toLocaleString()}
            </span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Живых сейчас</span>
            <span className="text-xl font-bold text-primary">{stats.totalAlive.toLocaleString()}</span>
          </div>
        </motion.div>
      )}

      {/* Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Вслушиваемся во мрак...</p>
          </div>
        ) : data?.whispers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-center glass-panel rounded-3xl border-dashed">
            <Wind className="w-12 h-12 mb-4 opacity-50" />
            <h3 className="text-xl font-serif text-foreground mb-2">Здесь слишком тихо</h3>
            <p className="max-w-xs">Пока никто не осмелился оставить свой секрет. Станьте первым, кто нарушит тишину.</p>
          </div>
        ) : (
          data?.whispers.map((whisper, index) => (
            <motion.div
              key={whisper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <WhisperCard whisper={whisper} currentUser={user ?? null} />
            </motion.div>
          ))
        )}
      </div>
    </Layout>
  );
}
