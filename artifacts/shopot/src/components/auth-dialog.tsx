import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, LogIn, KeyRound } from "lucide-react";
import { useLogin, useRegister, getGetMeQueryKey, getGetWhispersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button, Input } from "./ui-elements";

const schema = z.object({
  username: z.string().min(3, "Минимум 3 символа").max(30, "Максимум 30 символов"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormValues = z.infer<typeof schema>;

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const queryClient = useQueryClient();
  const [authError, setAuthError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onAuthSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
    setAuthError(null);
    reset();
    onClose();
  };

  const onAuthErrorFn = (err: any) => {
    setAuthError(err?.data?.error || err?.message || "Произошла ошибка при авторизации");
  };

  const loginMutation = useLogin({
    mutation: { onSuccess: onAuthSuccess, onError: onAuthErrorFn }
  });

  const registerMutation = useRegister({
    mutation: { onSuccess: onAuthSuccess, onError: onAuthErrorFn }
  });

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const onSubmit = (data: FormValues) => {
    setAuthError(null);
    if (mode === "login") {
      loginMutation.mutate({ data });
    } else {
      registerMutation.mutate({ data });
    }
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
              className="glass-panel w-full max-w-md rounded-3xl p-8 relative pointer-events-auto"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary shadow-[0_0_30px_-5px_rgba(120,50,255,0.4)]">
                  {mode === "login" ? <LogIn className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
                </div>
                <h2 className="text-3xl font-bold text-foreground font-serif">
                  {mode === "login" ? "Войти в тень" : "Создать личность"}
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  {mode === "login" 
                    ? "Узнайте, какие шёпоты принадлежат вам" 
                    : "Только логин и пароль. Больше ничего."}
                </p>
              </div>

              <div className="flex bg-black/40 rounded-xl p-1 mb-8 border border-white/5">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setAuthError(null); }}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    mode === "login" ? "bg-white/10 text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("register"); setAuthError(null); }}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                    mode === "register" ? "bg-white/10 text-foreground shadow" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Регистрация
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <Input
                      {...register("username")}
                      placeholder="Имя в тени"
                      className="pl-12"
                    />
                  </div>
                  {errors.username && <p className="text-xs text-destructive mt-1.5 pl-1">{errors.username.message}</p>}
                </div>

                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <Input
                      type="password"
                      {...register("password")}
                      placeholder="Секретный ключ"
                      className="pl-12"
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1.5 pl-1">{errors.password.message}</p>}
                </div>

                {authError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center">
                    {authError}
                  </div>
                )}

                <Button
                  type="submit"
                  isLoading={isPending}
                  className="w-full h-12 text-base"
                >
                  {mode === "login" ? "Войти" : "Зарегистрироваться"}
                </Button>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
