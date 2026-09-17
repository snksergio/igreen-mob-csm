import { useState } from "react";
import { Receipt, TrendingUp } from "lucide-react";
import {
  Avatar,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChipGroup,
  ChipGroupItem,
  Kpi,
  KpiDelta,
  KpiGroup,
  type ChartConfig,
} from "@snksergio/design-system";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  DIAS_DA_SEMANA,
  brl,
  duracaoHm,
  horariosDePico,
  numero,
  rankingDeCarregadores,
  rankingDeLocais,
  rankingDeMotoristas,
  receitaPorOrigem,
  receitaPorTipo,
  totais,
  usoDeCupons,
  variacao,
  type DiaDaSemana,
  type DiaDoDashboard,
} from "./dashboard-mock";
import {
  CartaoDeGrafico,
  ListaDeRanking,
  RotuloDeSecao,
  Rosca,
} from "./dashboard-ui";

/**
 * Aba Financeiro — monetização, comportamento e os três rankings.
 *
 * ## Os blocos da referência foram preservados
 *
 * `Monetização` (uso de cupons + receita por tipo) e `Comportamento` (horários de pico +
 * receita por app) existem com os mesmos nomes e o mesmo conteúdo, porque essa separação
 * vai para validação. O que mudou é a forma de cada peça — ver os comentários.
 *
 * ## Horários de pico: barra vertical, e o dia da semana como filtro local
 *
 * A referência já faz assim, e está certa: "pico" é uma pergunta sobre a hora do dia, e a
 * hora é categoria ordenada — barra é a leitura natural. O seletor de dia fica NO CARD e
 * não no cabeçalho porque ele recorta só este gráfico; subir para o cabeçalho faria
 * parecer que a aba inteira obedece a ele.
 *
 * A coluna de pico é destacada por opacidade, receita do `BarChartDoc` — 24 barras iguais
 * escondem justamente o que o card promete mostrar.
 */

const configPico = {
  recargas: { label: "Recargas", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

export function AbaFinanceiro({
  serie,
  serieAnterior: anterior,
}: {
  serie: DiaDoDashboard[];
  serieAnterior: DiaDoDashboard[];
}) {
  const [dia, setDia] = useState<DiaDaSemana>("QUA");

  const t = totais(serie);
  const tAnterior = totais(anterior);

  const pico = horariosDePico(serie, dia);
  const horaDePico = pico.reduce((a, b) => (b.recargas > a.recargas ? b : a));

  /* Uma chamada por ranking, no corpo — chamá-los dentro do JSX recalcularia a lista
     inteira também para o `subtitulo` que conta os itens. */
  const locais = rankingDeLocais(serie);
  const motoristas = rankingDeMotoristas(serie);
  const carregadores = rankingDeCarregadores(serie);

  const varTicket = variacao(t.ticketMedio, tAnterior.ticketMedio);
  const varPorCarregador = variacao(
    t.brutoPorCarregador,
    tAnterior.brutoPorCarregador,
  );

  return (
    /* `pb-pad-6xl`: sem ele o último bloco encosta no fim do scroll e parece
       cortado — o padding do body do AppShell não alcança conteúdo tão alto. */
    <div className="flex flex-col gap-gp-4xl pb-pad-6xl">
      <section aria-label="Indicadores financeiros">
        {/* Dois KPIs, então `columns={2}` e não a grade de 6 da Visão Geral: com 6 colunas
            declaradas e 2 filhos, as quatro células vazias abrem um vão de 700px. */}
        <KpiGroup columns={2} divided>
          <Kpi
            label="Ticket médio por recarga"
            value={brl(t.ticketMedio)}
            icon={<Receipt />}
            tone="brand"
            hint={varTicket === null ? undefined : "vs. período anterior"}
            delta={
              varTicket === null ? undefined : (
                <KpiDelta
                  value={`${numero(Math.abs(varTicket), 2)}%`}
                  tone={varTicket > 0 ? "success" : "danger"}
                  direction={varTicket > 0 ? "up" : "down"}
                />
              )
            }
          />
          <Kpi
            label="Receita bruta média por carregador"
            value={brl(t.brutoPorCarregador)}
            icon={<TrendingUp />}
            tone="success"
            hint={varPorCarregador === null ? undefined : "vs. período anterior"}
            delta={
              varPorCarregador === null ? undefined : (
                <KpiDelta
                  value={`${numero(Math.abs(varPorCarregador), 2)}%`}
                  tone={varPorCarregador > 0 ? "success" : "danger"}
                  direction={varPorCarregador > 0 ? "up" : "down"}
                />
              )
            }
          />
        </KpiGroup>
      </section>

      <RotuloDeSecao>Monetização</RotuloDeSecao>

      <section
        aria-label="Monetização"
        className="grid grid-cols-1 items-stretch gap-gp-2xl lg:grid-cols-2"
      >
        <CartaoDeGrafico
          titulo="Uso de cupons"
          subtitulo="Recargas por código de cupom"
          className="h-full"
        >
          <Rosca
            fatias={usoDeCupons(serie)}
            formatar={(v) => numero(v)}
            rotuloDoTotal="recargas"
          />
        </CartaoDeGrafico>

        <CartaoDeGrafico
          titulo="Receita bruta por tipo"
          subtitulo="Recarga, ociosidade e ativação"
          className="h-full"
        >
          <Rosca
            fatias={receitaPorTipo(serie)}
            formatar={brl}
            rotuloDoTotal="bruto"
          />
        </CartaoDeGrafico>
      </section>

      <RotuloDeSecao>Comportamento</RotuloDeSecao>

      <section
        aria-label="Comportamento"
        className="grid grid-cols-1 items-stretch gap-gp-2xl lg:grid-cols-3"
      >
        <CartaoDeGrafico
          titulo="Horários de pico"
          subtitulo={`Pico às ${horaDePico.hora}h · ${dia}`}
          className="h-full lg:col-span-2"
          acao={
            <ChipGroup
              type="single"
              value={dia}
              onValueChange={(v) => v && setDia(v as DiaDaSemana)}
              size="sm"
              ariaLabel="Dia da semana"
            >
              {DIAS_DA_SEMANA.map((d) => (
                <ChipGroupItem key={d} value={d}>
                  {d}
                </ChipGroupItem>
              ))}
            </ChipGroup>
          }
        >
          <ChartContainer config={configPico} className="h-[240px] w-full">
            <BarChart data={pico} margin={{ left: 4, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis
                dataKey="hora"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="recargas" radius={[4, 4, 0, 0]}>
                {/* Pico em cheio, resto a 45% — receita do `BarChartDoc`. Com as 24
                    barras na mesma intensidade, achar o pico exige comparar alturas. */}
                {pico.map((p) => (
                  <Cell
                    key={p.hora}
                    fill="var(--color-recargas)"
                    fillOpacity={p.hora === horaDePico.hora ? 1 : 0.45}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CartaoDeGrafico>

        <CartaoDeGrafico
          titulo="Receita bruta por app"
          subtitulo="Aplicativo próprio × roaming"
          className="h-full"
        >
          <Rosca
            fatias={receitaPorOrigem(serie)}
            formatar={brl}
            rotuloDoTotal="bruto"
          />
        </CartaoDeGrafico>
      </section>

      <RotuloDeSecao>Rankings</RotuloDeSecao>

      {/* Local e Motorista LADO A LADO: as duas respondem "quem rende mais", uma por
          ponto e outra por pessoa, e lê-las juntas é a comparação que importa. Em duas
          linhas inteiras, uma sai da vista da outra. */}
      <section
        aria-label="Rankings de receita"
        className="grid grid-cols-1 items-start gap-gp-2xl lg:grid-cols-2"
      >
        <CartaoDeGrafico
          titulo="Receita por local"
          subtitulo={`${locais.length} pontos no período`}
        >
          <ListaDeRanking
            rotulo="Ranking de receita por local"
            alturaMax={420}
            itens={locais.map((l) => ({
              id: l.local,
              titulo: l.local,
              subtitulo: `${l.empresa} · ${numero(l.energiaKwh, 1)} kWh`,
              valor: brl(l.receita),
              apoio: `${numero(l.recargas)} recargas`,
            }))}
          />
        </CartaoDeGrafico>

        <CartaoDeGrafico
          titulo="Motoristas"
          subtitulo="Os 12 que mais gastaram no período"
        >
          <ListaDeRanking
            rotulo="Ranking de motoristas"
            alturaMax={420}
            itens={motoristas.map((m) => ({
              id: m.id,
              figura: (
                <Avatar
                  size="sm"
                  colorHex={corDoAvatar(m.nome)}
                  className="shrink-0"
                  aria-hidden
                >
                  {iniciais(m.nome)}
                </Avatar>
              ),
              titulo: m.nome,
              /* ⚠️ E-mail fictício. A referência lista e-mail e telefone reais aqui. */
              subtitulo: m.email,
              valor: brl(m.totalGasto),
              apoio: `${numero(m.transacoes)} recargas · ${numero(m.energiaKwh, 1)} kWh`,
            }))}
          />
        </CartaoDeGrafico>
      </section>

      {/* Carregadores ocupa a linha inteira: são quatro métricas de apoio por item, e em
          meia largura elas quebrariam em duas linhas. */}
      <CartaoDeGrafico
        titulo="Carregadores"
        subtitulo={`${carregadores.length} equipamentos no período`}
      >
        <ListaDeRanking
          rotulo="Ranking de carregadores"
          alturaMax={460}
          itens={carregadores.map((c) => ({
            id: c.id,
            titulo: c.carregador,
            subtitulo: c.local,
            valor: brl(c.receita),
            apoio: `${numero(c.transacoes)} recargas · ${numero(c.kwhMedio, 1)} kWh/sessão · ${duracaoHm(c.tempoMedioMin)}`,
          }))}
        />
      </CartaoDeGrafico>
    </div>
  );
}
