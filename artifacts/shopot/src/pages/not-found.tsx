import { Layout } from "@/components/layout";
import { Button } from "@/components/ui-elements";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-8xl font-serif font-bold text-white/10 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">Шёпот растворился во тьме</h2>
        <p className="text-muted-foreground max-w-sm mb-8">
          Эта страница больше не существует, или вы забрели слишком далеко в пустоту.
        </p>
        <Link href="/">
          <Button size="lg">Вернуться в ленту</Button>
        </Link>
      </div>
    </Layout>
  );
}
