import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Clock, Feather } from "lucide-react";
import { useCreateWhisper, getGetWhispersQueryKey, type CreateWhisperRequestLifetime } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const schema = z.object({
  content: z.string().min(1, "Секрет не может быть пустым").max(500, "Слишком длинный секрет"),
  lifetime: z.enum(["1h", "24h", "7d"] as const),
});

type FormValues = z.infer<typeof schema>;

interface CreateWhisperDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWhisperDialog({ isOpen, onClose }: CreateWhisperDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      content: "",
      lifetime: "24h",
    }
  });

  const { mutate: createWhisper, isPending } = useCreateWhisper({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
        reset();
        onClose();
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    createWhisper({ data: { content: data.content, lifetime: data.lifetime as CreateWhisperRequestLifetime } });
  };

  const content = watch("content");
  const selectedLifetime = watch("lifetime");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-lg rounded-3xl p-6 relative pointer-events-auto border border-primary/20 shadow-[0_0_40px_-15px_rgba(120,50,255,0.3)]"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 flex items-center space-x-3 text-primary">
                <Feather className="w-6 h-6" />
                <h2 className="text-2xl font-serif font-bold text-foreground">Поделиться шёпотом</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <textarea
                    {...register("content")}
                    placeholder="Напишите свой секрет... (он будет полностью анонимен)"
                    className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 min-h-[150px] text-foreground font-serif text-xl placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent resize-none transition-all"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-destructive">{errors.content?.message}</span>
                    <span className={cn(
                      "text-xs font-mono transition-colors",
                      content.length > 450 ? "text-orange-400" : "text-muted-foreground"
                    )}>
                      {content.length}/500
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Время жизни секрета</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "1h", label: "1 час", desc: "Короткий миг" },
                      { value: "24h", label: "24 часа", desc: "Один день" },
                      { value: "7d", label: "7 дней", desc: "Долгая память" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setValue("lifetime", opt.value as "1h" | "24h" | "7d")}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                          selectedLifetime === opt.value
                            ? "bg-primary/20 border-primary text-primary-foreground shadow-[0_0_15px_-3px_rgba(120,50,255,0.4)]"
                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        <span className="font-semibold">{opt.label}</span>
                        <span className="text-[10px] opacity-70 mt-1">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-2xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isPending ? "Отправляем во тьму..." : "Прошептать"}</span>
                    {!isPending && <Send className="w-4 h-4 ml-2" />}
                  </button>
                  <p className="text-center text-xs text-muted-foreground/60 mt-4">
                    Ваш секрет полностью анонимен. Никто не узнает, кто вы.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
