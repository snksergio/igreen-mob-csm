import { useMemo, useState } from "react";
import { Download, Eye, Star, Trash2 } from "lucide-react";
import {
  AlertModal,
  Button,
  Chip,
  DataTable,
  PageHeader,
  presetView,
  type DataTableColumnDef,
  type DataTablePresetView,
} from "@snksergio/design-system";
import { CelulaDeMotorista } from "~/pages/motoristas/motoristas-ui";
import {
  ROTULO_DO_SALDO,
  USUARIOS,
  USUARIOS_TEXTOS,
  saldoDoUsuario,
  type Usuario,
} from "./usuarios-mock";
import { UsuarioDetailPanel } from "./UsuarioDetailPanel";
import { avisoDeExcluido } from "~/components/feedback";
import {
  TABELA_DE_PAGINA,
  RAIZ_DE_PAGINA,
} from "~/components/altura-de-tabela";

/**
 * Tela de Usuários — medida em `/pt/settings/users?page=1` (2026-09-16).
 *
 * ## A referência estava vazia, e isso mudou o que dava pra copiar
 *
 * A tela da origem mostrava "Sem resultados" — os três filtros do topo vinham com um
 * recorte que não casava com nada. Então o que é fiel aqui são as **sete colunas**, os
 * **rótulos dos filtros** e as **opções de cada um**; os dados são inventados, a pedido do
 * operador. Ver o JSDoc de `usuarios-mock`.
 *
 * ## Os três selects viraram visão + chips
 *
 * A origem tem `Filtrar por atividade`, `Filtrar por saldo` e `Filtrar por tags` como
 * selects soltos acima da grade — exatamente o que a L-051 proíbe. Aqui:
 *
 * | filtro da origem | aqui | por quê |
 * |---|---|---|
 * | Saldo | **duas visões** + coluna `Situação` com chip | são os dois casos que pedem AÇÃO — dinheiro a receber e conta sem crédito |
 * | Atividade | some | é `Transações = 0`, e a coluna já ordena por isso |
 * | Tags | some | vive na tela de Motoristas, que é onde se edita tag |
 *
 * ⚠️ `Saldo positivo` NÃO virou aba: ele é o caso normal, e uma aba pro estado saudável
 * gasta um dos três slots (o `maxViewTabs` é 3 contando a Default) pra mostrar o que já
 * aparece em `Todos`.
 *
 * ## A gramática de cor é a de Transações e Resumo
 *
 * Avatar + nome + e-mail na primeira coluna, valor categórico em `Chip` (a situação da
 * carteira), dinheiro em `tabular-nums font-semibold` com verde só quando entrou. São as
 * telas em que a cor foi mais trabalhada, e repetir a gramática é o que faz a tabela nova
 * parecer da mesma família.
 *
 * ## Uma coluna da referência não está aqui
 *
 * ⚠️ **`Empresa` saiu.** Com ela as oito colunas somavam **1239px de PISO** numa área útil
 * de 1100 — não cabiam nem espremidas. E ela é a que menos informa: uma empresa só no
 * escopo, repetida em todas as linhas, com o escopo já declarado no seletor do topo. Mesmo
 * critério de Monitoramento. Ela continua no painel de detalhe, onde é ficha e não coluna.
 *
 * ## Só ver e excluir
 *
 * A origem não tem adicionar nem editar — o cadastro nasce no app do motorista. As duas
 * ações inventadas são as que fazem sentido num back-office de consulta, e a destrutiva
 * confirma por `AlertModal`, que é o guardrail do DS.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const VISOES: DataTablePresetView[] = [
  presetView({
    id: "preset:saldo-negativo",
    name: "Saldo negativo",
    filters: [
      {
        field: "saldo",
        operator: "isAnyOf",
        value: [ROTULO_DO_SALDO.negativo],
      },
    ],
  }),
  presetView({
    id: "preset:carteira-zerada",
    name: "Carteira zerada",
    filters: [
      { field: "saldo", operator: "isAnyOf", value: [ROTULO_DO_SALDO.zerada] },
    ],
  }),
];

function construirColunas(handlers: {
  onVerDetalhes: (u: Usuario) => void;
  onExcluir: (u: Usuario) => void;
}): DataTableColumnDef<Usuario>[] {
  return [
    {
      field: "nome",
      headerName: "Motorista",
      type: "text",
      isPrimary: true,
      /* 210 pras duas linhas (avatar + nome + e-mail), no desenho da coluna
         `Licenciado` do app de Finanças do DS — o mesmo de Motoristas e Resumo.

         ⚠️ As nove larguras são medidas contra os 1100px úteis; esta é a que sobrou
         depois das oito fixas. */
      width: 230,
      /* Com o e-mail dentro da célula, é o `valueGetter` que mantém a busca do toolbar
         encontrando por e-mail. */
      valueGetter: (row) => `${row.nome} ${row.email}`,
      render: ({ row }) => (
        <CelulaDeMotorista nome={row.nome} email={row.email} />
      ),
    },
    {
      /* ⚠️ Esta coluna existe pra alimentar as VISÕES — o `presetView` filtra por campo, e
         campo sem coluna não tem contra o que comparar.

         Ela não é só andaime: a faixa de saldo é o recorte mais acionável desta tela, e
         como `Chip` colorido ela responde "quem está devendo" antes de alguém ler
         qualquer número.

         📋 O DS não tem como marcar uma coluna como oculta por padrão (`hidden` só existe
         em item de AÇÃO; `hiddenColumns` é estado do usuário). Então o jeito de ter o
         campo é tê-lo visível — e aqui isso deu certo. */
      field: "saldo",
      headerName: "Situação",
      type: "text",
      /* 136: quem manda aqui é o CONTEÚDO — o chip "Carteira zerada" desenha ~104px mais
         o padding dele e o da célula. O header pediria 109. */
      width: 136,
      enableColumnFilter: true,
      filterType: "multiSelect",
      valueGetter: (row) => ROTULO_DO_SALDO[saldoDoUsuario(row)],
      render: ({ row }) => {
        const faixa = saldoDoUsuario(row);
        return (
          <Chip
            color={
              faixa === "negativo"
                ? "danger"
                : faixa === "positivo"
                  ? "success"
                  : "neutral"
            }
            variant="soft"
            size="sm"
            shape="pill"
          >
            {ROTULO_DO_SALDO[faixa]}
          </Chip>
        );
      },
    },
    {
      field: "veiculoFavorito",
      headerName: "Veículo favorito",
      type: "text",
      ellipsis: true,
      /* 152 é o PISO, e o maior dos headers: "Veículo favorito" desenha 98px + 54 de
         reserva. É a coluna que mais custa por causa do rótulo, não do dado. */
      width: 152,
      render: ({ row }) =>
        row.veiculoFavorito ?? <span className="text-fg-subtle">–</span>,
    },
    {
      field: "carteira",
      headerName: "Carteira",
      /* ⚠️ **Sem `type: "currency"`**, e a formatação fica no `render`. O tipo põe um
         ícone `$` no header e cobra ~20px por isso — informação zero, porque o valor já
         vem com `R$`. Medido: as duas colunas de dinheiro pediam 124 e 142px de piso
         contra 96 e 102 sem o ícone. */
      align: "right",
      width: 104,
      sortable: true,
      render: ({ row }) => (
        /* Vermelho no negativo, verde no positivo, neutro no zero — a mesma regra de cor
           de Transações e Resumo. Zero em verde diria "está tudo certo" sobre uma conta
           que não pode recarregar. */
        <span
          className={`font-semibold tabular-nums ${
            row.carteira < 0
              ? "text-fg-danger"
              : row.carteira > 0
                ? "text-fg-success"
                : "text-fg-muted"
          }`}
        >
          {brl.format(row.carteira)}
        </span>
      ),
    },
    {
      field: "transacoes",
      headerName: "Transações",
      align: "right",
      /* 104 é o piso: 71 + 33. */
      width: 104,
      sortable: true,
      render: ({ row }) => (
        <span className="tabular-nums">{row.transacoes}</span>
      ),
    },
    {
      field: "satisfacao",
      headerName: "Satisfação",
      align: "right",
      /* 100 é o piso: 67 + 33. */
      width: 100,
      sortable: true,
      render: ({ row }) =>
        row.satisfacao === null ? (
          <span className="text-fg-subtle">–</span>
        ) : (
          <span className="flex items-center justify-end gap-gp-xs tabular-nums">
            <Star
              className="size-icon-xs text-fg-warning"
              fill="currentColor"
              aria-hidden
            />
            {row.satisfacao.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
            })}
          </span>
        ),
    },
    {
      field: "totalGasto",
      headerName: "Total gasto",
      /* Sem `type: "currency"` pelo mesmo motivo da Carteira. */
      align: "right",
      width: 122,
      sortable: true,
      /* Verde só quando gastou — zero em verde diria "entrou dinheiro" sobre quem nunca
         recarregou. Mesma regra da coluna `Valor` em Motoristas. */
      render: ({ row }) => (
        <span
          className={`tabular-nums font-semibold ${
            row.totalGasto > 0 ? "text-fg-success" : "text-fg-muted"
          }`}
        >
          {brl.format(row.totalGasto)}
        </span>
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
          label: "Ver detalhes",
          icon: <Eye />,
          onClick: () => handlers.onVerDetalhes(row),
        },
        {
          id: "excluir",
          label: "Excluir usuário",
          icon: <Trash2 />,
          destructive: true,
          onClick: () => handlers.onExcluir(row),
        },
      ],
    },
  ];
}

export function UsuariosPage() {
  const [detalhe, setDetalhe] = useState<Usuario | null>(null);
  const [aExcluir, setAExcluir] = useState<Usuario | null>(null);

  const colunas = useMemo(
    () =>
      construirColunas({
        onVerDetalhes: setDetalhe,
        onExcluir: setAExcluir,
      }),
    [],
  );

  const comSaldoNegativo = USUARIOS.filter((u) => u.carteira < 0).length;

  return (
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Usuários"
        description={USUARIOS_TEXTOS.aviso}
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {USUARIOS.length} {USUARIOS.length === 1 ? "usuário" : "usuários"}
            {comSaldoNegativo > 0 && ` · ${comSaldoNegativo} com saldo negativo`}
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Download />}
          >
            {USUARIOS_TEXTOS.baixarDados}
          </Button>
        }
      />

      <DataTable<Usuario>
        rows={USUARIOS}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className={TABELA_DE_PAGINA}
        /* `persistId` NÃO é opcional com visões: a barra de abas só renderiza quando
           `persistId && defaultViews.length > 0`. Sem ele o `defaultViews` compila e as
           abas simplesmente não aparecem. */
        persistId="igreen-mob-cms.usuarios"
        defaultViews={VISOES}
        allowCreateView={false}
        /* Os três chips que substituem os selects da origem — ver o JSDoc do topo. */
        showEmptyFilterChips={["saldo"]}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
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

      <UsuarioDetailPanel
        usuario={detalhe}
        onClose={() => setDetalhe(null)}
        onExcluir={(u) => {
          /* Fecha o painel ANTES de abrir o alerta: dois overlays empilhados deixam o
             fundo escurecido duas vezes e o Esc fecha só o de cima. */
          setDetalhe(null);
          setAExcluir(u);
        }}
      />

      {aExcluir && (
        <AlertModal
          open
          onOpenChange={(v) => !v && setAExcluir(null)}
          tone="danger"
          title={USUARIOS_TEXTOS.excluirTitulo}
          description={`${aExcluir.nome} — ${USUARIOS_TEXTOS.excluirDescricao}`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={() => {
            avisoDeExcluido({ o: "Usuário", detalhe: `${aExcluir.nome} saiu da base.` });
            setAExcluir(null);
          }}
        />
      )}
    </div>
  );
}
