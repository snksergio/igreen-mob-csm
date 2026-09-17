import type { SingleMenuCategory } from "@snksergio/design-system";
import {
  ArrowLeftRight,
  Gauge,
  LayoutDashboard,
  PlugZap,
  Settings,
  Tag,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Todo destino do RAIL. O `App.tsx` faz switch sobre isto.
 *
 * Três das 19 telas do inventário ficam fora daqui de propósito, porque não são
 * alcançadas pelo rail: **Login** (pré-autenticação), **Perfil** (user menu) e
 * **Alertas** (campainha do header). São 16 destinos no rail, não 19.
 *
 * ⚠️ Os 16 destinos e os 16 ids continuam EXATAMENTE os mesmos depois do
 * reagrupamento de 2026-09-16 — o que mudou foi só em que linha do rail cada um
 * aparece. Este tipo aqui é o contrato com o `App.tsx`; mexer nele é outro trabalho.
 */
export type PageId =
  | "dashboard"
  | "resumo"
  | "transacoes"
  | "performance"
  | "repasses"
  | "gestao-carga"
  | "precos"
  | "carregadores"
  | "monitoramento"
  | "cupons"
  | "permissoes"
  | "motoristas"
  | "estrutura-rede"
  | "locais"
  | "usuarios"
  | "configurar-alertas"
  /**
   * Os dois destinos FORA DO RAIL, alcançados pelo chrome e não pelo menu.
   *
   * · `alertas` — rodapé "Ver todas" da campainha do header.
   * · `minha-conta` — item "Configurações" do menu do usuário, no rodapé da sidebar.
   *
   * Entram no `PageId` porque o switch do `App.tsx` é exaustivo e o breadcrumb lê o
   * `PAGE_LABELS` — ficar de fora do rail não é ficar de fora do roteamento.
   */
  | "alertas"
  | "minha-conta";

/** Rótulo legível de cada destino — usado no breadcrumb e no placeholder. */
export const PAGE_LABELS: Record<PageId, string> = {
  dashboard: "Dashboard",
  resumo: "Resumo",
  transacoes: "Transações",
  performance: "Performance",
  repasses: "Repasses",
  "gestao-carga": "Gestão de Carga",
  precos: "Preços",
  carregadores: "Carregadores",
  monitoramento: "Monitoramento",
  cupons: "Cupons",
  permissoes: "Permissões",
  motoristas: "Motoristas",
  "estrutura-rede": "Estrutura da rede",
  locais: "Locais",
  usuarios: "Usuários",
  "configurar-alertas": "Configurar alertas",
  alertas: "Alertas",
  "minha-conta": "Minha conta",
};

/* ══════════════════════════════════════════════════════════════════════════
   O rail: 10 linhas de topo, os MESMOS 16 destinos

   ⚠️ Isto DIVERGE da referência de propósito, a pedido do operador (2026-09-16).
   A referência tem **14 linhas de topo** — 12 folhas e 2 grupos (`Financeiro` e
   `Configurações`), e as rotas dela confirmam: só `/pt/financial/*` e
   `/pt/settings/*` são aninhados, todo o resto é raiz. O inventário registra o
   original em `docs/inventario-igreen-mob-cms.md` §4, então a divergência é
   rastreável e reversível — nenhum destino saiu, nenhum id mudou.

   Três agrupamentos avaliados e REJEITADOS, pra não serem re-propostos:

   · **Motoristas junto de Usuários** — erro semântico. Usuários são operadores do
     back-office; motoristas são clientes do app. Populações diferentes.
   · **Preços + Cupons em "Comercial"** — o eixo existe (os dois definem o que o
     motorista paga), mas "Comercial" na iGreen significa rede de consultores, e um
     grupo de 2 troca 2 linhas por 1 linha + 1 clique. Ganho quase nulo.
   · **Dashboard + Resumo + Performance em "Análise"** — coerente no papel, mas os
     três são irmãos de topo na referência, e o Dashboard é a primeira tela e a mais
     clicada: enterrá-la num grupo custa um clique no caminho mais quente do app.

   E `Financeiro` **continua grupo de um** (só Repasses). Grupo de um normalmente é
   erro — não separa nada. Fica porque a rota da origem é `/pt/financial/transfers`,
   o que indica mais telas nesse ramo ainda não medidas (o inventário tem 165 lacunas
   "não medido"). Achatar agora pra desachatar depois é pior.
   ══════════════════════════════════════════════════════════════════════════ */

export const NAV_CATEGORIES: SingleMenuCategory[] = [
  /* Dashboard fica SOZINHA no topo por decisão do operador: é a primeira tela e a
     mais clicada do app. Agrupar o caminho mais quente é o inverso do que
     agrupamento serve. */
  { id: "dashboard", icon: <LayoutDashboard />, label: "Dashboard", href: "#dashboard" },
  { id: "resumo", icon: <Gauge />, label: "Resumo", href: "#resumo" },
  { id: "transacoes", icon: <ArrowLeftRight />, label: "Transações", href: "#transacoes" },
  { id: "performance", icon: <TrendingUp />, label: "Performance", href: "#performance" },
  {
    id: "financeiro",
    icon: <Wallet />,
    label: "Financeiro",
    items: [{ id: "repasses", label: "Repasses" }],
  },
  /**
   * `Infraestrutura` — o equipamento físico, nas três formas em que se fala dele:
   * **cadastro** (Carregadores, `/chargers`) → **estado ao vivo** (Monitoramento,
   * `/monitoring`) → **operação** (Gestão de Carga, `/smartspott`). Nenhum dos outros
   * itens do rail fala de equipamento, o que torna este o agrupamento mais limpo da
   * lista.
   *
   * A ordem interna NÃO é a da referência (lá é Gestão de Carga, Carregadores,
   * Monitoramento, por posição no rail). Aqui é cadastro → estado → operação, porque
   * dentro de um grupo a entidade tem que vir antes do que se faz com ela.
   *
   * ⚠️ Dois custos aceitos conscientemente: **Monitoramento passa a custar um
   * clique** (é tela de operação, provavelmente aberta várias vezes ao dia), e os três
   * **perdem o ícone** — `SingleMenuSubItem` é `{ id, label, href? }`, sem campo de
   * ícone. O grupo herda o `PlugZap` que era do Carregadores.
   *
   * O nome não é "Rede de recarga" porque `Estrutura da rede` (dentro de
   * Configurações) já usa "rede" com OUTRO sentido — a hierarquia de empresas. Dois
   * "rede" no mesmo menu significando coisas diferentes é ambiguidade gratuita.
   */
  {
    id: "infraestrutura",
    icon: <PlugZap />,
    label: "Infraestrutura",
    items: [
      { id: "carregadores", label: "Carregadores" },
      { id: "monitoramento", label: "Monitoramento" },
      { id: "gestao-carga", label: "Gestão de Carga" },
    ],
  },
  { id: "precos", icon: <Tag />, label: "Preços", href: "#precos" },
  { id: "cupons", icon: <Ticket />, label: "Cupons", href: "#cupons" },
  { id: "motoristas", icon: <Users />, label: "Motoristas", href: "#motoristas" },
  /**
   * `Configurações` recebeu dois itens que estavam soltos no topo:
   *
   * · **Permissões** (`/permissions`) — mesmo assunto de Usuários: quem opera o
   *   back-office. Os dois estavam a uma linha de distância um do outro, em níveis
   *   diferentes, pelo acaso da ordem do rail.
   * · **Configurar alertas** (`/alert-groups`) — o rótulo já começa com "Configurar".
   *   É a tela de REGRAS de alerta, e regra é configuração. Não confunda com
   *   **Alertas**, a lista ao vivo, que fica na campainha do header e nunca esteve no
   *   rail — quem consome o alerta continua a um clique de lá.
   *
   * Cinco itens num grupo de configurações não é excesso: grupo de settings é
   * legitimamente heterogêneo, e é o único lugar do menu onde "cadastro estrutural" e
   * "regra do sistema" convivem sem ambiguidade.
   */
  {
    id: "configuracoes",
    icon: <Settings />,
    label: "Configurações",
    items: [
      { id: "estrutura-rede", label: "Estrutura da rede" },
      { id: "locais", label: "Locais" },
      { id: "usuarios", label: "Usuários" },
      { id: "permissoes", label: "Permissões" },
      { id: "configurar-alertas", label: "Configurar alertas" },
    ],
  },
];

/** Locais do seletor global do header. 38 na referência; 8 bastam pro mock. */
export const LOCAIS_MOCK = [
  "IGREEN MOB - Usina Solar Vinhedo",
  "IGREEN MOB - BIG MAIS Gov Valadares",
  "IGREEN MOB - SEDE",
  "IGREEN MOB - Posto Via Dupla",
  "IGREEN MOB - Arena 7 BH",
  "IGREEN MOB - Duo FOOD",
  "IGREEN MOB - Shopping Colombo",
  "PV MOB - Estacionamento",
];
