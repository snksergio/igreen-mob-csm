import { useState, type ReactNode } from "react";
import { MapPin, Receipt, Zap } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  AlertModal,
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Chip,
  FloatingPanel,
  FloatingPanelField,
  FloatingPanelSection,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  type ChartConfig,
} from "@snksergio/design-system";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@snksergio/design-system/shadcn";
import {
  Dinheiro,
  Etiqueta,
  MotoristaCelula,
  StatusChip,
} from "../transacoes-ui";
import type { ItemCobranca, Transacao } from "../transacoes-mock";
import { avisoDeAcao } from "~/components/feedback";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const KWH = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Larguras das colunas da tabela de cobrança.
 *
 * Constante porque o `Table` do DS posiciona por largura DECLARADA: o `width` da célula
 * tem que ser o mesmo do head, senão as colunas desalinham. É o gotcha que o
 * `dsgreen-paneldetail-3` documenta.
 */
const COL_COBRANCA = {
  item: 168,
  preco: 144,
  quantidade: 152,
  valor: 100,
  acao: 100,
} as const;
/**
 * Soma = 664px, e isso é orçamento, não estética.
 *
 * O painel tem 720px; o corpo útil mede 708 (scrollbar) e o bloco da tabela gasta
 * 2 x `pad-xl` de gutter. Medido em 2026-09-16: com 690px de colunas o corpo ganhava
 * **24px de scroll horizontal** — e scroll-x num painel de detalhe é exatamente o que
 * o `size="xl"` existe pra evitar. Ao mexer nestes números, some-os antes.
 */

/**
 * Os 17 campos da referência agrupados em 4 seções.
 *
 * Todos os 17 estão aqui — o agrupamento muda a APRESENTAÇÃO, não o conteúdo. A
 * referência lista os 17 numa grade corrida de duas colunas; em seções colapsáveis a
 * mesma informação fica navegável, que é o padrão do `dsgreen-paneldetail-1`.
 *
 * A ordem DENTRO de cada seção preserva a ordem relativa da referência.
 */
function secoesDe(
  t: Transacao,
): Array<{ titulo: string; campos: Array<{ rotulo: string; valor: ReactNode }> }> {
  /**
   * Número puro: tabular pra alinhar pela casa decimal, sem ênfase de cor.
   *
   * Vazio vira `–` em `fg-subtle`. Sessão em curso não tem término nem motivo, e o mock
   * entrega string vazia de propósito — renderizar o vazio como nada deixaria o campo
   * parecendo quebrado em vez de "ainda não aconteceu".
   */
  const num = (v: string) =>
    v ? (
      <span className="tabular-nums">{v}</span>
    ) : (
      <span className="text-fg-subtle">–</span>
    );
  return [
    {
      titulo: "Transação",
      campos: [
        { rotulo: "ID da transação", valor: num(t.idTransacao) },
        { rotulo: "Valor da transação", valor: <Dinheiro valor={t.valor} /> },
        {
          rotulo: "Cupom",
          valor:
            t.cupomValor === null ? (
              <span className="text-fg-subtle">–</span>
            ) : (
              <span className="flex items-center gap-gp-sm">
                <Chip color="info" variant="soft" size="sm">
                  {t.cupomTipo}
                </Chip>
                <span className="tabular-nums">{BRL.format(t.cupomValor)}</span>
              </span>
            ),
        },
        {
          rotulo: "Motivo",
          valor: t.motivo ? (
            <Etiqueta>{t.motivo}</Etiqueta>
          ) : (
            <span className="text-fg-subtle">–</span>
          ),
        },
      ],
    },
    {
      titulo: "Sessão",
      campos: [
        { rotulo: "Início da transação", valor: num(t.inicioTransacao) },
        { rotulo: "Término da recarga", valor: num(t.terminoRecarga) },
        { rotulo: "Término da transação", valor: num(t.terminoTransacao) },
        { rotulo: "Duração da recarga", valor: num(t.duracaoRecarga) },
        {
          rotulo: "Total de kWh",
          /* Energia em `fg-brand`: é o assunto da tela, e o token de marca é o que o
             `paneldetail-1` usa pro valor que o leitor vem buscar. Dinheiro fica em
             `fg-success` (padrão do finance) — duas cores pra dois papéis, não decoração. */
          valor: (
            <span className="font-semibold tabular-nums text-fg-brand">
              {KWH.format(t.energiaKwh)} kWh
            </span>
          ),
        },
      ],
    },
    {
      titulo: "Local e equipamento",
      campos: [
        { rotulo: "Empresa", valor: <Etiqueta>{t.empresa}</Etiqueta> },
        {
          rotulo: "Local",
          valor: (
            <span className="inline-flex items-center gap-gp-xs [&>svg]:size-icon-xs [&>svg]:text-fg-muted">
              <MapPin />
              {t.local}
            </span>
          ),
        },
        { rotulo: "ID do carregador", valor: num(t.idCarregador) },
        { rotulo: "Código CP", valor: num(t.codigoCP) },
        { rotulo: "ID do conector", valor: num(t.idConector) },
      ],
    },
    {
      titulo: "Motorista e preço",
      campos: [
        {
          rotulo: "Nome do motorista",
          /* Avatar + nome: mesmo tratamento da célula de licenciado do
             `example-finance`. Identidade lê melhor com âncora visual que texto solto. */
          valor: <MotoristaCelula nome={t.motorista} />,
        },
        { rotulo: "Aplicativo", valor: <Etiqueta>{t.aplicativo}</Etiqueta> },
        { rotulo: "Nome do perfil de preço", valor: <Etiqueta>{t.perfilPreco}</Etiqueta> },
      ],
    },
  ];
}

const CONFIG_POTENCIA = {
  potenciaKw: { label: "Potência", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

const CONFIG_CORRENTE = {
  correnteA: { label: "Corrente", color: "var(--color-chart-4)" },
} satisfies ChartConfig;

/**
 * Teto do eixo Y arredondado pra cima, num passo redondo.
 *
 * Existe por causa da L-032: o Recharts 3 omite o tick de borda, e o `domain` máximo
 * tem que ser IGUAL ao maior tick — senão sai uma linha-guia duplicada no topo. Deixar
 * o Recharts inferir o domínio produz exatamente esse defeito.
 */
function tetoEixo(valores: number[], passo: number): number {
  const max = Math.max(...valores, 0);
  return Math.max(passo, Math.ceil(max / passo) * passo);
}

function ticksAte(teto: number, passo: number): number[] {
  const t: number[] = [];
  for (let v = 0; v <= teto; v += passo) t.push(v);
  return t;
}

function GraficoSerie({
  titulo,
  dados,
  chave,
  config,
  unidade,
  passo,
}: {
  titulo: string;
  dados: Array<Record<string, unknown>>;
  chave: "potenciaKw" | "correnteA";
  config: ChartConfig;
  unidade: string;
  passo: number;
}) {
  const valores = dados.map((d) => Number(d[chave]));
  const teto = tetoEixo(valores, passo);

  return (
    /* `Card` do DS com `CardHeader variant="banded"`, não um `<div>` com bg na unha.
       A faixa é exatamente o que a referência mostra, e o componente cobre desde
       2026-08-19 o que os `Panel`/`CardHead` locais do showcase faziam — replicar na
       unha reintroduziria a divergência que eles têm (subtítulo 13px vs 12px). */
    /* `shadow-none`: a base do Card traz `shadow-sh-lg`, que e peso de card de
       dashboard. Dentro de um painel o card e agrupador, nao elemento flutuante — o
       `ring-1` da base ja separa. E o titulo cai pra `text-body-sm`: o `text-title-md`
       do CardTitle competia com o titulo do painel. */
    <Card size="sm" className="gap-gp-lg shadow-none">
      <CardHeader variant="banded">
        {/* `font-semibold` explícito: o preset `text-body-sm` é 13/**500**, e ao trocar
            o `text-title-md` (que já emite 600) o peso cairia junto. Override de peso
            sobre preset é o padrão documentado do DS, não gambiarra. */}
        <CardTitle className="text-body-sm font-semibold">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
      <ChartContainer config={config} className="h-[240px] w-full">
        <LineChart data={dados} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
          {/* Sem `stroke`: a cor vem do token `chart-grid`, reescrito pelo
              ChartContainer. Passar stroke aqui sobrescreveria o token (L-032). */}
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="hora" tickLine={false} axisLine={false} className="text-caption-sm" />
          <YAxis
            /* `interval={0}` e `ticks` explícitos: sem eles o Recharts 3 come o tick
               de borda (o `0`) e o topo ganha uma linha-guia a mais. */
            interval={0}
            ticks={ticksAte(teto, passo)}
            domain={[0, teto]}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => `${v} ${unidade}`}
            className="text-caption-sm"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey={chave}
            type="monotone"
            stroke={`var(--color-${chave})`}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Painel de detalhe da transação — abas Detalhes e Potência/Corrente.
 *
 * Composição de DOIS blocos do DS, porque nenhum sozinho cobre o caso:
 *   · `dsgreen-paneldetail-3` — a largura (`size="xl"`, 720px) e a tabela com o
 *     primitivo `Table` (não o `DataTable`: é série curta escopada no registro).
 *   · `dsgreen-paneldetail-2` — as abas, pros dois conteúdos que crescem.
 *
 * ⚠️ O estorno confirma por `AlertModal`, não por modal montado na unha. É guardrail
 * do DS: ação destrutiva pede confirmação por ele. A referência usa um modal próprio
 * que abre com ~1000px de área vazia — isso é defeito dela, não padrão a copiar.
 */
export function TransacaoDetailPanel({
  transacao,
  onClose,
}: {
  transacao: Transacao | null;
  onClose: () => void;
}) {
  const [aba, setAba] = useState("detalhes");
  const [aEstornar, setAEstornar] = useState<ItemCobranca | null>(null);

  if (!transacao) return null;
  const t = transacao;

  return (
    <>
      <FloatingPanel
        open={!!t}
        onOpenChange={(aberto) => !aberto && onClose()}
        side="right"
        /* `xl` = 720px. Requisito da tabela de cobrança (5 colunas), não preferência —
           em 560px ela viraria scroll horizontal. Mesmo critério do paneldetail-3. */
        size="xl"
        resizable
        maximizable
        resizableStorageKey="transacoes.detail-panel.width"
        /* Obrigatório com `FloatingPanelSection`: a seção gerencia o próprio padding e
           traz divisória de ponta a ponta (regra do `ds:regras` do FloatingPanel). Como
           o body fica sem gutter, o que NÃO é seção — as abas, a tabela de cobrança, os
           cards de gráfico — recebe `px-pad-xl` explícito. */
        bodyPadded={false}
        titleSlot={
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-md font-semibold text-fg-default">
              Detalhes da transação
            </span>
            <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
              <span className="tabular-nums">{t.idTransacao}</span>
              <span className="opacity-50">·</span>
              <StatusChip status={t.status} />
            </span>
          </div>
        }
        footer={
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
        }
      >
        <Tabs value={aba} onValueChange={setAba} fullWidth>
          {/* O gutter vem do PAI, não de `mx` na `TabsList`.
              `fullWidth` dá `w-full` à lista, e `w-full` + `mx-*` soma a margem à
              largura total (`100% + 2x12px`) em vez de encolher — medido: 24px de
              scroll horizontal no corpo do painel, que era exatamente o dobro do
              `pad-xl`. Padding no wrapper não tem esse efeito. */}
          <div className="px-pad-xl pt-pad-xl">
            <TabsList>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="curvas">Potência (kW) / Corrente (A)</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="detalhes" className="flex flex-col">
            {/* As informações vão em SEÇÕES colapsáveis (label : valor), não em tabela.
                Tabela de duas colunas pra 17 campos é grade onde não há grade: cada
                linha tem uma chave e um valor, não um registro. É o padrão do
                `dsgreen-paneldetail-1`, e o que os painéis do VP usam. */}
            {secoesDe(t).map((s) => (
              <FloatingPanelSection key={s.titulo} title={s.titulo}>
                {s.campos.map((c) => (
                  <FloatingPanelField
                    key={c.rotulo}
                    label={c.rotulo}
                    value={c.valor}
                  />
                ))}
              </FloatingPanelSection>
            ))}

            {t.itensCobranca.length > 0 && (
              <div className="flex flex-col gap-gp-md px-pad-xl py-pad-xl">
                {/* Título da seção de cobrança: a tabela sozinha não diz do que é, e o
                    cabeçalho "Item da cobrança" é rótulo de coluna, não de bloco. */}
                <span className="text-title-sm text-fg-default">Itens da cobrança</span>
                <Table density="compact" ariaLabel="Itens da cobrança">
                <TableHead>
                  <TableHeadCell field="item" width={COL_COBRANCA.item}>
                    Item da cobrança
                  </TableHeadCell>
                  <TableHeadCell field="preco" width={COL_COBRANCA.preco}>
                    Preço da unidade
                  </TableHeadCell>
                  <TableHeadCell field="quantidade" width={COL_COBRANCA.quantidade}>
                    Quantidade utilizada
                  </TableHeadCell>
                  <TableHeadCell field="valor" width={COL_COBRANCA.valor} align="right">
                    Valor
                  </TableHeadCell>
                  <TableHeadCell field="acao" width={COL_COBRANCA.acao} align="right">
                    {""}
                  </TableHeadCell>
                </TableHead>
                <TableBody>
                  {t.itensCobranca.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell field="item" width={COL_COBRANCA.item}>
                        {/* Ícone por NATUREZA do item, não decoração: energia é o
                            consumo, taxa é o serviço. Deriva do `id`, que o mock
                            garante ser `energia` | `taxa`. */}
                        <span className="inline-flex items-center gap-gp-sm [&>svg]:size-icon-xs">
                          {item.id === "energia" ? (
                            <Zap className="text-fg-brand" />
                          ) : (
                            <Receipt className="text-fg-muted" />
                          )}
                          {item.item}
                        </span>
                      </TableCell>
                      <TableCell field="preco" width={COL_COBRANCA.preco}>
                        <span className="tabular-nums text-fg-muted">
                          {item.precoUnidade}
                        </span>
                      </TableCell>
                      <TableCell field="quantidade" width={COL_COBRANCA.quantidade}>
                        <span className="tabular-nums text-fg-muted">
                          {item.quantidade}
                        </span>
                      </TableCell>
                      <TableCell field="valor" width={COL_COBRANCA.valor} align="right">
                        <Dinheiro valor={item.valor} />
                      </TableCell>
                      <TableCell field="acao" width={COL_COBRANCA.acao} align="right">
                        <Button
                          variant="outline"
                          color="secondary"
                          size="2xs"
                          onClick={() => setAEstornar(item)}
                        >
                          Estornar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            )}

            {t.itensCobranca.length === 0 && (
              <div className="px-pad-xl py-pad-xl">
                <div className="rounded-radius-base border border-border-subtle bg-bg-subtle px-pad-xl py-pad-lg">
                  <span className="text-body-sm text-fg-muted">
                    Sessão sem cobrança — não houve consumo de energia.
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="curvas"
            className="flex flex-col gap-gp-2xl px-pad-xl pb-pad-xl"
          >
            <GraficoSerie
              titulo="Potência (kW)"
              dados={t.serie as unknown as Array<Record<string, unknown>>}
              chave="potenciaKw"
              config={CONFIG_POTENCIA}
              unidade="kW"
              passo={10}
            />
            <GraficoSerie
              titulo="Corrente (A)"
              dados={t.serie as unknown as Array<Record<string, unknown>>}
              chave="correnteA"
              config={CONFIG_CORRENTE}
              unidade="A"
              passo={30}
            />
          </TabsContent>
        </Tabs>
      </FloatingPanel>

      <AlertModal
        open={!!aEstornar}
        onOpenChange={(aberto) => !aberto && setAEstornar(null)}
        tone="danger"
        title="Confirmar estorno"
        description={
          <span className="flex flex-col gap-gp-md">
            <span className="text-fg-muted">
              Quantia de estorno:{" "}
              <Chip color="danger" variant="soft" size="sm">
                <span className="tabular-nums">
                  {aEstornar ? BRL.format(aEstornar.valor) : ""}
                </span>
              </Chip>
            </span>
            <span>
              Tem certeza de que deseja estornar este item? A ação não poderá ser desfeita.
            </span>
          </span>
        }
        confirmLabel="Confirmar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          avisoDeAcao({
            titulo: "Estorno solicitado",
            detalhe: "O valor volta para a carteira em até 2 dias úteis.",
            tipo: "success",
          });
          setAEstornar(null);
        }}
      />
    </>
  );
}
