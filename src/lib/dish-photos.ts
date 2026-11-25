// Escolhe a foto do prato pelo tipo de receita (palavras do nome primeiro, depois do texto).
import ovos from "@/assets/dishes/ovos.jpg";
import bolo from "@/assets/dishes/bolo.jpg";
import massa from "@/assets/dishes/massa.jpg";
import salada from "@/assets/dishes/salada.jpg";
import frango from "@/assets/dishes/frango.jpg";
import carne from "@/assets/dishes/carne.jpg";
import sopa from "@/assets/dishes/sopa.jpg";
import peixe from "@/assets/dishes/peixe.jpg";
import prato from "@/assets/dishes/prato.jpg";
import sobremesa from "@/assets/dishes/sobremesa.jpg";
import escondidinho from "@/assets/dishes/escondidinho.jpg";
import arroz from "@/assets/dishes/arroz.jpg";
import feijao from "@/assets/dishes/feijao.jpg";
import torta from "@/assets/dishes/torta.jpg";
import legumes from "@/assets/dishes/legumes.jpg";
import pao from "@/assets/dishes/pao.jpg";
import frutas from "@/assets/dishes/frutas.jpg";
import moqueca from "@/assets/dishes/moqueca.jpg";
import strogonoff from "@/assets/dishes/strogonoff.jpg";
import lasanha from "@/assets/dishes/lasanha.jpg";
import carneMoida from "@/assets/dishes/carne-moida.jpg";
import bife from "@/assets/dishes/bife.jpg";

export const DISH_RULES: { kind: string; re: RegExp; src: string }[] = [
  { kind: "escondidinho", re: /escondidinho/i, src: escondidinho },
  { kind: "lasanha", re: /lasanha/i, src: lasanha },
  { kind: "moqueca", re: /(moqueca|bob[óo]|ensopado)/i, src: moqueca },
  { kind: "strogonoff", re: /(strogonoff|estrogonofe|curry|madeira)/i, src: strogonoff },
  { kind: "feijao", re: /(feij[ãa]o|feijoada|tropeiro)/i, src: feijao },
  { kind: "arroz", re: /(carreteiro|arroz de|arroz com|galinhada|paella)/i, src: arroz },
  { kind: "torta", re: /(torta (de liquidificador|salgada)|quiche|empad|salpic[ãa]o|t[áa]bua de frios)/i, src: torta },
  { kind: "pao", re: /(p[ãa]o|tapioca|biscoito|polvilho|wrap)/i, src: pao },
  { kind: "frutas", re: /(salada de frutas|banana caramelizada|ma[çc][ãa] assada|doce de banana|sorbet|frutas)/i, src: frutas },
  { kind: "bife", re: /(bife|fil[ée]|picanha|alcatra)/i, src: bife },
  { kind: "bolo", re: /\b(bolo|cuca|muffin|cupcake|panqueca doce|torta doce)/i, src: bolo },
  { kind: "sobremesa", re: /(mousse|pudim|brigadeiro|doce|sobremesa|torta de lim|panqueca vegana|sorvete|sorbet|pav[êe]|beijinho|cocada|creme de|chocolate|brownie|cookie)/i, src: sobremesa },
  { kind: "ovos", re: /(omelete|ovo|fritada|tortilha|crepioca)/i, src: ovos },
  { kind: "sopa", re: /(sopa|caldo|creme de legumes|canja)/i, src: sopa },
  { kind: "massa", re: /(macarr|espaguete|massa|lasanha|nhoque|penne|talharim|parafuso|risoto)/i, src: massa },
  { kind: "carne_moida", re: /(carne mo[íi]da|picadinho|bolonhesa|polenta|ragu)/i, src: carneMoida },
  { kind: "peixe", re: /(peixe|til[áa]pia|salm[ãa]o|bacalhau|atum|sardinha|camar[ãa]o|merluza)/i, src: peixe },
  { kind: "frango", re: /(frango|galinha|peito de frango|coxa|sobrecoxa)/i, src: frango },
  { kind: "carne", re: /(carne|bife|alcatra|picanha|patinho|costela|almôndega|almondega|hamb[úu]rguer|porco|lombo)/i, src: carne },
  { kind: "legumes", re: /(batata r[úu]stica|assad[ao]s? com|legumes assados|farofa)/i, src: legumes },
  { kind: "salada", re: /(salada|bowl|tabule|legumes|vegano|grão-de-bico|grao-de-bico)/i, src: salada },
];

export function dishKind(title: string, body = ""): string {
  for (const r of DISH_RULES) if (r.re.test(title)) return r.kind;
  for (const r of DISH_RULES) if (r.re.test(body)) return r.kind;
  return "prato";
}

export function dishPhoto(title: string, body = ""): string {
  const k = dishKind(title, body);
  return DISH_RULES.find((r) => r.kind === k)?.src ?? prato;
}
