---
data: 2026-09-16
status: APROVADO
autor: Sergio Vieira (operador) + Claude Opus 5
referencia: https://cmstest.spott.eco/pt (ambiente de teste, medido em 2026-09-16)
---

# iGreen MOB CMS — réplica navegável sobre o iGreen Design System

## 1. Objetivo

Reconstruir o iGreen MOB CMS como **projeto novo e independente**, com 100% da pele e do
comportamento vindos do iGreen Design System, para aprovação visual e de UX antes de
qualquer decisão sobre o produto de produção.

O conteúdo é da referência — copy, labels, nomenclatura, ordem dos campos, colunas.
A pele e o comportamento são do DS: fonte, tamanho, peso, cor, espaçamento, radius,
sombra, foco, e o comportamento de cada componente.

### Não-objetivos

Estes ficam **fora**, explicitamente, e não por esquecimento:

| Não faz parte | Por quê |
|---|---|
| Integração com a API real do iGreen MOB | A réplica valida visual e UX. Integração é decisão posterior, com outro desenho |
| Autenticação real | A tela de login é réplica visual; não autentica |
| Paginação server-side (a real tem 55 páginas) | Mock com ~60 linhas e paginação client-side valida o mesmo visual |
| Polling que re-renderiza a tabela | Ruído de ambiente, não requisito de UI |
| 6ª marca própria no DS | Decidido: usa a marca `default` (iGreen) |
| Dados pessoais reais dos motoristas | Ver §7 — forma real, identidades fictícias |

## 2. Canal de consumo do DS — npm install

```bash
npm i @snksergio/design-system@0.63.0
```

O pacote é **público** (`npm view` responde sem autenticação) e o barrel exporta o que
esta rodada precisa: `AppShell` (`src/components/index.ts:13`) e `DataTable`
(`src/components/index.ts:24`). Componentes chegam como **dependência versionada**, não
como cópia editável.

### Por que mudou de copy-in para npm

A primeira versão desta spec escolheu scaffold/copy-in. **O canal copy-in exige
`IGREEN_TOKEN`** — o registry (`igreen-registry.vercel.app`) é privado e o
`igreen:add` recusa sem Bearer. Medido em 2026-09-16: o token não existe no ambiente
nem em nenhum `.env.local` do workspace. O canal estava inviável na prática, não em
teoria.

O argumento que tinha excluído o npm — que **23 arquivos** do payload de IA referenciam
`igreen:add` e o kit passaria instrução inaplicável
(`.ai/context/architecture.md:127`) — vale para um consumidor cujo único recurso é o
kit. **Não vale aqui:** o repo do DS está no disco desta máquina
(`02-projects/igreen/desing-system-adm`), e é de lá que o source dos componentes é
consultado quando preciso.

E há um ganho que não era óbvio: dependência versionada é **mais** alinhada com
"100% nosso design system" do que copy-in. O copy-in entrega código editável — existe
um hook `protect-ds` justamente para impedir que o consumidor edite internals. Por npm
isso não é possível por construção.

### ⚠️ O gotcha que define a Tarefa 1

**Tailwind v4 não escaneia `node_modules`.** Sem a diretiva `@source`, nenhuma classe
do DS é gerada — e não parcialmente: medido em 2026-08-07 no repo do DS, **9 regras
CSS** contra as milhares do showcase, com `<Button>` saindo transparente, 24px de altura
e radius 0. **Não há erro**, e a conclusão natural é "o pacote está quebrado".

```css
/* src/index.css */
@import "tailwindcss";
@source "../node_modules/@snksergio/design-system/dist-lib/**/*.mjs";
@import "@snksergio/design-system/theme.css";
@import "tw-animate-css";
```

O `@source` precisa cobrir `dist-lib/**`, não só o `index.mjs`: as classes dos
componentes flutuantes (Modal, Panel, dropdown, popover) vivem nos **chunks**.

As fontes precisam ser copiadas para a raiz do site — o `@font-face` aponta para
`/fonts/*.woff2`, relativo ao site, não ao pacote:

```bash
cp node_modules/@snksergio/design-system/dist-lib/fonts/*.woff2 public/fonts/
```

Sem isso os 27 presets tipográficos do DS renderizam em `system-ui`.

### Por que não os outros dois canais

**Submódulo git** funciona e é o canal mais usado, mas acopla este repo ao repo do DS,
e as deps e os `.woff2` do Geist não vêm junto.

**Duplicar `projeto/virtual-proposta/`** não é possível: ele consome o DS por alias de
source (`@ → ../../src`, em `vite.config.ts:11`), o que só funciona **dentro** do repo
do DS. Ele entra aqui como **referência de arquitetura de páginas**, não como código
copiado.

## 3. Estrutura

```
D:\Workspace\02-projects\\igreen\\mob-cms\        ← projeto novo, independente do DS
├── docs/
│   ├── specs/                   ← esta spec
│   └── inventario-igreen-mob-cms.md  ← §5, o inventário das 18 telas
├── src/
│   ├── layout/
│   │   └── AppShell.tsx         ← rail + header (molde: virtual-proposta)
│   ├── nav/
│   │   └── nav-data.tsx         ← menu completo (`.tsx`: tem JSX nos ícones)
│   ├── pages/
│   │   └── transacoes/
│   │       ├── TransacoesPage.tsx
│   │       ├── transacoes-mock.ts
│   │       └── sections/
│   └── index.css                ← escopo de scan + tema do DS (vem do pacote npm)
├── index.html
├── package.json
└── vite.config.ts
```

Padrão de página herdado do `virtual-proposta`: `<Nome>Page.tsx` +
`<nome>-mock.ts` + `sections/`. Uma pasta por tela. O mock vive ao lado da página que
o consome, nunca num `mocks/` central — foi o que manteve as 22 páginas do
virtual-proposta legíveis.

## 4. O chrome é parte do escopo

A referência tem rail de módulos e header persistentes. Pela regra do DS
(*"chrome na referência = shell no escopo"*), isso é `/ds-create-app`, não decoração da
tela de Transações.

**Header:** seletor EMPRESA (`PV MOB`) · seletor LOCAIS (multi-select com chips
removíveis, 38 locais) · Alertas (campainha) · Suporte (dropdown) · PT/BR (dropdown) ·
avatar + nome + Sair.

**Rail — 14 linhas de topo, 16 destinos.** Medido na árvore de acessibilidade da sessão
logada em 2026-09-16: `Dashboard`, `Resumo`, `Transações` e `Performance` são **irmãos de
topo**, não filhos de Dashboard. `Dashboard` tem rota própria (`/pt/dashboard`), distinta de
`/pt/resume` — e o conteúdo dela **nunca foi medido**.

logo · **Dashboard** · **Resumo** · **Transações** · **Performance** · Financeiro *(grupo:
Repasses)* · Gestão de Carga · Preços · Carregadores · Monitoramento · Cupons · Permissões ·
Motoristas · Configurações *(grupo: Estrutura da rede · Locais · Usuários)* · Configurar
alertas.

⚠️ A primeira versão desta seção descrevia Dashboard como **pai** dos três — e foi assim que
o plano nasceu errado. Só os dois grupos têm sub-itens.

**Aviso recorrente**, presente em quase toda tela e que precisa existir no shell ou num
componente compartilhado: *"Dados correspondentes aos locais selecionados no topo. Para
alterar, use o seletor no topo da página."*

## 5. Inventário — 18 telas

Rotas medidas no ambiente de teste em 2026-09-16.

| # | Tela | Rota | Forma | Builder DS |
|---|---|---|---|---|
| 1 | Login | `/pt` | form auth: e-mail, senha, esqueceu a senha, Continuar com Google, PT/BR | `/ds-create-login` |
| 2 | Resumo | `/pt/resume` | 5 KPIs (Status dos Carregadores, Faturamento, Consumo de Energia, Clientes Atendidos, Total de Transações) + date range + "Baixar dados" + tabela de transações | `/ds-create-dashboard` |
| 3 | **Transações** | `/pt/transactions` | tabela densa 13 colunas, scroll-x | `/ds-create-crud` |
| 4 | Performance | `/pt/performance` | select de carregadores + download + gráfico de linha (Sessões) + 2 tabelas de métricas | `/ds-create-dashboard` |
| 5 | Repasses | `/pt/financial/transfers` | select de ano + tabela (Mês, Ano, Repasse líquido, Taxa rede iGreen líquido, Status, Ações) | `/ds-create-crud` |
| 6 | Gestão de Carga | `/pt/smartspott` | busca + tabela (Empresa, Local, Potência em uso, Ações) | `/ds-create-crud` |
| 7 | Preços | `/pt/price` | "Criar novo perfil" + busca + tabela (Empresa, Local, Nome, Padrão, Recarga grátis, Tags, Ações) | `/ds-create-crud` |
| 8 | Carregadores | `/pt/chargers` | "Adicionar carregador" + busca + tabela (Empresa, Local, Nome, ID, CPO/OCPI, Status, Modelo, Preço, Ações) | `/ds-create-crud` |
| 9 | Monitoramento | `/pt/monitoring` | chips de filtro + barra "Plugues por status" empilhada + select + tabela | `/ds-create-screen` (composição) |
| 10 | Cupons | `/pt/coupons` | "Novo cupom" + 2 selects + busca + tabela + estado vazio | `/ds-create-crud` |
| 11 | Permissões | `/pt/permissions` | legenda de 4 perfis + "Conceder acesso" + busca + lista de cards | `/ds-create-list` |
| 12 | Motoristas | `/pt/drivers` | "BAIXAR DADOS" + "TAGS DE PREÇO" + select + busca + date range + checkbox + tabela 10 col | `/ds-create-crud` |
| 13 | Estrutura da rede | `/pt/settings/companies-net` | busca + tabela (Nome, CNPJ, Endereço, Responsável, e-mail, Ações) | `/ds-create-crud` |
| 14 | Locais | `/pt/settings/locals` | busca + checkbox "Exibir desativados" + tabela | `/ds-create-crud` |
| 15 | Usuários | `/pt/settings/users` | 3 selects + "BAIXAR DADOS" + busca + tabela 8 col + vazio | `/ds-create-crud` |
| 16 | Configurar alertas | `/pt/alert-groups` | "Adicionar grupo de alertas" + busca + tabela + vazio | `/ds-create-crud` |
| 17 | Alertas | `/pt/alerts-history` | busca + date range + tabela com badge de tipo de alerta | `/ds-create-crud` |
| 18 | Perfil | `/pt/profile` | avatar + "Mudar Foto" + 2 painéis editáveis (Pessoal, Endereço) + "Alterar senha" | página de form |

A distribuição é o que torna as 17 restantes mecânicas: **12 são tabela**. Fechar
Transações bem resolve a maior parte do trabalho das outras.

### Detalhe por tela

O arquivo `docs/inventario-igreen-mob-cms.md` traz, por tela: título e subtítulo, controles
de toolbar, colunas com tipo e formato, KPIs, ações de linha, estados vazios e
paginação. Esta spec traz a tabela de rotas; o inventário traz o conteúdo.

## 6. Transações — a tela desta rodada

> ⚠️ **A referência tem 13 colunas; a rodada 1 construiu 12.** A 13ª é Ações
> ("Ver detalhes"), e ficou fora porque o detalhe não abriu no ambiente de teste e o
> conteúdo nunca foi medido (§9). Onde este documento disser "13", leia "na referência".

### Colunas (13)

| # | Coluna | Tipo | Formato observado | Nota |
|---|---|---|---|---|
| 1 | Data | date | `15/09/2026` | |
| 2 | Empresa | text | `PV MOB` | |
| 3 | Local | text | `IGREEN MOB - Usina Solar Vinhedo` | longa; trunca |
| 4 | Aplicativo | text | `iGreen MOB` | |
| 5 | Motorista | text | nome do motorista | |
| 6 | Carregador | text | `DC 40 KW - 1` | |
| 7 | Energia | 2 linhas | `14,20 kWh` + `78% - 99%` | valor + SoC inicial/final |
| 8 | Valor | currency | `R$ 37,99` | right |
| 9 | Veículo | text | `Geely`, `Jaecoo7` ou placa `TYF9I53` | pode ser vazio |
| 10 | Cupom | text/currency | `-` ou `R$ 26,87` + `CPO` | 2 linhas quando há cupom |
| 11 | Duração | 2 linhas | `00h 34min` + `21:42 - 22:16` | duração + janela |
| 12 | Recargas | badge | `Finalizado` | status da recarga |
| 13 | Ações | ação | `Ver detalhes` | ⛔ **FORA da rodada 1** — o detalhe não abriu no ambiente de teste e nunca foi medido (§9). A tela construída tem **12** colunas |

### Toolbar e footer

- Busca: `Buscar por motorista, e-mail ou carregador`
- Data Inicial (`01/09/2026`) e Data Final (`16/09/2026`)
- `Baixar dados` (ação de página, não de toolbar)
- Footer: `Registros por página` 10 / 20 / 50 + navegação

### Mapa de componentes DS

| Elemento do iGreen MOB | Componente DS |
|---|---|
| Rail + header + rotas | `AppShell` via `/ds-create-app` |
| Tabela densa com scroll-x — **13 na referência, 12 construídas** (Ações fora) | `DataTable` com `autoFit` |
| Busca por motorista/e-mail/carregador | busca nativa do `DataTable` |
| Data Inicial / Data Final | `toolbar.actions` — caso pequeno não-coluna, os ~2 que a L-051 permite |
| Colunas Energia, Cupom e Duração (2 linhas) | célula composta: valor + `caption` |
| Coluna Recargas | `Badge` por status |
| ID de carregador, e-mail, CNPJ | `copyable: true` na coluna |
| `Ver detalhes` | `PanelDetail` (bloco `dsgreen-paneldetail-1`) |
| `Baixar dados` | `Button` no header da página |
| `Registros por página` | footer nativo do `DataTable` |

A escolha de `toolbar.actions` para as duas datas, e **não** um form de filtros acima da
grade, é a L-051: filtro de tabela vai no motor reativo do componente. Duas datas são
exatamente o caso pequeno, não-coluna, com label curta que a regra permite no toolbar.

### Densidade

`autoFit` sem `width` fixo nas colunas. A largura mínima de cada coluna já inclui o
header inteiro (header-floor), e a sobra é distribuída proporcionalmente — fixar `width`
transforma a coluna em piso no rateio e é o erro comum. Prefira não fixar.

## 7. Política de dados mock

**Forma real, identidades fictícias.** As colunas, os formatos, a densidade e os ranges
vêm da observação do ambiente de teste. Nomes de motorista, e-mails, CPFs e placas são
inventados.

A razão é simples: a tela real expõe nomes completos, e-mails, CPFs e placas de clientes
reais. Commitar isso num repo novo de demonstração é risco sem retorno — não muda nada
na validação visual, que depende do formato e do comprimento do texto, não da identidade.

Ranges observados, a preservar no mock:

| Campo | Range |
|---|---|
| Energia | `0,00` a `39,58` kWh |
| Valor | `R$ 0,00` a `R$ 62,71` |
| SoC | `0%` a `100%`, sempre inicial menor que final |
| Duração | `00h 01min` a `01h 25min` |
| Carregadores | `AC 7,4 KW`, `DC 40 KW`, `60 kW Dual`, `AC 22 KW` |
| Locais | 38 locais, prefixo `IGREEN MOB - ` (e um `PV MOB - `) |

Sessões com `0,00 kWh` e `R$ 0,00` e duração de 1–2 min **existem na base real** e devem
aparecer no mock: são tentativas falhas de recarga, e a tabela precisa mostrar que não
quebra com elas.

Volume do mock: ~60 linhas — o suficiente para exercitar paginação de 10/20/50 e o
scroll-x das 12 colunas construídas.

## 8. Assumption central

**Que a densidade do iGreen MOB — 12 colunas construídas (13 na referência) em scroll-x,
com 3 delas de duas linhas — cabe
no `DataTable` com `autoFit` sem exigir componente novo no DS.**

Se quebrar, o caminho é cascata para o repo do DS (spec de componente ou ajuste do
`DataTable`), **nunca** um componente local no projeto do iGreen MOB que reimplemente tabela.
O ponto da réplica é provar o DS; contorná-lo localmente perde o objetivo.

As células de duas linhas são a parte de maior risco: são 3 das 12, e o
`autoFit` mede o header, não o corpo.

## 9. Itens abertos

| Item | Estado |
|---|---|
| `Ver detalhes` de Transações | Não abriu por clique simples no ambiente de teste (provável modal com handler próprio). O conteúdo do detalhe **não foi medido** — precisa ser capturado antes de implementar a `PanelDetail`, ou a tela fecha sem ela e o detalhe entra numa rodada seguinte |
| Mapa do Monitoramento | A área central da tela renderizou vazia na captura. Não sei se é mapa, gráfico ou placeholder. A medir quando Monitoramento entrar no escopo |

## 10. Definição de pronto desta rodada

0. **Nada é commitado.** Decisão do operador em 2026-09-16, e é o oposto do default do
   repo do DS (Regra 8: todo trabalho fecha por PR). Vale para esta rodada inteira
1. Projeto criado em `D:\Workspace\02-projects\\igreen\\mob-cms`, `npm run dev` sobe
2. `docs/inventario-igreen-mob-cms.md` com as 18 telas detalhadas
3. `AppShell` com rail e header completos — o rail mostra as **14 linhas de topo com seus
   16 destinos** (12 folhas + Repasses + os 3 de Configurações), porque ele aparece em toda captura e sem ele a tela não é fiel. As outras 3
   das 18 telas não são alcançadas pelo rail: **Login** (pré-autenticação), **Perfil**
   (user menu) e **Alertas** (campainha do header)
4. Tela de Transações navegável, com as 13 colunas e ~60 linhas de mock
5. Itens de menu não construídos caem num **único placeholder compartilhado**, não em 17
   páginas vazias. O escopo aprovado foi *inventário de todas + só Transações construída*;
   uma rota por tela era a opção que não foi escolhida
6. Zero Tailwind literal onde há token DS; zero hardcode de cor ou tamanho
