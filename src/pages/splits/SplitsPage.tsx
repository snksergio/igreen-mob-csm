import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  AlertModal,
  Chip,
  DataTable,
  PageHeader,
  type DataTableColumnDef,
} from "@snksergio/design-system";
import { avisoDeExcluido } from "~/components/feedback";
import {
  ROTULO_CURTO_DO_NIVEL,
  SPLITS,
  SPLITS_TEXTOS,
  locaisAlcancados,
  percentual,
  restante,
  totalDistribuido,
  type Split,
} from "./splits-mock";
import { ChipDeNivel, ChipDeSituacao } from "./splits-ui";
import { SplitDetailPanel } from "./SplitDetailPanel";
import { SplitFormPanel } from "./SplitFormPanel";

/**
 * Tela de Splits — medida em `/pt/financial/split?page=1` (2026-09-17).
 *
 * ## A lista da origem tem três colunas e nenhuma informação
 *
 * `Empresa` · `Local` · `Ações`, com uma linha só: `PV MOB` · `39 locais` · `Editar`. Nada
 * ali responde o que se pergunta antes de abrir um split — **quanto já está distribuído, e
 * para quantos**. O operador chamou isso de "sem nenhuma informação", e é literal.
 *
 * As colunas aqui:
 *
 * | coluna | por quê |
 * |---|---|
 * | **Split** | o local, ou a empresa quando é nível empresa |
 * | **Nível** | empresa × local — decide a ORDEM dos cortes, então é coluna, não legenda |
 * | **Abrangência** | `Todos os 17 locais` ou o nome do ponto — total × pontual é diferença categórica |
 * | **Beneficiários** | quantos dividem. Zero é um estado real, e é o que denuncia split criado e esquecido |
 * | **Distribuído** | o número que a lista existia para não mostrar |
 * | **Situação** | fechado × parcial × vazio × estourado, em chip |
 * | **Ações** | ver, editar, excluir |
 *
 * ## Toolbar padrão, com busca e filtro de verdade
 *
 * Esta tela saiu primeiro SEM toolbar — quatro linhas não pedem busca. Duas coisas
 * derrubaram a decisão: ficou fora do padrão das outras seis tabelas do produto, e
 * **omitir `toolbar` não esconde a barra** (o `DataTable` a desenha com tudo ligado; não
 * existe `hideToolbar`, desligar é enumerar controle por controle). Entre uma barra meio
 * vazia e a barra completa, a completa.
 *
 * Os três filtros de coluna (`Nível`, `Abrangência`, `Situação`) existem para o ícone de
 * filtro ter o que oferecer: sem nenhuma coluna filtrável, o popover abre vazio.
 *
 * ## Editar abre PAINEL, não outra tela
 *
 * Ver o JSDoc de `SplitFormPanel`: na origem, `Editar` navega para uma rota cujo título
 * renderiza **"Splits - undefined"**. Painel mantém a lista ao lado e o nome resolvido.
 */

function construirColunas(handlers: {
  onVer: (s: Split) => void;
  onEditar: (s: Split) => void;
  onExcluir: (s: Split) => void;
}): DataTableColumnDef<Split>[] {
  return [
    {
      field: "split",
      headerName: "Split",
      type: "text",
      isPrimary: true,
      width: 240,
      valueGetter: (row) => row.local ?? row.empresa,
      render: ({ row }) => (
        /* Sem elipse: nome de local cortado faz editar a divisão do ponto errado. */
        <span className="block whitespace-normal break-words text-body-sm font-medium leading-snug text-fg-default">
          {row.local ?? row.empresa}
        </span>
      ),
    },
    {
      field: "nivel",
      headerName: "Nível",
      width: 120,
      /* Coluna própria, e não chip empilhado sob o nome: o nível é o que decide a ORDEM
         em que os cortes incidem (local primeiro, empresa depois). Enterrado como
         legenda de outra coluna não dava para ordenar nem filtrar por ele — e é a
         primeira pergunta de quem audita uma cascata. */
      valueGetter: (row) => ROTULO_CURTO_DO_NIVEL[row.nivel],
      enableColumnFilter: true,
      filterType: "select",
      render: ({ row }) => (
        <span className="flex">
          <ChipDeNivel nivel={row.nivel} curto />
        </span>
      ),
    },
    {
      field: "abrangencia",
      headerName: "Abrangência",
      width: 180,
      enableColumnFilter: true,
      filterType: "select",
      valueGetter: (row) =>
        row.nivel === "empresa" ? "Todos os locais" : "Local específico",
      render: ({ row }) =>
        row.nivel === "empresa" ? (
          <Chip color="primary" variant="soft" size="sm" shape="pill">
            Todos os {locaisAlcancados(row)} locais
          </Chip>
        ) : (
          <span className="text-fg-muted">Um local</span>
        ),
    },
    {
      field: "beneficiarios",
      headerName: "Beneficiários",
      width: 120,
      align: "right",
      valueGetter: (row) => row.beneficiarios.length,
      render: ({ row }) =>
        row.beneficiarios.length === 0 ? (
          /* Zero em `fg-subtle` e não `0` neutro: é o estado que pede ação, e a lista é
             onde ele tem de saltar. */
          <span className="text-fg-subtle">—</span>
        ) : (
          <span className="tabular-nums">{row.beneficiarios.length}</span>
        ),
    },
    {
      field: "distribuido",
      headerName: "Distribuído",
      width: 140,
      align: "right",
      valueGetter: (row) => totalDistribuido(row),
      render: ({ row }) => {
        const total = totalDistribuido(row);
        return (
          <span className="flex min-w-0 flex-col items-end">
            <span
              className={`tabular-nums font-semibold ${
                total > 100 ? "text-fg-danger" : "text-fg-default"
              }`}
            >
              {percentual(total)}
            </span>
            <span className="text-caption-sm tabular-nums text-fg-muted">
              sobra {percentual(Math.max(0, restante(row)))}
            </span>
          </span>
        );
      },
    },
    {
      field: "situacao",
      headerName: "Situação",
      width: 176,
      enableColumnFilter: true,
      filterType: "multiSelect",
      valueGetter: (row) => {
        const total = totalDistribuido(row);
        if (row.beneficiarios.length === 0) return "Sem beneficiários";
        if (total > 100) return "Acima de 100%";
        if (total === 100) return "Distribuição fechada";
        return "Distribuição parcial";
      },
      render: ({ row }) => <ChipDeSituacao split={row} />,
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
          label: "Ver split",
          icon: <Eye />,
          onClick: () => handlers.onVer(row),
        },
        {
          id: "editar",
          label: "Editar split",
          icon: <Pencil />,
          onClick: () => handlers.onEditar(row),
        },
        {
          id: "excluir",
          label: "Excluir split",
          icon: <Trash2 />,
          destructive: true,
          onClick: () => handlers.onExcluir(row),
        },
      ],
    },
  ];
}

export function SplitsPage() {
  const [detalhe, setDetalhe] = useState<Split | null>(null);
  const [emEdicao, setEmEdicao] = useState<Split | null>(null);
  const [aExcluir, setAExcluir] = useState<Split | null>(null);

  const abrirEdicao = (s: Split) => {
    setDetalhe(null);
    setEmEdicao(s);
  };

  const colunas = useMemo(
    () =>
      construirColunas({
        onVer: setDetalhe,
        onEditar: abrirEdicao,
        onExcluir: (s) => {
          /* Fecha o painel ANTES do alerta: dois overlays empilhados escurecem o fundo
             duas vezes e o Esc fecha só o de cima. */
          setDetalhe(null);
          setAExcluir(s);
        },
      }),
    [],
  );

  const fechados = SPLITS.filter((s) => totalDistribuido(s) === 100).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Splits"
        description={SPLITS_TEXTOS.aviso}
        badge={
          <Chip color="neutral" variant="soft" size="sm" shape="rounded">
            {SPLITS.length} {SPLITS.length === 1 ? "split" : "splits"} ·{" "}
            {fechados} {fechados === 1 ? "fechado" : "fechados"}
          </Chip>
        }
      />

      <DataTable<Split>
        rows={SPLITS}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className="flex-1 min-h-0"
        /* ⚠️ `.v2` na chave: o `DataTable` persiste a ORDEM das colunas, e coluna
           acrescentada depois nasce no FIM da ordem guardada. Medido: com a chave antiga,
           a `Nível` renderizava depois de `Situação` mesmo estando em segundo lugar no
           código. Trocar a chave descarta a ordem antiga; a alternativa era pedir que
           cada pessoa limpasse o localStorage. */
        persistId="igreen-mob-cms.splits.v2"
        onRowClick={(row) => setDetalhe(row)}
        /* `title` AQUI funciona (ao contrário de Locais e Cupons): ele vira o
           `soloLabel` da aba, e o `soloLabel` só vale quando a Default é a ÚNICA aba.
           Splits não tem preset, então a visão única ganha nome próprio em vez de
           "Default". */
        toolbar={{
          title: "Todos os splits",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
        }}
        /* Sem "+": quatro linhas não pedem visão salva, e o botão prometeria guardar um
           recorte que ninguém vai reabrir. */
        allowCreateView={false}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <SplitDetailPanel
        split={detalhe}
        onClose={() => setDetalhe(null)}
        onEditar={abrirEdicao}
        onExcluir={(s) => {
          setDetalhe(null);
          setAExcluir(s);
        }}
      />

      <SplitFormPanel
        split={emEdicao}
        aberto={!!emEdicao}
        onClose={() => setEmEdicao(null)}
      />

      {aExcluir && (
        <AlertModal
          open
          onOpenChange={(v) => !v && setAExcluir(null)}
          tone="danger"
          title={SPLITS_TEXTOS.excluirTitulo}
          description={`${aExcluir.local ?? aExcluir.empresa} — ${SPLITS_TEXTOS.excluirDescricao}`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={() => {
            avisoDeExcluido({
              o: "Split",
              detalhe: `${aExcluir.local ?? aExcluir.empresa} não divide mais a receita.`,
            });
            setAExcluir(null);
          }}
        />
      )}
    </div>
  );
}
