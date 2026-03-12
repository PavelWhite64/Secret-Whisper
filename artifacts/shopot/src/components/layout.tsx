import { useState } from "react";
import { Link } from "wouter";
import { useGetMe, useLogout, getGetMeQueryKey, getGetWhispersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, User, Menu, X, Plus } from "lucide-react";
import { AuthDialog } from "./auth-dialog";
import { CreateWhisperDialog } from "./create-whisper-dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user } = useGetMe({
    query: { retry: false, staleTime: 1000 * 60 * 5 } // check auth status, don't spam retries on 401
  });
  
  const { mutate: logout } = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        queryClient.invalidateQueries({ queryKey: getGetWhispersQueryKey() });
      }
    }
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Abstract Background Image */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/mystic-bg.png`} 
          alt="Ethereal background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background to-background" />
      </div>

      <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-background/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-serif italic font-bold text-gradient opacity-90 group-hover:opacity-100 transition-opacity">
              Шёпот
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-foreground rounded-full text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Прошептать</span>
            </button>
            
            {user ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-white/10">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.username}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                  title="Выйти"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors ml-2"
              >
                Войти
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-white/5 bg-card/95 backdrop-blur-xl z-20 absolute top-16 left-0 right-0 overflow-hidden"
          >
            <div className="p-4 flex flex-col space-y-4">
              <button
                onClick={() => { setIsCreateOpen(true); setIsMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-2 w-full py-3 bg-primary/20 text-primary-foreground rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Прошептать</span>
              </button>
              
              {user ? (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3 text-muted-foreground">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <button
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="p-2 text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-3 bg-white/5 text-foreground rounded-xl text-sm font-medium"
                >
                  Войти
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CreateWhisperDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
