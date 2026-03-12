import { useGetWhispers } from "@workspace/api-client-react";
import { WhisperCard } from "@/components/whisper-card";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Loader2, Wind } from "lucide-react";

export function Feed() {
  const { data, isLoading, isError } = useGetWhispers(
    { page: 1, limit: 50 },
    {
      query: {
        refetchInterval: 10000, // Refresh every 10 seconds to update whispers/expiry
      }
    }
  );

  return (
    <Layout>
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4 opacity-90">
          Секреты во мраке
        </h1>
        <p className="text-muted-foreground md:text-lg max-w-2xl">
          Читайте анонимные признания. Они исчезнут, как только истечёт их время. 
          Никто не знает, кто их оставил.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary/50" />
          <p className="text-sm font-medium">Вслушиваемся в пустоту...</p>
        </div>
      ) : isError ? (
        <div className="glass-panel p-8 rounded-2xl text-center border-destructive/20 bg-destructive/5">
          <p className="text-destructive font-medium">Связь прервана. Шёпот утих.</p>
        </div>
      ) : data?.whispers.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 px-4 text-center glass-panel rounded-3xl"
        >
          <Wind className="w-16 h-16 text-muted-foreground/30 mb-6" />
          <h3 className="text-2xl font-serif font-bold text-foreground/80 mb-2">Здесь слишком тихо</h3>
          <p className="text-muted-foreground max-w-md">
            Пока никто не осмелился оставить свой секрет. Станьте первым, кто нарушит тишину.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data?.whispers.map((whisper, i) => (
            <WhisperCard key={whisper.id} whisper={whisper} />
          ))}
        </div>
      )}
    </Layout>
  );
}
