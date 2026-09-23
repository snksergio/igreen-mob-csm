import { useMemo, useState } from "react";
import { Eye, Info, Plus } from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  PageHeader,
  presetView,
  type DataTableColumnDef,
  type DataTablePresetView,
} from "@snksergio/design-system";
import {
  ESTRUTURA,
  ESTRUTURA_TEXTOS,
  type NoDaRede,
} from "~/pages/estrutura-rede/estrutura-mock";
import { ALTURA_DE_TABELA } from "~/components/altura-de-tabela";
import { LocalFormPanel } from "~/pages/estrutura-rede/LocalFormPanel";
import { CelulaDeMotorista } from "~/pages/motoristas/motoristas-ui";
import { Etiqueta } from "~/pages/transacoes/transacoes-ui";

/**
 * Tela de Locais — medida em `/pt/settings/locals?page=1` (2026-09-16).
 *
 * ## É a lista plana do que a Estrutura da rede mostra em árvore
 *
 * As duas telas leem `ESTRUTURA`: lá o local aparece como folha de uma empresa, aqui como
 * registro próprio. São perguntas diferentes — "como a rede é montada" contra "quais locais
 * existem e quero achar um" —, e é por isso que a lista plana com busca ganha da árvore
 * aqui.
 *
 * ⚠️ **O painel é o MESMO `LocalFormPanel`** da Estrutura da rede. Escrever um segundo
 * formulário de local seria garantir que os dois divergissem no primeiro campo novo — e
 * "editei o local e o campo sumiu na outra tela" é o tipo de defeito que ninguém reproduz.
 *
 * ## O checkbox `Exibir desativados` virou TRÊS visões
 *
 * Na referência o recorte é um checkbox solto acima da grade, e ele tem dois problemas: só
 * oferece dois dos três estados úteis (não dá pra ver *apenas* os desativados), e filtro
 * solto acima de uma tabela é o que a L-051 proíbe — o motor de visões do `DataTable` já
 * faz isso, com o estado visível numa aba em vez de escondido numa caixinha.
 *
 * `Todos` · `Ativos` · `Desativados`, e o operador vê em qual está sem precisar lembrar se
 * marcou a caixa.
 */

/**
 * ⚠️ O `status` não existe no dado — é derivado de `ativo`.
 *
 * As visões filtram por VALOR de coluna, então precisam de um campo textual comparável.
 * Sem o `valueGetter` o preset compararia contra `true`/`false` e o chip do filtro mostraria
 * "true", que não é palavra que alguém procura.
 */
const ROTULO_DO_STATUS = { ativo: "Ativo", inativo: "Inativo" } as const;

const VISOES: DataTablePresetView[] = [
  presetView({
    id: "preset:ativos",
    name: "Ativos",
    filters: [
      { field: "status", operator: "isAnyOf", value: [ROTULO_DO_STATUS.ativo] },
    ],
  }),
  presetView({
    id: "preset:desativados",
    name: "Desativados",
    filters: [
      {
        field: "status",
        operator: "isAnyOf",
        value: [ROTULO_DO_STATUS.inativo],
      },
    ],
  }),
];

function construirColunas(
  onVerDetalhes: (l: NoDaRede) => void,
): DataTableColumnDef<NoDaRede>[] {
  return [
    {
      field: "nome",
      headerName: "Local",
      type: "text",
      isPrimary: true,
      /* ⚠️ Sem `ellipsis`, como na Estrutura da rede: nome de local cortado é o que faz
         alguém abrir o registro errado. Quebra em duas linhas, e a densidade comporta.

         ⚠️ As sete larguras são MEDIDAS contra os 1100px úteis. Esta encolheu de 250 pra
         228 quando o Responsável ganhou avatar: a foto custa 32px + gap, e eles saem de
         algum lugar. */
      width: 228,
      enableColumnFilter: true,
      filterType: "multiSelect",
      render: ({ row }) => (
        <span className="block whitespace-normal break-words leading-snug">
          {row.nome}
        </span>
      ),
    },
    {
      field: "empresa",
      headerName: "Empresa",
      type: "text",
      width: 118,
      enableColumnFilter: true,
      filterType: "multiSelect",
      /* O local não guarda a empresa: ele guarda o `paiId`. O `valueGetter` resolve o
         nome, e é ele também que alimenta a busca e o filtro desta coluna. */
      valueGetter: (row) =>
        ESTRUTURA.find((n) => n.id === row.paiId)?.nome ?? "—",
      /* `Chip neutro` — o `Etiqueta` de Transações e Resumo. Valor categórico em texto
         puro tem o mesmo peso visual de um dado contínuo e some no meio da grade. */
      render: ({ row }) => (
        <Etiqueta>
          {ESTRUTURA.find((n) => n.id === row.paiId)?.nome ?? "—"}
        </Etiqueta>
      ),
    },
    {
      field: "cnpj",
      headerName: "Documento",
      type: "text",
      copyable: true,
      /* 184: o CNPJ desenha ~124px e a célula carrega o ícone de copiar. Esta é a única
         coluna que NÃO quebra — número partido no meio parece outro número. */
      width: 184,
      render: ({ row }) => <span className="tabular-nums">{row.cnpj}</span>,
    },
    {
      field: "cidade",
      headerName: "Cidade",
      type: "text",
      /* 110: "Belo Horizonte/MG" desenha ~115px, então quebra em duas linhas — e a
         densidade `comfortable` comporta. */
      width: 110,
      enableColumnFilter: true,
      filterType: "multiSelect",
      valueGetter: (row) => (row.cidade ? `${row.cidade}/${row.uf}` : "—"),
      render: ({ row }) => (
        <span className="block whitespace-normal break-words leading-snug text-fg-muted">
          {row.cidade}/{row.uf}
        </span>
      ),
    },
    {
      field: "responsavel",
      headerName: "Responsável",
      type: "text",
      /* 212 pro avatar mais as duas linhas — o desenho da coluna `Licenciado` do app
         de Finanças do DS, o mesmo de Motoristas, Resumo e Usuários. */
      width: 212,
      /* Com o e-mail dentro desta célula, é o `valueGetter` que mantém a busca do toolbar
         encontrando por e-mail — sem ele, digitar o domínio não acharia ninguém. */
      valueGetter: (row) => `${row.responsavel} ${row.email}`,
      render: ({ row }) => (
        <CelulaDeMotorista nome={row.responsavel} email={row.email} />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      /* 104: o chip "Inativo" desenha ~62px, mais o padding da célula. */
      width: 104,
      enableColumnFilter: true,
      filterType: "multiSelect",
      /* É este `valueGetter` que faz as visões funcionarem — ver o JSDoc de
         `ROTULO_DO_STATUS`. */
      valueGetter: (row) =>
        row.ativo ? ROTULO_DO_STATUS.ativo : ROTULO_DO_STATUS.inativo,
      render: ({ row }) => (
        <Chip
          color={row.ativo ? "success" : "neutral"}
          variant="soft"
          size="sm"
          shape="pill"
        >
          {row.ativo ? "Ativo" : "Inativo"}
        </Chip>
      ),
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      align: "right",
      width: 124,
      sortable: false,
      /* Botão no PADRÃO do DS, sem os reforços da Estrutura da rede. Lá são três ações
         de escrita (editar, adicionar, excluir) e o peso extra se justifica; aqui é uma
         só, de leitura — dar destaque a ela seria gritar sobre abrir um registro. */
      getActions: ({ row }) => [
        {
          id: "detalhes",
          label: "Ver detalhes",
          icon: <Eye />,
          onClick: () => onVerDetalhes(row),
        },
      ],
    },
  ];
}

export function LocaisPage() {
  const [emEdicao, setEmEdicao] = useState<NoDaRede | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);

  /** Só as folhas — rede e empresa não são locais. */
  const locais = useMemo(
    () => ESTRUTURA.filter((n) => n.nivel === "local"),
    [],
  );

  const abrir = (l: NoDaRede | null) => {
    setEmEdicao(l);
    setPainelAberto(true);
  };

  const colunas = useMemo(() => construirColunas((l) => abrir(l)), []);

  const empresaDoLocal = useMemo(
    () =>
      emEdicao
        ? (ESTRUTURA.find((n) => n.id === emEdicao.paiId) ?? null)
        : null,
    [emEdicao],
  );

  const ativos = locais.filter((l) => l.ativo).length;

  return (
    /* `min-h-0 flex-1` — o padrão das telas de tabela. É o que dá altura limitada à
       raiz pra que a tabela abaixo possa ocupar a sobra e rolar por dentro, mantendo
       toolbar e paginação parados. Sem `pb`: a página não rola, então não há fim de
       rolagem pra dar respiro. */
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Locais"
        description={ESTRUTURA_TEXTOS.aviso}
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {locais.length} {locais.length === 1 ? "local" : "locais"} ·{" "}
            {ativos} {ativos === 1 ? "ativo" : "ativos"}
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Plus />}
            onClick={() => abrir(null)}
          >
            {ESTRUTURA_TEXTOS.novoLocal}
          </Button>
        }
      />

      {/* Aviso literal da origem, fora do `PageHeader`: ele diz respeito ao RECORTE da
          lista, não à página. */}
      <p className="flex items-start gap-gp-sm text-caption-md text-fg-muted">
        <Info className="mt-[1px] size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
        Um local inativo continua cadastrado, mas some do app do motorista.
      </p>

      <DataTable<NoDaRede>
        rows={locais}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        /* `flex-1 min-h-0`, não `max-h`: a tabela ocupa o que sobra da tela. O
           mecanismo interno do `DataTable` (corpo `flex-1 min-h-0 overflow-auto`) só arma
           com a raiz de altura limitada, e é o `min-h-0 flex-1` do wrapper que dá isso.

           ⚠️ O `max-h-[72vh]` que estava aqui era cópia do Monitoramento, e lá ele existe
           por um motivo que não vale aqui: aquela tela tem mapa e barra ACIMA da tabela,
           então a página inteira rola e a tabela precisa de um teto próprio. Esta tem só
           cabeçalho e grade — é o caso normal. */
        className={`${ALTURA_DE_TABELA} [&_.scrollbar-thin]:[scrollbar-gutter:stable]`}
        /* `persistId` NÃO é opcional com visões: a barra de abas só renderiza quando
           `persistId && defaultViews.length > 0`. Sem ele o `defaultViews` compila e as
           abas simplesmente não aparecem. */
        persistId="igreen-mob-cms.locais"
        defaultViews={VISOES}
        /* Abas fixas: `Todos` (a Default) + as duas. ⛔ O `maxViewTabs` é 3 CONTANDO a
           Default, então estas duas são o limite — uma terceira seria cortada em silêncio. */
        allowCreateView={false}
        showEmptyFilterChips={["empresa", "cidade", "status"]}
        onRowClick={(row) => abrir(row)}
        density="comfortable"
        toolbar={{
          /* ⚠️ **Isto NÃO renomeia a aba "Default".** O `toolbar.title` vira `soloLabel`,
             que só vale quando a Default é a ÚNICA aba — com presets ela continua
             "Default". Conferi na tipagem do DS: não existe prop pra isso.

             Fica assim mesmo, e declarado: o nome honesto seria "Todos", e a aba diz
             "Default".
             📋 Lacuna do DS, segunda tela em que aparece (a primeira foi Cupons). */
          title: "Todos",
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

      {/* O MESMO painel da Estrutura da rede — ver o JSDoc do topo. */}
      <LocalFormPanel
        aberto={painelAberto}
        local={emEdicao}
        empresa={empresaDoLocal}
        onClose={() => setPainelAberto(false)}
      />
    </div>
  );
}
