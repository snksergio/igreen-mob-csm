import { useMemo, useState } from "react";
import { Bell, Eye, Plus, Trash2 } from "lucide-react";
import {
  AlertModal,
  Button,
  Chip,
  DataTable,
  PageHeader,
  type DataTableColumnDef,
} from "@snksergio/design-system";
import {
  ALERTAS_TEXTOS,
  GRUPOS_DE_ALERTAS,
  LOCAIS_DISPONIVEIS,
  TIPOS_CRITICOS,
  TIPOS_DE_ALERTA,
  cobreTudo,
  locaisCobertos,
  type GrupoDeAlertas,
} from "./alertas-mock";
import { avisoDeExcluido } from "~/components/feedback";
import { ChipsComResto } from "./alertas-ui";
import { GrupoDeAlertasPanel } from "./GrupoDeAlertasPanel";
import { GrupoDeAlertasFormPanel } from "./GrupoDeAlertasFormPanel";
import {
  ALTURA_DE_TABELA,
  RAIZ_DE_PAGINA,
} from "~/components/altura-de-tabela";

/**
 * Tela de Configuração de grupos de alertas — medida em `/pt/alert-groups?page=1`
 * (2026-09-16).
 *
 * ## A lista estava vazia, então o desenho dela é PROPOSTA
 *
 * A origem mostrava "Sem resultados" — só deu pra copiar os cabeçalhos das cinco colunas e
 * o formulário. O resto é sugestão, a pedido do operador, e a pergunta que ela responde é:
 * **como uma linha mostra três campos que são listas?**
 *
 * Tipos de alerta (1 a 9), locais cobertos (1 a 17) e e-mails (1 a N) não cabem inteiros
 * numa linha, e reduzir os três a contagem faria a tabela virar um placar — daria pra
 * comparar grupos e não pra reconhecer o seu. O desenho que escolhi:
 *
 * | coluna | desenho | por quê |
 * |---|---|---|
 * | **Grupo** | nome + chip Ativo/Pausado | pausado é o único estado que muda se funciona |
 * | **Tipos** | chip com a contagem + chip `Críticos` quando cobre os três de indisponibilidade | 9 chips não cabem; o que se quer saber é "escuta o que me interessa?" |
 * | **Cobertura** | `Todos os locais` OU `N de 17` | a diferença entre total e parcial é categórica, não quantitativa |
 * | **E-mails** | os dois primeiros + `+N` com tooltip | quem procura o próprio e-mail costuma achar nos primeiros |
 *
 * Ver o JSDoc de `ChipsComResto` pro raciocínio do `+N`.
 *
 * ## Só ver, editar e excluir
 *
 * Mesmas ações da tela de Usuários, a pedido do operador — e aqui cabe o editar também,
 * porque a origem tem o formulário. A destrutiva confirma por `AlertModal`.
 */

function construirColunas(handlers: {
  onVer: (g: GrupoDeAlertas) => void;
  onEditar: (g: GrupoDeAlertas) => void;
  onExcluir: (g: GrupoDeAlertas) => void;
}): DataTableColumnDef<GrupoDeAlertas>[] {
  return [
    {
      field: "nome",
      headerName: "Grupo",
      type: "text",
      isPrimary: true,
      width: 240,
      render: ({ row }) => (
        <span className="flex min-w-0 items-center gap-gp-md">
          <span
            className={`grid size-form-md shrink-0 place-items-center rounded-radius-md ${
              row.ativo
                ? "bg-bg-brand-subtle text-fg-brand"
                : "bg-bg-muted text-fg-subtle"
            }`}
          >
            <Bell className="size-icon-sm" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm font-medium text-fg-default">
              {row.nome}
            </span>
            <span className="truncate text-caption-sm text-fg-muted">
              {row.empresa}
            </span>
          </span>
        </span>
      ),
    },
    {
      field: "ativo",
      headerName: "Status",
      width: 112,
      enableColumnFilter: true,
      filterType: "select",
      valueGetter: (row) => (row.ativo ? "Ativo" : "Pausado"),
      render: ({ row }) => (
        <Chip
          color={row.ativo ? "success" : "neutral"}
          variant="soft"
          size="sm"
          shape="pill"
        >
          {row.ativo ? "Ativo" : "Pausado"}
        </Chip>
      ),
    },
    {
      field: "tipos",
      headerName: "Tipos de alertas",
      width: 190,
      /* A contagem ordena e a busca encontra por "críticos" — ver o render. */
      valueGetter: (row) =>
        `${row.tipos.length} tipos ${
          TIPOS_CRITICOS.every((t) => row.tipos.includes(t)) ? "críticos" : ""
        }`,
      render: ({ row }) => {
        const cobreCriticos = TIPOS_CRITICOS.every((t) =>
          row.tipos.includes(t),
        );
        return (
          <span className="flex flex-wrap items-center gap-gp-xs">
            <Chip color="neutral" variant="soft" size="sm">
              {row.tipos.length} de {TIPOS_DE_ALERTA.length}
            </Chip>
            {/* O chip `Críticos` é o que dá significado à contagem: 4 tipos que incluem
                offline e falha é um grupo de operação; 4 que não incluem é um grupo que
                vai perder o carregador caído. */}
            {cobreCriticos && (
              <Chip color="danger" variant="soft" size="sm" shape="pill">
                Críticos
              </Chip>
            )}
          </span>
        );
      },
    },
    {
      field: "locais",
      headerName: "Cobertura",
      width: 170,
      valueGetter: (row) =>
        cobreTudo(row) ? "Todos os locais" : `${row.locais.length} locais`,
      render: ({ row }) =>
        cobreTudo(row) ? (
          <Chip color="primary" variant="soft" size="sm" shape="pill">
            Todos os locais
          </Chip>
        ) : (
          <span className="tabular-nums text-fg-muted">
            {locaisCobertos(row)} de {LOCAIS_DISPONIVEIS.length} locais
          </span>
        ),
    },
    {
      field: "emails",
      headerName: "E-mails notificados",
      width: 290,
      valueGetter: (row) => row.emails.join(" "),
      render: ({ row }) => <ChipsComResto itens={row.emails} limite={2} />,
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
          label: "Ver detalhes",
          icon: <Eye />,
          onClick: () => handlers.onVer(row),
        },
        {
          id: "excluir",
          label: "Excluir grupo",
          icon: <Trash2 />,
          destructive: true,
          onClick: () => handlers.onExcluir(row),
        },
      ],
    },
  ];
}

export function AlertasPage() {
  const [detalhe, setDetalhe] = useState<GrupoDeAlertas | null>(null);
  const [emEdicao, setEmEdicao] = useState<GrupoDeAlertas | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [aExcluir, setAExcluir] = useState<GrupoDeAlertas | null>(null);

  const abrirForm = (g: GrupoDeAlertas | null) => {
    setDetalhe(null);
    setEmEdicao(g);
    setFormAberto(true);
  };

  const colunas = useMemo(
    () =>
      construirColunas({
        onVer: setDetalhe,
        onEditar: abrirForm,
        onExcluir: (g) => {
          /* Fecha o painel ANTES do alerta: dois overlays empilhados escurecem o fundo
             duas vezes e o Esc fecha só o de cima. */
          setDetalhe(null);
          setAExcluir(g);
        },
      }),
    [],
  );

  const ativos = GRUPOS_DE_ALERTAS.filter((g) => g.ativo).length;

  return (
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Configuração de grupos de alertas"
        description={ALERTAS_TEXTOS.aviso}
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {GRUPOS_DE_ALERTAS.length}{" "}
            {GRUPOS_DE_ALERTAS.length === 1 ? "grupo" : "grupos"} · {ativos}{" "}
            {ativos === 1 ? "ativo" : "ativos"}
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Plus />}
            onClick={() => abrirForm(null)}
          >
            {ALERTAS_TEXTOS.novoGrupo}
          </Button>
        }
      />

      <DataTable<GrupoDeAlertas>
        rows={GRUPOS_DE_ALERTAS}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className={ALTURA_DE_TABELA}
        persistId="igreen-mob-cms.alertas"
        allowCreateView={false}
        showEmptyFilterChips={["ativo"]}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          title: "Todos os grupos",
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

      <GrupoDeAlertasPanel
        grupo={detalhe}
        onClose={() => setDetalhe(null)}
        onEditar={abrirForm}
        onExcluir={(g) => {
          setDetalhe(null);
          setAExcluir(g);
        }}
      />

      <GrupoDeAlertasFormPanel
        aberto={formAberto}
        grupo={emEdicao}
        onClose={() => setFormAberto(false)}
      />

      {aExcluir && (
        <AlertModal
          open
          onOpenChange={(v) => !v && setAExcluir(null)}
          tone="danger"
          title={ALERTAS_TEXTOS.excluirTitulo}
          description={`${aExcluir.nome} — ${ALERTAS_TEXTOS.excluirDescricao}`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={() => {
            avisoDeExcluido({ o: "Grupo", detalhe: `${aExcluir.nome} não envia mais alertas.` });
            setAExcluir(null);
          }}
        />
      )}
    </div>
  );
}
