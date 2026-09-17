import { useState } from "react";
import {
  Activity,
  CalendarRange,
  Check,
  ChevronDown,
  Hourglass,
  Repeat,
} from "lucide-react";
import { Button, Chip, Kpi, KpiDelta, KpiGroup } from "@snksergio/design-system";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@snksergio/design-system/shadcn";
import {
  JANELAS_DE_DISPONIBILIDADE,
  PISO_DE_DISPONIBILIDADE,
  brl,
  disponibilidadeDaFrota,
  duracaoDhm,
  duracaoHm,
  metricasDeOcupacao,
  numero,
  percentual,
  rankingDeOcupacao,
  variacao,
  type DiaDoDashboard,
  type JanelaId,
} from "./dashboard-mock";
import {
  CartaoDeGrafico,
  FaixaDeDisponibilidade,
  ListaDeRanking,
  RotuloDeSecao,
} from "./dashboard-ui";

/**
 * Aba Carregadores — ocupação e disponibilidade.
 *
 * ## O segundo seletor de período é o único que sobreviveu, e por quê
 *
 * O pedido era unificar os filtros no cabeçalho, e foi feito — menos aqui. Disponibilidade
 * é uma **janela deslizante que termina agora** ("24 horas atrás" → "Agora"), não um
 * intervalo entre duas datas. Aplicar um recorte de 16 dias a uma faixa de 24 blocos daria
 * 16 dias por bloco e o gráfico deixaria de dizer o que promete. Ver o JSDoc de
 * `JANELAS_DE_DISPONIBILIDADE`.
 *
 * ## Ocupação alta é boa; tempo ocioso alto não é
 *
 * Os três KPIs desta aba não seguem "subir é verde". `Tempo médio ocioso` subindo é
 * capacidade parada, e o delta dele é vermelho quando cresce.
 */

export function AbaCarregadores({
  serie,
  serieAnterior: anterior,
}: {
  serie: DiaDoDashboard[];
  serieAnterior: DiaDoDashboard[];
}) {
  const [janela, setJanela] = useState<JanelaId>("24h");

  const m = metricasDeOcupacao(serie);
  const mAnterior = metricasDeOcupacao(anterior);

  const varOcupacao = variacao(m.ocupacaoMedia, mAnterior.ocupacaoMedia);
  const varOcioso = variacao(m.ociosoMin, mAnterior.ociosoMin);
  const varSessoes = variacao(m.sessoesPorDia, mAnterior.sessoesPorDia);

  const ocupacao = rankingDeOcupacao(serie);
  const frota = disponibilidadeDaFrota(janela);
  const rotuloDaJanela =
    JANELAS_DE_DISPONIBILIDADE.find((j) => j.id === janela)?.rotulo ?? "";
  const baixa = frota.filter(
    (c) => c.disponibilidade < PISO_DE_DISPONIBILIDADE,
  );
  const media =
    frota.reduce((a, c) => a + c.disponibilidade, 0) / (frota.length || 1);

  const pilula = (v: number | null, subirEhBom: boolean) =>
    v === null ? undefined : (
      <KpiDelta
        value={`${numero(Math.abs(v), 2)}%`}
        tone={v > 0 === subirEhBom ? "success" : "danger"}
        direction={v > 0 ? "up" : "down"}
      />
    );

  return (
    /* `pb-pad-6xl`: sem ele o último bloco encosta no fim do scroll e parece
       cortado — o padding do body do AppShell não alcança conteúdo tão alto. */
    <div className="flex flex-col gap-gp-4xl pb-pad-6xl">
      <section aria-label="Indicadores de ocupação">
        <KpiGroup columns={3} divided>
          <Kpi
            label="Taxa de ocupação média"
            value={percentual(m.ocupacaoMedia)}
            icon={<Activity />}
            tone="brand"
            hint="vs. período anterior"
            delta={pilula(varOcupacao, true)}
          />
          <Kpi
            label="Tempo médio ocioso"
            value={duracaoHm(m.ociosoMin)}
            icon={<Hourglass />}
            tone="warning"
            hint="vs. período anterior"
            /* ⚠️ Subir é PIOR: é capacidade parada entre uma sessão e a próxima. */
            delta={pilula(varOcioso, false)}
          />
          <Kpi
            label="Sessões/carregador/dia"
            value={numero(m.sessoesPorDia, 2)}
            icon={<Repeat />}
            tone="info"
            hint="vs. período anterior"
            delta={pilula(varSessoes, true)}
          />
        </KpiGroup>
      </section>

      <RotuloDeSecao>Ocupação</RotuloDeSecao>

      <CartaoDeGrafico
        titulo="Ranking de ocupação de carregadores"
        subtitulo="Percentual do tempo do período com sessão ativa"
      >
        <ListaDeRanking
          rotulo="Ranking de ocupação de carregadores"
          alturaMax={460}
          itens={ocupacao.map((l) => ({
            id: l.id,
            titulo: l.carregador,
            subtitulo: l.local,
            valor: percentual(l.ocupacao),
            apoio: `${numero(l.energiaKwh, 1)} kWh · ${brl(l.receita)}`,
          }))}
        />
      </CartaoDeGrafico>

      <RotuloDeSecao>Disponibilidade dos carregadores</RotuloDeSecao>

      {/* Os dois KPIs ocupam a LINHA INTEIRA, como os três de cima — eles são
          indicadores do mesmo tipo e meia largura os rebaixaria a legenda do filtro. */}
      <section aria-label="Resumo de disponibilidade">
        <KpiGroup columns={2} divided>
          <Kpi
            label="Disponibilidade média"
            value={percentual(media)}
            tone={media >= PISO_DE_DISPONIBILIDADE ? "success" : "warning"}
            hint={rotuloDaJanela}
          />
          <Kpi
            label="Com disponibilidade baixa"
            value={numero(baixa.length)}
            tone={baixa.length ? "danger" : "success"}
            hint={`Abaixo de ${PISO_DE_DISPONIBILIDADE}% na janela`}
          />
        </KpiGroup>
      </section>

      {/* ⚠️ Menu, não segmento — e ABAIXO dos KPIs, não flutuando no canto deles.
          Eram dois `ChipGroupItem` no canto superior direito; com seis opções eles
          ocupariam a faixa toda, e o controle parecia legenda dos KPIs em vez de filtro
          da lista que vem depois. O gatilho copia o do `DatePicker` do cabeçalho
          (ícone + rótulo + chevron) porque os dois fazem a mesma coisa: recortar tempo. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            color="secondary"
            size="md"
            iconLeft={<CalendarRange />}
            iconRight={<ChevronDown />}
            className="w-fit"
          >
            {rotuloDaJanela}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {JANELAS_DE_DISPONIBILIDADE.map((j) => (
            <DropdownMenuItem key={j.id} onClick={() => setJanela(j.id)}>
              {/* Espaço reservado para o ✓ mesmo sem seleção: sem ele, os rótulos
                  dançam 20px para a direita quando o item vira o escolhido. */}
              <span className="grid w-[16px] shrink-0 place-items-center">
                {janela === j.id && (
                  <Check className="size-icon-2xs text-fg-brand" aria-hidden />
                )}
              </span>
              {j.rotulo}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Uma faixa por carregador, o pior primeiro. A ordem é o que faz a lista valer:
          ordenada por local, quem está fora ficaria no meio de 25 barras verdes. */}
      <div className="flex flex-col gap-gp-2xl">
        {frota.map((c) => (
          <CartaoDeGrafico
            key={c.id}
            titulo={c.local}
            subtitulo={c.carregador}
            acao={
              <div className="flex shrink-0 items-center gap-gp-2xl">
                {c.offlineAgora && (
                  <Chip color="danger" variant="soft" size="sm" shape="pill">
                    Offline agora
                  </Chip>
                )}
                <span className="flex flex-col items-end">
                  <span className="text-caption-sm uppercase tracking-[0.04em] text-fg-subtle">
                    Quedas
                  </span>
                  <span className="text-body-sm font-semibold tabular-nums text-fg-default">
                    {c.quedas}
                  </span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="text-caption-sm uppercase tracking-[0.04em] text-fg-subtle">
                    Tempo offline
                  </span>
                  <span className="text-body-sm font-semibold tabular-nums text-fg-default">
                    {duracaoDhm(c.offlineMin)}
                  </span>
                </span>
              </div>
            }
          >
            <div className="flex flex-col gap-gp-md">
              <FaixaDeDisponibilidade blocos={c.blocos} />
              <div className="flex items-center justify-between text-caption-sm text-fg-muted">
                <span>{rotuloDaJanela.replace("Últim", "Últim")}</span>
                <span className="text-fg-brand">Agora</span>
              </div>
            </div>
          </CartaoDeGrafico>
        ))}
      </div>
    </div>
  );
}
