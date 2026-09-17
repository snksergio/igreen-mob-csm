import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react";
import {
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  DatePicker,
  PageHeader,
  type ChartConfig,
  type DateRange,
} from "@snksergio/design-system";
import { Card, CardContent } from "@snksergio/design-system/shadcn";
import {
  AJUDA_VARIACAO,
  CARREGADORES,
  GRUPOS_DE_METRICAS,
  TICKS_EIXO_DIAS,
  TODAS_AS_METRICAS,
  escalaDoEixo,
  type Metrica,
} from "./performance-mock";
import {
  ComAjuda,
  Unidade,
  Variacao,
  VariacaoDestaque,
  formatar,
  formatarCurto,
} from "./performance-ui";
import { SeletorDeCarregadores } from "./SeletorDeCarregadores";

/**
 * Tela de Performance — dados medidos em `/pt/performance?period=thisMonth` (2026-09-16).
 *
 * ## A composição
 *
 * Um card, duas colunas **no mesmo nível**: à esquerda o número em foco e o gráfico, à
 * direita as duas listas de métrica, separadas por um divisor vertical. Clicar numa
 * métrica troca o número e o gráfico.
 *
 * Três referências, cada uma resolvendo uma coisa:
 *
 * · **a origem** (`/pt/performance`) dá o conteúdo: as 7 métricas, as colunas de cada
 *   grupo, os textos de ajuda e a seta de tendência ao fim de cada linha;
 * · **o card "Finance" do showcase de gráficos do DS** dá as duas colunas irmãs com
 *   divisor no meio e título próprio em cada lado;
 * · **o card "Crypto Portfolio"** dá o cabeçalho da esquerda: **rótulo pequeno → número
 *   grande → variação**, sem título separado. Foi ele que resolveu o problema de ter dois
 *   títulos disputando tamanho no mesmo card — o nome da métrica agora mora DENTRO do
 *   rótulo ("Receita total no período (R$)"), e a definição dela vive no `ⓘ` da linha.
 *
 * ## Por que a grade das listas é uma constante
 *
 * `GRADE` é declarada uma vez e usada no cabeçalho E nas linhas, nos DOIS grupos. É isso,
 * e só isso, que mantém as colunas alinhadas. Carregadores não tem `Total` e ainda assim
 * usa a mesma grade, com a célula vazia — é o que faz `Média` cair na mesma vertical de
 * `Média por dia` do outro grupo, como na origem.
 *
 * ## Altura
 *
 * **Quem manda é a coluna da direita.** O gráfico é `flex-1 min-h-0` dentro de uma coluna
 * esquerda sem altura própria, então a linha da grade mede o que as listas medem e o
 * gráfico preenche o resto. As duas versões anteriores fizeram o contrário — piso fixo no
 * gráfico — e sobrava espaço vazio embaixo de um dos lados.
 *
 * ## O que DIVERGE da origem
 *
 * · **Área com gradiente**, não linha: é o formato do card do DS que serve de referência.
 *   Cor por token (`chart-1`) — a referência escolhe o conjunto, nunca o valor.
 * · **Período** pelo `DatePicker mode="range"` do DS; a origem tem dois campos de texto COM
 *   HORA. A hora se perde — decisão do operador.
 * · **Cor de direção só na pastilha da seta.** O número de variação fica neutro, como
 *   medido. O porquê está em `performance-ui.tsx`.
 *
 * ## O que ficou de FORA
 *
 * O estado `Performance por carregador` da origem — o i18n tem as chaves, o layout não
 * renderizou com 31/31 nem 30/31 carregadores. Não medido, então não construído.
 */

/**
 * A grade das listas. Cinco vagas: nome · Total · Média · Variação · seta.
 *
 * `minmax(0,1fr)` e não `1fr`: sem o mínimo zero, "Tx. de Utilização" força a coluna a
 * crescer e empurra os números pra fora.
 */
const GRADE =
  "grid grid-cols-[minmax(0,1fr)_96px_104px_88px_36px] items-center gap-gp-md";

/** Faixa do rótulo de coluna — o recurso que a origem usa pra separar cabeçalho de dado. */
const FAIXA =
  "rounded-radius-sm bg-bg-muted py-pad-xs text-center text-caption-sm font-semibold text-fg-muted";

export function PerformancePage() {
  const [carregadores, setCarregadores] = useState<string[]>([...CARREGADORES]);
  const [periodo, setPeriodo] = useState<DateRange | undefined>(undefined);

  /** Métrica em foco. Abre em Sessões — a que a origem desenha por default. */
  const [metricaId, setMetricaId] = useState<string>("sessoes");
  const metrica =
    TODAS_AS_METRICAS.find((m) => m.id === metricaId) ?? TODAS_AS_METRICAS[0];

  /**
   * ⚠️ Os agregados NÃO reagem ao filtro de carregador nem ao período: são os números
   * medidos na referência. Fazê-los reagir exigiria gerar dado por carregador e por dia, e
   * aí a tela deixa de ser conferível contra a origem — o único critério de aceite que
   * existe hoje. O que reage é a escolha de MÉTRICA, que é o comportamento da origem.
   */
  const rotuloPeriodo = useMemo(() => {
    if (!periodo?.from) return "Mês atual";
    const fmt = (d: Date) =>
      d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
    return periodo.to ? `${fmt(periodo.from)} – ${fmt(periodo.to)}` : fmt(periodo.from);
  }, [periodo]);

  const escala = useMemo(
    () => escalaDoEixo(Math.max(...metrica.serie.map((p) => p.valor))),
    [metrica],
  );

  const config = useMemo(
    () =>
      ({
        valor: { label: metrica.rotulo, color: "var(--color-chart-1)" },
      }) satisfies ChartConfig,
    [metrica],
  );

  return (
    <div className="flex flex-col gap-gp-2xl">
      <PageHeader
        title="Performance"
        /* Texto literal da referência — o aviso recorrente do escopo global. */
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        /* Os controles sobem pro `actions` do `PageHeader`, na MESMA hierarquia do
           botão de download. Eles recortam a tela inteira — gráfico e as duas listas —
           então pertencem ao cabeçalho da página, não a um bloco solto abaixo dele.
           Sem rótulo externo: os dois gatilhos já dizem o que são ("Todos os
           carregadores", "Mês atual"), e rótulo acima de controle dentro de um header
           criaria uma terceira hierarquia de texto na mesma linha. */
        actions={
          <>
            <SeletorDeCarregadores
              selecionados={carregadores}
              onChange={setCarregadores}
            />
            {/* `title` no wrapper porque o `DatePicker` não repassa `title`. */}
            <span title={rotuloPeriodo}>
              <DatePicker
                mode="range"
                value={periodo}
                onValueChange={setPeriodo}
                placeholder="Mês atual"
                align="end"
                /* ⚠️ Largura que CRESCE com o conteúdo, e não fixa: vazio o gatilho diz
                   "Mês atual" (9 caracteres) e com período escolhido diz "01 de set. de
                   2026 – 30 de set. de 2026" (39). Travado no menor, o texto truncava;
                   travado no maior, sobrava um campo enorme mostrando duas palavras. */
                className={periodo?.from ? "w-[260px]" : "w-[140px]"}
              />
            </span>
            <Button variant="filled" color="primary" size="md" iconLeft={<Download />}>
              Download dos dados
            </Button>
          </>
        }
      />

      <Card size="md">
        {/* ⚠️ Sem `CardHeader`: o cabeçalho da esquerda tem que nascer NA MESMA LINHA do
            título da lista da direita, e um header de card ocupa a largura inteira acima
            das duas colunas. Com a grade no nível do conteúdo, os dois lados começam no
            mesmo topo — e o divisor passa exatamente no meio, do topo ao fim do conteúdo,
            recuado das bordas pelo padding do `CardContent`. */}
        <CardContent>
          {/* Gráfico à ESQUERDA, listas à DIREITA — a disposição escolhida pelo
              operador depois de ver as duas. A coluna da direita continua sendo a que
              MANDA NA ALTURA: o gráfico não contribui com altura nenhuma (ver o
              `relative` dele abaixo), então a linha da grade mede o que a lista mede. */}
          <div className="grid gap-gp-4xl xl:grid-cols-[minmax(0,1fr)_minmax(560px,0.85fr)]">
            {/* ── Esquerda: número em foco + gráfico ────────────────────────────
                DOM: gráfico primeiro (é o conteúdo). No mobile a ordem VISUAL
                inverte por `order` — quem controla aparece antes de quem é
                controlado. */}
            <div className="order-2 flex min-w-0 flex-col gap-gp-2xl xl:order-1">
              {/* Padrão "Crypto Portfolio": rótulo → número → variação. Um bloco só, sem
                  título nem subtítulo separados disputando tamanho. */}
              <div className="flex flex-col gap-gp-2xs">
                <span className="text-caption-md text-fg-subtle">
                  {metrica.rotuloDoDestaque}
                </span>
                <span className="text-stat-lg tabular-nums text-fg-default">
                  {metrica.total ?? metrica.media}
                </span>
                <VariacaoDestaque valor={metrica.variacao} />
              </div>

              {/* `h-[260px]` é o piso do mobile. No `xl` a altura vem da coluna da
                  direita: `flex-1 min-h-0` faz o gráfico esticar pra preencher o que
                  sobrar, e como esta coluna não tem altura própria, é a lista que define a
                  linha da grade.
                  `ResponsiveContainer` exige pai com altura resolvida — senão colapsa em 0
                  e o gráfico não aparece, sem erro nenhum. */}
              {/* ⚠️ `relative` + filho `absolute inset-0` é o que faz o gráfico NÃO
                  contribuir com altura nenhuma pra linha da grade. Sem isso ele empurrava
                  a linha pra ~700px e sobrava um vão embaixo da lista — era o espaço
                  vazio do print. `flex-1` não resolvia: num flex-column de altura
                  automática, `flex-grow` não tem pra onde crescer, então o item voltava a
                  medir o próprio conteúdo.
                  `min-h-[260px]` é o piso do mobile, onde não há linha de grade pra
                  herdar; no `xl` ele zera e a altura vem da lista ao lado. */}
              <div className="relative min-h-[260px] w-full flex-1 xl:min-h-0">
                <ChartContainer config={config} className="absolute inset-0 h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={metrica.serie}
                      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    >
                      {/* `id` com o da métrica: um `id` fixo manteria o gradiente antigo
                          depois da troca. */}
                      <defs>
                        <linearGradient
                          id={`area-${metrica.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="var(--color-valor)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-valor)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      {/* Sem `stroke`: a cor vem do token `chart-grid`, que o
                          `ChartContainer` reescreve (L-032). */}
                      <CartesianGrid vertical={false} strokeDasharray="4 4" />

                      {/* ⚠️ `ticks` explícito, não `interval={1}`: os dois espaçam de 2 em
                          2, mas o `interval` começa no índice 0 e rotula os dias ÍMPARES;
                          a origem rotula os PARES. Medido. */}
                      <XAxis
                        dataKey="dia"
                        tickLine={false}
                        axisLine={false}
                        ticks={TICKS_EIXO_DIAS}
                        tickMargin={8}
                        className="text-caption-md"
                      />
                      {/* ⚠️ L-032 (4): sem `interval={0}` o Recharts OMITE o tick de borda
                          (o `0`), e o `domain` máximo tem que ser IGUAL ao maior tick —
                          senão sai linha-guia duplicada no topo. Os dois vêm da mesma
                          função (`escalaDoEixo`). */}
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        ticks={escala.ticks}
                        domain={[0, escala.teto]}
                        tickFormatter={(v: number) => formatarCurto(v, metrica.formato)}
                        tickMargin={8}
                        width={48}
                        className="text-caption-md"
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(v) => formatar(Number(v), metrica.formato)}
                          />
                        }
                      />
                      <Area
                        dataKey="valor"
                        type="monotone"
                        stroke="var(--color-valor)"
                        strokeWidth={2}
                        fill={`url(#area-${metrica.id})`}
                        dot={{ r: 2.5 }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>

            {/* ── Direita: as duas listas ───────────────────────────────────────
                O divisor mora AQUI, na coluna da direita: é a borda esquerda dela que
                desenha a linha entre as duas metades do card. */}
            {/* ⚠️ `min-w-0`: item de grade tem `min-width: auto`, e sem isto a coluna se recusa
                a encolher abaixo do conteúdo — o scroll horizontal da lista nunca ativava
                no celular, a coluna estourava 576px e a PÁGINA rolava de lado. */}
            <div className="order-1 flex min-w-0 flex-col gap-gp-4xl xl:order-2 xl:border-l xl:border-border-default xl:pl-gp-4xl">
              {GRUPOS_DE_METRICAS.map((g) => (
                <ListaDeMetricas
                  key={g.id}
                  titulo={g.titulo}
                  subtitulo={g.subtitulo}
                  metricas={g.metricas}
                  ativa={metricaId}
                  onSelecionar={setMetricaId}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Uma lista de métricas selecionáveis.
 *
 * **Lista de cards, não `Table`.** Cada linha tem borda e fundo próprios — é o que diz
 * "clique aqui", e é o padrão do bloco "Recent Releases" do showcase. Uma `Table` faria
 * linhas que parecem dado, não controle; e duas tabelas irmãs com número de colunas
 * diferente não alinham entre si.
 */
function ListaDeMetricas({
  titulo,
  subtitulo,
  metricas,
  ativa,
  onSelecionar,
}: {
  titulo: string;
  subtitulo: string;
  metricas: Metrica[];
  ativa: string;
  onSelecionar: (id: string) => void;
}) {
  /* Derivado do dado, não passado por prop: assim o cabeçalho não pode discordar do que a
     linha mostra. Operação tem Total; Carregadores, só Média. */
  const temTotal = metricas.some((m) => m.total !== undefined);

  return (
    /**
     * ⚠️ **Scroll horizontal abaixo do `xl`.** Sem isso a grade comprimia a coluna do
     * nome pra caber na largura do celular, e nomes longos ("Tx. de Utilização",
     * "Disponibilidade") sumiam em "…" — pior que rolar, porque a informação desaparece
     * sem avisar. Com `min-w`, a lista mantém as cinco colunas legíveis e o dedo arrasta.
     *
     * O `min-w` é a soma real das vagas: 200 (nome) + 96 + 104 + 88 + 36 + 4×8 de gap +
     * o padding lateral. No `xl` ele zera e a grade volta a se ajustar à coluna do card.
     */
    <div className="scrollbar-thin overflow-x-auto xl:overflow-visible">
    <div className="flex min-w-[576px] flex-col gap-gp-sm xl:min-w-0">
      {/* ⚠️ Título e faixas de coluna NA MESMA LINHA da grade — é isso que fecha o vão que
          havia debaixo do título: aquele espaço era a área reservada às faixas.
          `items-end` deixa as faixas na altura do subtítulo. E `border border-transparent`
          não é enfeite: as linhas têm 1px de borda, e sem uma borda invisível aqui o box
          model difere e as colunas saem 1px fora de registro. */}
      <div className={`${GRADE} items-end border border-transparent pl-pad-2xl pr-pad-lg`}>
        {/* ⚠️ `-ml-pad-lg` cancela o padding do cabeçalho SÓ no título. As linhas têm
            `px-pad-lg` porque são cards com borda; o título não é card, e recuado ele
            ficava 10px pra dentro da borda do card — desalinhado do que o olho espera.
            Cancelar na célula, e não no container, preserva a posição das faixas de
            coluna: elas são vagas fixas da grade e têm que continuar sobre os números. */}
        <div className="-ml-pad-2xl flex min-w-0 flex-col gap-gp-2xs">
          {/* Mesmos tamanhos do cabeçalho da direita, por pedido: `title-md` + `body-sm`
              em `fg-muted`. Os dois lados do card leem como irmãos. */}
          {/* `whitespace-nowrap`: no celular a célula do título é estreita, e quebrar
              em duas linhas empurrava as faixas de coluna pra baixo e desalinhava tudo.
              Com o scroll horizontal do wrapper, não quebrar é possível sem cortar. */}
          <span className="whitespace-nowrap text-title-md text-fg-default">{titulo}</span>
          <span className="whitespace-nowrap text-body-sm text-fg-muted">
            {subtitulo}
          </span>
        </div>
        {/* Sem faixa quando não há coluna: faixa cinza vazia parecia campo quebrado. A
            célula continua ocupando a vaga da grade — é ela que mantém `Média` na mesma
            vertical nos dois grupos. */}
        {temTotal ? <span className={FAIXA}>Total</span> : <span />}
        <span className={FAIXA}>{temTotal ? "Média por dia" : "Média"}</span>
        <span className={`${FAIXA} flex items-center justify-center gap-gp-2xs`}>
          <ComAjuda ajuda={AJUDA_VARIACAO}>Variação</ComAjuda>
        </span>
        <span />
      </div>

      {metricas.map((m) => {
        const selecionada = m.id === ativa;
        const positivo = m.variacao.trim().startsWith("+");
        const Seta = positivo ? ArrowUpRight : ArrowDownRight;
        const Icone = m.icone;

        return (
          /**
           * `role="radio"`, não checkbox: a seleção é ÚNICA — uma métrica no gráfico por
           * vez. O visual é o de item selecionado do `DataList` (borda e fundo de marca),
           * sem caixa de marcar: o operador pediu o realce sem o checkbox, e radio é o
           * papel honesto pra "clica uma vez e fica ativo".
           */
          <div
            key={m.id}
            role="radio"
            aria-checked={selecionada}
            tabIndex={0}
            onClick={() => onSelecionar(m.id)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                onSelecionar(m.id);
              }
            }}
            /* `pl-pad-2xl` (16px) e não `pad-lg` (10px): com 10px o ícone encostava na
                borda do card da linha. O `pr` fica menor porque à direita o conteúdo é a
                pastilha da seta, que já tem massa própria. */
            className={`${GRADE} cursor-pointer rounded-radius-md border pl-pad-2xl pr-pad-lg py-pad-xl transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand ${
              selecionada
                ? "border-border-brand bg-bg-brand-subtle"
                : "border-border-subtle bg-bg-surface hover:border-border-default hover:bg-bg-muted"
            }`}
          >
            <span className="flex min-w-0 items-center gap-gp-md">
              <Icone
                className={`size-icon-sm shrink-0 ${
                  selecionada ? "text-fg-brand" : "text-fg-muted"
                }`}
              />
              <span
                className={`flex min-w-0 items-center gap-gp-xs text-body-sm ${
                  selecionada
                    ? "font-semibold text-fg-brand"
                    : "font-medium text-fg-default"
                }`}
              >
                <ComAjuda ajuda={m.ajuda}>
                  <span className="truncate">
                    {m.rotulo}
                    {m.unidade && <> <Unidade>{m.unidade}</Unidade></>}
                  </span>
                </ComAjuda>
              </span>
            </span>

            {/* Célula de `Total` VAZIA em Carregadores — é o que mantém `Média` na mesma
                vertical nos dois grupos. */}
            <span
              className={`text-center text-body-sm font-semibold tabular-nums ${
                selecionada ? "text-fg-brand" : "text-fg-default"
              }`}
            >
              {m.total ?? ""}
            </span>
            <span
              className={`text-center text-body-sm font-semibold tabular-nums ${
                selecionada ? "text-fg-brand" : "text-fg-default"
              }`}
            >
              {m.media}
            </span>
            <span className="text-center">
              <Variacao valor={m.variacao} />
            </span>

            {/* Seta de tendência — a origem tem uma em cada linha, em pastilha colorida.
                É o ÚNICO lugar da lista com cor de direção: o número ao lado fica neutro,
                como medido, e a seta carrega o sinal. */}
            <span
              /* ⚠️ `size-form-xs` = 28px, e é ESTE token que define a altura da linha
                  (`py-pad-xl`×2 + o elemento mais alto + borda).

                  Estava `size-comp-sm`, e a família `comp` **não existe no tema** — a
                  classe não emitia CSS, a pastilha ficava do tamanho do ícone, e o
                  comentário antigo afirmava "28px … dá exatamente 54px" sobre uma classe
                  morta. Falha silenciosa da L-057: passa em build, `tsc` e teste. 28px é o
                  valor que eu queria, e ele existe — como `form-xs`. */
              className={`flex size-form-xs items-center justify-center rounded-radius-sm ${
                positivo
                  ? "bg-bg-success-muted text-fg-success"
                  : "bg-bg-danger-muted text-fg-danger"
              }`}
              aria-hidden
            >
              <Seta className="size-icon-xs" />
            </span>
          </div>
        );
      })}
    </div>
    </div>
  );
}
