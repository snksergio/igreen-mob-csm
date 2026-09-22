import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  PlugZap,
  Receipt,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  DatePicker,
  Kpi,
  KpiDelta,
  KpiGroup,
  PageHeader,
  type DateRange,
} from "@snksergio/design-system";
import { dentroDoPeriodo, rotuloDoPeriodo } from "~/components/periodo";
import { construirColunas } from "~/pages/transacoes/transacoes-columns";
import { TRANSACOES_MOCK, type Transacao } from "~/pages/transacoes/transacoes-mock";
import { TransacaoDetailPanel } from "~/pages/transacoes/sections/TransacaoDetailPanel";
import { RESUMO_TEXTOS, indicadoresDoResumo } from "./resumo-mock";

/**
 * Tela de Resumo — medida em `/pt/resume?period=thisMonth&page=1` (2026-09-16).
 *
 * ## É a tela de Transações com um cabeçalho de indicadores
 *
 * A tabela, as colunas e o painel de detalhe são os MESMOS componentes de Transações —
 * importados, não copiados. A origem também repete a mesma grade nas duas telas, e duas
 * cópias divergiriam no primeiro ajuste de coluna: o operador veria a mesma transação com
 * formatação diferente dependendo de por onde entrou.
 *
 * O que Resumo tem a mais são os cinco KPIs. O que ele tem a menos são as visões salvas: em
 * Transações elas recortam por status, e aqui o recorte é o PERÍODO — abas de status sobre
 * um resumo diriam "resumo de um pedaço", que é o oposto do que a tela é.
 *
 * ## Os KPIs saem da tabela, não de constantes
 *
 * Mudar o período muda os cinco números junto com as linhas. Um KPI fixo num resumo é a
 * pior espécie de número errado: ele parece autoridade, e quem confere acha que a tabela é
 * que está errada. Ver o JSDoc de `resumo-mock`.
 */

const ICONES = {
  carregador: PlugZap,
  dinheiro: Wallet,
  energia: Zap,
  clientes: Users,
  transacoes: Receipt,
} as const;

/**
 * Os três ajustes de anatomia que o `Kpi` do DS não expõe como prop.
 *
 * Todos escritos como seletor de descendente **de propósito**: `[&>header>span]` tem
 * especificidade (0,1,2) e vence o `.rounded-radius-lg` (0,1,0) do `iconBox`. Uma classe
 * solta no `className` da raiz NÃO venceria — com prefixo DS o `tailwind-merge` não
 * reconhece o conflito, as duas sobrevivem e a ordem do CSS decide (L-072 do DS). Já
 * aconteceu neste projeto, e o sintoma é o pior possível: funciona no dev e some depois.
 *
 * | ajuste | por quê |
 * |---|---|
 * | `rounded-radius-full` no ícone | o DS entrega `rounded-radius-lg`; o padrão da tela é círculo |
 * | `-mt-gp-xs` no bloco do valor | −4px no respiro entre o título e o número, o teto que você pediu |
 *
 * ⚠️ O `-mt` não disputa com o `gap-gp-lg` da raiz — em flex, gap e margin SOMAM. Por isso
 * ele encolhe de 10 pra 6px de forma determinística, sem depender de ordem de CSS.
 *
 * 📋 **Lacuna do DS** (não corrigida aqui — mexer no DS é cascata e exige autorização):
 * `Kpi` não tem `iconShape` nem `density`. Duas telas quererem círculo é o sinal de que a
 * forma do `iconBox` devia ser prop, não constante.
 */
const AJUSTES_DO_KPI =
  "[&>header>span]:rounded-radius-full [&>div:first-of-type]:-mt-gp-xs";

export function ResumoPage() {
  const [detalhe, setDetalhe] = useState<Transacao | null>(null);
  /* `undefined`, não `mesCorrente()`: o `DatePicker` mostra o placeholder enquanto não há
     seleção explícita, e "nenhuma seleção" É o estado em que o recorte é o mês atual. */
  const [periodo, setPeriodo] = useState<DateRange | undefined>(undefined);

  const colunas = useMemo(
    () => construirColunas({ onVerDetalhes: setDetalhe }),
    [],
  );

  const linhas = useMemo(
    () => TRANSACOES_MOCK.filter((t) => dentroDoPeriodo(t.data, periodo)),
    [periodo],
  );

  /* Recalculado a cada mudança de período — é o que liga os cards à tabela. */
  const indicadores = useMemo(() => indicadoresDoResumo(linhas), [linhas]);

  const rotuloPeriodo = useMemo(() => rotuloDoPeriodo(periodo), [periodo]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Resumo"
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {linhas.length} {linhas.length === 1 ? "transação" : "transações"}
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Download />}
          >
            {RESUMO_TEXTOS.baixarDados}
          </Button>
        }
      />

      {/* ── Indicadores ──────────────────────────────────────────────────────
          `KpiGroup divided`: UM card com divisórias, não cinco cards soltos. Os cinco são
          faces do mesmo período, e cinco molduras os fariam parecer cinco fontes.

          ⚠️ `divided` já transforma os filhos em `plain` — empilhar `Kpi` dentro de outro
          card pra conseguir o mesmo efeito é o anti-pattern que o `USAGE.md` do componente
          nomeia. */}
      {/* Mesma correção do Dashboard, e aqui era pior: cinco colunas a 1024px dão
          138px cada, e "686,28 kWh" precisa de 143px — quebrava sempre. Três colunas
          entre 1024 e 1280, cinco a partir daí. */}
      <KpiGroup columns={5} divided className="lg:grid-cols-3 xl:grid-cols-5">
        {indicadores.map((i) => {
          /* ⚠️ "Ruim" é a variação contra o `subirEhBom`, NÃO o sinal do percentual.
             Derivar da seta quebraria no primeiro indicador em que subir é ruim — um
             "tempo médio de espera +12%" pintado de verde. É o gotcha que o `USAGE.md`
             do `Kpi` nomeia, e é por isso que `subirEhBom` existe no mock. */
          const ruim = i.variacao ? i.variacao.sobe !== i.subirEhBom : false;
          /* Cinco tons diferentes transformavam o cabeçalho num semáforo sem semântica:
             se tudo é destaque, nada é. Neutro é o repouso, e o vermelho fica reservado
             pro que exige atenção — que é o único que o olho precisa achar sozinho. */
          const Icone = ruim ? AlertTriangle : ICONES[i.icone];
          return (
            <Kpi
              key={i.id}
              label={i.label}
              /* O valor em vermelho vai num `<span>` interno, não por prop: a cor do slot
                 `value` é do DS, e uma cor declarada MAIS PARA DENTRO vence sem disputar
                 especificidade com ele. */
              value={
                ruim ? (
                  <span className="text-fg-danger">{i.valor}</span>
                ) : (
                  i.valor
                )
              }
              hint={i.detalhe}
              icon={<Icone />}
              tone={ruim ? "danger" : "neutral"}
              className={AJUSTES_DO_KPI}
              delta={
                i.variacao ? (
                  <KpiDelta
                    value={`${i.variacao.sobe ? "+" : "−"}${i.variacao.pct.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%`}
                    direction={i.variacao.sobe ? "up" : "down"}
                    tone={ruim ? "danger" : "success"}
                  />
                ) : undefined
              }
            />
          );
        })}
      </KpiGroup>

      <DataTable<Transacao>
        rows={linhas}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className="flex-1 min-h-0"
        persistId="igreen-mob-cms.resumo"
        allowCreateView={false}
        /* ── Filtros abertos, sem visões ─────────────────────────────────────
           Três chips pré-declarados e vazios: eles aparecem na barra já montados, e um
           clique escolhe o valor. É o motor nativo do `DataTable`, não um form acima da
           grade (L-051) — e é o que substitui as abas de visão, que aqui não cabem.

           ⛔ TRÊS é o teto, e não é gosto: cada chip come largura da MESMA linha onde
           moram a busca, o período e os ícones de coluna/densidade/exportar. O quarto
           empurra a busca pra fora em 1440px, que é a largura em que esta tela foi medida.

           Os três escolhidos são os que recortam um resumo — LUGAR, EQUIPAMENTO e
           DESFECHO. Ficaram de fora `empresa` (uma só no escopo, chip sempre com uma
           opção) e `motorista` (é busca, não filtro: ninguém escolhe um nome numa lista
           de 10 quando pode digitar). */
        showEmptyFilterChips={["local", "carregador", "status"]}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          /* Sem visões salvas aqui — ver o JSDoc. A aba única ganha nome próprio, padrão
             deste projeto. */
          title: "Transações do período",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
          /* Mesmo seletor de Transações, com as mesmas três decisões: `title` no wrapper
             (o `DatePicker` não repassa `title`), `w-[150px]` travado (o label cresce de
             9 pra 39 caracteres quando há período escolhido e empurraria a busca pra
             fora) e `align="end"` pro calendário não vazar à esquerda. */
          customLeft: (
            <span title={rotuloPeriodo}>
              <DatePicker
                mode="range"
                value={periodo}
                onValueChange={setPeriodo}
                placeholder="Mês atual"
                align="end"
                className="w-[150px]"
              />
            </span>
          ),
        }}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      {/* O MESMO painel de Transações — ver o JSDoc. */}
      <TransacaoDetailPanel
        transacao={detalhe}
        onClose={() => setDetalhe(null)}
      />
    </div>
  );
}
