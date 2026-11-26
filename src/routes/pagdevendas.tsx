import { createFileRoute, Link } from "@tanstack/react-router";
import { ANNUAL_PRICE, ANNUAL_INSTALLMENTS, ANNUAL_INSTALLMENT_PRICE, ANNUAL_INSTALLMENT_TOTAL, PAYMENT_LINK } from "@/lib/payment";
import capaImg from "@/assets/zelfa-chef-capa-limpa.png";
import lasanha from "@/assets/dishes/lasanha.jpg";
import moqueca from "@/assets/dishes/moqueca.jpg";
import bolo from "@/assets/dishes/bolo.jpg";
import torta from "@/assets/dishes/torta.jpg";
const VIDEO_GELADEIRA_URL = "/videos/geladeira-fala-corrigida.mp4";

export const Route = createFileRoute("/pagdevendas")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "ZELFA — Sua Chef de Cozinha Virtual | eXPLIK@ das Galáxias" },
      {
        name: "description",
        content:
          "Fale ou escreva o que tem na geladeira e receba receitas na hora com a ZELFA, sua chef de cozinha virtual. Portal eXPLIK@ das Galáxias.",
      },
      { property: "og:title", content: "ZELFA — Sua Chef de Cozinha Virtual | eXPLIK@ das Galáxias" },
      {
        property: "og:description",
        content:
          "Diga o que tem na geladeira: receitas na hora, cronômetro inteligente, lista de compras e voz da ZELFA. 7 dias de garantia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const GARANTIA = "✅ 7 dias de garantia · Cancele a renovação a qualquer momento";
const RECURSOS = [
  ["🍳", "Receitas na hora", "Diga o que tem em casa e receba receitas do simples ao sofisticado"],
  ["🥗", "Respeita suas restrições", "Vegano, sem glúten, alergias e preferências da família"],
  ["📅", "Cardápio da semana", "Planeje toda a semana sem pensar"],
  ["🛒", "Lista de compras", "Com preço estimado dos ingredientes"],
  ["⏱️", "Cronômetro inteligente", "A ZELFA avisa quando cada etapa termina e quando o prato está pronto"],
  ["🎤", "Voz da ZELFA", "Ela fala com você e guia cada passo do preparo"],
];
const PASSOS = [
  ["Diga o que tem em casa", "Escreva ou fale no microfone"],
  ["Cozinhe com a ZELFA", "Ela guia cada passo e cronometra"],
  ["Fotografe e guarde", "Monte seu álbum e compartilhe"],
];
const ALBUM = [
  [lasanha, "Lasanha do Rafa 💛"],
  [moqueca, "Moqueca da Ana 💛"],
  [bolo, "Bolo do Léo 💛"],
  [torta, "Torta da Maria 💛"],
] as const;
const INCLUI = [
  "Acesso completo",
  "Receitas ilimitadas",
  "Cronômetro inteligente",
  "Álbum da Cozinha",
  "Comunidade ZELFA",
];
const FAQ = [
  [
    "Quanto custa a assinatura da ZELFA?",
    `A assinatura é anual: em até ${ANNUAL_INSTALLMENTS}x de ${ANNUAL_INSTALLMENT_PRICE} no cartão (total de ${ANNUAL_INSTALLMENT_TOTAL}) ou ${ANNUAL_PRICE} à vista. O parcelamento tem acréscimo. Não há plano mensal.`,
  ],
  [
    "As 12 parcelas são uma assinatura mensal?",
    "Não. As parcelas são a forma de pagar a assinatura anual. Você contrata um ano de acesso, mesmo escolhendo pagar em até 12 vezes no cartão.",
  ],
  [
    "A assinatura renova automaticamente?",
    "Sim. A assinatura renova a cada ano até você cancelar a renovação. Não é uma compra única sem renovação automática.",
  ],
  [
    "Como funciona o cancelamento?",
    "Você pode cancelar a renovação a qualquer momento. No e-mail da Kiwify com o título Pagamento de assinatura aprovado, abra o botão para gerenciar a assinatura e confirme o cancelamento. Isso impede a próxima renovação anual, mantém seu acesso até o fim do período pago e não interrompe as parcelas da compra anual. Cancelar a renovação não é pedir reembolso. Confira o passo a passo nesta página ou peça ajuda em zelfaapp@gmail.com.",
  ],
  [
    "Tenho garantia? É um teste gratuito?",
    "Não é um teste gratuito: você faz a compra e pode solicitar o reembolso integral pela Kiwify em até 7 dias após a compra. O pedido de reembolso é separado do cancelamento da renovação. Essa garantia não limita os demais direitos previstos em lei.",
  ],
  [
    "Como meu acesso é liberado depois do pagamento?",
    "Use o mesmo e-mail na compra pela Kiwify e na sua conta ZELFA. O acesso é liberado após a confirmação do pagamento. Criar uma conta, inclusive pelo Google, não substitui a assinatura. Se precisar de ajuda, escreva para zelfaapp@gmail.com.",
  ],
  [
    "Funciona no celular, tablet e computador?",
    "Sim! Você acessa a ZELFA pelo navegador do celular, tablet ou computador, sem precisar baixar pela loja de aplicativos.",
  ],
  [
    "Posso compartilhar meu login ou usar dois aparelhos ao mesmo tempo?",
    "Cada conta é de uso individual: 1 conta por pessoa e 1 aparelho ativo por vez. Você pode usar no celular, tablet ou computador, mas ao entrar em um aparelho novo o anterior é desconectado automaticamente. Por isso, não compartilhe seu login e senha — se outra pessoa abrir sua conta, você perde o acesso na hora. Se precisar de ajuda, escreva para zelfaapp@gmail.com.",
  ],
  [
    "Como peço receitas para a ZELFA?",
    "Escreva ou fale o que tem em casa e informe suas preferências e restrições alimentares. Não é preciso enviar foto da geladeira. As fotos são para guardar os pratos que você preparou no seu Álbum da Cozinha.",
  ],
];
const cta = "inline-block rounded-full bg-accent px-8 py-4 text-xl font-bold text-accent-foreground shadow-soft";

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-warm text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-5 py-12 text-center md:flex-row md:text-left">
          <img
            src={capaImg}
            alt="ZELFA, sua chef de cozinha virtual"
            width={1024}
            height={1024}
            className="w-full max-w-sm rounded-[2rem] shadow-soft"
          />
          <div className="space-y-5">
            <h1 className="text-4xl font-bold md:text-5xl">
              Sua chef de cozinha virtual, <span className="text-gold">do ingrediente ao prato pronto</span>
            </h1>
            <p className="text-xl opacity-90">
              Diga o que tem na geladeira e a ZELFA cria receitas na hora, te guia no preparo e avisa quando está
              pronto
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className={cta}>
                TESTAR 7 DIAS COM GARANTIA
              </a>
              <Link
                to="/auth"
                search={{ modo: "entrar" }}
                className="rounded-full border-2 border-gold px-8 py-4 text-xl font-bold text-gold"
              >
                Já tenho conta
              </Link>
            </div>
            <p className="inline-block rounded-full bg-primary-foreground/10 px-4 py-2 font-semibold">{GARANTIA}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
          <video
            src={VIDEO_GELADEIRA_URL}
            autoPlay
            muted
            loop
            playsInline
            controls
            className="w-full max-w-xs rounded-[2rem] border-4 border-gold shadow-soft"
          />
          <div className="max-w-md space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-bold text-primary">Abriu a geladeira e não sabe o que fazer? 🍳</h2>
            <p className="text-lg text-muted-foreground">
              É só contar para a ZELFA o que você tem em casa — por escrito ou por voz — e ela cria a receita na
              hora, guia cada passo e avisa quando está pronto.
            </p>
            <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className={cta}>
              QUERO A ZELFA NA MINHA COZINHA
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-center text-3xl font-bold text-primary">TUDO QUE A ZELFA FAZ</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map(([e, t, d]) => (
            <div key={t} className="rounded-3xl border-2 border-accent/40 bg-card p-6 shadow-soft">
              <div className="text-4xl">{e}</div>
              <div className="mt-2 font-display text-xl font-semibold">{t}</div>
              <div className="text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary py-12 text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <h2 className="text-3xl font-bold text-gold">ÁLBUM DA COZINHA E COMUNIDADE 💛</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg opacity-90">
            Fotografe seus pratos e monte seu Álbum da Cozinha. Compartilhe com a Comunidade ZELFA e inspire outras
            pessoas — a foto mais bonita é a do SEU prato!
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {ALBUM.map(([img, nome]) => (
              <figure key={nome} className="overflow-hidden rounded-3xl border-2 border-gold bg-card text-card-foreground">
                <img
                  src={img}
                  alt={nome}
                  loading="lazy"
                  width={1024}
                  height={1024}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="p-2 font-semibold">{nome}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-sm opacity-70">Imagens ilustrativas</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-center text-3xl font-bold text-primary">COMO FUNCIONA</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {PASSOS.map(([p, d], i) => (
            <li key={p} className="rounded-3xl bg-card p-6 text-center shadow-soft">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold text-2xl font-bold text-gold-foreground">
                {i + 1}
              </span>
              <p className="mt-3 text-lg font-semibold">{p}</p>
              <p className="text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-12">
        <div className="rounded-[2rem] border-4 border-gold bg-card p-8 text-center shadow-soft">
          <h2 className="text-3xl font-bold text-primary">Assinatura anual ZELFA Chef</h2>
          <p className="mt-2 text-4xl font-bold text-primary sm:text-5xl">
            em até {ANNUAL_INSTALLMENTS}x de {ANNUAL_INSTALLMENT_PRICE}
          </p>
          <p className="mt-3 text-xl font-semibold text-muted-foreground">
            ou {ANNUAL_PRICE} à vista
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            No cartão em {ANNUAL_INSTALLMENTS}x o total fica {ANNUAL_INSTALLMENT_TOTAL}, maior que os {ANNUAL_PRICE} à vista. Renovação anual automática até cancelar.
          </p>
          <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-lg">
            {INCLUI.map((i) => (
              <li key={i}>✅ {i}</li>
            ))}
          </ul>
          <p className="mt-5 rounded-2xl bg-secondary p-3 text-lg font-semibold text-secondary-foreground">
            🎁 Reembolso integral em até 7 dias após a compra
          </p>
          <aside aria-label="Uso individual da conta" className="mt-5 border-l-4 border-accent bg-secondary p-4 text-left text-secondary-foreground">
            <p className="font-bold">💛 1 conta por pessoa · 1 aparelho por vez</p>
            <p className="mt-2">A assinatura é individual. Você pode usar no celular ou computador, mas sempre <strong>1 aparelho ativo por vez</strong>.</p>
            <p className="mt-2 text-sm">Ao entrar em um novo aparelho, o anterior é desconectado automaticamente — por isso, não compartilhe sua senha.</p>
          </aside>
          <a href={PAYMENT_LINK} target="_blank" rel="noopener noreferrer" className={`${cta} mt-5 px-10`}>
            ASSINAR AGORA
          </a>
          <p className="mt-3 text-muted-foreground">Pagamento seguro pela Kiwify.</p>
          <p className="mt-3 text-sm text-muted-foreground">Cancele a renovação a qualquer momento. O acesso continua até o fim do período pago; as parcelas da compra anual continuam no cartão. Cancelar a renovação não gera reembolso automático.</p>
        </div>
      </section>

      <section className="border-y bg-secondary py-12 text-secondary-foreground" aria-labelledby="subscription-details">
        <div className="mx-auto max-w-3xl px-5">
          <p className="text-sm font-semibold uppercase">Antes de assinar</p>
          <h2 id="subscription-details" className="mt-2 text-3xl font-bold">Entenda sua assinatura 💛</h2>
          <p className="mt-4 text-lg">
            A ZELFA tem uma assinatura anual com renovação automática. Você contrata um ano de acesso
            e escolhe pagar à vista ou parcelar no cartão.
          </p>
          <ul className="mt-6 space-y-4 text-lg">
            <li><strong>Pagamento:</strong> em até {ANNUAL_INSTALLMENTS}x de {ANNUAL_INSTALLMENT_PRICE} (total de {ANNUAL_INSTALLMENT_TOTAL}) ou {ANNUAL_PRICE} à vista. Parcelar não transforma o plano em mensal.</li>
            <li><strong>Renovação:</strong> acontece automaticamente a cada ano, até você cancelar pela Kiwify.</li>
            <li><strong>Cancelamento da renovação:</strong> pode ser feito a qualquer momento e impede a próxima renovação anual. Seu acesso continua até o fim do período pago, e as parcelas da compra anual já realizada continuam no cartão. Não gera reembolso automático.</li>
            <li><strong>Garantia:</strong> você pode solicitar reembolso integral em até 7 dias após a compra. Não é um teste gratuito. Permanecem assegurados os demais direitos previstos em lei.</li>
            <li><strong>Liberação:</strong> use o mesmo e-mail na compra e na conta ZELFA. O acesso depende da confirmação do pagamento.</li>
            <li><strong>Uso individual:</strong> 1 conta por pessoa, em 1 aparelho ativo por vez. Ao entrar em um novo aparelho, o anterior é desconectado automaticamente. Não compartilhe login e senha.</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12" aria-labelledby="cancelamento">
        <h2 id="cancelamento" className="text-3xl font-bold text-primary">Como cancelar a renovação, passo a passo</h2>
        <p className="mt-4 text-lg text-muted-foreground">Você pode fazer isso a qualquer momento pela Kiwify, sem precisar esperar completar um ano.</p>
        <ol className="mt-6 list-decimal space-y-4 pl-6 text-lg">
          <li>Abra a caixa de entrada do <strong>e-mail usado na compra</strong>.</li>
          <li>Procure o e-mail da Kiwify com o título <strong>Pagamento de assinatura aprovado</strong>, referente à ZELFA. Confira também spam e lixo eletrônico.</li>
          <li>Abra esse e-mail e toque no <strong>botão para gerenciar a assinatura</strong>.</li>
          <li>Na página da Kiwify, escolha a opção de <strong>cancelar a assinatura</strong> e confirme o cancelamento.</li>
          <li>Confira se o cancelamento foi confirmado e guarde o comprovante ou a confirmação exibida.</li>
        </ol>
        <p className="mt-6 border-l-4 border-accent bg-secondary p-4 text-secondary-foreground"><strong>O que muda?</strong> Não haverá uma nova renovação anual. Você mantém o acesso até o fim do período já pago. Se parcelou a compra anual, as parcelas continuam sendo cobradas. O cancelamento da renovação não devolve automaticamente o valor pago.</p>
        <p className="mt-5 text-lg text-muted-foreground">Não encontrou o e-mail ou precisa de ajuda? Escreva para <a href="mailto:zelfaapp@gmail.com?subject=Cancelar%20renova%C3%A7%C3%A3o%20ZELFA" className="font-semibold text-primary underline break-all">zelfaapp@gmail.com</a>, informando o e-mail da compra. Nunca envie sua senha ou os dados completos do cartão.</p>
        <p className="mt-3"><a href="https://ajuda.kiwify.com.br/pt-br/article/como-cancelar-a-assinatura-do-produto-que-comprei-19d0my1/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">Ver orientação oficial da Kiwify</a></p>
        <h3 className="mt-8 text-xl font-bold text-primary">Quer pedir reembolso?</h3>
        <p className="mt-3 text-lg text-muted-foreground">O pedido é separado do cancelamento da renovação. Em até 7 dias após a compra, solicite o reembolso integral pela Kiwify. Se precisar de orientação, entre em contato pelo e-mail acima. Essa garantia não limita os demais direitos previstos em lei.</p>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="text-center text-3xl font-bold text-primary">PERGUNTAS FREQUENTES</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-lg border bg-card p-5">
              <summary className="cursor-pointer text-lg font-bold">{q}</summary>
              <p className="mt-2 text-lg text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-muted-foreground">
        <p className="mb-2">
          Suporte:{" "}
          <a href="mailto:zelfaapp@gmail.com" className="font-bold text-primary underline">
            zelfaapp@gmail.com
          </a>
        </p>
        zelfa.app · eXPLIK@ DAS GALÁXIAS · explicadasgalaxias.com
      </footer>
    </main>
  );
}
