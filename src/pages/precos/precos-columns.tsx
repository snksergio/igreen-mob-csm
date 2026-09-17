import { Pencil } from "lucide-react";
import type { DataTableColumnDef } from "@snksergio/design-system";
import { Etiqueta } from "~/pages/transacoes/transacoes-ui";
import { temRecargaGratis, type PerfilDePreco } from "./precos-mock";
import { CelulaDeTags, SimNao } from "./precos-ui";

/**
 * Colunas de Preços — as sete da referência: `Empresa · Local · Nome · Padrão ·
 * Recarga grátis · Tags · Ações`.
 */
export function construirColunas(handlers: {
  onEditar: (row: PerfilDePreco) => void;
}): DataTableColumnDef<PerfilDePreco>[] {
  return [
    {
      field: "empresa",
      headerName: "Empresa",
      type: "text",
      width: 120,
      /* Mesma etiqueta neutra de Empresa em Transações e Gestão de Carga — as três telas
         falam da mesma entidade, e divergir de aparência faria parecer coisa diferente. */
      render: ({ row }) => <Etiqueta>{row.empresa}</Etiqueta>,
    },
    {
      field: "local",
      headerName: "Local",
      type: "text",
      ellipsis: true,
      copyable: true,
      isPrimary: true,
      /* Piso alto: o maior nome aqui tem 52 caracteres ("Supermercado Mais Opção -
         Jaboticatubas"). Com `autoFit` isto é piso e entra no rateio da sobra — e como as
         sete colunas somam exatamente a largura útil a 1440px, NÃO HÁ sobra: o que este
         piso ganha veio de encolher `Nome`, `Padrão` e `Tags`, que carregam texto curto. */
      width: 396,
    },
    {
      field: "nome",
      headerName: "Nome",
      type: "text",
      /* 120: "Perfil padrão" mede ~85px e o header "Nome" é curto. O piso de uma coluna
         inclui o header MAIS o espaço que o `TableHeadCell` reserva pra sort e menu
         (L-052b), e é por isso que 120 e não 90. */
      width: 120,
      render: ({ row }) => (
        <span className="font-medium text-fg-default">{row.nome}</span>
      ),
    },
    {
      /* ⚠️ **Coluna com o MESMO conteúdo da anterior, e é medição.** A referência traz
         `Perfil padrão` nas duas em 10/10 linhas — `Nome` é o nome deste perfil e `Padrão` é
         o perfil marcado como padrão do local, que nos dados capturados coincidem sempre.
         Colapsar as duas aqui esconderia a pergunta ("são sempre iguais?") em vez de
         respondê-la, e a resposta muda a tela: se forem sempre iguais, uma delas sai. */
      field: "padrao",
      headerName: "Padrão",
      type: "text",
      width: 120,
    },
    {
      field: "recargaGratis",
      headerName: "Recarga grátis",
      width: 140,
      sortable: true,
      /* Derivada do modo de cobrança — ver `temRecargaGratis`. Sem o `valueGetter` a
         ordenação leria um campo que não existe e não ordenaria nada, calada. */
      valueGetter: (row) => (temRecargaGratis(row) ? "Sim" : "Não"),
      render: ({ row }) => <SimNao valor={temRecargaGratis(row)} />,
    },
    {
      field: "tags",
      headerName: "Tags",
      /* 160, e não 128: o perfil de duas tags ("Hotel", "Parceiro") quebrava em duas linhas
         e esticava a altura da linha inteira. Os 32px vieram do `Local`, que ainda sobra —
         o nome mais longo desenha 349px numa célula de 363. */
      width: 160,
      sortable: false,
      render: ({ row }) => <CelulaDeTags tags={row.tags} />,
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      sortable: false,
      hideable: false,
      /* A referência tem SÓ o lápis nesta coluna — nenhum menu, nenhum "ver detalhes". O
         perfil não tem tela de leitura: abrir é editar. */
      getActions: ({ row }) => [
        {
          id: "editar",
          label: "Editar perfil",
          icon: <Pencil />,
          onClick: () => handlers.onEditar(row),
        },
      ],
    },
  ];
}
