// Banco de receitas da ZELFA, separado por categoria fixa. Seguro para o navegador.
import { BADGES, conflicts, type RestrictionKey } from "@/lib/diet";

export const RECIPE_CATEGORIES = ["dia_a_dia", "doces", "vegano", "sem_gluten", "saudavel", "visitas"] as const;
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<RecipeCategory, string> = {
  dia_a_dia: "🍳 Dia a dia",
  doces: "🍰 Doces e sobremesas",
  vegano: "🌱 Vegano",
  sem_gluten: "🥖 Sem glúten",
  saudavel: "🥗 Alimentação saudável",
  visitas: "🎉 Visitas",
};

/** Restrição que a própria categoria impõe (além das do perfil). */
export const CATEGORY_RULE: Partial<Record<RecipeCategory, RestrictionKey>> = { vegano: "vegano", sem_gluten: "gluten" };

export type Recipe = { name: string; category: RecipeCategory; minutes: number; level: "Fácil" | "Médio" | "Difícil"; ingredients: string[]; steps: string[] };

const r = (category: RecipeCategory, name: string, minutes: number, level: Recipe["level"], ingredients: string[], steps: string[]): Recipe => ({ name, category, minutes, level, ingredients, steps });

export const RECIPES: Recipe[] = [
  // 🍳 DIA A DIA
  r("dia_a_dia", "Picadinho de carne moída com legumes", 35, "Fácil", ["500 g de carne moída", "2 batatas em cubos", "1 cenoura em cubos", "1 cebola", "2 dentes de alho", "Sal e cheiro-verde"], ["Refogue cebola e alho.", "Doure a carne moída.", "Junte batata, cenoura e 1 xícara de água; cozinhe 20 min.", "Finalize com cheiro-verde."]),
  r("dia_a_dia", "Escondidinho de carne moída", 50, "Médio", ["500 g de carne moída", "1 kg de batata", "1 xícara de leite", "2 colheres de manteiga", "1 cebola", "Queijo ralado"], ["Cozinhe e amasse as batatas com leite e manteiga.", "Refogue a carne com cebola.", "Monte camadas: purê, carne, purê.", "Cubra com queijo e leve ao forno 20 min."]),
  r("dia_a_dia", "Arroz carreteiro", 40, "Fácil", ["2 xícaras de arroz", "300 g de carne seca dessalgada", "1 cebola", "2 tomates", "Cheiro-verde"], ["Desfie e refogue a carne seca com cebola.", "Junte tomate e o arroz.", "Cubra com água quente e cozinhe até secar."]),
  r("dia_a_dia", "Frango assado com batatas", 60, "Fácil", ["1 kg de coxa e sobrecoxa", "4 batatas", "Alho, limão e sal", "Azeite", "Alecrim"], ["Tempere o frango com alho, limão e sal.", "Disponha com batatas na assadeira.", "Asse a 200 °C por 50 min."]),
  r("dia_a_dia", "Omelete de forno com legumes", 30, "Fácil", ["6 ovos", "1 abobrinha", "1 tomate", "1/2 cebola", "Sal e orégano"], ["Bata os ovos com sal.", "Misture os legumes picados.", "Asse em forma untada a 180 °C por 20 min."]),
  r("dia_a_dia", "Feijão tropeiro", 40, "Médio", ["3 xícaras de feijão cozido", "200 g de bacon", "2 linguiças", "1 xícara de farinha de mandioca", "2 ovos", "Couve"], ["Frite bacon e linguiça.", "Mexa os ovos na mesma panela.", "Junte feijão, farinha e couve."]),
  r("dia_a_dia", "Bife acebolado com arroz", 25, "Fácil", ["4 bifes", "2 cebolas em rodelas", "Alho e sal", "Arroz pronto"], ["Tempere e grelhe os bifes.", "Doure a cebola na mesma frigideira.", "Sirva com arroz."]),
  r("dia_a_dia", "Macarrão à bolonhesa", 35, "Fácil", ["500 g de macarrão", "400 g de carne moída", "1 lata de molho de tomate", "1 cebola", "Alho"], ["Cozinhe o macarrão.", "Refogue a carne com cebola e alho.", "Junte o molho e misture ao macarrão."]),
  r("dia_a_dia", "Sopa de legumes com frango", 45, "Fácil", ["300 g de peito de frango", "2 batatas", "1 cenoura", "1 chuchu", "1 cebola", "Sal e salsinha"], ["Cozinhe o frango e desfie.", "Cozinhe os legumes no caldo.", "Volte o frango e finalize com salsinha."]),
  r("dia_a_dia", "Torta de liquidificador de sardinha", 50, "Fácil", ["3 ovos", "1 xícara de leite", "1/2 xícara de óleo", "2 xícaras de farinha de trigo", "1 lata de sardinha", "1 tomate", "1 colher de fermento"], ["Bata ovos, leite, óleo e farinha.", "Junte o fermento.", "Intercale massa e recheio na forma.", "Asse a 180 °C por 35 min."]),

  // 🍰 DOCES E SOBREMESAS
  r("doces", "Pudim de leite condensado", 70, "Médio", ["1 lata de leite condensado", "2 medidas de leite", "3 ovos", "1 xícara de açúcar para a calda"], ["Derreta o açúcar para a calda e forre a forma.", "Bata leite condensado, leite e ovos.", "Asse em banho-maria por 50 min.", "Gele antes de desenformar."]),
  r("doces", "Brigadeiro de panela", 15, "Fácil", ["1 lata de leite condensado", "2 colheres de chocolate em pó", "1 colher de manteiga"], ["Leve tudo ao fogo baixo.", "Mexa até desgrudar do fundo.", "Sirva de colher ou enrole."]),
  r("doces", "Bolo de cenoura com cobertura de chocolate", 55, "Fácil", ["3 cenouras", "3 ovos", "1 xícara de óleo", "2 xícaras de açúcar", "2 xícaras de farinha de trigo", "1 colher de fermento", "Cobertura: chocolate em pó, açúcar, manteiga e leite"], ["Bata cenoura, ovos e óleo.", "Misture açúcar, farinha e fermento.", "Asse a 180 °C por 40 min.", "Cubra com a calda de chocolate."]),
  r("doces", "Mousse de maracujá", 20, "Fácil", ["1 lata de leite condensado", "1 caixa de creme de leite", "1/2 xícara de suco de maracujá"], ["Bata tudo no liquidificador.", "Leve à geladeira por 2 horas."]),
  r("doces", "Arroz-doce cremoso", 40, "Fácil", ["1 xícara de arroz", "1 litro de leite", "1/2 lata de leite condensado", "Canela em pau e em pó"], ["Cozinhe o arroz em água.", "Junte leite e canela; cozinhe mexendo.", "Finalize com leite condensado e canela em pó."]),
  r("doces", "Pavê de bolacha com creme", 30, "Fácil", ["1 pacote de bolacha maisena", "1 lata de leite condensado", "2 gemas", "500 ml de leite", "1 caixa de creme de leite"], ["Faça um creme com leite condensado, leite e gemas.", "Molhe as bolachas no leite.", "Intercale bolacha e creme; cubra com creme de leite."]),
  r("doces", "Banana caramelizada com canela", 15, "Fácil", ["4 bananas", "3 colheres de açúcar", "1 colher de manteiga", "Canela"], ["Derreta o açúcar com a manteiga.", "Doure as bananas dos dois lados.", "Polvilhe canela."]),
  r("doces", "Beijinho de coco", 20, "Fácil", ["1 lata de leite condensado", "100 g de coco ralado", "1 colher de manteiga", "Cravos para decorar"], ["Cozinhe até desgrudar da panela.", "Esfrie, enrole e passe no coco."]),
  r("doces", "Torta de limão", 50, "Médio", ["200 g de bolacha", "100 g de manteiga", "1 lata de leite condensado", "1/2 xícara de suco de limão", "3 claras", "6 colheres de açúcar"], ["Triture bolacha com manteiga e forre a forma.", "Misture leite condensado e limão; recheie.", "Cubra com merengue e doure no forno."]),
  r("doces", "Sorvete caseiro de morango", 20, "Fácil", ["2 xícaras de morango congelado", "1 caixa de creme de leite", "4 colheres de açúcar"], ["Bata tudo até ficar cremoso.", "Congele por 3 horas."]),

  r("doces", "Salada de frutas com hortelã", 15, "Fácil", ["2 bananas", "1 maçã", "1 manga", "1 xícara de uvas", "Suco de 2 laranjas", "Folhas de hortelã"], ["Pique as frutas.", "Regue com o suco de laranja.", "Finalize com hortelã e gele."]),
  r("doces", "Doce de banana em calda", 30, "Fácil", ["6 bananas maduras", "1 xícara de açúcar", "1 xícara de água", "Cravo e canela em pau"], ["Faça uma calda com açúcar e água.", "Junte banana, cravo e canela.", "Cozinhe até a banana ficar macia e dourada."]),
  r("doces", "Mousse de chocolate com abacate", 15, "Fácil", ["2 abacates maduros", "4 colheres de cacau em pó", "4 colheres de açúcar", "1/2 xícara de leite de coco"], ["Bata tudo até ficar liso.", "Gele por 1 hora."]),
  r("doces", "Sorbet de manga", 15, "Fácil", ["3 mangas congeladas em cubos", "Suco de 1 limão", "3 colheres de açúcar"], ["Bata tudo até virar creme.", "Sirva na hora ou congele por 1 hora."]),
  r("doces", "Maçã assada com canela", 35, "Fácil", ["4 maçãs", "4 colheres de açúcar mascavo", "Canela em pó", "Uvas-passas"], ["Tire o miolo das maçãs.", "Recheie com açúcar, canela e passas.", "Asse a 180 °C por 25 min."]),
  r("doces", "Bolo de laranja vegano", 50, "Fácil", ["2 xícaras de farinha de trigo", "1 xícara de açúcar", "1 xícara de suco de laranja", "1/2 xícara de óleo", "Raspas de laranja", "1 colher de fermento"], ["Misture os líquidos com o açúcar.", "Junte farinha, raspas e fermento.", "Asse a 180 °C por 35 min."]),

  // 🌱 VEGANO
  r("vegano", "Escondidinho de batata com cenoura e lentilha", 50, "Médio", ["1 kg de batata", "1 xícara de lentilha cozida", "2 cenouras raladas", "1 cebola", "Azeite", "Leite de coco"], ["Faça purê de batata com azeite e leite de coco.", "Refogue lentilha, cenoura e cebola.", "Monte em camadas e asse 15 min."]),
  r("vegano", "Sopa cremosa de batata e cenoura", 35, "Fácil", ["3 batatas", "2 cenouras", "1 cebola", "2 dentes de alho", "Azeite", "Sal e salsinha"], ["Refogue cebola e alho no azeite.", "Cozinhe batata e cenoura até amaciar.", "Bata no liquidificador e finalize com salsinha."]),
  r("vegano", "Batata rústica com cenoura assada", 45, "Fácil", ["4 batatas", "3 cenouras", "Azeite", "Alecrim", "Páprica e sal"], ["Corte em gomos.", "Tempere com azeite, páprica e alecrim.", "Asse a 200 °C por 40 min."]),
  r("vegano", "Strogonoff de grão-de-bico", 30, "Fácil", ["2 xícaras de grão-de-bico cozido", "1 cebola", "Molho de tomate", "200 ml de leite de coco", "Cogumelos"], ["Refogue cebola e cogumelos.", "Junte grão-de-bico e molho de tomate.", "Finalize com leite de coco."]),
  r("vegano", "Feijoada vegana", 60, "Médio", ["3 xícaras de feijão preto cozido", "1 abóbora", "1 cenoura", "Couve", "Cebola, alho e louro", "Fumaça líquida"], ["Refogue cebola, alho e louro.", "Junte feijão, abóbora e cenoura em cubos.", "Cozinhe 30 min; sirva com couve."]),
  r("vegano", "Hambúrguer de feijão", 35, "Médio", ["2 xícaras de feijão cozido", "1/2 xícara de farinha de mandioca", "1 cebola", "Cheiro-verde", "Cominho"], ["Amasse o feijão.", "Misture os demais ingredientes.", "Modele e grelhe dos dois lados."]),
  r("vegano", "Curry de legumes com leite de coco", 35, "Fácil", ["1 batata", "1 cenoura", "1 abobrinha", "200 ml de leite de coco", "Curry e gengibre", "Arroz"], ["Refogue o curry e gengibre.", "Cozinhe os legumes no leite de coco.", "Sirva com arroz."]),
  r("vegano", "Farofa de banana e cenoura", 20, "Fácil", ["2 xícaras de farinha de mandioca", "2 bananas", "1 cenoura ralada", "1 cebola", "Azeite"], ["Doure cebola no azeite.", "Junte cenoura e banana.", "Acrescente a farinha e toste."]),
  r("vegano", "Panqueca vegana de banana", 20, "Fácil", ["2 bananas maduras", "1 xícara de farinha de arroz", "1 xícara de leite vegetal", "Canela"], ["Amasse a banana.", "Misture farinha, leite vegetal e canela.", "Doure porções em frigideira untada."]),
  r("vegano", "Salada de lentilha com legumes", 25, "Fácil", ["2 xícaras de lentilha cozida", "1 tomate", "1 pepino", "1 cenoura ralada", "Limão e azeite"], ["Pique os legumes.", "Misture com a lentilha.", "Tempere com limão, azeite e sal."]),

  // 🥖 SEM GLÚTEN
  r("sem_gluten", "Pão de queijo", 40, "Fácil", ["500 g de polvilho azedo", "1 xícara de leite", "1/2 xícara de óleo", "2 ovos", "200 g de queijo meia cura"], ["Escalde o polvilho com leite e óleo quentes.", "Junte ovos e queijo.", "Enrole e asse a 180 °C por 25 min."]),
  r("sem_gluten", "Tapioca recheada", 10, "Fácil", ["4 colheres de goma de tapioca", "Queijo branco", "Tomate"], ["Espalhe a goma na frigideira.", "Quando firmar, recheie e dobre."]),
  r("sem_gluten", "Bolo de fubá", 50, "Fácil", ["2 xícaras de fubá", "1 xícara de açúcar", "3 ovos", "1 xícara de leite", "1/2 xícara de óleo", "1 colher de fermento"], ["Bata tudo no liquidificador.", "Asse a 180 °C por 40 min."]),
  r("sem_gluten", "Escondidinho de mandioca com frango", 50, "Médio", ["1 kg de mandioca", "400 g de frango desfiado", "Requeijão", "Cebola e tomate"], ["Faça purê de mandioca.", "Refogue o frango com cebola e tomate.", "Monte e gratine."]),
  r("sem_gluten", "Pão sem glúten de frigideira", 15, "Fácil", ["2 ovos", "3 colheres de farinha de arroz", "1 colher de polvilho", "Sal e fermento"], ["Misture tudo.", "Doure em frigideira tampada dos dois lados."]),
  r("sem_gluten", "Risoto de abóbora", 40, "Médio", ["2 xícaras de arroz arbóreo", "300 g de abóbora", "1 cebola", "Caldo de legumes caseiro", "Queijo parmesão"], ["Refogue cebola e arroz.", "Junte caldo aos poucos com a abóbora.", "Finalize com parmesão."]),
  r("sem_gluten", "Crepioca de frango", 15, "Fácil", ["1 ovo", "2 colheres de goma de tapioca", "Frango desfiado", "Sal"], ["Bata ovo e goma.", "Doure na frigideira e recheie com frango."]),
  r("sem_gluten", "Bolo de chocolate de farinha de arroz", 45, "Médio", ["2 xícaras de farinha de arroz", "1 xícara de chocolate em pó", "1 xícara de açúcar", "3 ovos", "1 xícara de leite", "1/2 xícara de óleo", "Fermento"], ["Bata líquidos e açúcar.", "Junte farinha, chocolate e fermento.", "Asse a 180 °C por 35 min."]),
  r("sem_gluten", "Polenta cremosa com ragu de carne", 50, "Médio", ["1 xícara de fubá", "1 litro de água", "400 g de carne em cubos", "Molho de tomate", "Cebola e alho"], ["Cozinhe a carne no molho até desmanchar.", "Cozinhe o fubá mexendo até engrossar.", "Sirva a polenta com o ragu."]),
  r("sem_gluten", "Biscoito sem glúten de polvilho", 40, "Fácil", ["500 g de polvilho azedo", "1 xícara de água", "1/2 xícara de óleo", "1 ovo", "Sal"], ["Escalde o polvilho com água e óleo quentes.", "Junte o ovo.", "Modele e asse a 180 °C por 25 min."]),

  // 🥗 ALIMENTAÇÃO SAUDÁVEL
  r("saudavel", "Salada de quinoa com legumes", 25, "Fácil", ["1 xícara de quinoa", "1 pepino", "1 tomate", "Hortelã", "Limão e azeite"], ["Cozinhe a quinoa.", "Misture os legumes picados.", "Tempere com limão e azeite."]),
  r("saudavel", "Peixe assado com legumes", 35, "Fácil", ["4 filés de tilápia", "1 abobrinha", "1 cenoura", "Limão, alho e azeite"], ["Tempere o peixe com limão e alho.", "Asse com os legumes a 200 °C por 25 min."]),
  r("saudavel", "Frango grelhado com purê de abóbora", 35, "Fácil", ["4 filés de frango", "500 g de abóbora", "Alho e ervas", "Azeite"], ["Grelhe o frango temperado.", "Cozinhe e amasse a abóbora com azeite."]),
  r("saudavel", "Wrap de alface com atum", 10, "Fácil", ["Folhas de alface", "1 lata de atum", "Tomate", "Cenoura ralada", "Limão"], ["Misture atum, tomate e cenoura.", "Enrole nas folhas de alface."]),
  r("saudavel", "Sopa detox de legumes", 35, "Fácil", ["1 abobrinha", "1 chuchu", "1 cenoura", "Gengibre", "Cebola e salsinha"], ["Cozinhe tudo em água.", "Bata e finalize com salsinha."]),
  r("saudavel", "Omelete de espinafre", 15, "Fácil", ["3 ovos", "1 xícara de espinafre", "Tomate", "Sal"], ["Bata os ovos.", "Junte espinafre e tomate.", "Doure em frigideira antiaderente."]),
  r("saudavel", "Bowl de grão-de-bico e legumes assados", 40, "Fácil", ["1 xícara de grão-de-bico cozido", "1 batata-doce", "Brócolis", "Azeite e páprica"], ["Asse batata-doce, brócolis e grão-de-bico com páprica.", "Monte o bowl e regue com azeite."]),
  r("saudavel", "Panqueca de aveia com banana", 15, "Fácil", ["1 banana", "1 ovo", "3 colheres de aveia", "Canela"], ["Amasse a banana com o ovo.", "Junte aveia e canela.", "Doure na frigideira."]),
  r("saudavel", "Salada morna de lentilha e abóbora", 30, "Fácil", ["1 xícara de lentilha", "300 g de abóbora", "Rúcula", "Azeite e limão"], ["Cozinhe a lentilha.", "Asse a abóbora em cubos.", "Misture com rúcula e tempere."]),
  r("saudavel", "Escondidinho de batata-doce com frango", 45, "Médio", ["600 g de batata-doce", "400 g de frango desfiado", "Tomate e cebola", "Cheiro-verde"], ["Faça purê de batata-doce.", "Refogue o frango com tomate.", "Monte e leve ao forno 15 min."]),

  // 🎉 VISITAS
  r("visitas", "Lasanha à bolonhesa", 80, "Médio", ["500 g de massa de lasanha", "500 g de carne moída", "Molho de tomate", "400 g de mussarela", "300 g de presunto", "Molho branco"], ["Prepare o molho de carne.", "Monte camadas de massa, molho, presunto e queijo.", "Asse a 200 °C por 40 min."]),
  r("visitas", "Bobó de camarão", 60, "Difícil", ["1 kg de camarão", "1 kg de mandioca", "400 ml de leite de coco", "Azeite de dendê", "Pimentão, tomate e cebola"], ["Cozinhe e bata a mandioca.", "Refogue o camarão com os temperos.", "Junte o creme de mandioca, leite de coco e dendê."]),
  r("visitas", "Filé ao molho madeira", 45, "Médio", ["800 g de filé mignon", "Cogumelos", "1/2 xícara de vinho madeira", "Manteiga", "Caldo de carne caseiro"], ["Sele os medalhões.", "Prepare o molho com cogumelos, vinho e caldo.", "Sirva o filé coberto pelo molho."]),
  r("visitas", "Salpicão de frango", 40, "Fácil", ["500 g de frango desfiado", "2 cenouras raladas", "Milho e ervilha", "Maionese", "Batata palha"], ["Misture frango, cenoura, milho e ervilha.", "Envolva na maionese.", "Cubra com batata palha na hora de servir."]),
  r("visitas", "Bacalhau à Gomes de Sá", 70, "Difícil", ["600 g de bacalhau dessalgado", "6 batatas", "2 cebolas", "Azeite", "Ovos cozidos e azeitonas"], ["Cozinhe batatas e bacalhau.", "Doure as cebolas no azeite.", "Monte em camadas e asse 20 min."]),
  r("visitas", "Escondidinho de camarão", 60, "Médio", ["500 g de camarão", "1 kg de mandioca", "Requeijão", "Tomate, cebola e coentro"], ["Faça purê de mandioca.", "Refogue o camarão com os temperos.", "Monte, cubra com requeijão e gratine."]),
  r("visitas", "Tábua de frios caseira", 20, "Fácil", ["Queijos variados", "Salame e presunto cru", "Frutas", "Torradas", "Geleia"], ["Disponha os itens em grupos na tábua.", "Complete os espaços com frutas e torradas."]),
  r("visitas", "Arroz de forno festivo", 50, "Fácil", ["4 xícaras de arroz cozido", "Frango desfiado", "Milho, ervilha e presunto", "Molho de tomate", "Mussarela"], ["Misture arroz, frango e legumes com o molho.", "Cubra com mussarela e gratine."]),
  r("visitas", "Lombo assado com abacaxi", 90, "Médio", ["1,5 kg de lombo suíno", "1 abacaxi", "Alho, limão e ervas", "Mel"], ["Tempere o lombo na véspera.", "Asse coberto por 60 min.", "Descubra, junte abacaxi e mel e doure."]),
  r("visitas", "Moqueca de peixe", 50, "Médio", ["1 kg de peixe branco", "400 ml de leite de coco", "Pimentões e tomate", "Cebola e coentro", "Azeite de dendê"], ["Monte camadas de peixe e legumes na panela.", "Regue com leite de coco e dendê.", "Cozinhe tampado por 25 min."]),
];

/** Receitas da categoria que respeitam as restrições do perfil e da própria categoria. */
export function allowedRecipes(category: RecipeCategory, restrictions: string[]) {
  const rule = CATEGORY_RULE[category];
  const all = rule ? [...new Set([...restrictions, rule])] : restrictions;
  return RECIPES.filter((x) => x.category === category && conflicts([x.name, ...x.ingredients], all).length === 0);
}

/** Quantos pratos foram pedidos ("3 pratos", "cinco receitas"); mínimo 3. */
export function requestedCount(text: string) {
  const words: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, "três": 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
  const m = text.toLowerCase().match(/(\d+|um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\s+(pratos?|receitas?|op[cç][oõ]es|sugest)/);
  const n = m ? (Number(m[1]) || words[m[1] ?? ""] || 3) : 3;
  return Math.min(10, Math.max(3, n));
}

/** Nomes de receitas do banco já sugeridos num texto. */
export function suggestedNames(text: string) {
  return RECIPES.filter((x) => text.includes(`### ${x.name}`)).map((x) => x.name);
}

/** Escolhe receitas: dá preferência às que usam o que a pessoa tem e evita as já sugeridas. */
export function pickRecipes(category: RecipeCategory, restrictions: string[], opts: { avoid?: string[]; text?: string; count?: number } = {}) {
  const pool = allowedRecipes(category, restrictions);
  const count = opts.count ?? 3;
  const avoid = new Set(opts.avoid ?? []);
  const text = (opts.text ?? "").toLowerCase();
  const score = (x: Recipe) => x.ingredients.filter((i) => i.toLowerCase().split(/[^a-zà-ú]+/).some((w) => w.length > 3 && text.includes(w))).length;
  const fresh = pool.filter((x) => !avoid.has(x.name)).sort((a, b) => score(b) - score(a));
  const reused = pool.filter((x) => avoid.has(x.name));
  return [...fresh, ...reused].slice(0, count);
}

/** Ingredientes proibidos que a pessoa citou ("tenho carne moída"). */
export function mentionedForbidden(text: string, restrictions: string[]) {
  const chunks = text.split(/,|;|\.|\se\s|\scom\s/i).map((c) => c.replace(/^\s*(tenho|quero|usar|com|e)\s+/i, "").trim()).filter(Boolean);
  return [...new Set(conflicts(chunks, restrictions).map((c) => c.ingredient))];
}

export function formatRecipe(x: Recipe, profile: string[]) {
  const rule = CATEGORY_RULE[x.category];
  const badge = rule && !profile.includes(rule) ? `\n\n**${BADGES[rule]}**` : "";
  return `### ${x.name}${badge}\n\n_${CATEGORY_LABEL[x.category]} · ⏱️ ${x.minutes} min · ${x.level}_\n\nIngredientes:\n${x.ingredients.map((i) => `- ${i}`).join("\n")}\n\nModo de preparo:\n${x.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n`;
}

/** O banco só responde sozinho quando tem receitas novas suficientes; senão a ZELFA cria receitas na hora. */
export function bankCovers(category: RecipeCategory, restrictions: string[], text: string, recentText: string) {
  const avoid = new Set(suggestedNames(recentText));
  return allowedRecipes(category, restrictions).filter((x) => !avoid.has(x.name)).length >= requestedCount(text);
}

/** Regras para receitas criadas na hora: nunca recusar, sempre variar e respeitar estritamente os ingredientes informados. */
export const DYNAMIC_RECIPE_RULES = `RECEITAS CRIADAS NA HORA (obrigatório):
- REGRA RÍGIDA DE INGREDIENTES: quando a pessoa informar o que tem em casa (ex.: "tenho carne moída e batata"), use EXCLUSIVAMENTE os ingredientes que ela falou (mais básicos simples como água, sal e óleo/azeite, se realmente precisar). NUNCA adicione, invente nem substitua por ingredientes que ela NÃO tem (como grão-de-bico, creme de leite, queijos, legumes ou temperos que ela não citou), a menos que ela peça explicitamente ou tenha restrição alimentar cadastrada.
- Você cria receitas conforme os ingredientes e o pedido. NUNCA diga "não tenho essa receita", "não conheço" ou "não encontrei receitas": sempre invente uma receita adequada e segura com o que ela tem.
- Se pedirem de novo com os mesmos ingredientes, traga receitas DIFERENTES das anteriores, variando o preparo (assado, refogado, cozido, grelhado, frito, cru) e o estilo (caseiro, regional, prático).`;

/** Resposta completa da ZELFA para um pedido dentro de uma categoria. */
export function categoryAnswer(category: RecipeCategory, restrictions: string[], text: string, recentText: string) {
  const rule = CATEGORY_RULE[category];
  const all = rule ? [...new Set([...restrictions, rule])] : restrictions;
  const bad = mentionedForbidden(text, all);
  const picks = pickRecipes(category, restrictions, { avoid: suggestedNames(recentText), text, count: requestedCount(text) });
  const warn = bad.length ? `**Atenção: ${bad.join(", ")} não combina com ${category === "vegano" ? "a alimentação vegana 🌱" : "suas restrições"}.** Separei receitas só com os outros ingredientes.\n\n` : "";
  if (!picks.length) return `${warn}Não encontrei receitas de ${CATEGORY_LABEL[category]} que respeitem suas restrições. Quer tentar outra categoria? 💛`;
  return `${warn}Aqui estão ${picks.length} receitas de **${CATEGORY_LABEL[category]}** para você:\n\n${picks.map((x) => formatRecipe(x, restrictions)).join("\n")}`;
}
