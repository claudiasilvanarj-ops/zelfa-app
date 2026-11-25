import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ShareDish } from "@/components/ShareDish";
import { BADGE, HASHTAG, INSTAGRAM_HANDLE, INSTAGRAM_PROFILE, hasBadge } from "@/lib/community";

export const Route = createFileRoute("/_authenticated/comunidade")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Comunidade — ZELFA Chef" },
      { name: "description", content: "Mostre seus pratos feitos com a ZELFA no Instagram @universozelfa." },
      { property: "og:title", content: "Comunidade — ZELFA Chef" },
      { property: "og:description", content: "Envie a foto do seu prato e ganhe o selo Chef da Comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Comunidade,
});

function Comunidade() {
  const [badge, setBadge] = useState(false);
  useEffect(() => {
    const sync = () => setBadge(hasBadge());
    sync();
    window.addEventListener("zelfa-badge", sync);
    return () => window.removeEventListener("zelfa-badge", sync);
  }, []);
  return (
    <AppShell>
      <h1 className="text-3xl font-bold">Comunidade 💛</h1>
      <p className="mt-2 text-lg text-muted-foreground">Cozinhou com a ZELFA? A gente adora ver seu prato!</p>
      {badge && <p className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-lg font-bold text-accent-foreground">{BADGE}</p>}
      <section className="mt-6 rounded-[1.75rem] bg-card p-5 shadow-soft">
        <h2 className="text-xl font-bold">Siga a ZELFA no Instagram</h2>
        <a href={INSTAGRAM_PROFILE} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-primary px-5 py-3 text-lg font-bold text-primary-foreground">
          SEGUIR {INSTAGRAM_HANDLE}
        </a>
        <p className="mt-3 text-lg">Use a hashtag <b className="text-primary">{HASHTAG}</b> nas suas fotos.</p>
      </section>
      <ShareDish showInvite={false} />
      <p className="text-base text-muted-foreground">Quem envia foto ganha o selo <b>{BADGE}</b> aqui no app.</p>
    </AppShell>
  );
}
