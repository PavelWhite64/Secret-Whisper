import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Feed } from "@/pages/feed";
import { Top } from "@/pages/top";
import { Profile } from "@/pages/profile";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Feed} />
      <Route path="/top" component={Top} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster theme="dark" position="bottom-center" toastOptions={{
        className: 'bg-card border-white/10 text-foreground glass-panel'
      }} />
    </QueryClientProvider>
  );
}

export default App;
