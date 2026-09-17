import { Eye } from "lucide-react";
import { Button, type DataTableColumnDef } from "@snksergio/design-system";
import {
  ROTULO_STATUS,
  STATUS_NA_ORDEM,
  type Plugue,
} from "./monitoramento-mock";
import {
  CarimboDeStatus,
  ChipDeStatus,
  Disponibilidade,
  PontoDeConexao,
} from "./monitoramento-ui";

/**
 * Colunas da tabela de plugues — as dez da referência, na ordem dela.
 *
 * ⚠️ **As larguras são MEDIDAS, não escolhidas.** O piso de cada coluna é o texto do header
 * MAIS o que o `TableHeadCell` reserva pra sort e menu — 54px nas de texto, 33px nas
 * numéricas (L-052b). `ID Carregador` é a mais larga porque o identificador longo da
 * referência (`01060125460010110002`) tem 20 dígitos; cortá-lo torna a coluna inútil,
 * porque é justamente o valor que se copia pra abrir chamado.
 *
 * ## Duas colunas da referência não estão aqui
 *
 * Com as dez, o piso somado dava **1163px numa área útil de 1100** — não cabiam nem
 * espremidas, e o resultado medido foi 414px de scroll horizontal com `Ver detalhes`
 * cortado ao meio. As duas que saíram são as que não informam:
 *
 * - **`Empresa`** — uma só no escopo, repetida em 23 linhas, e o escopo já está no seletor
 *   do topo da página. Continua no painel, onde é ficha e não coluna.
 * - **`Veículo`** — `–` em 100% das linhas da referência e daqui: o veículo plugado não é
 *   modelado. Mesmo critério do `Complemento` em Motoristas — coluna vazia custando 100px é
 *   espaço tirado de `CPF` e `Telefone`, que têm o que mostrar.
 */
export function construirColunas(handlers: {
  onVerDetalhes: (row: Plugue) => void;
}): DataTableColumnDef<Plugue>[] {
  return [
    {
      field: "local",
      headerName: "Local",
      type: "text",
      ellipsis: true,
      isPrimary: true,
      /* A mais larga do grupo de texto, mas 160 e não 300: os nomes chegam a
         "IGREEN MOB - ESPAÇO 356 (Entrada 4º andar) - Carga rápida" e truncariam de
         qualquer jeito. `ellipsis` devolve o texto inteiro no hover.

         160 é o que SOBRA depois que as outras sete ficam no piso delas — é esta que
         absorve o resto, porque é a única cujo conteúdo trunca sem perder sentido. Com
         `autoFit` a largura é piso, então em telas largas ela cresce de volta sozinha. */
      width: 160,
      enableColumnFilter: true,
      filterType: "multiSelect",
    },
    {
      field: "idCarregador",
      headerName: "ID Carregador",
      type: "text",
      copyable: true,
      /* 168 = os 86px do header + os 54 de sort/menu, com folga pro ícone de copiar. O
         conteúdo de 20 dígitos ainda é o que manda aqui. */
      width: 168,
      render: ({ row }) => (
        <span className="tabular-nums">{row.idCarregador}</span>
      ),
    },
    {
      field: "id",
      headerName: "ID Plugue",
      type: "text",
      copyable: true,
      /* 134 medidos: 59 de header + 54 de sort/menu + o ícone de copiar. Declarei 113
         antes e o componente subiu pra 134 sozinho — o piso manda. */
      width: 134,
      render: ({ row }) => <span className="tabular-nums">{row.id}</span>,
    },
    {
      field: "conectado",
      headerName: "Conexão",
      align: "center",
      /* 108 é o PISO, não escolha: "Conexão" desenha 54px e o `TableHeadCell` reserva
         outros 54. Abaixo disso o próprio header trunca. */
      width: 108,
      sortable: true,
      /* Filtro de coluna aqui é o terceiro chip da barra, e é o mais útil dos três numa
         tela de monitoramento: "mostre tudo que parou de falar". */
      enableColumnFilter: true,
      filterType: "select",
      /* `valueGetter` porque o valor renderizado é um ponto: sem ele a ordenação usaria o
         booleano cru e a busca do toolbar nunca encontraria "desconectado". */
      valueGetter: (row) => (row.conectado ? "Conectado" : "Desconectado"),
      render: ({ row }) => (
        <span className="flex justify-center">
          <PontoDeConexao conectado={row.conectado} />
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      /* 124: o chip mais longo é `Indisponível` (~86px) mais o padding da célula. */
      width: 124,
      enableColumnFilter: true,
      filterType: "multiSelect",
      /* Rótulo, não a chave: o chip do filtro mostra o valor bruto, e `indisponivel` numa
         lista de opções ao lado de "Disponível" parece defeito. */
      valueGetter: (row) => ROTULO_STATUS[row.status],
      filterOptions: STATUS_NA_ORDEM.map((s) => ({
        value: ROTULO_STATUS[s],
        label: ROTULO_STATUS[s],
      })),
      render: ({ row }) => <ChipDeStatus status={row.status} />,
    },
    {
      field: "ultimoStatus",
      headerName: "Último status",
      /* 137 é o piso: 83px de header + 54. O conteúdo em duas linhas cabe em menos. */
      width: 137,
      sortable: true,
      render: ({ row }) => <CarimboDeStatus iso={row.ultimoStatus} />,
    },
    {
      field: "disponibilidade",
      headerName: "Disponibilidade",
      align: "right",
      /* 147 medidos. O header tem 96px de texto — é o mais longo da tabela — e é ele,
         não o valor de 5 caracteres, que define o piso. */
      width: 147,
      sortable: true,
      render: ({ row }) => <Disponibilidade pct={row.disponibilidade} />,
    },
    {
      field: "acoes",
      headerName: "Ações",
      align: "right",
      /* 120 e não 96: o botão `Ver detalhes` com ícone desenha ~118px, e em 96 ele saía
         cortado como "er detalhes" — medido. */
      width: 120,
      sortable: false,
      render: ({ row }) => (
        <span className="flex justify-end">
          <Button
            variant="ghost"
            color="secondary"
            size="sm"
            iconLeft={<Eye />}
            aria-label={`Ver detalhes do plugue ${row.id}`}
            onClick={(e) => {
              /* Sem isto o clique sobe pro `onRowClick` e o painel abre duas vezes — a
                 segunda abertura remonta o conteúdo e perde a aba escolhida. */
              e.stopPropagation();
              handlers.onVerDetalhes(row);
            }}
          >
            Ver detalhes
          </Button>
        </span>
      ),
    },
  ];
}
