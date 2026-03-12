import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Feather } from "lucide-react";
import { useCreateWhisper, getGetWhispersQueryKey, getGetStatsQueryKey, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button, Textarea } from "./ui-elements";
import { toast } from "sonner";

const schema = z.object({
  content: z.string().min(1, "Шёпот не может быть пустым").max(500, "Слишком длинный шёпот (макс 500)"),
  lifetime: z.enum(["1h", "24h", "7d"]),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWhisperDialog({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lifetime: "24h"
    }
  });

  const lifetimeValue = watch("lifetime");
  const contentValue = watch("content") || "";

  const createMutation = useCreateWhisper({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        toast.success("Шёпот отправлен во мрак");
        reset();
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.data?.error || "Не удалось отправить шёпот");
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({ data });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 relative pointer-events-auto"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_-5px_rgba(120,50,255,0.4)]">
                  <Feather className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground font-serif">Прошептать секрет</h2>
                  <p className="text-muted-foreground text-sm">Никто не узнает, что это вы.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Textarea
                    {...register("content")}
                    placeholder="Напишите то, о чём молчите..."
                    className="text-lg placeholder:text-xl"
                  />
                  <div className="flex justify-between items-center mt-2">
                    {errors.content ? (
                      <p className="text-xs text-destructive pl-1">{errors.content.message}</p>
                    ) : (
                      <span /> 
                    )}
                    <span className={cn("text-xs", contentValue.length > 450 ? "text-destructive" : "text-muted-foreground")}>
                      {contentValue.length}/500
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Время жизни шёпота</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "1h", label: "1 Час", desc: "Быстро сгорит" },
                      { value: "24h", label: "24 Часа", desc: "Оптимально" },
                      { value: "7d", label: "7 Дней", desc: "Долгая память" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue("lifetime", opt.value as "1h" | "24h" | "7d")}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-left",
                          lifetimeValue === opt.value 
                            ? "bg-primary/20 border-primary shadow-[0_0_15px_-5px_rgba(120,50,255,0.4)]" 
                            : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10 text-muted-foreground"
                        )}
                      >
                        <span className={cn("font-bold text-lg", lifetimeValue === opt.value ? "text-primary-foreground" : "")}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] mt-1 opacity-70">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={createMutation.isPending}
                  className="w-full h-14 text-lg rounded-2xl"
                >
                  Отпустить во мрак
                </Button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
