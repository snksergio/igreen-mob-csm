import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import {
  Chip,
  DataTable,
  PageHeader,
  presetView,
  type DataTableColumnDef,
  type DataTablePresetView,
} from "@snksergio/design-system";
import {
  ALERTAS,
  ALERTAS_LISTA_TEXTOS,
  COR_DO_TIPO,
  ROTULO_DA_SITUACAO,
  TIPOS_OBSERVADOS,
  alertasAtivos,
  carimbo,
  contagemPorTipo,
  duracaoEmMinutos,
  duracaoLegivel,
  type Alerta,
} from "./alertas-lista-mock";
import { AlertaDetailPanel } from "./AlertaDetailPanel";
import {
  ALTURA_DE_TABELA,
  RAIZ_DE_PAGINA,
} from "~/components/altura-de-tabela";

/**
 * Tela de Alertas — a lista ao vivo, medida em `/pt/alerts` (2026-09-16).
 *
 * ## As dez colunas da origem em oito, sem scroll horizontal
 *
 * A referência tem dez colunas e resolve com scroll lateral. Com 1100px úteis, três
 * decisões:
 *
 * | origem | aqui | por quê |
 * |---|---|---|
 * | `Empresa` + `Local` | uma coluna, empresa como sub-linha | há uma empresa só no mock, e ela nunca é o que se procura — é contexto do local |
 * | `Nome do carregador` + `ID do carregador` | uma coluna, ID como sub-linha | o par identifica UMA coisa; separá-los custa 150px pra repetir a mesma resposta |
 * | `Término` | só no painel | é redundante com `Duração`, e duração é a forma em que a pergunta vem ("ficou fora quanto tempo?") |
 *
 * O que sobrou entra em 1110px exatos, medidos.
 *
 * ## O resumo do período no topo
 *
 * Acréscimo nosso, no bloco `kpi/detail` do Design System. A referência abre direto na
 * tabela, e com 67 ocorrências a primeira página não diz se o dia teve um problema
 * recorrente ou vários espalhados — que é a primeira pergunta de quem abre esta tela.
 *
 * ⚠️ Os campos do card **não são filtro clicável**, de propósito: o filtro nativo da
 * coluna `Alerta` já faz esse recorte, e dois caminhos pro mesmo resultado é o defeito
 * que a L-051 previne. Ver `ResumoDoPeriodo`.
 *
 * ## As duas visões
 *
 * `Ativos` (o que ainda está acontecendo) e `Indisponibilidade` (os três tipos que tiram o
 * ponto do ar). São os dois recortes que alguém pede sem ter um carregador em mente.
 */

/**
 * Os tipos que efetivamente tiram o ponto do ar — os mesmos `TIPOS_CRITICOS` de
 * Configurar alertas.
 *
 * ⚠️ A 1ª versão derivava disto uma coluna `Gravidade` só pra a visão ter um campo
 * textual pra filtrar. Custava 150px dos 1100 úteis — a soma dava 1300, o `autoFit`
 * espremia todo mundo e a coluna `Plugue` truncava o identificador em 13px (medido).
 * A visão filtra a coluna `Alerta` com `isAnyOf` nos três tipos e diz exatamente o
 * mesmo, sem coluna nenhuma: o recorte já estava expresso no dado.
 */
const TIPOS_INDISPONIBILIDADE = [
  "Offline",
  "Com falha",
  "Conector indisponível",
];

const VISOES: DataTablePresetView[] = [
  presetView({
    id: "preset:ativos",
    name: "Ativos",
    filters: [
      {
        field: "situacao",
        operator: "isAnyOf",
        value: [ROTULO_DA_SITUACAO.ativo],
      },
    ],
  }),
  presetView({
    id: "preset:indisponibilidade",
    name: "Indisponibilidade",
    filters: [
      {
        field: "tipo",
        operator: "isAnyOf",
        value: TIPOS_INDISPONIBILIDADE,
      },
    ],
  }),
];

/**
 * ⚠️ As oito larguras são MEDIDAS contra os 1100px úteis e somam exatamente 1100:
 * `206 + 176 + 110 + 150 + 146 + 106 + 110 + 96`. Mexer numa exige tirar de outra —
 * com a soma acima do útil, o `autoFit` espreme todas e o que trunca primeiro é o
 * identificador do plugue, que é justamente o que alguém copia.
 */
function construirColunas(
  onVer: (a: Alerta) => void,
): DataTableColumnDef<Alerta>[] {
  return [
    {
      field: "local",
      headerName: "Local",
      type: "text",
      isPrimary: true,
      width: 206,
      enableColumnFilter: true,
      filterType: "multiSelect",
      render: ({ row }) => (
        <span className="flex min-w-0 flex-col">
          {/* Sem elipse, como no resto do projeto: nome de local cortado leva equipe ao
              ponto errado. Quebra em duas linhas e a densidade comporta. */}
          <span className="block whitespace-normal break-words text-body-sm leading-snug text-fg-default">
            {row.local}
          </span>
          <span className="truncate text-caption-sm text-fg-muted">
            {row.empresa}
          </span>
        </span>
      ),
    },
    {
      field: "carregador",
      headerName: "Carregador",
      width: 176,
      render: ({ row }) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-medium text-fg-default">
            {row.carregador}
          </span>
          <span className="truncate text-caption-sm tabular-nums text-fg-muted">
            {row.idCarregador}
          </span>
        </span>
      ),
    },
    {
      field: "plugue",
      headerName: "Plugue",
      width: 110,
      copyable: true,
      render: ({ row }) => (
        <span className="tabular-nums text-fg-muted">{row.plugue}</span>
      ),
    },
    {
      field: "tipo",
      headerName: "Alerta",
      width: 150,
      enableColumnFilter: true,
      filterType: "multiSelect",
      render: ({ row }) => (
        <Chip
          color={COR_DO_TIPO[row.tipo] ?? "neutral"}
          variant="soft"
          size="sm"
          shape="pill"
        >
          {row.tipo}
        </Chip>
      ),
    },
    {
      field: "inicio",
      headerName: "Início",
      width: 146,
      render: ({ row }) => {
        const c = carimbo(row.inicio);
        return (
          <span className="flex min-w-0 flex-col tabular-nums">
            <span className="text-body-sm text-fg-default">{c.data}</span>
            <span className="text-caption-sm text-fg-muted">{c.hora}</span>
          </span>
        );
      },
    },
    {
      field: "duracao",
      headerName: "Duração",
      align: "right",
      width: 106,
      /* Ordena pelo NÚMERO, não pelo texto: por texto, "9min" viria depois de "2h 29min".
         O render é que formata. */
      valueGetter: (row) => duracaoEmMinutos(row),
      render: ({ row }) => (
        <span
          className={`tabular-nums ${
            row.situacao === "ativo"
              ? "font-semibold text-fg-danger"
              : "text-fg-muted"
          }`}
        >
          {duracaoLegivel(row)}
        </span>
      ),
    },
    {
      field: "situacao",
      headerName: "Status",
      width: 110,
      enableColumnFilter: true,
      filterType: "select",
      valueGetter: (row) => ROTULO_DA_SITUACAO[row.situacao],
      render: ({ row }) => (
        <Chip
          color={row.situacao === "ativo" ? "danger" : "success"}
          variant="soft"
          size="sm"
          shape="pill"
        >
          {ROTULO_DA_SITUACAO[row.situacao]}
        </Chip>
      ),
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      align: "right",
      width: 96,
      sortable: false,
      getActions: ({ row }) => [
        {
          id: "ver",
          label: "Ver detalhes do alerta",
          icon: <Eye />,
          onClick: () => onVer(row),
        },
      ],
    },
  ];
}

/**
 * Resumo do período — o bloco `kpi/detail` ("Detail strip") do Design System,
 * transcrito: uma faixa de campos, cada um com rótulo em caixa alta acima e, abaixo, uma
 * barra vertical colorida ao lado do valor. Sem o cabeçalho do bloco — ver o comentário
 * no corpo pro porquê dos três desvios.
 *
 * ## Por que ele, e não a fileira de chips que estava aqui
 *
 * A 1ª versão eram cinco pastilhas soltas acima da tabela — cada uma um card em
 * miniatura, todas com peso visual igual ao das abas de visão logo abaixo, e nenhuma
 * moldura dizendo que as cinco são **uma coisa só**. O bloco do DS resolve os três: uma
 * superfície, um título que nomeia o conjunto, e o rótulo acima do valor em vez de ao
 * lado — o que deixa varrer só a linha dos números.
 *
 * ## A cor da barra NÃO é a rampa de gráfico do bloco original
 *
 * ⚠️ O `kpi/detail` pinta os campos com `chart-1..5` porque "Total projects" e "Tax ID"
 * não têm semântica — a cor ali só separa. Aqui o tipo **já tem cor**, e é a mesma do
 * chip da coluna `Alerta` logo abaixo. Trocar por azul/âmbar/violeta quebraria a única
 * associação que a tela ensina: a cor identifica a gravidade, não a posição no card.
 *
 * Que três barras saiam vermelhas iguais é informação, não repetição: são exatamente os
 * três tipos que a visão `Indisponibilidade` recorta.
 *
 * ## O sexto campo
 *
 * No bloco original é `Client Status` com um chip. Aqui é a situação do período — o
 * único campo que muda de cor conforme o valor, porque é o único que pede ação.
 */
function TokenDaCor(cor: string): string {
  return cor === "danger"
    ? "var(--color-fg-danger)"
    : cor === "warning"
      ? "var(--color-fg-warning)"
      : cor === "info"
        ? "var(--color-fg-info)"
        : "var(--color-fg-subtle)";
}

function ResumoDoPeriodo() {
  const contagens = contagemPorTipo();
  const ativos = alertasAtivos();

  return (
    /* As classes do `Panel` do bloco, transcritas: ele é helper local de
       `KpiDoc.tsx` (`src/preview/pages/`), não API pública — não está no barrel nem no
       registry, então não chega por npm. O que viaja é o desenho, feito de tokens.

       Três desvios do bloco original, todos pedidos pelo operador (2026-09-16) e todos
       pela mesma razão — aqui o card é ACESSÓRIO da tabela, não o conteúdo da tela:

       · **sem cabeçalho.** No bloco, "Company Details" nomeia um card que vive sozinho.
         Aqui os seis rótulos já dizem o que são, e o título custava ~44px de altura
         acima da tabela pra repetir o que a página inteira é.
       · **`shadow-sh-sm` no lugar de `shadow-sh-lg`.** O `lg` é `0 8px 24px / 0.3` e
         projetava o card à frente da tabela, que é o conteúdo. O `sm` é exatamente o que
         o `Table` do DS usa (`table.styles.ts:16`), então os dois passam a flutuar na
         mesma altura.
       · **`mb-[4px]`** sobre o `gap-gp-2xl` do container: 4px a mais de folga separando
         o resumo da grade. Valor solto porque é ajuste fino de um caso, não um degrau
         novo de espaçamento — um token para 4px de exceção seria escala por acidente. */
    <div className="mb-[4px] w-full rounded-radius-lg bg-bg-surface p-pad-4xl text-body-md text-fg-default shadow-sh-sm ring-1 ring-fg-default/5 dark:ring-fg-default/10">
      <div className="grid grid-cols-2 gap-y-pad-4xl sm:grid-cols-3 lg:grid-cols-6">
        {contagens.map(({ tipo, total }) => (
          <div key={tipo} className="flex flex-col gap-gp-2xs pl-pad-md">
            <p className="text-caption-sm uppercase tracking-[0.04em] text-fg-subtle">
              {tipo}
            </p>
            <span className="flex items-center gap-gp-md">
              <span
                className="h-[16px] w-[3px] shrink-0 rounded-radius-full"
                style={{ background: TokenDaCor(COR_DO_TIPO[tipo] ?? "neutral") }}
                aria-hidden
              />
              <span className="text-body-md font-semibold tabular-nums text-fg-default">
                {total} {total === 1 ? "alerta" : "alertas"}
              </span>
            </span>
          </div>
        ))}

        <div className="flex flex-col gap-gp-2xs">
          <p className="text-caption-sm uppercase tracking-[0.04em] text-fg-subtle">
            Situação
          </p>
          <span>
            <Chip
              color={ativos > 0 ? "danger" : "success"}
              variant="soft"
              size="sm"
              shape="pill"
            >
              {ativos === 0
                ? "Tudo resolvido"
                : `${ativos} ${ativos === 1 ? "ativo" : "ativos"}`}
            </Chip>
          </span>
        </div>
      </div>
    </div>
  );
}

export function AlertasListaPage() {
  const [detalhe, setDetalhe] = useState<Alerta | null>(null);

  const colunas = useMemo(() => construirColunas(setDetalhe), []);

  return (
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Alertas"
        description={ALERTAS_LISTA_TEXTOS.aviso}
        /* Só o total: a contagem de ativos saiu daqui quando o card de resumo passou a
           dar o mesmo número com espaço pra dizer o que ele significa. Repetir os dois
           faria o leitor conferir se batem. */
        badge={
          <Chip color="neutral" variant="soft" size="sm" shape="rounded">
            {ALERTAS.length} no período
          </Chip>
        }
      />

      <ResumoDoPeriodo />

      <DataTable<Alerta>
        rows={ALERTAS}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className={ALTURA_DE_TABELA}
        persistId="igreen-mob-cms.alertas-lista"
        defaultViews={VISOES}
        allowCreateView={false}
        showEmptyFilterChips={["tipo", "situacao"]}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
        }}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <AlertaDetailPanel alerta={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}

/** Reexportado só pra o teste do mock não precisar redeclarar a lista. */
export { TIPOS_OBSERVADOS };
