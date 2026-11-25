import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CookingNow } from "@/components/CookingNow";
import avatar from "@/assets/zelfa-avatar.png";

export function AppShell({ title, back = true, children, wide }: { title?: string; back?: boolean; children: ReactNode; wide?: boolean }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
        <div className={`mx-auto flex items-center gap-3 px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
          {back ? (
            <Link to="/inicio" aria-label="Voltar" className="rounded-full bg-secondary p-3 text-secondary-foreground">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          ) : (
            <img src={avatar} alt="ZELFA" width={816} height={816} className="h-12 w-12" />
          )}
          <h1 className="flex-1 truncate text-2xl font-bold">{title ?? "ZELFA"}</h1>
          <Link to="/perfil" aria-label="Meu Perfil" className="rounded-full p-3 text-muted-foreground hover:bg-muted">
            <UserRound className="h-6 w-6" />
          </Link>
          <button onClick={signOut} aria-label="Sair" className="rounded-full p-3 text-muted-foreground hover:bg-muted">
            <LogOut className="h-6 w-6" />
          </button>
        </div>
        <CookingNow />
      </header>
      <main className={`mx-auto px-4 py-5 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</main>
    </div>
  );
}
