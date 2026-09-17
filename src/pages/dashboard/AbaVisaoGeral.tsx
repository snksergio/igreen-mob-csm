import {
  AlertTriangle,
  BatteryCharging,
  Clock,
  Gauge,
  PlugZap,
  Ticket,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Kpi,
  KpiDelta,
  KpiGroup,
  type ChartConfig,
} from "@snksergio/design-system";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  brl,
  carregadoresPorCorrente,
  carregadoresPorStatus,
  diaCurto,
  duracaoHm,
  movimentacaoPorUf,
  numero,
  totais,
  variacao,
  type DiaDoDashboard,
} from "./dashboard-mock";
import {
  CartaoDeGrafico,
  COR_DE_STATUS,
  MapaDeMovimentacao,
  RotuloDeSecao,
  Rosca,
} from "./dashboard-ui";

/**
 * Aba Visão Geral — os oito KPIs, o estado da frota e a evolução no período.
 *
 * ## Os KPIs são os MESMOS da tela de Resumo
 *
 * Mesmo componente (`Kpi` do DS), mesmos ajustes de anatomia (`AJUSTES_DO_KPI`), mesma
 * regra de tom. Não é economia de código — é que as duas telas mostram indicadores do
 * mesmo período sobre o mesmo dado, e duas gramáticas visuais fariam o operador achar que
 * são coisas diferentes.
 *
 * ⚠️ O `DashboardShowcase` do DS tem DUAS receitas de KPI convivendo: o primitivo `Kpi`
 * (valor em `text-stat-*`) e um `KpiCard` local que é cópia manual e usa
 * `text-body-2xl font-bold` — 24px com weight sobrescrito em vez do preset. A doc do
 * próprio DS marca a segunda como desvio. Aqui é o primitivo, como em Resumo.
 *
 * ## O tom não é o sinal, e o ícone muda quando vai mal
 *
 * Tudo neutro no repouso; **vermelho só no que exige atenção**, e aí o ícone vira
 * `AlertTriangle` e o valor fica vermelho. Cinco tons diferentes transformariam a faixa
 * num semáforo sem semântica — se tudo é destaque, nada é. Idem Resumo.
 *
 * E "vai mal" é a variação contra `subirEhBom`, não o sinal: subir é bom em recarga e
 * receita, e é piora em **tempo médio de sessão**.
 */

/**
 * Os ajustes de anatomia que o `Kpi` do DS não expõe como prop — copiados de
 * `ResumoPage`, literalmente, para as duas telas não divergirem.
 *
 * Seletor de descendente de propósito: `[&>header>span]` tem especificidade (0,1,2) e
 * vence o `rounded-radius-lg` (0,1,0) do `iconBox`. Uma classe solta no `className` da
 * raiz NÃO venceria — com prefixo DS o `tailwind-merge` não reconhece o conflito, as duas
 * sobrevivem e a ordem do CSS decide (L-072 do DS).
 *
 * 📋 Lacuna do DS, já anotada em Resumo: `Kpi` não tem `iconShape`. Duas telas quererem
 * círculo é o sinal de que a forma do `iconBox` devia ser prop.
 */
const AJUSTES_DO_KPI =
  "[&>header>span]:rounded-radius-full [&>div:first-of-type]:-mt-gp-xs";

interface DefinicaoDeKpi {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  valor: (t: ReturnType<typeof totais>) => string;
  /** O número cru, para comparar com o período anterior. */
  bruto: (t: ReturnType<typeof totais>) => number;
  subirEhBom: boolean;
  /**
   * O KPI responde ao recorte de tempo?
   *
   * ⚠️ `Carregadores` não responde — é o tamanho da frota AGORA. Com delta, ele mostrava
   * uma pílula "0,00%" em todo período, que lê como "não cresceu" quando o certo é "a
   * pergunta não se aplica". A referência também não põe pílula nele.
   */
  temDelta?: boolean;
}

const KPIS: DefinicaoDeKpi[] = [
  {
    id: "recargas",
    rotulo: "Recargas",
    icone: BatteryCharging,
    valor: (t) => numero(t.recargas),
    bruto: (t) => t.recargas,
    subirEhBom: true,
  },
  {
    id: "bruto",
    rotulo: "Receita total bruta",
    icone: TrendingUp,
    valor: (t) => brl(t.bruto),
    bruto: (t) => t.bruto,
    subirEhBom: true,
  },
  {
    id: "energia",
    rotulo: "Total kWh vendido",
    icone: Zap,
    valor: (t) => `${numero(t.energiaKwh, 2)} kWh`,
    bruto: (t) => t.energiaKwh,
    subirEhBom: true,
  },
  {
    id: "motoristas",
    rotulo: "Motoristas",
    icone: Users,
    valor: (t) => numero(t.motoristas),
    bruto: (t) => t.motoristas,
    subirEhBom: true,
  },
  {
    id: "cupom",
    rotulo: "Recargas com cupom",
    icone: Ticket,
    valor: (t) => numero(t.comCupom),
    bruto: (t) => t.comCupom,
    subirEhBom: true,
  },
  {
    id: "kwh-medio",
    rotulo: "kWh médio/recarga",
    icone: Gauge,
    valor: (t) => `${numero(t.kwhMedio, 2)} kWh`,
    bruto: (t) => t.kwhMedio,
    subirEhBom: true,
  },
  {
    id: "tempo-medio",
    rotulo: "Tempo médio/recarga",
    icone: Clock,
    valor: (t) => duracaoHm(t.duracaoMedia),
    bruto: (t) => t.duracaoMedia,
    /* ⚠️ Sessão mais longa é pior: ocupa o ponto por mais tempo pelo mesmo kWh. */
    subirEhBom: false,
  },
  {
    id: "carregadores",
    rotulo: "Carregadores",
    icone: PlugZap,
    valor: () => numero(carregadoresPorStatus().reduce((a, f) => a + f.valor, 0)),
    bruto: () => carregadoresPorStatus().reduce((a, f) => a + f.valor, 0),
    subirEhBom: true,
    temDelta: false,
  },
];

/* Verde + âmbar para duas séries — a regra do `chart-patterns.md`. Teal é proibido como
   2ª série porque não separa do verde em barra empilhada fina. */
const configBruto = {
  brutoApp: { label: "App MOB", color: "var(--color-chart-1)" },
  brutoCpo: { label: "CPO", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

const configRecargas = {
  recargasApp: { label: "App MOB", color: "var(--color-chart-1)" },
  recargasRoaming: { label: "Roaming", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

const configEnergia = {
  energiaKwh: { label: "Energia", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function AbaVisaoGeral({
  serie,
  serieAnterior: anterior,
}: {
  serie: DiaDoDashboard[];
  serieAnterior: DiaDoDashboard[];
}) {
  const t = totais(serie);
  const tAnterior = totais(anterior);

  const dados = serie.map((d) => ({ ...d, dia: diaCurto(d.data) }));

  const status = carregadoresPorStatus();
  const corrente = carregadoresPorCorrente();
  const ufs = movimentacaoPorUf(serie);

  return (
    /* `pb-pad-6xl`: sem ele o último card encosta no fim do scroll e parece cortado —
       o body do AppShell dá padding, mas o conteúdo alto come o de baixo. */
    <div className="flex flex-col gap-gp-4xl pb-pad-6xl">
      <section aria-label="Indicadores do período">
        {/* 4 colunas e não 6: são OITO KPIs, e com 6 a segunda fila fica com duas
            células esticadas ocupando a largura de seis. 4×2 fecha sem sobra. */}
        <KpiGroup columns={4} divided>
          {KPIS.map((k, indice) => {
            const v =
              k.temDelta === false
                ? null
                : variacao(k.bruto(t), k.bruto(tAnterior));
            const sobe = (v ?? 0) > 0;
            const ruim = v === null ? false : sobe !== k.subirEhBom;
            const Icone = ruim ? AlertTriangle : k.icone;

            return (
              <Kpi
                key={k.id}
                label={k.rotulo}
                /* O vermelho vai num `<span>` INTERNO, não por prop: a cor do slot
                   `value` é do DS, e uma cor declarada mais para dentro vence sem
                   disputar especificidade com ela. Mesma solução de Resumo. */
                value={
                  ruim ? (
                    <span className="text-fg-danger">{k.valor(t)}</span>
                  ) : (
                    k.valor(t)
                  )
                }
                icon={<Icone />}
                tone={ruim ? "danger" : "neutral"}
                hint={v === null ? undefined : "vs. período anterior"}
                className={[
                  AJUSTES_DO_KPI,
                  /* ⚠️ A divisória HORIZONTAL entre as filas é nossa. O `divided` do
                     `KpiGroup` emite `sm:divide-y-0 sm:divide-x`: a partir de `sm` ele
                     separa só na vertical, e com duas filas de quatro as linhas ficam
                     coladas. `divide-y` de volta não serve — em grade ele põe borda no
                     topo de TODOS a partir do 2º, inclusive dentro da mesma fila. Borda
                     só nos quatro da segunda fila é o único recorte correto. */
                  indice >= 4 ? "border-t border-border-subtle" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                delta={
                  v === null ? undefined : (
                    <KpiDelta
                      value={`${sobe ? "+" : "−"}${numero(Math.abs(v), 1)}%`}
                      direction={sobe ? "up" : "down"}
                      tone={ruim ? "danger" : "success"}
                    />
                  )
                }
              />
            );
          })}
        </KpiGroup>
      </section>

      {/* ── Três cards de participação, no desenho da referência que o operador mandou:
             mapa de calor · rosca · rosca. A 1ª versão tinha dois cards, e o de status
             era uma barra de 8px que ele chamou (com razão) de feia.

             A barra virou rosca. Ele havia aceitado mantê-la "porque não tem muito o que
             fazer" — tinha: a barra era ruim por ser fina, não por ser proporção, e a
             mesma proporção numa rosca grossa com legenda lê bem. As três fatias de
             status mantêm as cores SEMÂNTICAS (verde/âmbar/vermelho), não a paleta
             categórica: aqui a cor significa estado, e trocá-la por "3ª categoria"
             apagaria a única informação que a cor carrega nesta tela. ── */}
      <section
        aria-label="Participação da frota"
        className="grid grid-cols-1 items-stretch gap-gp-2xl lg:grid-cols-3"
      >
        <CartaoDeGrafico
          titulo="Movimentação por estado"
          subtitulo={`${ufs.length} estados · ${numero(t.recargas)} recargas`}
          className="h-full"
        >
          <MapaDeMovimentacao
            ufs={ufs.map((u) => ({
              uf: u.uf,
              codigo: u.codigo,
              valor: u.recargas,
              detalhe: `${u.locais} ${u.locais === 1 ? "local" : "locais"}`,
            }))}
            formatar={(v) => numero(v)}
          />
        </CartaoDeGrafico>

        <CartaoDeGrafico
          titulo="Carregadores por corrente"
          subtitulo="Participação por tipo de corrente"
          className="h-full"
        >
          <Rosca
            fatias={corrente}
            formatar={(v) => numero(v)}
            rotuloDoTotal="carregadores"
          />
        </CartaoDeGrafico>

        <CartaoDeGrafico
          titulo="Carregadores por status"
          subtitulo="Estado atual da frota, independente do período"
          className="h-full"
        >
          <Rosca
            fatias={status}
            formatar={(v) => numero(v)}
            rotuloDoTotal="carregadores"
            cores={[COR_DE_STATUS.ok, COR_DE_STATUS.atencao, COR_DE_STATUS.fora]}
          />
        </CartaoDeGrafico>
      </section>

      <RotuloDeSecao>Evolução no período</RotuloDeSecao>

      <CartaoDeGrafico
        titulo="Valor bruto transacionado"
        subtitulo="Reais por dia, separados por origem da recarga"
      >
        <ChartContainer config={configBruto} className="h-[260px] w-full">
          <BarChart data={dados} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            {/* `minTickGap` é o que impede os 16 a 31 rótulos de data de virarem uma
                mancha — o DS usa o mesmo em série densa. */}
            <XAxis
              dataKey="dia"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              /* ⚠️ Sem "R$" no tick: com o prefixo, "R$ 1.05k" não cabe em 48px e o
                 rótulo quebra em duas linhas, desalinhando a escala inteira. A moeda já
                 está no título do card e no tooltip. */
              width={44}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
              }
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Radius só na barra de CIMA do stack — a de baixo arredondada abriria uma
                fresta entre as duas. */}
            <Bar dataKey="brutoApp" stackId="b" fill="var(--color-brutoApp)" />
            <Bar
              dataKey="brutoCpo"
              stackId="b"
              fill="var(--color-brutoCpo)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CartaoDeGrafico>

      <CartaoDeGrafico
        titulo="Recargas"
        subtitulo="Sessões por dia, separadas por origem"
      >
        <ChartContainer config={configRecargas} className="h-[240px] w-full">
          <BarChart data={dados} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="dia"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="recargasApp"
              stackId="r"
              fill="var(--color-recargasApp)"
            />
            <Bar
              dataKey="recargasRoaming"
              stackId="r"
              fill="var(--color-recargasRoaming)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CartaoDeGrafico>

      <CartaoDeGrafico
        titulo="Energia"
        subtitulo="kWh entregues por dia"
      >
        <ChartContainer config={configEnergia} className="h-[240px] w-full">
          <LineChart data={dados} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis
              dataKey="dia"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} width={48} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="energiaKwh"
              type="natural"
              stroke="var(--color-energiaKwh)"
              strokeWidth={2}
              dot={{ fill: "var(--color-energiaKwh)", r: 3 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CartaoDeGrafico>
    </div>
  );
}
