import { useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  PageHeader,
  presetView,
  type DataTableColumnDef,
  type DataTablePresetView,
} from "@snksergio/design-system";
import { Etiqueta } from "~/pages/transacoes/transacoes-ui";
import {
  CUPONS,
  CUPONS_LISTA,
  ROTULO_STATUS,
  ROTULO_TIPO,
  statusDoCupom,
  type Cupom,
} from "./cupons-mock";
import { StatusChip, TipoChip } from "./cupons-ui";
import { CupomFormPanel } from "./CupomFormPanel";
import { ALTURA_DE_TABELA } from "~/components/altura-de-tabela";

/**
 * Tela de Cupons — medida em `/pt/coupons?page=1` (2026-09-16).
 *
 * ## Os dois filtros do topo sumiram, e isso é a regra do projeto
 *
 * A referência põe dois selects soltos acima da tabela: `Filtrar por tipo de cupom` e
 * `Filtrar por status`. Nenhum dos dois é um controle novo aqui — os dois são colunas, e
 * coluna se filtra pelo motor da própria tabela (L-051):
 *
 * | filtro da origem | aqui |
 * |---|---|
 * | status | **abas de visão** — Todos · Ativos · Agendados · Inativos |
 * | tipo de cupom | **chip de filtro** na barra, pré-declarado e vazio |
 *
 * O ganho não é de espaço: é que os dois passam a mostrar o estado aplicado no mesmo lugar
 * onde se mexe nele, em vez de num select que fica longe da tabela que ele filtra.
 */

function construirColunas(handlers: {
  onEditar: (row: Cupom) => void;
}): DataTableColumnDef<Cupom>[] {
  const data = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return [
    {
      field: "nome",
      headerName: "Nome",
      type: "text",
      isPrimary: true,
      width: 176,
      render: ({ row }) => (
        <span className="font-medium text-fg-default">{row.nome}</span>
      ),
    },
    {
      field: "tipo",
      headerName: "Tipo",
      width: 200,
      /* Chip de filtro pré-declarado: é o que substitui o select "Filtrar por tipo de
         cupom" da referência. `valueGetter` devolve o RÓTULO porque é ele que o usuário lê
         no chip — filtrar por `primeira-recarga` não diria nada a ninguém. */
      enableColumnFilter: true,
      filterType: "select",
      valueGetter: (row) => ROTULO_TIPO[row.tipo],
      render: ({ row }) => <TipoChip tipo={row.tipo} />,
    },
    {
      field: "codigo",
      headerName: "Código",
      type: "text",
      copyable: true,
      width: 148,
      render: ({ row }) => (
        <span className="font-mono text-body-sm text-fg-default">
          {row.codigo}
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 124,
      sortable: true,
      enableColumnFilter: true,
      filterType: "multiSelect",
      /* DERIVADO das datas — ver `statusDoCupom`. É o mesmo valor que as abas filtram. */
      valueGetter: (row) => ROTULO_STATUS[statusDoCupom(row)],
      render: ({ row }) => <StatusChip status={statusDoCupom(row)} />,
    },
    {
      field: "validade",
      headerName: "Validade",
      width: 196,
      valueGetter: (row) => row.inicio.getTime(),
      /* Início e término na MESMA célula: são as duas pontas de um intervalo, e em colunas
         separadas o olho tem que juntá-las de novo. `Sem prazo` no lugar do travessão
         porque um vazio aqui pareceria dado faltando. */
      render: ({ row }) => (
        <span className="tabular-nums text-fg-default">
          {data.format(row.inicio)}
          {row.termino ? (
            <> – {data.format(row.termino)}</>
          ) : (
            <span className="text-fg-muted"> – sem prazo</span>
          )}
        </span>
      ),
    },
    {
      field: "usos",
      headerName: "Utilizações",
      align: "right",
      width: 132,
      sortable: true,
      render: ({ row }) => (
        <span className="tabular-nums text-fg-default">
          {row.usos.toLocaleString("pt-BR")}
          {row.regras.limiteDeUsos !== null && (
            <span className="text-fg-muted">
              {" "}
              / {row.regras.limiteDeUsos.toLocaleString("pt-BR")}
            </span>
          )}
        </span>
      ),
    },
    {
      field: "empresa",
      headerName: "Empresa",
      type: "text",
      width: 116,
      render: ({ row }) => <Etiqueta>{row.empresa}</Etiqueta>,
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      sortable: false,
      hideable: false,
      getActions: ({ row }) => [
        {
          id: "editar",
          label: "Editar cupom",
          icon: <Pencil />,
          onClick: () => handlers.onEditar(row),
        },
      ],
    },
  ];
}

/**
 * As abas de status.
 *
 * ⚠️ `maxViewTabs={4}` porque o default é **3 contando a Default** — com três presets, o
 * terceiro seria cortado em silêncio (o `DataTable` só avisa em DEV). E `operator: "isAnyOf"`
 * porque a coluna é `multiSelect`: com `equals`, o chip aparece aplicado e a tabela não
 * filtra nada.
 */
const VISOES: DataTablePresetView[] = (
  ["ativo", "agendado", "inativo"] as const
).map((s) =>
  presetView({
    id: `preset:${s}`,
    name: `${ROTULO_STATUS[s]}s`,
    filters: [
      { field: "status", operator: "isAnyOf", value: [ROTULO_STATUS[s]] },
    ],
  }),
);

export function CuponsPage() {
  const [emEdicao, setEmEdicao] = useState<Cupom | "novo" | null>(null);

  const colunas = useMemo(
    () => construirColunas({ onEditar: setEmEdicao }),
    [],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Cupons"
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {CUPONS.length} cupons
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Plus />}
            onClick={() => setEmEdicao("novo")}
          >
            {CUPONS_LISTA.novo}
          </Button>
        }
      />

      <DataTable<Cupom>
        rows={CUPONS}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className={ALTURA_DE_TABELA}
        persistId="igreen-mob-cms.cupons"
        defaultViews={VISOES}
        /* Abas fixas: o usuário não cria visão própria aqui (L-054). */
        allowCreateView={false}
        /* Conta a Default — sem isso o terceiro preset é cortado sem aviso em produção. */
        maxViewTabs={4}
        /* O chip de `tipo` nasce visível e vazio: é o que substitui o select da referência,
           e um filtro que só aparece depois de aplicado não se anuncia. */
        showEmptyFilterChips={["tipo"]}
        onRowClick={(row) => setEmEdicao(row)}
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

      <CupomFormPanel cupom={emEdicao} onClose={() => setEmEdicao(null)} />
    </div>
  );
}
