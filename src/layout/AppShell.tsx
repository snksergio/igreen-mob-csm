import { useLayoutEffect, type ReactNode } from "react";
import { AlertTriangle, BellRing, Moon, PlugZap, Sun } from "lucide-react";
import {
  AppShell as DsAppShell,
  type HeaderNotificationsConfig,
  type HeaderThemeOption,
  type Theme,
} from "@snksergio/design-system";
import { NAV_CATEGORIES, PAGE_LABELS, type PageId } from "~/nav/nav-data";
import { moduloDaEmpresa, SeletorDeLocais, type Escopo } from "./EscopoGlobal";
import { EMPRESAS, LOCAIS } from "~/pages/transacoes/transacoes-mock";

/**
 * Largura a partir da qual o rail abre com os rótulos.
 *
 * O DS usa 1536px (a mesma fronteira do padding do body). Medimos e a fronteira real
 * deste produto é mais baixa: o rail expandido custa 220px, e a 1360 as oito colunas de
 * KPI do Dashboard ainda cabem com folga. Abaixo disso o conteúdo começa a espremer —
 * a 1024 o valor "10.734,73 kWh" precisava de 168px e recebia 130px, quebrando no meio
 * do número.
 *
 * ⚠️ Vale só no mount, igual ao DS: quem abriu o menu na mão não o vê fechar sozinho ao
 * redimensionar a janela.
 */
const LARGURA_DE_RAIL_ABERTO = 1360;

/**
 * Largura abaixo da qual a sidebar vira DRAWER (o `md` do DS).
 */
const LARGURA_DE_DRAWER = 768;

/**
 * Fecha o drawer depois de navegar.
 *
 * 📋 **Lacuna do DS.** Com `sidebar="single"` o drawer do celular É a sidebar
 * expandida — `expanded` e visibilidade são o mesmo estado (documentado no
 * `app-shell.types.d.ts`). Clicar num item navega e **não fecha nada**: a pessoa
 * escolhe a tela e continua olhando para o menu, tendo que fechar na mão. Medido a
 * 390px: o `aside` segue com 390px de largura depois da navegação.
 *
 * Como o DS não expõe callback de "item clicado no mobile" nem prop de fechar, o
 * caminho é o mesmo do recolhimento automático: acionar o botão do próprio
 * componente. Se o `aria-label` mudar, o drawer volta a ficar aberto — comportamento
 * de hoje, não tela quebrada.
 */
function fecharDrawerSeMobile() {
  if (typeof window === "undefined") return;
  if (window.innerWidth >= LARGURA_DE_DRAWER) return;
  /* ⚠️ Atraso, não `requestAnimationFrame`: no frame seguinte o DS ainda não
     reconciliou o clique no item, e o botão de recolher é encontrado num DOM que será
     substituído — o clique se perde. 250ms é depois da troca de rota e antes de a pessoa
     perceber. */
  window.setTimeout(() => {
    const barra = document.querySelector("aside");
    if (!barra || barra.getBoundingClientRect().width < 200) return;
    const botao = [...barra.querySelectorAll("button")].find((b) =>
      /recolher|colapsar/i.test(b.getAttribute("aria-label") ?? ""),
    );
    botao?.click();
  }, 250);
}

function railComecaRetraido() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < LARGURA_DE_RAIL_ABERTO;
}

/**
 * Recolhe o rail **clicando no botão do próprio DS**, em vez de nascer recolhido.
 *
 * ## Por que um clique simulado, e não `defaultMenuCollapsed`
 *
 * A `SingleMenuSidebar` abre o rail inteiro no hover enquanto ele está recolhido — é
 * assim que se alcança empresa e locais sem reabrir o menu. Só que o hover é guardado por
 * um estado interno `lockedOpen`, e o `AppShell` passa para a sidebar **apenas**
 * `expanded` (controlado), nunca `defaultExpanded`. Resultado: `lockedOpen` nasce com o
 * default do componente, que é `true`, e o `onMouseEnter` começa com
 * `if (lockedOpen) return`.
 *
 * Na prática: nascer recolhido por `defaultMenuCollapsed` dá um rail recolhido **sem
 * hover**; recolher pelo clique dá um rail recolhido **com hover**. Medido nos dois
 * caminhos — a 1440 recolhido no clique o painel abre em 280px no hover; a 1024 recolhido
 * pelo default ele fica em 80px. 📋 Lacuna do DS: só o `toggle()` escreve `lockedOpen`.
 *
 * ## O que acontece se o DS mudar
 *
 * O botão é achado pelo `aria-label`. Se ele mudar de nome, o clique não acontece e a
 * tela abre com o rail **aberto** — que é o comportamento antigo, não uma tela quebrada.
 * Degradação segura, de propósito.
 */
/**
 * Recolhe o rail **clicando no botão do próprio DS**, em vez de nascer recolhido.
 *
 * ## Por que um clique simulado, e não `defaultMenuCollapsed`
 *
 * A `SingleMenuSidebar` abre o rail inteiro no hover enquanto está recolhida — é assim
 * que se alcança empresa e locais sem reabrir o menu. Só que o hover é guardado por um
 * estado interno `lockedOpen`, e o `AppShell` passa para a sidebar **apenas** `expanded`
 * (controlado), nunca `defaultExpanded`. Resultado: `lockedOpen` nasce com o default do
 * componente, que é `true`, e o `onMouseEnter` começa com `if (lockedOpen) return`.
 *
 * Medido nos dois caminhos, a 1024: nascer recolhido por `defaultMenuCollapsed` dá um
 * rail de 80px **sem hover**; recolher pelo clique dá um rail de 80px **com hover**, que
 * abre o painel de 280px por cima do conteúdo. 📋 Lacuna do DS: só o `toggle()` escreve
 * `lockedOpen`.
 *
 * ## Por que com atraso, e não num `requestAnimationFrame`
 *
 * Recolher tem transição de largura de 300ms, e em desenvolvimento o StrictMode monta o
 * efeito duas vezes. Clicando no frame seguinte, a segunda montagem ainda lê o rail como
 * aberto e clica de novo — dois cliques se anulam. Com o atraso, a limpeza da primeira
 * montagem cancela o agendamento antes de ele acontecer, e só a segunda executa.
 *
 * ## Se o DS mudar
 *
 * O botão é achado pelo `aria-label`. Se ele mudar de nome, o clique não acontece e a
 * tela abre com o rail **aberto** — comportamento antigo, não tela quebrada.
 */
const ESPERA_ATE_A_SIDEBAR_ASSENTAR = 400;

function useRailRecolhidoComoSeFosseClique() {
  useLayoutEffect(() => {
    if (!railComecaRetraido()) return;
    const id = window.setTimeout(() => {
      const barra = document.querySelector("aside");
      if (!barra) return;
      /* Não clica num rail que já está recolhido.
         ⚠️ A largura que responde é a do `<aside>` (80 recolhido · 280 aberto), **não a
         do filho**: o painel interno mantém 280 sempre e vira overlay quando recolhido —
         é exatamente esse overlay que o hover revela. */
      if (barra.getBoundingClientRect().width < 200) return;
      const botao = [...barra.querySelectorAll("button")].find((x) =>
        /recolher|colapsar/i.test(x.getAttribute("aria-label") ?? ""),
      );
      botao?.click();
    }, ESPERA_ATE_A_SIDEBAR_ASSENTAR);
    return () => window.clearTimeout(id);
  }, []);
}

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  /** Recorte global (empresa + locais). Controlado no TOPO DA SIDEBAR. */
  escopo: Escopo;
  onEscopoChange: (e: Escopo) => void;
  /** "Sair" do menu do usuário — devolve o app pra tela de login. */
  onSair: () => void;
  /**
   * Tema e seu setter, vindos do `App`.
   *
   * ⚠️ Não é `useTheme()` aqui dentro de propósito: o hook precisa rodar também na tela
   * de login, que não monta este shell. Ver o JSDoc em `App.tsx`.
   */
  tema: Theme;
  onTemaChange: (t: Theme) => void;
  children: ReactNode;
}

/**
 * Sem "Sistema" de propósito: o produto abre escuro por decisão (ver `main.tsx`), e
 * oferecer a opção que segue o SO reintroduziria o claro pela porta de trás.
 */
const OPCOES_TEMA: HeaderThemeOption[] = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Escuro", icon: Moon },
];

/**
 * Notificações mock, no espírito do domínio (alerta de carregador offline, recarga
 * concluída, manutenção). A referência tem a campainha com badge vermelho; o conteúdo
 * do dropdown dela nunca foi medido, então isto é composição nossa, não cópia.
 */
function notificacoesDoHeader(
  irParaAlertas: () => void,
): HeaderNotificationsConfig {
  return {
    items: [
      {
        id: "n1",
        icon: AlertTriangle,
        color: "var(--color-fg-danger)",
        title: "Carregador offline",
        body: "DC 40 KW - 1 · IGREEN MOB - SEDE está sem comunicação há 12 min.",
        time: "12 min",
        unread: true,
        kind: "alert",
      },
      {
        id: "n2",
        icon: PlugZap,
        color: "var(--color-fg-success)",
        title: "Recarga concluída",
        body: "39,58 kWh em IGREEN MOB - SEDE · R$ 62,71.",
        time: "1 h",
        unread: true,
        kind: "alert",
      },
      {
        id: "n3",
        icon: BellRing,
        color: "var(--color-fg-warning)",
        title: "Manutenção programada",
        body: "AC 7,4 KW - 1 · IGREEN MOB - BIG MAIS Gov Valadares, amanhã às 08:00.",
        time: "ontem",
        kind: "alert",
      },
    ],
    emptyMessage: "Nenhuma notificação por aqui.",
    /* ⚠️ O rodapé "Ver todas" só RENDERIZA quando `onViewAll` vem — o `viewAllLabel`
       sozinho é inerte (`header-notifications.tsx:162`). Passávamos só o rótulo, e por
       isso o popover não tinha saída: quem quisesse a lista inteira não tinha caminho
       nenhum, já que Alertas também não está no rail. */
    viewAllLabel: "Ver todas as notificações",
    onViewAll: irParaAlertas,
  };
}

export function AppShell({
  activePage,
  onNavigate,
  escopo,
  onEscopoChange,
  onSair,
  tema,
  onTemaChange,
  children,
}: Props) {
  useRailRecolhidoComoSeFosseClique();

  return (
    <DsAppShell
      sidebar="single"
      categories={NAV_CATEGORIES}
      sidebarTitle="iGreen MOB"
      /* O default do DS é responsivo, mas na fronteira dele: colapsado abaixo de 1536px.
         Passávamos `false` cru, o que **vence a regra responsiva inclusive em telas
         pequenas** — e era por isso que a 1024 o rail continuava aberto comendo 220px do
         conteúdo. Agora a regra é nossa, com a fronteira medida. */
      /* Abre EXPANDIDO sempre; quem recolhe em tela pequena é o clique simulado do
         `useRailRecolhidoComoSeFosseClique` — ver o JSDoc dele para o porquê. */
      defaultMenuCollapsed={false}
      /* ESCOPO GLOBAL no topo da sidebar, em dois campos empilhados:
           · `sidebarModule`  → a EMPRESA (seletor do DS, não troca o menu)
           · `sidebarTopSlot` → os LOCAIS (multi-select nosso, ver `EscopoGlobal.tsx`)

         ⛔ A versão anterior punha os locais em `sidebarSearchCommand` — dentro da paleta
         da BUSCA. Errado: o gatilho da busca tem lupa e `⌘K` fixos, o controle se
         apresentava como busca, e o rodapé de ações rolava com a lista. O DS ganhou
         `sidebarTopSlot` pra conteúdo arbitrário e a busca voltou a ser busca.

         Sem `sidebarShowSearch`: o menu tem 16 destinos e a navegação é plana, então a
         paleta de busca do menu não paga o espaço que rouba dos dois campos de escopo —
         pedido explícito do operador. A busca do Header continua lá. */
      sidebarModule={moduloDaEmpresa(escopo, EMPRESAS, onEscopoChange)}
      sidebarTopSlot={
        <SeletorDeLocais
          escopo={escopo}
          locais={LOCAIS}
          onChange={onEscopoChange}
          /* Duas cascas existem pra escolher na tela: `select` (borda + fundo de input)
             e `busca` (fundo escuro sem borda, igual ao campo de busca da sidebar).
             Trocar de uma pra outra é trocar esta palavra. */
          variante="busca"
        />
      }
      activeItemId={activePage}
      onSidebarItemClick={(id) => {
        onNavigate(id as PageId);
        fecharDrawerSeMobile();
      }}
      breadcrumb={[{ label: "iGreen MOB CMS" }, { label: PAGE_LABELS[activePage] }]}
      /* Os dois botoes do header ao lado da busca: tema e notificacoes. Cada um so
         RENDERIZA se as props dele vierem — `themeOptions` para o de tema, e
         `notifications` para a campainha. Sem elas o header fica so com a busca. */
      theme={tema}
      onThemeChange={(id) => onTemaChange(id as Theme)}
      themeOptions={OPCOES_TEMA}
      notifications={notificacoesDoHeader(() => onNavigate("alertas"))}
      user={{ name: "Matheus Pego", email: "matheus.pego@exemplo.com.br" }}
      /**
       * `onSettings` leva à tela "Minha conta". A referência não tem esse item no menu
       * do usuário — é acréscimo pedido pelo operador (2026-09-16), e a distinção é real:
       * configuração DA CONTA não é o grupo "Configurações" do rail, que é cadastro do
       * sistema.
       *
       * ⚠️ **Lacuna do DS, não esquecimento nosso.** O pedido incluía também "Tema" (com
       * submenu Sistema/Claro/Escuro) e um link de "Notificações" aqui. O `UserMenu` do
       * DS faz exatamente isso — mas ele só é montado quando `sidebar="menu"`. Com
       * `sidebar="single"`, o `AppShell` constrói um `SingleMenuUser.actions` FIXO a
       * partir de `onSettings`/`onLogout` (`app-shell.tsx:246`), sem prop pra acrescentar
       * item nem pro grupo de tema. Enquanto isso, o botão de tema segue no header.
       *
       * Decisão do operador (2026-09-16): **seguir sem isso**. O botão de tema no header
       * já cobre a troca, e abrir um PR no DS por dois itens de menu custaria um release
       * inteiro. Fica registrado aqui pra quem voltar não concluir que foi esquecimento.
       */
      onSettings={() => onNavigate("minha-conta")}
      /* `onLogout` nao e enfeite: o `AppShell` do DS monta as acoes do user
         menu A PARTIR de `onSettings`/`onLogout` (app-shell.tsx:208). Sem
         nenhuma das duas, `actions` sai vazio e o rodape da sidebar renderiza nome +
         e-mail SEM trigger de dropdown — medido em 2026-09-16.
         Passamos so `onLogout`: a referencia tem "Sair" e NAO tem "Configuracoes"
         no menu do usuario (Configuracoes vive no rail). */
      /* Era `window.location.reload()` — um "Sair" que recarregava a mesma sessão e
         devolvia a pessoa exatamente onde ela estava, que é o oposto de sair. Agora
         desautentica de verdade e cai na tela de login. */
      onLogout={onSair}
    >
      {children}
    </DsAppShell>
  );
}
