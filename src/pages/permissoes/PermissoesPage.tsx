import { useMemo, useState } from "react";
import { BookOpen, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import {
  AlertModal,
  Avatar,
  Button,
  Chip,
  DataTable,
  PageHeader,
  presetView,
  type DataTableColumnDef,
  type DataTablePresetView,
} from "@snksergio/design-system";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import { ChipsComResto } from "~/pages/alertas/alertas-ui";
import {
  ACESSOS,
  LOCAIS_DISPONIVEIS,
  PERFIL,
  PERMISSOES_TEXTOS,
  cobreTudo,
  dataCurta,
  locaisDoAcesso,
  perfilMaisForte,
  perfilPredominante,
  perfisDoAcesso,
  type Acesso,
} from "./permissoes-mock";
import { avisoDeExcluido } from "~/components/feedback";
import { ChipDePerfilOuMisto } from "./permissoes-ui";
import { AcessoDetailPanel } from "./AcessoDetailPanel";
import { AcessoFormPanel } from "./AcessoFormPanel";
import { PerfisDeAcessoPanel } from "./PerfisDeAcessoPanel";
import {
  ALTURA_DE_TABELA,
  RAIZ_DE_PAGINA,
} from "~/components/altura-de-tabela";

/**
 * Tela de Permissões — medida em `/pt/permissions?page=1` (2026-09-16).
 *
 * ## A referência foi ESTUDADA, não copiada — a pedido do operador
 *
 * O que a origem faz: um banner de legenda com quatro parágrafos acima da tabela, e três
 * colunas (`Email do usuário`, `Empresas e locais`, `Ações`) das quais a do meio é um
 * **card dentro da célula** — card de empresa, com badge de perfil no canto, contendo N
 * chips de local e scroll próprio quando não cabem.
 *
 * Quatro problemas, todos visíveis no print e nenhum de gosto:
 *
 * | defeito | consequência |
 * |---|---|
 * | o perfil mora no card, não numa coluna | não dá pra ordenar nem filtrar por perfil — a pergunta nº 1 desta tela |
 * | a altura da linha depende do nº de locais | o administrador ocupa 200px; o vizinho, 60px. Varredura vertical morre |
 * | scroll dentro de célula dentro de página | o conteúdo fica atrás de dois scrolls aninhados |
 * | legenda permanente, e repetida no modal | ~120px acima da tabela em toda visita, e ainda assim não responde "o Técnico vê o Financeiro?" |
 *
 * ## O que as ferramentas que resolveram isso fazem
 *
 * GitHub (Organization → People), Supabase (Team), Vercel e Linear convergiram no mesmo
 * desenho, e a convergência é o argumento:
 *
 * 1. **Uma linha por pessoa.** Altura constante. O que não cabe vira contagem.
 * 2. **O papel é COLUNA**, renderizado como chip — ordenável, filtrável, visão salva.
 * 3. **A grade granular (recurso × papel) vive num painel de detalhe**, não na célula.
 * 4. **A documentação dos papéis fica a um clique**, nunca residente na tela.
 *
 * É o que está implementado aqui. As seis colunas:
 *
 * | coluna | por quê |
 * |---|---|
 * | **Usuário** | avatar + e-mail; o nome aparece quando existe, e a ausência dele já denuncia convite pendente |
 * | **Perfil de acesso** | chip do perfil, ou `Misto` + contagem — o caso que a referência não consegue mostrar |
 * | **Abrangência** | `Todos os locais` ou `N de 17`: total × parcial é diferença categórica, não quantitativa |
 * | **Locais** | o primeiro + `+N` com tooltip. Nome de local é longo; dois chips já estouram |
 * | **Último acesso** | a coluna que faz uma lista de permissões virar auditoria — quem tem acesso e não usa é o que se revoga |
 * | **Ações** | ver, editar, revogar |
 *
 * ## As duas visões salvas respondem as duas perguntas de auditoria
 *
 * `Administradores` (quem pode tudo em algum lugar — inclui os mistos, que a coluna de
 * perfil sozinha esconderia) e `Acesso total` (quem alcança os 17 locais). São as duas
 * perguntas que trazem alguém a esta tela sem um nome em mente.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Campos derivados que as visões e os filtros precisam
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * ⚠️ As visões filtram por VALOR de coluna, então cada recorte precisa de um campo textual
 * comparável. `perfilForte` e `abrangencia` não existem no dado — são derivados aqui, como
 * o `status` de Locais, e é por isso que os `valueGetter` abaixo não são enfeite.
 */
const ROTULO_DA_ABRANGENCIA = {
  total: "Todos os locais",
  parcial: "Locais selecionados",
} as const;

const VISOES: DataTablePresetView[] = [
  presetView({
    id: "preset:administradores",
    name: "Administradores",
    filters: [
      {
        field: "perfilForte",
        operator: "isAnyOf",
        value: [PERFIL.administrador.nome],
      },
    ],
  }),
  presetView({
    id: "preset:acesso-total",
    name: "Acesso total",
    filters: [
      {
        field: "abrangencia",
        operator: "isAnyOf",
        value: [ROTULO_DA_ABRANGENCIA.total],
      },
    ],
  }),
];

function construirColunas(handlers: {
  onVer: (a: Acesso) => void;
  onEditar: (a: Acesso) => void;
  onRevogar: (a: Acesso) => void;
}): DataTableColumnDef<Acesso>[] {
  return [
    {
      field: "email",
      headerName: "Usuário",
      type: "text",
      isPrimary: true,
      width: 268,
      copyable: true,
      render: ({ row }) => (
        <span className="flex min-w-0 items-center gap-gp-md">
          <Avatar
            size="sm"
            colorHex={corDoAvatar(row.nome ?? row.email)}
            className="shrink-0"
            aria-hidden
          >
            {iniciais(
              (row.nome ?? row.email.split("@")[0]).replace(/[._-]+/g, " "),
            )}
          </Avatar>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm font-medium text-fg-default">
              {row.nome ?? row.email}
            </span>
            <span className="truncate text-caption-sm text-fg-muted">
              {row.nome ? row.email : "Convite pendente"}
            </span>
          </span>
        </span>
      ),
    },
    {
      field: "perfilForte",
      headerName: "Perfil de acesso",
      width: 172,
      enableColumnFilter: true,
      filterType: "multiSelect",
      /* O valor filtrável é o perfil MAIS FORTE, não o predominante: quem procura
         administradores quer achar também o acesso misto que tem um administrador dentro —
         o caso que a referência esconde por completo. */
      valueGetter: (row) => PERFIL[perfilMaisForte(row)].nome,
      render: ({ row }) => (
        <ChipDePerfilOuMisto
          perfil={perfilPredominante(row)}
          quantos={perfisDoAcesso(row).length}
        />
      ),
    },
    {
      field: "abrangencia",
      headerName: "Abrangência",
      width: 168,
      enableColumnFilter: true,
      filterType: "select",
      valueGetter: (row) =>
        cobreTudo(row)
          ? ROTULO_DA_ABRANGENCIA.total
          : ROTULO_DA_ABRANGENCIA.parcial,
      render: ({ row }) =>
        cobreTudo(row) ? (
          <Chip color="primary" variant="soft" size="sm" shape="pill">
            Todos os locais
          </Chip>
        ) : (
          <span className="tabular-nums text-fg-muted">
            {locaisDoAcesso(row).length} de {LOCAIS_DISPONIVEIS.length} locais
          </span>
        ),
    },
    {
      field: "locais",
      headerName: "Locais",
      width: 244,
      sortable: false,
      valueGetter: (row) => locaisDoAcesso(row).join(" "),
      /* `limite={1}` e não 2 como em Alertas: nome de local aqui tem 30 a 48 caracteres
         contra os ~22 de um e-mail. Dois chips truncariam os dois e o `+N` sumiria. */
      render: ({ row }) => (
        <ChipsComResto itens={locaisDoAcesso(row)} limite={1} />
      ),
    },
    {
      field: "ultimoAcesso",
      headerName: "Último acesso",
      width: 152,
      valueGetter: (row) => row.ultimoAcesso ?? "",
      render: ({ row }) =>
        row.ultimoAcesso ? (
          <span className="tabular-nums text-fg-muted">
            {dataCurta(row.ultimoAcesso)}
          </span>
        ) : (
          <Chip color="warning" variant="soft" size="sm" shape="pill">
            Pendente
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
          label: "Ver acesso",
          icon: <Eye />,
          onClick: () => handlers.onVer(row),
        },
        {
          id: "editar",
          label: "Editar acesso",
          icon: <Pencil />,
          onClick: () => handlers.onEditar(row),
        },
        {
          id: "revogar",
          label: "Revogar acesso",
          icon: <Trash2 />,
          destructive: true,
          onClick: () => handlers.onRevogar(row),
        },
      ],
    },
  ];
}

export function PermissoesPage() {
  const [detalhe, setDetalhe] = useState<Acesso | null>(null);
  const [emEdicao, setEmEdicao] = useState<Acesso | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [perfisAberto, setPerfisAberto] = useState(false);
  const [aRevogar, setARevogar] = useState<Acesso | null>(null);

  const abrirForm = (a: Acesso | null) => {
    setDetalhe(null);
    setEmEdicao(a);
    setFormAberto(true);
  };

  const colunas = useMemo(
    () =>
      construirColunas({
        onVer: setDetalhe,
        onEditar: abrirForm,
        onRevogar: (a) => {
          /* Fecha o painel ANTES do alerta: dois overlays empilhados escurecem o fundo duas
             vezes e o Esc fecha só o de cima. */
          setDetalhe(null);
          setARevogar(a);
        },
      }),
    [],
  );

  const administradores = ACESSOS.filter(
    (a) => perfilMaisForte(a) === "administrador",
  ).length;

  return (
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Permissões"
        description={PERMISSOES_TEXTOS.aviso}
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {ACESSOS.length} {ACESSOS.length === 1 ? "acesso" : "acessos"} ·{" "}
            {administradores}{" "}
            {administradores === 1 ? "administrador" : "administradores"}
          </Chip>
        }
        actions={
          <>
            {/* A legenda da referência virou este botão. Ver o JSDoc de
                `PerfisDeAcessoPanel`: quem já sabe o que é Colaborador não paga 120px de
                tela por isso em toda visita. */}
            <Button
              variant="outline"
              color="secondary"
              size="md"
              iconLeft={<BookOpen />}
              onClick={() => setPerfisAberto(true)}
            >
              {PERMISSOES_TEXTOS.verPerfis}
            </Button>
            <Button
              variant="filled"
              color="primary"
              size="md"
              iconLeft={<Plus />}
              onClick={() => abrirForm(null)}
            >
              {PERMISSOES_TEXTOS.conceder}
            </Button>
          </>
        }
      />

      <DataTable<Acesso>
        rows={ACESSOS}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className={ALTURA_DE_TABELA}
        persistId="igreen-mob-cms.permissoes"
        defaultViews={VISOES}
        allowCreateView={false}
        showEmptyFilterChips={["perfilForte"]}
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

      <AcessoDetailPanel
        acesso={detalhe}
        onClose={() => setDetalhe(null)}
        onEditar={abrirForm}
        onRevogar={(a) => {
          setDetalhe(null);
          setARevogar(a);
        }}
      />

      <AcessoFormPanel
        aberto={formAberto}
        acesso={emEdicao}
        onClose={() => setFormAberto(false)}
      />

      <PerfisDeAcessoPanel
        aberto={perfisAberto}
        onClose={() => setPerfisAberto(false)}
      />

      {aRevogar && (
        <AlertModal
          open
          onOpenChange={(v) => !v && setARevogar(null)}
          tone="danger"
          title={PERMISSOES_TEXTOS.revogarTitulo}
          description={`${aRevogar.email} — ${PERMISSOES_TEXTOS.revogarDescricao}`}
          confirmLabel="Revogar"
          cancelLabel="Cancelar"
          onConfirm={() => {
            avisoDeExcluido({
              o: "Acesso",
              detalhe: `${aRevogar.email} perdeu o acesso a todos os locais.`,
            });
            setARevogar(null);
          }}
        />
      )}
    </div>
  );
}
