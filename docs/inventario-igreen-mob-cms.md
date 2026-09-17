---
data: 2026-09-16
status: PARCIAL — 2 destinos medidos em detalhe, 17 medidos só na forma
fonte: docs/specs/2026-09-16-igreen-mob-cms-replica-design.md §5 e §6
plano: docs/plans/2026-09-16-igreen-mob-cms-rodada-1.md (Tarefa 5)
---

# Inventário de telas — iGreen MOB CMS

Uma seção por destino conhecido, com as **10 rubricas** que a Tarefa 5 do plano define.
É o documento que torna as telas restantes mecânicas: a próxima tela se constrói
copiando a seção dela.

## Proveniência

Ambiente de teste `https://cmstest.spott.eco/pt`, medido em **2026-09-16**.

As rotas do sistema de referência (`/pt/transactions`, `/pt/smartspott`, …) ficam
registradas neste documento porque são **o endereço onde ir medir de novo** — apagá-las
tornaria o inventário não-verificável. Elas não entram em código nenhum. Em tudo mais o
produto é **iGreen MOB CMS**, e o item de menu daquela rota é **Gestão de Carga**.

## São 19 destinos, não 18

A §5 da spec lista 18 telas. Existe uma 19ª: a rota **`/pt/dashboard`**, do item
**Dashboard** do rail, separada de `/pt/resume` ("Resumo"). O conteúdo dela **nunca foi
medido** — está aqui como seção 19, inteiramente "não medido", e é **a primeira coisa a
capturar na próxima passada**: sem ela, o primeiro item do rail não tem destino descrito.

A numeração 1–18 deste arquivo é **a mesma** da §5 da spec, de propósito (Carregadores
é 8 aqui e 8 lá), para que as duas se confiram linha a linha. Dashboard entrou como 19
em vez de renumerar tudo — o que também é verdade sobre a ordem: no rail ele é o
**primeiro** item, não o último.

## Como ler

**Marcas de proveniência**, por campo:

| Marca | Significa |
|---|---|
| `§4` | veio da §4 da spec (chrome: rail e header) |
| `§5` | veio da tabela das 18 telas (§5) — **prosa descritiva**: a forma e os nomes são confiáveis, a **literalidade** do label (caixa, acento, pontuação) **não** está garantida |
| `§6` | veio da §6 (Transações em detalhe) — medido coluna a coluna |
| `§7` / `§9` | veio da política de dados mock / dos itens abertos da spec |
| `plano` | veio da Tarefa 5 do plano (seção modelo de Carregadores) ou do código da Tarefa 4 |

**Duas expressões que não são sinônimas:**

- **não medido** — a rubrica existe nesta tela e o valor não foi observado. É uma lacuna
  declarada, e serve para alguém ir medir. **Nunca** foi preenchida por inferência.
- **não se aplica** — a rubrica não existe na forma desta tela (coluna num formulário,
  paginação numa tela sem lista). Nunca é substituto de "não medido".

⛔ **O que este inventário deliberadamente não faz:** deduzir `Tipo DS` e `Alinh.` a
partir do nome da coluna. "Repasse líquido" *provavelmente* é `currency` e
*provavelmente* alinha à direita — mas provável não é medido, e uma coluna inventada
aqui viaja direto para o código da próxima tela. Onde só o **nome** da coluna foi
registrado, as outras três células dizem "não medido".

## O chrome, comum a todas as telas (§4)

**Header:** seletor EMPRESA (`PV MOB`) · seletor LOCAIS (multi-select com chips
removíveis, **38 locais**) · Alertas (campainha → tela 17) · Suporte (dropdown) · PT/BR
(dropdown) · avatar + nome + Sair (→ tela 18).

**Rail — 14 linhas de topo**, sendo **12 folhas** e **2 grupos**:

| # | Linha de topo | Tipo | Filhos |
|---|---|---|---|
| 1 | Dashboard | folha | — |
| 2 | Resumo | folha | — |
| 3 | Transações | folha | — |
| 4 | Performance | folha | — |
| 5 | Financeiro | **grupo** | Repasses |
| 6 | Gestão de Carga | folha | — |
| 7 | Preços | folha | — |
| 8 | Carregadores | folha | — |
| 9 | Monitoramento | folha | — |
| 10 | Cupons | folha | — |
| 11 | Permissões | folha | — |
| 12 | Motoristas | folha | — |
| 13 | Configurações | **grupo** | Estrutura da rede · Locais · Usuários |
| 14 | Configurar alertas | folha | — |

**Dashboard, Resumo, Transações e Performance são irmãos de topo** — não filhos de
Dashboard. Total de destinos alcançáveis pelo rail: **16** (12 folhas + 1 + 3).

Os **3 destinos fora do rail**: **Login** (pré-autenticação) · **Alertas** (campainha do
header) · **Perfil** (user menu). 16 + 3 = **19**.

**Aviso recorrente** (§4), presente em "quase toda tela": *"Dados correspondentes aos
locais selecionados no topo. Para alterar, use o seletor no topo da página."* A spec
**não registra em quais telas** ele aparece — por isso, fora de Transações e
Carregadores, o subtítulo está "não medido" em vez de assumido.

---

## 1. Login

- **Rota:** `/pt`
- **Título:** não medido
- **Subtítulo:** não medido
- **Toolbar:** não se aplica (formulário pré-autenticação). Controles registrados (`§5`,
  em prosa — literalidade não confirmada): campo de **e-mail** · campo de **senha** ·
  link de recuperação ("esqueceu a senha") · botão **"Continuar com Google"** · seletor
  de idioma **PT/BR**. O label do botão primário de entrar é **não medido**
- **Colunas:** não se aplica (não é tabela nem lista)
- **KPIs:** nenhum (`§5` descreve a tela como formulário de autenticação)
- **Ações de linha:** não se aplica
- **Estado vazio:** não se aplica
- **Paginação:** não se aplica
- **Builder DS:** `/ds-create-login`
- **Aberto:** título e subtítulo · label literal do botão primário · ordem dos elementos
  · se há link de cadastro · mensagens de erro de credencial inválida · se o seletor
  PT/BR do login é o mesmo componente do header · se há logo e qual

---

## 2. Resumo

- **Rota:** `/pt/resume`
- **Título:** "Resumo" (`§5` — nome da tela; o H1 literal não foi conferido em separado
  do label do rail)
- **Subtítulo:** não medido
- **Toolbar:** date range (`§5`, labels não medidos) · botão **"Baixar dados"** (`§5`).
  Se o "Baixar dados" é ação de página (como em Transações) ou de toolbar: **não medido**
- **Colunas:** a tela tem uma **tabela de transações** (`§5`). Se são as mesmas 13
  colunas da tela 3, um subconjunto, ou outra tabela: **não medido**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |

- **KPIs:** 5, nesta ordem (`§5`): **Status dos Carregadores** · **Faturamento** ·
  **Consumo de Energia** · **Clientes Atendidos** · **Total de Transações**. O **formato
  de cada valor** (moeda, kWh, inteiro, percentual), a presença de variação/delta e a
  presença de ícone são **não medidos**
- **Ações de linha:** não medido
- **Estado vazio:** não medido (a tela tinha dados)
- **Paginação:** não medido
- **Builder DS:** `/ds-create-dashboard`
- **Aberto:** formato dos 5 KPIs · colunas da tabela de transações desta tela · labels do
  date range · se o aviso recorrente da §4 aparece aqui · se há gráfico (a `§5` não
  menciona nenhum, ao contrário de Performance)

---

## 3. Transações

A tela desta rodada. É a única com detalhe de coluna medido na origem (`§6`).

- **Rota:** `/pt/transactions`
- **Título:** "Transações" (`§6`/`plano`)
- **Subtítulo:** "Dados correspondentes aos locais selecionados no topo. Para alterar,
  use o seletor no topo da página." (`§4`/`plano` — é o aviso recorrente, usado aqui como
  `description` do `PageHeader`)
- **Toolbar:**
  - Busca, placeholder **"Buscar por motorista, e-mail ou carregador"** (`§6`)
  - **"Data Inicial"** (valor observado `01/09/2026`) e **"Data Final"** (`16/09/2026`)
    — `§6`. Vão em `toolbar.actions`, não num form acima da grade (L-051)
  - **"Baixar dados"** é ação **de página**, não de toolbar (`§6`)
- **Colunas:** 13 na referência (`§6`). As 12 primeiras foram construídas nesta rodada;
  a 13ª ficou fora — ver "Aberto".

  | # | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|---|
  | 1 | Data | `date` | left | `15/09/2026` |
  | 2 | Empresa | `text` + `select` filter | left | `PV MOB` |
  | 3 | Local | `text` + `ellipsis` + `select` filter | left | `IGREEN MOB - Usina Solar Vinhedo` (longo, trunca) |
  | 4 | Aplicativo | `text` | left | `iGreen MOB` |
  | 5 | Motorista | `text` + `copyable` | left | nome do motorista |
  | 6 | Carregador | `text` + `copyable` + `select` filter | left | `DC 40 KW - 1` |
  | 7 | Energia | `render` (2 linhas) | right | `14,20 kWh` + `78% - 99%` (valor + SoC inicial/final) |
  | 8 | Valor | `currency` | right | `R$ 37,99` |
  | 9 | Veículo | `text` | left | `Geely`, `Jaecoo7` ou placa `TYF9I53`; pode ser vazio (`-`) |
  | 10 | Cupom | `render` (2 linhas) | right | `-` ou `R$ 26,87` + `CPO` |
  | 11 | Duração | `render` (2 linhas) | left | `00h 34min` + `21:42 - 22:16` (duração + janela) |
  | 12 | Recargas | `badge` + `select` filter | left | `Finalizado` |
  | 13 | Ações | `actions` | não medido | **"Ver detalhes"** — **fora desta rodada** |

  ⚠️ **A 13ª coluna não foi construída, e o motivo importa.** "Ver detalhes" não abriu
  por clique simples no ambiente de teste (provável modal com handler próprio), e o
  **conteúdo do detalhe nunca foi medido** (`§9`). Construir o botão sem saber o que ele
  abre produziria uma ação que não leva a lugar nenhum — pior que a ausência declarada.
  A tela desta rodada tem **12 colunas**; a 13ª entra quando o detalhe for capturado.
  ⛔ O passo 5 da Tarefa 4 do plano manda "contar 13 headers" — está **errado** contra o
  próprio passo 1, que define 12. O esperado é **12**.
- **KPIs:** nenhum (`§6` — a tela é tabela densa, sem faixa de KPI)
- **Ações de linha:** **"Ver detalhes"** (`§6`). O que abre: **não medido** — destino
  previsto `PanelDetail` (bloco `dsgreen-paneldetail-1`) quando o conteúdo for capturado
- **Estado vazio:** não medido (a tela tinha dados — 55 páginas na referência)
- **Paginação:** **"Registros por página"** com **10 / 20 / 50** + navegação (`§6`).
  Não é o default do DS (`[10, 25, 50, 100]`) — copia a referência
- **Builder DS:** `/ds-create-crud`
- **Aberto:** conteúdo do detalhe de "Ver detalhes" · alinhamento da coluna Ações ·
  valores possíveis do badge Recargas além de `Finalizado` (o mock assume
  `Finalizado` / `Em andamento` / `Falha`, e **"Em andamento"/"Falha" são invenção do
  mock, não rótulos medidos**) · estado vazio · se a busca é client-side ou server-side
- **Ranges medidos** (`§7`, a preservar em qualquer mock desta tela):

  | Campo | Range |
  |---|---|
  | Energia | `0,00` a `39,58` kWh |
  | Valor | `R$ 0,00` a `R$ 62,71` |
  | SoC | `0%` a `100%`, sempre inicial ≤ final |
  | Duração | `00h 01min` a `01h 25min` |
  | Carregadores | `AC 7,4 KW` · `DC 40 KW` · `60 kW Dual` · `AC 22 KW` |
  | Locais | 38 locais, prefixo `IGREEN MOB - ` (e um `PV MOB - `) |

  Sessões com `0,00 kWh`, `R$ 0,00` e 1–2 min **existem na base real** (tentativas
  falhas) e precisam aparecer.

---

## 4. Performance

- **Rota:** `/pt/performance`
- **Título:** "Performance" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** select de **carregadores** (`§5` — label e se é single ou multi: **não
  medido**) · ação de **download** (`§5` — label literal **não medido**; pode ser
  "Baixar dados" como nas outras telas, mas isso não foi verificado)
- **Colunas:** a tela tem **2 tabelas de métricas** (`§5`). Nomes das colunas de cada
  uma: **não medidos**. O que distingue as duas tabelas: **não medido**

  | Tabela | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|---|
  | 1 | não medido | não medido | não medido | não medido |
  | 2 | não medido | não medido | não medido | não medido |

- **KPIs:** não medido. A tela tem um **gráfico de linha** rotulado **"Sessões"** (`§5`);
  eixos, granularidade (dia/semana/mês), número de séries e legenda são **não medidos**
- **Ações de linha:** não medido
- **Estado vazio:** não medido
- **Paginação:** não medido (nem se as tabelas de métricas paginam)
- **Builder DS:** `/ds-create-dashboard`
- **Aberto:** colunas das 2 tabelas · eixos e séries do gráfico "Sessões" · label do
  download · label e cardinalidade do select de carregadores · presença de date range
  (as outras telas de análise têm; esta não foi registrada com um)

---

## 5. Repasses

- **Rota:** `/pt/financial/transfers`
- **Título:** "Repasses" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** **select de ano** (`§5` — label e valores **não medidos**). Sem busca
  registrada, ao contrário das outras telas de tabela — se a ausência é real ou lacuna da
  captura: **não medido**
- **Colunas:** 6, nomes medidos (`§5`); tipo, alinhamento e formato **não**:

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | Mês | não medido | não medido | não medido |
  | Ano | não medido | não medido | não medido |
  | Repasse líquido | não medido | não medido | não medido |
  | Taxa rede iGreen líquido | não medido | não medido | não medido |
  | Status | não medido | não medido | não medido |
  | Ações | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** existe coluna **"Ações"** (`§5`); quantos controles, quais ícones,
  labels e o que abrem: **não medidos**
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** formato de "Repasse líquido" e "Taxa rede iGreen líquido" (moeda? com
  sinal?) · valores possíveis do Status · conteúdo da coluna Ações · se há busca

---

## 6. Gestão de Carga

> O item de menu chamado **"Gestão de Carga"**. A rota de referência
> (`/pt/smartspott`) fica registrada só como endereço de medição.

- **Rota:** `/pt/smartspott`
- **Título:** "Gestão de Carga" (`§5` + decisão do operador em 2026-09-16 — o label
  original do sistema de referência **não** é usado em lugar nenhum do produto)
- **Subtítulo:** não medido
- **Toolbar:** **busca** (`§5` — placeholder **não medido**)
- **Colunas:** 4, nomes medidos (`§5`):

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | Empresa | não medido | não medido | não medido |
  | Local | não medido | não medido | não medido |
  | Potência em uso | não medido | não medido | não medido |
  | Ações | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** existe coluna **"Ações"** (`§5`); conteúdo **não medido**
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** unidade e formato de "Potência em uso" (kW? percentual? barra?) — é a
  coluna que define a tela e é justamente a não medida · conteúdo de Ações · placeholder
  da busca

---

## 7. Preços

- **Rota:** `/pt/price`
- **Título:** "Preços" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** botão **"Criar novo perfil"** (`§5` — se é primário e se tem ícone: **não
  medido**) · **busca** (placeholder **não medido**)
- **Colunas:** 7, nomes medidos (`§5`):

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | Empresa | não medido | não medido | não medido |
  | Local | não medido | não medido | não medido |
  | Nome | não medido | não medido | não medido |
  | Padrão | não medido | não medido | não medido |
  | Recarga grátis | não medido | não medido | não medido |
  | Tags | não medido | não medido | não medido |
  | Ações | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** existe coluna **"Ações"** (`§5`); conteúdo **não medido**
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** se "Padrão" e "Recarga grátis" são booleanos (badge? switch? ícone?) ·
  forma da coluna "Tags" (chips? texto?) — as duas decisões que mudam o componente ·
  conteúdo do form de "Criar novo perfil" · relação desta tela com a coluna "Preço" de
  Carregadores, que mostra `Perfil padrão` como link

---

## 8. Carregadores

Esta é a seção modelo do plano, e a única fora de Transações com detalhe de coluna.

- **Rota:** `/pt/chargers`
- **Título:** "Carregadores" (`plano`)
- **Subtítulo:** "Dados correspondentes aos locais selecionados no topo. Para alterar,
  use o seletor no topo da página." (`plano`)
- **Toolbar:**
  - Botão primário **"Adicionar carregador"** (ícone `+` à esquerda)
  - Busca, placeholder **"Buscar"**
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
- **Paginação:** **"Registros por página"** 10 / 20 / 50 · "1 de 4"
- **Builder DS:** `/ds-create-crud`
- **Aberto:** conteúdo do form de edição · valores possíveis do badge Status além de
  `Online`

---

## 9. Monitoramento

- **Rota:** `/pt/monitoring`
- **Título:** "Monitoramento" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** **chips de filtro** (quantos e com quais labels: **não medidos**) ·
  **select** (do quê: **não medido**) · barra empilhada **"Plugues por status"** —
  rótulo medido, segmentos e cores **não medidos** (`§5`)
- **Colunas:** a tela tem uma **tabela** (`§5`); nomes das colunas **não medidos**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |

- **KPIs:** não medido. A barra "Plugues por status" pode fazer esse papel — **não
  verificado**
- **Ações de linha:** não medido
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-screen` (composição — é a única tela da lista que não é
  CRUD nem dashboard puro)
- **Aberto:** ⚠️ **a área central da tela renderizou vazia na captura** (`§9`) — não se
  sabe se é mapa, gráfico ou placeholder. É o maior buraco do inventário depois do
  Dashboard, e precisa ser medido **antes** de Monitoramento entrar no escopo · colunas
  da tabela · labels dos chips · o que o select seleciona · segmentos da barra empilhada

---

## 10. Cupons

- **Rota:** `/pt/coupons`
- **Título:** "Cupons" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** botão **"Novo cupom"** (`§5`) · **2 selects** (do quê: **não medido**) ·
  **busca** (placeholder **não medido**)
- **Colunas:** a tela tem uma **tabela** (`§5`); nomes das colunas **não medidos**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** não medido
- **Estado vazio:** **existe** — a `§5` registra "estado vazio" nesta tela. O **texto
  literal é não medido**, e é justamente o que se precisa para replicá-lo
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** texto do estado vazio (esta é uma das 3 telas onde o vazio foi **visto** e
  não transcrito) · colunas · o que os 2 selects filtram · conteúdo do form de
  "Novo cupom" · relação com a coluna `Cupom` de Transações (`CPO`)

---

## 11. Permissões

- **Rota:** `/pt/permissions`
- **Título:** "Permissões" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** **legenda de 4 perfis** (nomes dos perfis: **não medidos**) · botão
  **"Conceder acesso"** (`§5`) · **busca** (placeholder **não medido**)
- **Colunas:** não se aplica — a tela é **lista de cards** (`§5`), não tabela. Os
  **campos de cada card** (quais dados, em que ordem, com que ênfase) são **não medidos**

  | Campo do card | Tipo DS | Posição | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** ações por card: **não medidas** (revogar? editar perfil?)
- **Estado vazio:** não medido
- **Paginação:** não medido (nem se a lista pagina ou rola)
- **Builder DS:** `/ds-create-list`
- **Aberto:** nomes dos 4 perfis da legenda e sua representação visual (cor? badge?) —
  é o que dá sentido à tela · campos do card · ações por card · conteúdo do fluxo de
  "Conceder acesso"

---

## 12. Motoristas

- **Rota:** `/pt/drivers`
- **Título:** "Motoristas" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** **"BAIXAR DADOS"** e **"TAGS DE PREÇO"** (`§5` — registrados em
  maiúsculas; se é caixa alta real ou transcrição, **não confirmado**) · **select** (do
  quê: **não medido**) · **busca** (placeholder **não medido**) · **date range** (labels
  **não medidos**) · **checkbox** (label **não medido**)

  ⚠️ São **6 controles de toolbar** — o caso que a L-051 mais penaliza. Ao construir,
  o que for coluna vira filtro nativo (chip), e só o pequeno não-coluna fica no toolbar.
  Mas **qual controle corresponde a qual coluna é não medido**, então essa distribuição
  não pode ser decidida ainda
- **Colunas:** **10** (`§5` registra a contagem). **Nenhum nome de coluna foi medido** —
  é a maior lacuna de coluna do inventário

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido (×10) | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** não medido
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** os 10 nomes de coluna · o que o select e o checkbox filtram · labels do
  date range · caixa real de "BAIXAR DADOS" e "TAGS DE PREÇO" · o que "TAGS DE PREÇO"
  abre · ⚠️ esta tela expõe **dados pessoais reais** na referência (nome, e-mail, CPF,
  placa): a política da `§7` — forma real, identidades fictícias — vale integralmente
  aqui

---

## 13. Estrutura da rede

- **Rota:** `/pt/settings/companies-net`
- **Título:** "Estrutura da rede" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** **busca** (placeholder **não medido**)
- **Colunas:** 6, nomes medidos (`§5`):

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | Nome | não medido | não medido | não medido |
  | CNPJ | não medido (candidato a `copyable` — ver "Aberto") | não medido | não medido |
  | Endereço | não medido | não medido | não medido |
  | Responsável | não medido | não medido | não medido |
  | e-mail | não medido (candidato a `copyable`) | não medido | não medido |
  | Ações | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** existe coluna **"Ações"** (`§5`); conteúdo **não medido**
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** formato de CNPJ e Endereço (Endereço é longo — trunca? quebra?) ·
  conteúdo de Ações · se há botão de criar empresa (a `§5` não registra nenhum, o que
  seria incomum numa tela de cadastro) · se CNPJ e e-mail têm o ícone de copiar na
  referência (o mapa da `§6` prevê `copyable` para eles, mas isso é **decisão de
  destino**, não medição da referência)

---

## 14. Locais

- **Rota:** `/pt/settings/locals`
- **Título:** "Locais" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** **busca** (placeholder **não medido**) · checkbox **"Exibir desativados"**
  (`§5`)
- **Colunas:** a tela tem uma **tabela** (`§5`); nomes das colunas **não medidos**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** não medido
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** colunas · como um local desativado se distingue visualmente quando o
  checkbox está ligado (badge? opacidade?) · se há botão de criar local · os **38 locais**
  da referência (`§4`) moram nesta tela — a lista completa não foi capturada, só 8 entraram
  no mock

---

## 15. Usuários

- **Rota:** `/pt/settings/users`
- **Título:** "Usuários" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** **3 selects** (do quê: **não medidos**) · **"BAIXAR DADOS"** (caixa não
  confirmada) · **busca** (placeholder **não medido**)
- **Colunas:** **8** (`§5` registra a contagem). **Nenhum nome de coluna foi medido**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido (×8) | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** não medido
- **Estado vazio:** **existe** (`§5` registra "vazio"). **Texto literal não medido**
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** os 8 nomes de coluna · o que os 3 selects filtram · texto do estado vazio ·
  relação com Permissões (tela 11) — se esta lista pessoas e aquela lista acessos, ou se
  há sobreposição · dados pessoais: aplica-se a `§7`

---

## 16. Configurar alertas

- **Rota:** `/pt/alert-groups`
- **Título:** "Configurar alertas" (`§5`)
- **Subtítulo:** não medido
- **Toolbar:** botão **"Adicionar grupo de alertas"** (`§5`) · **busca** (placeholder
  **não medido**)
- **Colunas:** a tela tem uma **tabela** (`§5`); nomes das colunas **não medidos**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** não medido
- **Estado vazio:** **existe** (`§5` registra "vazio"). **Texto literal não medido**
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** colunas · texto do estado vazio · conteúdo do form de "Adicionar grupo de
  alertas" (quais eventos, quais destinatários) · relação com a tela 17 (esta configura,
  aquela historia)

---

## 17. Alertas

Destino **fora do rail**: chega-se pela **campainha do header** (`§4`).

- **Rota:** `/pt/alerts-history`
- **Título:** não medido (a `§5` chama a tela de "Alertas"; a rota é `alerts-history`, e
  qual dos dois é o H1 **não foi conferido**)
- **Subtítulo:** não medido
- **Toolbar:** **busca** (placeholder **não medido**) · **date range** (labels **não
  medidos**)
- **Colunas:** a tela tem tabela **com badge de tipo de alerta** (`§5`); nomes das
  colunas **não medidos**

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |
  | (tipo de alerta) | `badge` | não medido | não medido — **valores possíveis do badge não medidos** |

- **KPIs:** não medido
- **Ações de linha:** não medido
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** `/ds-create-crud`
- **Aberto:** título literal · colunas · **valores e cores do badge de tipo de alerta**
  (é o que caracteriza a tela) · se a campainha do header mostra contador de não-lidos ·
  se há ação de marcar como lido

---

## 18. Perfil

Destino **fora do rail**: chega-se pelo **user menu** do header (`§4`).

- **Rota:** `/pt/profile`
- **Título:** não medido (a `§5` chama a tela de "Perfil")
- **Subtítulo:** não medido
- **Toolbar:** não se aplica — a tela é formulário em painéis, sem toolbar. Controles
  registrados (`§5`): **avatar** · botão **"Mudar Foto"** · botão/ação **"Alterar
  senha"**. Se há botão de salvar por painel ou um global: **não medido**
- **Colunas:** não se aplica (formulário). Os **campos** de cada painel são **não
  medidos**

  | Painel | Campo | Tipo DS | Formato observado |
  |---|---|---|---|
  | Pessoal | não medido | não medido | não medido |
  | Endereço | não medido | não medido | não medido |

- **KPIs:** nenhum (`§5` descreve 2 painéis editáveis)
- **Ações de linha:** não se aplica
- **Estado vazio:** não se aplica
- **Paginação:** não se aplica
- **Builder DS:** página de form (`§5`) — **nenhum builder do DS cobre isto**; é
  `FormField` + `Panel` na mão, seguindo a L-023 (nunca `<label>` cru) e a L-024
  (`gap-form-gap` entre campos)
- **Aberto:** campos dos painéis Pessoal e Endereço, com ordem e obrigatoriedade ·
  onde fica o salvar · fluxo de "Alterar senha" (inline? modal?) · fluxo de "Mudar Foto"
  (upload? crop?) · título literal

---

## 19. Dashboard

⚠️ **Seção inteiramente não medida.** Este destino **não está na §5 da spec** — foi
descoberto depois, e é a **primeira coisa a capturar na próxima passada**.

O item **Dashboard** é a **primeira linha do rail** e tem rota própria
(`/pt/dashboard`), **distinta** de `/pt/resume` ("Resumo", tela 2). Nada do conteúdo foi
observado: não se sabe se é um painel de KPIs, uma landing de módulo, um redirecionamento
para Resumo, ou uma tela vazia.

- **Rota:** `/pt/dashboard`
- **Título:** não medido
- **Subtítulo:** não medido
- **Toolbar:** não medido
- **Colunas:** não medido (nem se a tela tem tabela)

  | Coluna | Tipo DS | Alinh. | Formato observado |
  |---|---|---|---|
  | não medido | não medido | não medido | não medido |

- **KPIs:** não medido
- **Ações de linha:** não medido
- **Estado vazio:** não medido
- **Paginação:** não medido
- **Builder DS:** não medido — indeterminável sem saber a forma da tela
- **Aberto:** **tudo**. Em ordem de utilidade: (1) a tela tem conteúdo próprio ou
  redireciona para `/pt/resume`? · (2) se tem, é KPI, gráfico, tabela ou composição? ·
  (3) título e subtítulo · (4) como ela se diferencia de Resumo — as duas serem itens
  irmãos de topo com nomes tão próximos é a pergunta de produto que esta captura
  responde

---

## Cobertura — o que este inventário garante

| | |
|---|---|
| Destinos com seção própria | **19** (18 da §5 + Dashboard) |
| Rubricas por seção | **10**, sem exceção |
| Telas com colunas medidas nome-a-nome, com tipo e formato | **2** — Transações (3) e Carregadores (8) |
| Telas com **só os nomes** das colunas | 4 — Repasses (5) · Gestão de Carga (6) · Preços (7) · Estrutura da rede (13) |
| Telas com tabela e **nenhum** nome de coluna | 7 — Resumo (2) · Performance (4) · Monitoramento (9) · Cupons (10) · Locais (14) · Configurar alertas (16) · Alertas (17) |
| Telas com **só a contagem** de colunas | 2 — Motoristas (12, "10 col") · Usuários (15, "8 col") |
| Telas sem tabela | 4 — Login (1) · Permissões (11, lista de cards) · Perfil (18, form) · Dashboard (19, forma desconhecida) |
| Subtítulo medido | **2** de 19 — Transações e Carregadores |
| Estado vazio com texto literal | **0** de 19. Em 3 telas o vazio foi **visto** sem ser transcrito (Cupons, Usuários, Configurar alertas) |
| Paginação medida | **2** de 19 — Transações (10/20/50) e Carregadores (10/20/50, "1 de 4") |

**A leitura honesta desta tabela:** o inventário fecha a **navegação** (19 destinos, 19
rotas, 19 builders quando determináveis) e fecha **1 tela para construir** (Transações,
que é a desta rodada) mais **1 molde** (Carregadores). As outras 17 estão mapeadas na
**forma**, não no **conteúdo** — dá para decidir *qual builder* usar, não para gerar a
tela. Uma segunda passada de captura é o que transforma "12 são tabela" em 12 tabelas
construíveis.

**Ordem sugerida para a próxima passada**, por retorno:

1. **Dashboard (19)** — é o primeiro item do rail e não se sabe nem se tem conteúdo
2. **Motoristas (12) e Usuários (15)** — 18 colunas sem um único nome entre as duas
3. **Os 3 estados vazios vistos e não transcritos** — Cupons, Usuários, Configurar
   alertas. São 3 frases, e sem elas o vazio será inventado
4. **Área central de Monitoramento (9)** — renderizou vazia; bloqueia a tela inteira
5. **Detalhe de "Ver detalhes" (3)** — desbloqueia a 13ª coluna de Transações
6. **Subtítulos das 17 telas** — o aviso recorrente da §4 aparece em "quase toda tela",
   e "quase" é o que impede assumir
