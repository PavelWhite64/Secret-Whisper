import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Feather, Menu, X, LogOut } from "lucide-react";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { AuthDialog } from "./auth-dialog";
import { CreateWhisperDialog } from "./create-whisper-dialog";
import { Button } from "./ui-elements";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
      }
    });
  };

  const navLinks = [
    { href: "/", label: "Лента" },
    { href: "/top", label: "Топ" },
    ...(user ? [{ href: "/profile", label: "Профиль" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col relative z-0">
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Feather className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-xl tracking-wide text-foreground">Шёпот</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                location === link.href ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-bold text-sm">
                <span>🪙</span> {user.coins}
              </div>
            )}
            
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="rounded-full px-5">
              Прошептать
            </Button>

            {user ? (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsAuthOpen(true)} className="rounded-full">
                Войти
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10 p-4 flex flex-col gap-4 shadow-2xl">
            {user && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent font-bold">
                <span>Ваш баланс: 🪙</span> {user.coins}
              </div>
            )}
            <nav className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn(
                  "p-3 rounded-xl text-center font-medium",
                  location === link.href ? "bg-white/10 text-foreground" : "text-muted-foreground"
                )}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <Button onClick={() => { setIsCreateOpen(true); setIsMobileMenuOpen(false); }} className="w-full h-12 text-lg">
              Прошептать
            </Button>
            {user ? (
              <Button variant="outline" onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full">
                Выйти
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }} className="w-full">
                Войти
              </Button>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 relative">
        {children}
      </main>

      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CreateWhisperDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
