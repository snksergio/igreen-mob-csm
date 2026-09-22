import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BellRing,
  Moon,
  PanelLeftOpen,
  PlugZap,
  Sun,
} from "lucide-react";
import {
  AppShell as DsAppShell,
  Button,
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

function railComecaRetraido() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < LARGURA_DE_RAIL_ABERTO;
}

/**
 * Botão de expandir o rail, no canto direito do header.
 *
 * 📋 **Lacuna do DS, e é o que obriga este componente a existir.** Com o rail retraído o
 * `AppShell` esconde o `sidebarModule` e o `sidebarTopSlot` — que aqui são a EMPRESA e os
 * LOCAIS, o recorte global de que toda tela depende — e **não desenha nenhum gatilho de
 * expandir**: o cabeçalho da sidebar fica só com a logo (medido no DOM, 2026-09-22). Sem
 * isto, retrair abaixo de 1360 tornaria o escopo inalcançável, sem caminho de volta.
 *
 * Aparece só quando retraído: com o rail aberto o próprio DS já oferece o botão de fechar.
 */
function BotaoDeExpandirRail({ onExpandir }: { onExpandir: () => void }) {
  return (
    <Button
      variant="ghost"
      color="secondary"
      size="sm"
      /* Sem filho: o `Button` do DS não tem prop `iconOnly`, e um botão só com
         `iconLeft` já renderiza quadrado. O nome acessível vem do `aria-label`. */
      iconLeft={<PanelLeftOpen />}
      onClick={onExpandir}
      aria-label="Expandir o menu e o seletor de locais"
      title="Expandir o menu e o seletor de locais"
    />
  );
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
  /**
   * Retração do rail **controlada por nós**, e não pelo estado interno do DS.
   *
   * O DS aceita `defaultMenuCollapsed` (uncontrolled) — bastaria para abrir retraído. Mas
   * aí não dá pra SABER se está retraído, e é essa informação que decide se o header
   * precisa mostrar o botão de expandir. Ver o JSDoc de `BotaoDeExpandirRail`.
   */
  const [railRetraido, setRailRetraido] = useState(railComecaRetraido);

  return (
    <DsAppShell
      sidebar="single"
      categories={NAV_CATEGORIES}
      sidebarTitle="iGreen MOB"
      /* O default do DS é responsivo, mas na fronteira dele: colapsado abaixo de 1536px.
         Passávamos `false` cru, o que **vence a regra responsiva inclusive em telas
         pequenas** — e era por isso que a 1024 o rail continuava aberto comendo 220px do
         conteúdo. Agora a regra é nossa, com a fronteira medida. */
      menuCollapsed={railRetraido}
      onMenuCollapseChange={setRailRetraido}
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
      onSidebarItemClick={(id) => onNavigate(id as PageId)}
      breadcrumb={[{ label: "iGreen MOB CMS" }, { label: PAGE_LABELS[activePage] }]}
      /* Os dois botoes do header ao lado da busca: tema e notificacoes. Cada um so
         RENDERIZA se as props dele vierem — `themeOptions` para o de tema, e
         `notifications` para a campainha. Sem elas o header fica so com a busca. */
      theme={tema}
      onThemeChange={(id) => onTemaChange(id as Theme)}
      themeOptions={OPCOES_TEMA}
      notifications={notificacoesDoHeader(() => onNavigate("alertas"))}
      headerRightSlot={
        railRetraido ? (
          <BotaoDeExpandirRail onExpandir={() => setRailRetraido(false)} />
        ) : undefined
      }
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
