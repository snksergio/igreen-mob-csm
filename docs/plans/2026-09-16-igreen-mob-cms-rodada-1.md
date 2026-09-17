# iGreen MOB CMS — Rodada 1: base + shell + Transações

> **Para executores:** as etapas usam checkbox (`- [ ]`). Execute tarefa por tarefa,
> na ordem. Cada tarefa termina em **verificação**, não em commit.

**Goal:** Projeto novo rodando, com o shell do iGreen MOB CMS navegável e a tela de
Transações completa sobre o iGreen DS, tudo em mock.

**Architecture:** Vite + React 19 + Tailwind v4 consumindo `@snksergio/design-system`
por npm. `AppShell` com `sidebar="single"` monta rail e header. Uma pasta por página
(`pages/<nome>/`), com o mock ao lado da página que o consome.

**Tech Stack:** React 19 · Vite 6 · TypeScript 5.6 · Tailwind CSS v4 ·
`@snksergio/design-system@0.63.0` · `lucide-react@1.7.0` · vitest (só para os
invariantes do mock)

**Spec:** `docs/specs/2026-09-16-igreen-mob-cms-replica-design.md`

---

## Global Constraints

Valem em toda tarefa, sem repetição:

- **Nada é commitado.** Nem `git init`, nem `git add`, nem `git commit`. Decisão do
  operador em 2026-09-16. Nenhuma tarefa fecha em commit — fecham em verificação
- **Zero Tailwind literal onde há token DS.** `gap-4` → `gap-gp-md` · `p-4` → `p-sp-md` ·
  `px-3` → `px-pad-lg` · `rounded-lg` → `rounded-radius-lg` · `shadow-md` → `shadow-sh-md` ·
  `h-9` → `min-h-form-md` (36px) · `h-10` → `min-h-form-lg` (40px) · `size-5` → `size-icon-md`
- **Zero hardcode.** Sem `#fff`, sem `16px`, sem `0.875rem`, sem `text-[14px]`
- **Nomenclatura de cor é V3.** `brand` (não `primary`) · `fg.default` (não `fg.foreground`) ·
  `border.default` (não `border.main`) · `danger` (não `critical`) · `ring-ring-brand` para
  foco (nunca `border-*`). Tom sutil depende da família: status usa `-muted`
  (`bg-bg-success-muted`), `brand` usa `-subtle` (`bg-bg-brand-subtle`), neutro usa
  `-subtle` sem cor (`bg-bg-subtle`)
- **Proibido o vocabulário da bridge shadcn** (`bg-popover`, `text-foreground`,
  `ring-ring`, as 19 chaves) e a paleta nativa do Tailwind (`bg-red-500`). Elas não existem
  no pacote npm e a cor cai em `currentColor` (L-039)
- **Borda crua não tem cor.** `border` sozinho usa `currentColor` — sempre
  `border border-border-default` (ou `-subtle`/`-brand`/`-danger-muted`)
- **Formatação é manual.** Não há prettier no projeto e isso é deliberado. Espelhe a
  indentação e as quebras do código vizinho
- **Marca:** `default` (iGreen). Nenhum `data-theme` no `<html>`
- **Idioma da UI:** pt-BR, copiando os labels da referência literalmente
- ⛔ **A palavra da marca do sistema de referência ("Spott") é PROIBIDA em qualquer
  lugar do produto** — nome de pasta, `package.json`, `<title>`, `sidebarTitle`,
  breadcrumb, label de menu, valor de dado no mock, nome de variável, comentário.
  Decisão do operador em 2026-09-16. O produto é **iGreen MOB**; o item de menu que era
  "Smart Spott" é **"Gestão de Carga"**; a coluna Aplicativo vale **"iGreen MOB"**.
  **Única exceção:** a URL e as rotas do sistema de referência nos documentos
  (`cmstest.spott.eco`, `/pt/smartspott`) — são proveniência, o endereço onde ir
  medir de novo, e apagá-las tornaria o inventário não-verificável. Elas não entram em
  código nenhum

### Sobre testes neste plano

Este é um projeto de réplica visual em mock. A verificação real é **typecheck + browser**,
e é assim que as tarefas 1, 2, 4 e 5 fecham — não invento teste unitário para
`<AppShell categories={...}>`, porque um teste desses afirmaria menos do que uma
screenshot.

A exceção é a **Tarefa 3** (gerador de mock), que tem lógica de verdade com invariantes
que quebram em silêncio: SoC inicial maior que o final, valor negativo, janela de horário
incoerente com a duração. Um desses passa despercebido no browser e vira "bug de dado"
na reunião de aprovação. Essa tarefa é TDD de verdade.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `package.json` | deps e scripts |
| `vite.config.ts` | plugins React + Tailwind, alias `~` → `src`, porta 3300 |
| `tsconfig.json` | paths do alias `~` |
| `index.html` | root do app |
| `src/main.tsx` | bootstrap React |
| `src/index.css` | `@import "tailwindcss"` + `@source` + tema do DS. **O arquivo mais crítico do projeto** |
| `src/App.tsx` | estado do item ativo + roteamento por switch |
| `src/nav/nav-data.tsx` | as 14 linhas de topo do rail com seus 16 destinos. Fonte única da navegação. `.tsx` porque tem JSX nos ícones |
| `src/layout/AppShell.tsx` | wrapper do `AppShell` do DS com o chrome do iGreen MOB |
| `src/layout/PlaceholderPage.tsx` | página única compartilhada pelos itens não construídos |
| `src/pages/transacoes/TransacoesPage.tsx` | a tela: PageHeader + DataTable |
| `src/pages/transacoes/transacoes-columns.tsx` | as 12 colunas. Separado da página porque é o artefato que as outras 11 tabelas vão copiar |
| `src/pages/transacoes/transacoes-mock.ts` | gerador + dataset de ~60 linhas |
| `src/pages/transacoes/transacoes-mock.test.ts` | invariantes do gerador |
| `docs/inventario-igreen-mob-cms.md` | o inventário das 18 telas |

`transacoes-columns.tsx` sai da página de propósito: 12 das 18 telas são tabela, e esse
arquivo é o molde que elas copiam. Dentro do `TransacoesPage.tsx` ele não seria
encontrável.

---

## Task 1: Projeto base, com o `@source` provado

Esta tarefa existe por causa de um único risco, e ele justifica a tarefa inteira: sem a
diretiva `@source`, o Tailwind v4 não escaneia `node_modules`, **nenhuma classe do DS é
gerada, e não há erro nenhum**. Medido no repo do DS em 2026-08-07: 9 regras CSS contra
milhares, `<Button>` transparente com 24px de altura. Provar isso antes de escrever
qualquer tela é o que evita depurar a tela errada.

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `src/App.tsx` (temporário — só o smoke test)
- Create: `public/fonts/` (destino das fontes Geist)

- [ ] **Passo 1: criar o `.gitignore` e o `package.json`**

O `.gitignore` vem primeiro porque o Tailwind o respeita no scan. Nao commitamos nada,
mas o arquivo nao e sobre git aqui — e sobre nao varrer `dist/`:

```
node_modules
dist
*.local
.DS_Store
```

```json
{
  "name": "igreen-mob-cms",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@snksergio/design-system": "0.63.0",
    "clsx": "^2.1.1",
    "lucide-react": "^1.7.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.0",
    "tailwind-variants": "^3.0.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Passo 2: criar o `vite.config.ts`**

Porta 3300 — o DS usa 3100 e o virtual-proposta 3200. Evita colisão se os três subirem.

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3300,
    open: true,
  },
});
```

- [ ] **Passo 3: criar o `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["node", "vite/client"],
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Passo 4: criar o `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>iGreen MOB CMS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Passo 5: criar o `src/index.css` — a linha `@source` é o ponto da tarefa**

A ordem importa: `tailwindcss` primeiro, `@source` antes do tema, tema antes das
animações.

```css
/* O escopo de scan e EXPLICITO de proposito — ver a nota logo abaixo. */
@import "tailwindcss" source(none);

/* O codigo deste app. Relativo a este arquivo, entao `./` e `src/`. */
@source "./**/*.{ts,tsx}";

/* O design system. Cobre `dist-lib/**`, nao so o `index.mjs`. */
@source "../node_modules/@snksergio/design-system/dist-lib/**/*.mjs";

@import "@snksergio/design-system/theme.css";
@import "tw-animate-css";
```

⚠️ **`source(none)` nao e detalhe — sem ele a verificacao desta tarefa mente.** A
auto-deteccao do Tailwind v4 varre o diretorio do projeto inteiro (tudo que nao esta
gitignorado), **incluindo `docs/`**. Medido em 2026-09-16: cada nome de classe citado
neste plano virava regra CSS real, numa correspondencia 1:1 (`min-h-form-lg` aparecia 1x
no doc e gerava 1 regra). O peso e o menor problema — as classes fantasma **mascaram a
falha do `@source`**, que e exatamente o que esta tarefa existe pra pegar. Com o escopo
explicito, o estado quebrado da 12.811 bytes contra 169.744 do correto, e toda classe de
componente do DS desaparece.

O glob cobre `dist-lib/**`, não só o `index.mjs`: as classes dos componentes flutuantes
(Modal, Panel, dropdown, popover) vivem nos chunks.

- [ ] **Passo 6: criar o `src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Passo 7: criar o `src/App.tsx` do smoke test**

Temporário — a Tarefa 2 o substitui. Ele existe só para provar que o CSS do DS chegou.

```tsx
import { Button } from "@snksergio/design-system";

export function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-gp-lg bg-bg-canvas">
      <h1 className="text-heading-md text-fg-default">iGreen MOB CMS</h1>
      <p className="text-body-sm text-fg-muted">
        Se este botão tem altura, cor de marca e radius, o <code>@source</code> funcionou.
      </p>
      <Button>Verificar tema</Button>
    </div>
  );
}
```

- [ ] **Passo 8: instalar as deps e copiar as fontes**

```bash
npm install
```

```bash
mkdir -p public/fonts && cp node_modules/@snksergio/design-system/dist-lib/fonts/*.woff2 public/fonts/
```

Sem as fontes, os 27 presets tipográficos do DS renderizam em `system-ui` — e isso não
dá erro, só fica errado.

- [ ] **Passo 9: verificar o typecheck**

```bash
npm run typecheck
```

Esperado: sem erro. Se `@snksergio/design-system` não resolver os types, confirme que
`skipLibCheck` está `true` e que o pacote instalou com a versão exata `0.63.0`.

- [ ] **Passo 10: verificar no browser — a prova do `@source`**

Suba o dev server e abra a página.

Três coisas precisam ser verdade, e todas as três falham juntas se o `@source` não
pegou:

| Verificar | Sintoma da falha |
|---|---|
| **O CSS buildado passa de 150 KB** | ~13 KB. Este e o sinal primario, e o unico robusto |
| A regra `.bg-bg-brand` existe no CSS buildado | Ausente. O `<Button>` sai transparente |
| O `<Button>` tem altura de 40px e radius de 10px | 24px e radius 0 — **so vale com `source(none)` no lugar** |
| O titulo usa Geist, nao system-ui | Desenho de letra diferente; `document.fonts` sem `Geist:loaded` |

O jeito mais direto de medir as duas primeiras, sem browser:

```bash
npx vite build --logLevel error && ls -l dist/assets/*.css
```

```bash
grep -c "bg-bg-brand" dist/assets/*.css
```

⛔ **Duas rubricas que este passo TINHA e que eram falsas — nao as reintroduza:**

1. *"o fundo da pagina nao e branco puro"* — **insatisfazivel**. `canvas: white` na marca
   `default` (`tokens/brands/default/semantic/color-light.ts:30`), entao o fundo e branco
   puro por design no modo claro. O sintoma nunca distinguiria sucesso de falha.
2. *"botao transparente, 24px, radius 0"* como sinal isolado — **era falso-positivo
   perigoso** enquanto o scan incluia `docs/`: altura e radius sobreviviam (vinham das
   classes citadas neste proprio plano) e so a cor caia. Quem concluisse "altura certa,
   logo o tema chegou" errava. Com `source(none)` a rubrica voltou a valer — mas o sinal
   primario continua sendo o tamanho do CSS.

Confirme contando as regras CSS carregadas: se o total estiver na casa das dezenas em
vez de milhares, o `@source` não está pegando. Nesse caso confira o caminho relativo do
glob a partir de `src/index.css` — ele sobe um nível (`../node_modules/...`).

---

## Task 2: Shell do iGreen MOB — rail, header e os 16 destinos

**Files:**
- Create: `src/nav/nav-data.tsx` (extensão `.tsx`, não `.ts` — o arquivo tem JSX nos ícones)
- Create: `src/layout/AppShell.tsx`
- Create: `src/layout/PlaceholderPage.tsx`
- Modify: `src/App.tsx` (substitui o smoke test da Tarefa 1)

**Interfaces:**
- Consome: `src/index.css` provado na Tarefa 1
- Produz: `NAV_CATEGORIES: SingleMenuCategory[]` · `PAGE_LABELS: Record<PageId, string>` ·
  `LOCAIS_MOCK: string[]` · `type PageId` (união de 16 literais). A Tarefa 4 registra
  `"transacoes"` como a única página resolvida; qualquer tela futura se pendura no mesmo
  `PageId`

- [ ] **Passo 1: criar o `src/nav/nav-data.tsx`**

O iGreen MOB é sistema único, sem workspace switcher — logo `sidebar="single"` com
`categories`, não `contexts`. Categorias com sub-itens usam `items`; as folhas usam
`href`.

O `id` de cada destino é o `PageId`, e é o mesmo identificador que o `App.tsx` usa para
decidir o que renderizar. Uma fonte, não duas.

Tipe o array com o `SingleMenuCategory` **do DS** (exportado no barrel,
`src/components/index.ts:49`), não com uma interface própria: uma interface local
compila por compatibilidade estrutural hoje e passa a divergir em silêncio quando o DS
mudar o tipo.

```tsx
import type { SingleMenuCategory } from "@snksergio/design-system";
import {
  ArrowLeftRight,
  BellRing,
  Gauge,
  LayoutDashboard,
  Lock,
  MonitorDot,
  PlugZap,
  Settings,
  Tag,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

/**
 * Todo destino do RAIL. O `App.tsx` faz switch sobre isto.
 *
 * Três das 18 telas do inventário ficam fora daqui de propósito, porque não são
 * alcançadas pelo rail: **Login** (pré-autenticação), **Perfil** (user menu) e
 * **Alertas** (campainha do header). São 16 destinos no rail, não 19.
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
  | "configurar-alertas";

/** Rótulo legível de cada destino — usado no breadcrumb e no placeholder. */
export const PAGE_LABELS: Record<PageId, string> = {
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
};

export const NAV_CATEGORIES: SingleMenuCategory[] = [
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
  { id: "gestao-carga", icon: <Zap />, label: "Gestão de Carga", href: "#gestao-carga" },
  { id: "precos", icon: <Tag />, label: "Preços", href: "#precos" },
  { id: "carregadores", icon: <PlugZap />, label: "Carregadores", href: "#carregadores" },
  { id: "monitoramento", icon: <MonitorDot />, label: "Monitoramento", href: "#monitoramento" },
  { id: "cupons", icon: <Ticket />, label: "Cupons", href: "#cupons" },
  { id: "permissoes", icon: <Lock />, label: "Permissões", href: "#permissoes" },
  { id: "motoristas", icon: <Users />, label: "Motoristas", href: "#motoristas" },
  {
    id: "configuracoes",
    icon: <Settings />,
    label: "Configurações",
    items: [
      { id: "estrutura-rede", label: "Estrutura da rede" },
      { id: "locais", label: "Locais" },
      { id: "usuarios", label: "Usuários" },
    ],
  },
  {
    id: "configurar-alertas",
    icon: <BellRing />,
    label: "Configurar alertas",
    href: "#configurar-alertas",
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
```

Os imports em `~/nav/nav-data` resolvem sem a extensão — o alias do Vite e o `paths` do
`tsconfig` cuidam disso.

- [ ] **Passo 2: criar o `src/layout/PlaceholderPage.tsx`**

Uma página, compartilhada por todos os 14 destinos não construídos. O escopo aprovado
foi *inventário de todas + só Transações construída* — 14 arquivos vazios seriam a opção
que não foi escolhida.

```tsx
import { Construction } from "lucide-react";
import { PAGE_LABELS, type PageId } from "~/nav/nav-data";

export function PlaceholderPage({ page }: { page: PageId }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-gp-md py-sp-2xl">
      <span className="flex size-form-xl items-center justify-center rounded-radius-full bg-bg-subtle text-fg-muted">
        <Construction className="size-icon-md" />
      </span>
      <h2 className="text-title-md text-fg-default">{PAGE_LABELS[page]}</h2>
      <p className="max-w-sm text-center text-body-sm text-fg-muted">
        Tela mapeada no inventário e ainda não construída. Esta rodada entrega Transações
        como molde.
      </p>
    </div>
  );
}
```

- [ ] **Passo 3: criar o `src/layout/AppShell.tsx`**

Wrapper fino sobre o `AppShell` do DS. Duas decisões, ambas deliberadas:

**Não passamos `sidebarLogo`.** O `USAGE.md` do `AppShell` é explícito: o default é a
marca iGreen, e só se passa logo própria quando a marca própria foi pedida. A spec
escolheu marca `default` (iGreen). Se o iGreen MOB precisar do wordmark próprio, é uma prop e
um asset — mas é decisão do operador, não inferência.

**`sidebarTitle` é obrigatória de propósito** — é o nome do projeto, que o DS não
adivinha.

Os seletores EMPRESA e LOCAIS vão no `headerRightSlot`.

```tsx
import type { ReactNode } from "react";
import { AppShell as DsAppShell } from "@snksergio/design-system";
import { NAV_CATEGORIES, PAGE_LABELS, type PageId } from "~/nav/nav-data";

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
}

export function AppShell({ activePage, onNavigate, children }: Props) {
  return (
    <DsAppShell
      sidebar="single"
      categories={NAV_CATEGORIES}
      sidebarTitle="iGreen MOB"
      activeItemId={activePage}
      onSidebarItemClick={(id) => onNavigate(id as PageId)}
      breadcrumb={[{ label: "iGreen MOB CMS" }, { label: PAGE_LABELS[activePage] }]}
      user={{ name: "Matheus Pego", email: "matheus.pego@exemplo.com.br" }}
    >
      {children}
    </DsAppShell>
  );
}
```

⚠️ `onSidebarItemClick` (que entrega o **id**) é distinto de `onItemClick` (que entrega o
**item**). Com `sidebar="single"` é o primeiro. Trocar os dois compila e não navega.

- [ ] **Passo 4: substituir o `src/App.tsx`**

```tsx
import { useState } from "react";
import { AppShell } from "~/layout/AppShell";
import { PlaceholderPage } from "~/layout/PlaceholderPage";
import type { PageId } from "~/nav/nav-data";

export function App() {
  const [page, setPage] = useState<PageId>("transacoes");

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      <PlaceholderPage page={page} />
    </AppShell>
  );
}
```

A Tarefa 4 troca o corpo por um switch que resolve `"transacoes"` na tela real e o resto
no placeholder.

- [ ] **Passo 5: verificar o typecheck**

```bash
npm run typecheck
```

Esperado: sem erro. Se o TS reclamar que `categories` não é aceito, confirme que
`sidebar="single"` está presente — o tipo é união discriminada e `categories` só existe
nesse ramo.

- [ ] **Passo 6: verificar no browser**

| Verificar | Como |
|---|---|
| O rail mostra as 14 linhas de topo | Contar os itens visíveis |
| Dashboard, Financeiro e Configurações expandem | Clicar em cada e ver os sub-itens |
| Clicar num sub-item troca o placeholder e o breadcrumb | Clicar em "Resumo" e ver o título mudar |
| O toggle de colapsar o menu funciona | Clicar no botão do Header |
| O user menu mostra "Matheus Pego" | Abrir o menu do avatar |

Tire uma screenshot do shell com o menu expandido — é o artefato de aprovação desta
tarefa.

---

## Task 3: Gerador de mock de transações (TDD)

A única tarefa com teste de verdade neste plano. O gerador tem invariantes que quebram
em silêncio e aparecem como "bug de dado" na reunião de aprovação, não como erro.

**Files:**
- Create: `src/pages/transacoes/transacoes-mock.ts`
- Test: `src/pages/transacoes/transacoes-mock.test.ts`

**Interfaces:**
- Produz: `type Transacao` e `TRANSACOES_MOCK: Transacao[]` — a Tarefa 4 consome os dois.
  Campos exatos: `id: string` · `data: string` (ISO `yyyy-MM-dd`) · `empresa: string` ·
  `local: string` · `aplicativo: string` · `motorista: string` · `carregador: string` ·
  `energiaKwh: number` · `socInicial: number` · `socFinal: number` · `valor: number` ·
  `veiculo: string` · `cupomValor: number | null` · `cupomTipo: string | null` ·
  `duracaoMin: number` · `horaInicio: string` (`HH:mm`) · `horaFim: string` (`HH:mm`) ·
  `status: "finalizado" | "em-andamento" | "falha"`

- [ ] **Passo 1: escrever o teste que falha**

Os invariantes vêm dos ranges medidos na referência, registrados na §7 da spec.

```ts
import { describe, expect, it } from "vitest";
import { TRANSACOES_MOCK } from "./transacoes-mock";

describe("TRANSACOES_MOCK", () => {
  it("tem volume suficiente pra exercitar paginação de 10/20/50", () => {
    expect(TRANSACOES_MOCK.length).toBeGreaterThanOrEqual(60);
  });

  it("tem id único em toda linha", () => {
    const ids = new Set(TRANSACOES_MOCK.map((t) => t.id));
    expect(ids.size).toBe(TRANSACOES_MOCK.length);
  });

  it("nunca tem SoC final menor que o inicial", () => {
    for (const t of TRANSACOES_MOCK) {
      expect(t.socFinal).toBeGreaterThanOrEqual(t.socInicial);
    }
  });

  it("mantém SoC dentro de 0–100", () => {
    for (const t of TRANSACOES_MOCK) {
      expect(t.socInicial).toBeGreaterThanOrEqual(0);
      expect(t.socFinal).toBeLessThanOrEqual(100);
    }
  });

  it("nunca tem energia ou valor negativos, e respeita o teto observado", () => {
    for (const t of TRANSACOES_MOCK) {
      expect(t.energiaKwh).toBeGreaterThanOrEqual(0);
      expect(t.energiaKwh).toBeLessThanOrEqual(40);
      expect(t.valor).toBeGreaterThanOrEqual(0);
      expect(t.valor).toBeLessThanOrEqual(63);
    }
  });

  it("faz a janela de horário bater com a duração", () => {
    for (const t of TRANSACOES_MOCK) {
      const [hi, mi] = t.horaInicio.split(":").map(Number);
      const [hf, mf] = t.horaFim.split(":").map(Number);
      let delta = hf * 60 + mf - (hi * 60 + mi);
      if (delta < 0) delta += 24 * 60; // sessão que cruza a meia-noite
      expect(delta).toBe(t.duracaoMin);
    }
  });

  it("inclui sessões de energia zero — elas existem na base real", () => {
    const zeradas = TRANSACOES_MOCK.filter((t) => t.energiaKwh === 0);
    expect(zeradas.length).toBeGreaterThan(0);
  });

  it("não usa nome de pessoa real da referência", () => {
    const reais = ["wagner", "mariana stela", "tiago ferreira", "william james"];
    for (const t of TRANSACOES_MOCK) {
      const nome = t.motorista.toLowerCase();
      for (const r of reais) expect(nome).not.toContain(r);
    }
  });
});
```

O último teste é o que faz a política de dados da §7 da spec ser executável em vez de
intenção.

- [ ] **Passo 2: rodar e confirmar que falha**

```bash
npm test
```

Esperado: FAIL — `Cannot find module './transacoes-mock'`.

- [ ] **Passo 3: implementar o gerador**

Determinístico de propósito: um PRNG com semente fixa. Mock que muda a cada reload
torna impossível comparar duas screenshots de aprovação.

```ts
export interface Transacao {
  id: string;
  data: string;
  empresa: string;
  local: string;
  aplicativo: string;
  motorista: string;
  carregador: string;
  energiaKwh: number;
  socInicial: number;
  socFinal: number;
  valor: number;
  veiculo: string;
  cupomValor: number | null;
  cupomTipo: string | null;
  duracaoMin: number;
  horaInicio: string;
  horaFim: string;
  status: "finalizado" | "em-andamento" | "falha";
}

/** PRNG com semente fixa — mock estável entre reloads. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const LOCAIS = [
  "IGREEN MOB - Usina Solar Vinhedo",
  "IGREEN MOB - BIG MAIS Gov Valadares",
  "IGREEN MOB - SEDE",
  "IGREEN MOB - Posto Via Dupla",
  "IGREEN MOB - Arena 7 BH",
  "IGREEN MOB - Duo FOOD",
  "IGREEN MOB - Shopping Colombo",
  "PV MOB - Estacionamento",
];

const CARREGADORES = ["DC 40 KW - 1", "AC 7,4 KW - 1", "60 kW Dual - 1", "AC 22 KW - 1"];

/** Nomes fictícios — §7 da spec. A referência tem nomes reais de clientes. */
const MOTORISTAS = [
  "Ana Beatriz Moreira",
  "Caio Figueiredo Lima",
  "Débora Nunes Alencar",
  "Eduardo Paiva Ramos",
  "Fernanda Quintela Sá",
  "Gustavo Rebelo Pinto",
  "Helena Vasconcelos Dias",
  "Ícaro Mendonça Freitas",
  "Juliana Tavares Rocha",
  "Lucas Andrade Coutinho",
];

const VEICULOS = ["Geely", "Jaecoo7", "BYD Dolphin", "GWM Ora 03", "", "Volvo EX30"];
const PLACAS = ["TYF9I53", "RQK4B82", "", "MZP7D10"];

function hhmm(minutosDoDia: number) {
  const h = Math.floor(minutosDoDia / 60) % 24;
  const m = minutosDoDia % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function gerar(total: number): Transacao[] {
  const r = prng(20260916);
  const linhas: Transacao[] = [];

  for (let i = 0; i < total; i++) {
    // 1 em 8 é sessão falha: energia zero, 1-2 min. Existe na base real.
    const falha = i % 8 === 3;

    const socInicial = falha ? 0 : Math.floor(r() * 70);
    const ganho = falha ? 0 : Math.floor(r() * (100 - socInicial));
    const socFinal = socInicial + ganho;

    const energiaKwh = falha ? 0 : Math.round(ganho * 0.42 * 100) / 100;
    const valor = falha ? 0 : Math.round(Math.min(energiaKwh * 1.6, 62.71) * 100) / 100;

    const duracaoMin = falha ? 1 + Math.floor(r() * 2) : 4 + Math.floor(r() * 81);
    const inicioDoDia = 6 * 60 + Math.floor(r() * 16 * 60);

    const temCupom = !falha && i % 11 === 5;
    const diaDoMes = 16 - Math.floor(i / 4);

    linhas.push({
      id: `TRX-${String(1000 + i)}`,
      data: `2026-09-${String(Math.max(diaDoMes, 1)).padStart(2, "0")}`,
      empresa: "PV MOB",
      local: LOCAIS[i % LOCAIS.length],
      aplicativo: "iGreen MOB",
      motorista: MOTORISTAS[i % MOTORISTAS.length],
      carregador: CARREGADORES[i % CARREGADORES.length],
      energiaKwh,
      socInicial,
      socFinal,
      valor,
      veiculo: i % 3 === 0 ? PLACAS[i % PLACAS.length] : VEICULOS[i % VEICULOS.length],
      cupomValor: temCupom ? Math.round(valor * 0.43 * 100) / 100 : null,
      cupomTipo: temCupom ? "CPO" : null,
      duracaoMin,
      horaInicio: hhmm(inicioDoDia),
      horaFim: hhmm(inicioDoDia + duracaoMin),
      status: falha ? "falha" : "finalizado",
    });
  }

  return linhas;
}

export const TRANSACOES_MOCK: Transacao[] = gerar(64);
```

- [ ] **Passo 4: rodar e confirmar que passa**

```bash
npm test
```

Esperado: PASS, 8 testes.

Se `faz a janela de horário bater com a duração` falhar, a causa provável é o `% 24` do
`hhmm` cruzando a meia-noite — o teste já trata isso somando 24h ao delta negativo, mas
confira se `inicioDoDia + duracaoMin` não passa de 48h.

---

## Task 4: A tela de Transações

**Files:**
- Create: `src/pages/transacoes/transacoes-columns.tsx`
- Create: `src/pages/transacoes/TransacoesPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consome: `Transacao` e `TRANSACOES_MOCK` (Tarefa 3) · `PageId` (Tarefa 2)
- Produz: `COLUNAS_TRANSACOES: DataTableColumnDef<Transacao>[]` — o molde que as outras 11
  tabelas copiam

- [ ] **Passo 1: criar o `transacoes-columns.tsx`**

Três colunas (Energia, Cupom, Duração) são de duas linhas, e usam o escape hatch
`render?: (params: { row, value }) => ReactNode` do `DataTableColumnDef`.

Nenhuma coluna fixa `width`. Com `autoFit` (default) o `width` é **piso** e entra no
rateio, não trava — e a largura mínima já inclui o header inteiro, então o título nunca
trunca.

```tsx
import { Badge } from "@snksergio/design-system";
import type { DataTableColumnDef } from "@snksergio/design-system";
import type { Transacao } from "./transacoes-mock";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const KWH = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function duracaoLegivel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}min`;
}

/** Célula de duas linhas: valor em cima, contexto em caption embaixo. */
function CelulaDupla({ principal, apoio }: { principal: string; apoio: string }) {
  return (
    <span className="flex flex-col gap-gp-2xs">
      <span className="text-body-sm text-fg-default tabular-nums">{principal}</span>
      <span className="text-caption-md text-fg-muted tabular-nums">{apoio}</span>
    </span>
  );
}

const ROTULO_STATUS: Record<Transacao["status"], string> = {
  finalizado: "Finalizado",
  "em-andamento": "Em andamento",
  falha: "Falha",
};

export const COLUNAS_TRANSACOES: DataTableColumnDef<Transacao>[] = [
  { field: "data", headerName: "Data", type: "date", sortable: true },
  { field: "empresa", headerName: "Empresa", type: "text", enableColumnFilter: true, filterType: "select" },
  { field: "local", headerName: "Local", type: "text", ellipsis: true, enableColumnFilter: true, filterType: "select" },
  { field: "aplicativo", headerName: "Aplicativo", type: "text" },
  { field: "motorista", headerName: "Motorista", type: "text", sortable: true, copyable: true },
  { field: "carregador", headerName: "Carregador", type: "text", copyable: true, enableColumnFilter: true, filterType: "select" },
  {
    field: "energiaKwh",
    headerName: "Energia",
    align: "right",
    sortable: true,
    render: ({ row }) => (
      <CelulaDupla
        principal={`${KWH.format(row.energiaKwh)} kWh`}
        apoio={`${row.socInicial}% - ${row.socFinal}%`}
      />
    ),
  },
  { field: "valor", headerName: "Valor", type: "currency", align: "right", sortable: true },
  { field: "veiculo", headerName: "Veículo", type: "text", valueFormatter: (v) => (v ? String(v) : "-") },
  {
    field: "cupomValor",
    headerName: "Cupom",
    align: "right",
    render: ({ row }) =>
      row.cupomValor === null ? (
        <span className="text-body-sm text-fg-muted">-</span>
      ) : (
        <CelulaDupla principal={BRL.format(row.cupomValor)} apoio={row.cupomTipo ?? ""} />
      ),
  },
  {
    field: "duracaoMin",
    headerName: "Duração",
    sortable: true,
    render: ({ row }) => (
      <CelulaDupla
        principal={duracaoLegivel(row.duracaoMin)}
        apoio={`${row.horaInicio} - ${row.horaFim}`}
      />
    ),
  },
  {
    field: "status",
    headerName: "Recargas",
    enableColumnFilter: true,
    filterType: "select",
    render: ({ row }) => (
      <Badge color={row.status === "falha" ? "critical" : "success"} variant="soft">
        {ROTULO_STATUS[row.status]}
      </Badge>
    ),
  },
];
```

⚠️ `color="critical"` e não `"danger"` — verificado em `src/components/shadcn/badge.tsx:29`
do repo do DS. A API do `Badge` aceita `color: primary | secondary | critical | success |
warning | info` e `variant: solid | soft | outline | ghost`. O **token** por trás é
`-danger`, mas a **prop** ainda usa o nome antigo `critical` e mapeia internamente — é a
exceção que o `CLAUDE.md` do DS documenta na seção de nomenclatura de cores. Escrever
`color="danger"` não compila; escrever `variant="muted"` também não (`muted` é sufixo de
token, não variante de componente).

- [ ] **Passo 2: criar o `TransacoesPage.tsx`**

As duas datas vão em `toolbar.actions`, **não** num form acima da grade. É a L-051:
filtro de tabela vive no motor reativo do componente; o toolbar comporta o caso pequeno,
não-coluna, com label curta, e no máximo ~2 — duas datas são exatamente isso.

O que é coluna (Empresa, Local, Carregador, Recargas) usa `enableColumnFilter`, e os
chips aparecem desde o load via `showEmptyFilterChips`.

```tsx
import { Download } from "lucide-react";
import { Button, DataTable, PageHeader } from "@snksergio/design-system";
import { COLUNAS_TRANSACOES } from "./transacoes-columns";
import { TRANSACOES_MOCK, type Transacao } from "./transacoes-mock";

export function TransacoesPage() {
  return (
    <div className="flex flex-1 flex-col gap-gp-xl">
      <PageHeader
        title="Transações"
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        actions={
          <Button variant="outline">
            <Download className="size-icon-sm" />
            Baixar dados
          </Button>
        }
      />

      <DataTable<Transacao>
        rows={TRANSACOES_MOCK}
        columns={COLUNAS_TRANSACOES}
        getRowId={(r) => r.id}
        showEmptyFilterChips={["empresa", "local", "carregador", "status"]}
        toolbar={{
          enableSearch: true,
                  enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
          actions: [
            // `kind: "input"` e CONTROLADO: exige `value` + `onChange`
            // (TableToolbar/parts/toolbar-actions.tsx:51). Dois `useState` na pagina.
            { id: "data-inicial", kind: "input", label: "Data Inicial", placeholder: "01/09/2026", value: dataInicial, onChange: setDataInicial },
            { id: "data-final", kind: "input", label: "Data Final", placeholder: "16/09/2026", value: dataFinal, onChange: setDataFinal },
          ],
        }}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />
    </div>
  );
}
```

`pageSizeOptions: [10, 20, 50]` copia a referência exatamente — não é o default do DS
(`[10, 25, 50, 100]`).

Se `toolbar.actions` recusar `kind: "input"` com essa forma, consulte
`src/components/ui/TableToolbar/USAGE.md` §`ToolbarActions` no repo do DS e ajuste a
forma do objeto. O conceito — duas ações de input curtas no toolbar — está correto pela
L-051; só a assinatura pode diferir.

- [ ] **Passo 3: ligar a página no `App.tsx`**

```tsx
import { useState } from "react";
import { AppShell } from "~/layout/AppShell";
import { PlaceholderPage } from "~/layout/PlaceholderPage";
import { TransacoesPage } from "~/pages/transacoes/TransacoesPage";
import type { PageId } from "~/nav/nav-data";

export function App() {
  const [page, setPage] = useState<PageId>("transacoes");

  return (
    <AppShell activePage={page} onNavigate={setPage}>
      {page === "transacoes" ? <TransacoesPage /> : <PlaceholderPage page={page} />}
    </AppShell>
  );
}
```

- [ ] **Passo 4: verificar o typecheck**

```bash
npm run typecheck
```

Esperado: sem erro.

- [ ] **Passo 5: verificar no browser**

| Verificar | Esperado |
|---|---|
| As **12** colunas aparecem | Contar os headers. São 12, não 13: a coluna Ações fica fora desta rodada (o "Ver detalhes" nunca foi medido) |
| Nenhum header trunca em "..." | O header-floor do `autoFit` garante; se truncar, alguma coluna fixou `width` |
| Energia, Cupom e Duração têm duas linhas | Valor em cima, caption embaixo |
| Números alinham pela vírgula | `tabular-nums` nas células duplas |
| A tabela rola lateralmente ao arrastar o corpo | `grabToScroll` é nativo desde a v0.26.0 — não precisa ligar |
| Chips de filtro de Empresa, Local, Carregador e Recargas aparecem vazios no load | `showEmptyFilterChips` |
| Clicar num chip filtra sem recarregar | Motor reativo do `DataTable` |
| A busca filtra por motorista | Digitar parte de um nome |
| Trocar para 20 e 50 por página funciona | Footer nativo |
| Linhas de energia zero aparecem, com badge distinto | 8 das 64 linhas |
| Hover numa célula de Motorista ou Carregador revela o ícone de copiar | `copyable: true` |
| Dark mode não quebra nada | `document.documentElement.classList.toggle("dark")` via `javascript_tool`. **Não** pelo user menu: não passamos `themeOptions`, porque a referência não tem switcher de tema e a réplica não inventa controle que ela não tem |

Screenshot em claro e em escuro — são os artefatos de aprovação desta tarefa.

---

## Task 5: Inventário das 18 telas

Fecha a rodada. É o documento que torna as 17 telas restantes mecânicas.

**Files:**
- Create: `docs/inventario-igreen-mob-cms.md`

- [ ] **Passo 1: escrever o inventário**

Uma seção por tela, na ordem da §5 da spec. Cada seção tem, sem exceção:

```markdown
## <N>. <Nome da tela>

- **Rota:** `/pt/<rota>`
- **Título / subtítulo:** exatamente como na referência
- **Toolbar:** cada controle, com o label literal
- **Colunas:** tabela com nome | tipo DS | alinhamento | formato observado
- **KPIs:** label + formato, quando houver
- **Ações de linha:** label literal e o que abre
- **Estado vazio:** o texto literal, quando observado
- **Paginação:** opções de tamanho de página
- **Builder DS:** qual comando a constrói
- **Aberto:** o que não foi medido
```

Os dados da §5 e §6 da spec já cobrem as 18 telas. Para os campos não medidos,
**escreva "não medido"** — não preencha por inferência. Um inventário com coluna
inventada é pior que um com lacuna declarada: a lacuna faz alguém ir medir.

Esta é a seção modelo, escrita por inteiro. As outras 17 seguem exatamente esta forma:

```markdown
## 8. Carregadores

- **Rota:** `/pt/chargers`
- **Título:** "Carregadores"
- **Subtítulo:** "Dados correspondentes aos locais selecionados no topo. Para alterar,
  use o seletor no topo da página."
- **Toolbar:**
  - Botão primário "Adicionar carregador" (ícone `+` à esquerda)
  - Busca, placeholder "Buscar"
- **Colunas:**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | Empresa | `text` | left | `PV MOB` |
  | Local | `text` | left | `IGREEN MOB - Duo FOOD` (longo, trunca) |
  | Nome | `text` | left | `60 KW Dual`, `AC 7,4 KW` |
  | ID | `text` + `copyable` | left | `0060025A300101002` |
  | CPO/OCPI | `text` + `copyable` | left | `1173116`, `89752` |
  | Status | `badge` | left | `Online` |
  | Modelo | `text` | left | `FoxitModel`, `NDCAG-4Gb`, `PEVC21GBE`, `ACCharger`, `AHACET` |
  | Preço | link/`text` | left | `Perfil padrão` (link) ou `-` |
  | Ações | `actions` | right | 1 ícone de editar (lápis) |

- **KPIs:** nenhum
- **Ações de linha:** ícone de editar — abre form de edição do carregador (conteúdo
  **não medido**)
- **Estado vazio:** não medido (a tela tinha dados)
- **Paginação:** `Registros por página` 10 / 20 / 50 · "1 de 4"
- **Builder DS:** `/ds-create-crud`
- **Aberto:** conteúdo do form de edição; valores possíveis do badge Status além de
  `Online`
```

O nível de detalhe do bloco "Colunas" é o que faz o inventário valer: é ele que a
próxima tela copia. Uma linha por coluna, com o valor literal observado — não "texto",
mas `IGREEN MOB - Duo FOOD`.

- [ ] **Passo 2: conferir a cobertura**

Confirme que o inventário tem 18 seções e que cada uma tem as 10 rubricas. Rubrica
ausente é lacuna silenciosa; rubrica com "não medido" é lacuna declarada.

- [ ] **Passo 3: reportar ao operador**

Liste o que ficou "não medido" e pergunte se ele quer uma passada de captura antes de a
próxima tela entrar em construção.

---

## Riscos conhecidos

| Risco | Onde se manifesta | O que fazer |
|---|---|---|
| ~~`@source` não pega~~ — **fechado na Tarefa 1** | — | Resolvido e medido em 2026-09-16: 169.744 bytes de CSS, `.bg-bg-brand` presente, typecheck limpo. O escopo virou explícito (`source(none)` + 2 `@source`) porque a auto-detecção varria `docs/` e mascarava a própria falha |
| **API do `Badge` ou de `toolbar.actions` diferente** | Tarefas 4, passos 1 e 2 | Consultar o `USAGE.md` do componente no repo do DS. Nunca inventar prop, nunca cair pra `<span>` com classes na mão |
| **`autoFit` não acomoda 13 colunas com 3 duplas** | Tarefa 4, passo 5 | É a assumption central da §8 da spec. Se quebrar, o caminho é **cascata pro repo do DS**, não componente local que reimplemente tabela |
| ~~Logo~~ — **decidido, não é risco** | — | Logo iGreen: default do `AppShell`, sem `sidebarLogo`. Decisão do operador em 2026-09-16, junto da proibição de usar a palavra da marca original em qualquer lugar do produto. Não reabrir |
| **"Ver detalhes" sem conteúdo medido** | Fora desta rodada | A coluna Ações desta rodada **não** tem o botão. Entra quando o conteúdo do detalhe for capturado (§9 da spec) |
