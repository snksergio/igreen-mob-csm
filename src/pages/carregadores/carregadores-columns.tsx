import { Pencil, Trash2 } from "lucide-react";
import type { DataTableColumnDef } from "@snksergio/design-system";
import { Etiqueta } from "~/pages/transacoes/transacoes-ui";
import type { Carregador } from "./carregadores-mock";
import { StatusConexaoTexto } from "./carregadores-ui";

/**
 * Colunas de Carregadores — as nove da referência: `Empresa · Local · Nome · ID · CPCODE ·
 * Status · Modelo · Preço · Ações`.
 *
 * É a tabela mais larga do produto. Com `autoFit` e nove colunas, cada piso aqui é disputa
 * direta com o vizinho — os valores abaixo foram medidos no conteúdo real, não escolhidos.
 */
export function construirColunas(handlers: {
  onEditar: (row: Carregador) => void;
  onExcluir: (row: Carregador) => void;
  onAbrirPerfil: (row: Carregador) => void;
}): DataTableColumnDef<Carregador>[] {
  return [
    {
      field: "empresa",
      headerName: "Empresa",
      type: "text",
      width: 104,
      /* Mesma etiqueta neutra das outras quatro telas — a mesma entidade não pode mudar de
         aparência de tela pra tela. */
      render: ({ row }) => <Etiqueta>{row.empresa}</Etiqueta>,
    },
    {
      field: "local",
      headerName: "Local",
      type: "text",
      ellipsis: true,
      copyable: true,
      isPrimary: true,
      /* O nome mais longo desta tela tem 51 caracteres ("Padaria Cipó - Padaria na Serra do
         Cipó" com o prefixo). Com nove colunas não há sobra pra distribuir: este piso é o
         que ficou depois de apertar as colunas de texto curto. */
      width: 320,
    },
    {
      field: "nome",
      headerName: "Nome",
      type: "text",
      width: 108,
      render: ({ row }) => (
        <span className="font-medium text-fg-default">{row.nome}</span>
      ),
    },
    {
      field: "identificador",
      headerName: "ID",
      type: "text",
      ellipsis: true,
      /* `copyable` porque é o valor que se cola num chamado — e é o mais longo da tabela:
         `01060125460010110002`, 20 caracteres — que MEDIDO desenha 150px. Com os 180 que
         eu tinha posto, a célula ficava com 148 e ele cortava por 2px: o suficiente pra
         comer o último dígito do valor que existe pra ser copiado. */
      copyable: true,
      width: 192,
      render: ({ row }) => (
        <span className="tabular-nums">{row.identificador}</span>
      ),
    },
    {
      field: "cpcode",
      headerName: "CPCODE",
      type: "text",
      copyable: true,
      width: 100,
      render: ({ row }) => <span className="tabular-nums">{row.cpcode}</span>,
    },
    {
      field: "status",
      headerName: "Status",
      width: 96,
      sortable: true,
      /* Texto colorido, não `Chip`: são nove colunas, e uma pastilha aqui competiria com o
         link de Preço e com os dois botões de ação na mesma linha. A referência também usa
         texto. */
      render: ({ row }) => <StatusConexaoTexto status={row.status} />,
    },
    {
      field: "modelo",
      headerName: "Modelo",
      type: "text",
      ellipsis: true,
      /* 100: o maior modelo (`NDC60-W2b`) desenha 77px, e o piso de uma coluna inclui o
         header mais o espaço que o `TableHeadCell` reserva pra sort e menu (L-052b). Os
         24px que sobravam foram pro `Local`. */
      width: 100,
    },
    {
      field: "perfilDePreco",
      headerName: "Preço",
      width: 116,
      sortable: true,
      valueGetter: (row) => row.perfilDePreco ?? "",
      /* Link, e não texto: na referência o nome do perfil é clicável e abre o painel de
         preço — o MESMO painel da tela de Preços. É o que liga as duas telas, e por isso o
         handler sobe pra página em vez de virar navegação. */
      render: ({ row }) =>
        row.perfilDePreco ? (
          <button
            type="button"
            onClick={(e) => {
              /* Sem o `stopPropagation` o clique borbulha pro `onRowClick` e o painel de
                 EDIÇÃO abre por cima do de preço. */
              e.stopPropagation();
              handlers.onAbrirPerfil(row);
            }}
            /* `w-full text-left`: sem isso o botão encolhe ao tamanho do texto e o `truncate`
               passa a cortar pelo próprio arredondamento subpixel — MEDIDO em 77px de botão
               pra 78px de texto, comendo o fim de `Perfil padrão` numa célula de 116 que
               tinha espaço de sobra. */
            className="w-full truncate text-left rounded-radius-sm text-body-sm text-fg-brand underline underline-offset-2 transition-colors hover:text-fg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
          >
            {row.perfilDePreco}
          </button>
        ) : (
          <span className="text-fg-subtle">–</span>
        ),
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      sortable: false,
      hideable: false,
      /* Duas ações, como na referência: editar e excluir. A de excluir é `destructive`, que
         é o que o `DataTable` usa pra pintá-la de perigo no menu. */
      getActions: ({ row }) => [
        {
          id: "editar",
          label: "Editar carregador",
          icon: <Pencil />,
          onClick: () => handlers.onEditar(row),
        },
        {
          id: "excluir",
          label: "Excluir carregador",
          icon: <Trash2 />,
          destructive: true,
          onClick: () => handlers.onExcluir(row),
        },
      ],
    },
  ];
}
