import { useGetTopWhispers, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { WhisperCard } from "@/components/whisper-card";
import { Loader2, Flame } from "lucide-react";
import { motion } from "framer-motion";

export function Top() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data, isLoading } = useGetTopWhispers(
    { limit: 20 }, 
    { query: { refetchInterval: 30000 } }
  );

  return (
    <Layout>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)] mb-4">
          <Flame className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Горячие шёпоты</h1>
        <p className="text-muted-foreground mt-2">Самые обсуждаемые секреты прямо сейчас</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
            <p>Ищем искры во тьме...</p>
          </div>
        ) : data?.whispers.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground text-center glass-panel rounded-3xl border-dashed">
            <p>Пока нет популярных шёпотов.</p>
          </div>
        ) : (
          data?.whispers.map((whisper, index) => (
            <motion.div
              key={whisper.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="relative">
                <div className="absolute -left-4 sm:-left-6 top-6 text-xl font-bold text-white/20 font-serif w-6 text-right">
                  {index + 1}
                </div>
                <WhisperCard whisper={whisper} currentUser={user ?? null} />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Layout>
  );
}
