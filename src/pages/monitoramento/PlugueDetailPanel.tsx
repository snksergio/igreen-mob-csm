import { useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  Cable,
  Gauge,
  MapPin,
  Plug,
  PlugZap,
  Radio,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  DatePicker,
  FloatingPanel,
  FloatingPanelSection,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  type DateRange,
} from "@snksergio/design-system";
import { dentroDoPeriodo } from "~/components/periodo";
import {
  GEO_DOS_LOCAIS,
  historicoDoPlugue,
  type Plugue,
} from "./monitoramento-mock";
import { ChipDeStatus, PontoDeConexao } from "./monitoramento-ui";

/**
 * Painel de um plugue — o `Histórico de status` da referência.
 *
 * ## A anatomia é a do `dsgreen-paneldetail-1`
 *
 * ⚠️ **Métrica de painel NÃO é o `Kpi`, e isso é regra do DS, não gosto.** O JSDoc do
 * `MetricaCartoes` no bloco mede: `Kpi size="sm"` dá **172 × 144px por célula**, e num painel
 * isso come a primeira dobra inteira antes de qualquer campo. No painel a métrica é
 * contexto; no dashboard ela é o assunto. A versão anterior desta tela tinha quatro `Kpi` —
 * era o anti-pattern que o bloco nomeia, com o dobro das métricas que a referência mostra.
 *
 * São **duas**, as mesmas da origem: `Disponibilidade` e `ID Plugue`. E sim, um identificador
 * como métrica é estranho — mas ele é o que se lê em voz alta pro suporte, e a origem o
 * destaca por isso. Como card compacto ele custa 68px, não 144; o preço da esquisitice caiu
 * o bastante pra valer a fidelidade.
 *
 * ## Três gramáticas, cada uma com seu trabalho
 *
 * | bloco | forma | por quê |
 * |---|---|---|
 * | Métricas | cards lado a lado (`paneldetail-1`) | responde "como está?" — a pergunta de quem abriu |
 * | Informações | ícone · rótulo · valor (padrão da Gestão de Carga) | responde "quais são os dados?" |
 * | Registro de horário | `Table` do DS | é série, não ficha: mesma pergunta repetida no tempo |
 */

/* ── Métricas ──────────────────────────────────────────────────────────── */

const COR_DO_TOM = {
  brand: "text-fg-brand",
  danger: "text-fg-danger",
  neutro: "text-fg-default",
} as const;

interface Metrica {
  label: string;
  valor: string;
  icone: LucideIcon;
  tom: keyof typeof COR_DO_TOM;
}

/**
 * Cards compactos de métrica — cópia fiel do `MetricaCartoes` do `dsgreen-paneldetail-1`.
 *
 * Duas travas que o bloco documenta e que copiar sem elas quebra:
 *
 * 1. **O número de colunas segue o número de métricas.** Não é responsivo de propósito: num
 *    painel a largura é decidida, não negociada. Acima de 3 a resposta é cortar métrica.
 * 2. **O valor é `body-xl` (18px), não `stat-*`.** O role `stat` começa em 20px, e a 20 o par
 *    ícone + valor não cabe na mesma linha — o ícone é a primeira coisa que quebra.
 */
function MetricaCartoes({ itens }: { itens: Metrica[] }) {
  return (
    <div className="grid grid-cols-1 gap-gp-md sm:grid-cols-2">
      {itens.map(({ icone: Icone, ...m }) => (
        <div
          key={m.label}
          className="flex flex-col gap-gp-2xs rounded-radius-lg border border-border-default bg-bg-surface p-pad-2xl"
        >
          <div className={`flex items-center gap-gp-sm ${COR_DO_TOM[m.tom]}`}>
            <Icone className="size-icon-sm shrink-0" aria-hidden />
            <span className="text-body-xl font-bold leading-none tabular-nums">
              {m.valor}
            </span>
          </div>
          <span className="text-caption-sm text-fg-muted">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Informações ───────────────────────────────────────────────────────── */

/**
 * Linha da ficha: ícone à esquerda, rótulo, valor na coluna da direita.
 *
 * É o `Propriedade` da tela de Gestão de Carga, com a mesma trava: `min-h-form-md` nas DUAS
 * células. Sem isso a linha de texto puro mede 30px contra 36px na que tem `Chip`, e a ficha
 * fica com ritmo irregular.
 */
function Propriedade({
  icone: Icone,
  label,
  valor,
}: {
  icone: LucideIcon;
  label: string;
  valor: ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-form-md items-center gap-gp-md text-body-sm text-fg-muted">
        <Icone className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex min-h-form-md min-w-0 items-center text-body-sm text-fg-default">
        {valor}
      </div>
    </>
  );
}

/* ── Registro de horário ───────────────────────────────────────────────── */

/**
 * Larguras das colunas do log.
 *
 * ⚠️ Constante porque o `Table` do DS posiciona por largura DECLARADA: o `width` da célula
 * tem que ser o MESMO do head, senão as colunas desalinham. É o gotcha que o
 * `dsgreen-paneldetail-3` documenta, e a razão de não escrever o número duas vezes na mão.
 */
const COL_LOG = { quando: 260, status: 160 } as const;

/** Quando a queda passa a merecer vermelho — o mesmo limiar da coluna da tabela. */
const DISPONIBILIDADE_RUIM = 85;

export function PlugueDetailPanel({
  plugue,
  onClose,
}: {
  plugue: Plugue | null;
  onClose: () => void;
}) {
  /* `undefined` = sem recorte explícito, e o mês corrente é o padrão. Mesmo contrato das
     outras telas — ver `~/components/periodo`. */
  const [periodo, setPeriodo] = useState<DateRange | undefined>(undefined);

  const historico = useMemo(
    () => (plugue ? historicoDoPlugue(plugue) : []),
    [plugue],
  );

  const visiveis = useMemo(
    () => historico.filter((r) => dentroDoPeriodo(r.dataHora.slice(0, 10), periodo)),
    [historico, periodo],
  );

  if (!plugue) return null;
  const p = plugue;
  const geo = GEO_DOS_LOCAIS[p.local];
  const ruim = p.disponibilidade < DISPONIBILIDADE_RUIM;

  const metricas: Metrica[] = [
    {
      label: "Disponibilidade",
      valor: `${p.disponibilidade.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%`,
      icone: Gauge,
      tom: ruim ? "danger" : "brand",
    },
    { label: "ID Plugue", valor: p.id, icone: PlugZap, tom: "neutro" },
  ];

  return (
    <FloatingPanel
      open={!!p}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      size="xl"
      resizable
      maximizable
      resizableStorageKey="monitoramento.detail-panel.width"
      /* Obrigatório com `FloatingPanelSection`: a seção cuida do próprio padding e desenha a
         divisória de ponta a ponta. O que não é seção recebe `px-pad-xl` explícito. */
      bodyPadded={false}
      /* ⚠️ O corpo do `FloatingPanel` é `flex-1 min-h-0 overflow-y-auto` e **não** é um flex
         container — então nenhum filho consegue esticar pra ocupar a sobra, e o log ficava
         com 320px fixos e um vão embaixo. Isto o torna coluna flex, e aí o `flex-1 min-h-0`
         do log arma e ele passa a rolar por dentro em vez de deixar espaço morto.

         Escrito como seletor de CLASSE (`div.overflow-y-auto`) e não posicional
         (`div:nth-child(2)`): a ordem dos filhos do `<aside>` muda conforme `resizable` e
         `footer`, a classe não. 📋 Lacuna do DS: falta um `bodyClassName`. */
      className="[&>div.overflow-y-auto]:flex [&>div.overflow-y-auto]:flex-col"
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            Histórico de status
          </span>
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="tabular-nums">{p.id}</span>
            <span className="opacity-50">·</span>
            <ChipDeStatus status={p.status} />
            <PontoDeConexao conectado={p.conectado} />
          </span>
        </div>
      }
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <FloatingPanelSection title="Métricas">
        <MetricaCartoes itens={metricas} />
      </FloatingPanelSection>

      <FloatingPanelSection title="Informações">
        {/* `200px` na coluna do rótulo, o mesmo de Gestão de Carga: `Último status
            reportado` é o rótulo mais longo daqui e pede 158px de texto, mais 16 de ícone
            e 8 de gap. */}
        <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[200px_1fr] sm:items-center">
          <Propriedade icone={MapPin} label="Local" valor={p.local} />
          <Propriedade
            icone={MapPin}
            label="Cidade"
            valor={geo ? `${geo.cidade} / ${geo.uf}` : "–"}
          />
          <Propriedade icone={Building2} label="Empresa" valor={p.empresa} />
          <Propriedade
            icone={Plug}
            label="ID Carregador"
            valor={<span className="tabular-nums">{p.idCarregador}</span>}
          />
          <Propriedade icone={Cable} label="Conector" valor={p.tipoDeConector} />
          <Propriedade
            icone={Zap}
            label="Potência"
            valor={
              <span className="tabular-nums">
                {p.potenciaKw.toLocaleString("pt-BR")} kW
              </span>
            }
          />
          <Propriedade
            icone={Radio}
            label="Estado atual"
            valor={<ChipDeStatus status={p.status} />}
          />
          <Propriedade
            icone={Radio}
            label="Comunicação"
            valor={
              <span className="flex items-center gap-gp-md">
                <PontoDeConexao conectado={p.conectado} />
                {p.conectado ? "Conectado" : "Sem comunicação"}
              </span>
            }
          />
        </div>
      </FloatingPanelSection>

      {/* ⚠️ `flex-1 min-h-0` — é ele que faz o log comer a sobra do painel em vez de deixar
          vão embaixo, e é ele que transfere a rolagem pro log. Só arma por causa do
          `[&>div.overflow-y-auto]:flex-col` lá em cima. */}
      <div className="flex min-h-[220px] flex-1 flex-col gap-gp-xl border-t border-border-default px-pad-xl py-pad-2xl">
        <div className="flex flex-wrap items-center justify-between gap-gp-md">
          <span className="text-body-md font-semibold text-fg-default">
            Registro de horário
          </span>
          {/* Um `DatePicker range`, não os dois campos `Data Inicial`/`Data Final` da
              referência: é o padrão do projeto, e dois campos separados deixam montar
              intervalo invertido, que o range não deixa. */}
          <DatePicker
            mode="range"
            value={periodo}
            onValueChange={setPeriodo}
            placeholder="Mês atual"
            align="end"
            className="w-[150px]"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-radius-lg border border-border-default">
          {visiveis.length === 0 ? (
            <p className="p-pad-4xl text-center text-body-sm text-fg-muted">
              Nenhum registro no período selecionado.
            </p>
          ) : (
            /* `Table` do DS, não `<table>` na unha. A versão anterior era escrita à mão e
               tinha dois defeitos que o componente não tem: o `thead` sticky não carregava
               camada própria e as células passavam POR CIMA dele ao rolar, e a linha ficava
               com ~40px, apertada.

               `density="standard"` = 56px por linha. A escala do `Table` é 40 / 56 / 64 e
               não há tier entre os dois — inventar um padding fora dela seria Tailwind
               literal no lugar de token (Regra 5). */
            <Table density="standard" ariaLabel="Histórico de status do plugue">
              <TableHead>
                <TableHeadCell field="quando" width={COL_LOG.quando}>
                  Registro de horário
                </TableHeadCell>
                <TableHeadCell field="status" width={COL_LOG.status} align="right">
                  Status
                </TableHeadCell>
              </TableHead>
              <TableBody>
                {visiveis.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell field="quando" width={COL_LOG.quando}>
                      <span className="tabular-nums">
                        {new Date(r.dataHora).toLocaleString("pt-BR", {
                          hour12: false,
                        })}
                      </span>
                    </TableCell>
                    <TableCell field="status" width={COL_LOG.status} align="right">
                      <span
                        className={`inline-flex items-center rounded-radius-full px-pad-lg py-pad-2xs text-caption-md font-semibold ${
                          r.tom === "ok"
                            ? "bg-bg-success-muted text-fg-success"
                            : "bg-bg-danger-muted text-fg-danger"
                        }`}
                      >
                        {r.rotulo}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </FloatingPanel>
  );
}
