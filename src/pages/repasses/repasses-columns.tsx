import { Eye } from "lucide-react";
import type { DataTableColumnDef } from "@snksergio/design-system";
import { Dinheiro, StatusChip } from "./repasses-ui";
import { REPASSES, type Repasse, type StatusRepasse } from "./repasses-mock";

/**
 * Rótulos só pras OPÇÕES do filtro. O chip visual vem do `repasses-ui`, que é a fonte
 * única — declarar o mapa duas vezes é como a mesma informação ganha duas aparências.
 */
const ROTULO_STATUS: Record<StatusRepasse, string> = {
  "em-aberto": "Em aberto",
  pago: "Pago",
  processando: "Processando",
};

const OPCOES_STATUS = (Object.keys(ROTULO_STATUS) as StatusRepasse[]).map((s) => ({
  value: s,
  label: ROTULO_STATUS[s],
}));

/** Meses presentes nos dados, na ordem do calendário — pro filtro de coluna. */
const OPCOES_MES = [...new Set(REPASSES.map((r) => r.mes))].map((m) => ({
  value: m,
  label: m,
}));

interface HandlersColuna {
  /** Abre o painel de detalhe do repasse. */
  onVerDetalhes: (row: Repasse) => void;
}

/**
 * Colunas de Repasses — as **seis da referência**: Mês · Ano · Repasse líquido · Take rate
 * líquido · Status · Ações.
 *
 * Função e não constante, pelo mesmo motivo de Transações: a coluna de ações precisa do
 * handler do painel, e um módulo não tem acesso ao state da página.
 *
 * ⚠️ **`type: "currency"` nas duas colunas de dinheiro, mesmo com `render` próprio.** O
 * tipo não é só formatação: é ele que dá o `align: "right"` default e faz o filtro e o sort
 * tratarem o valor como número (L-038 — o default do column-type é resolvido na fonte
 * única). Com `type: "text"` a coluna ordenaria alfabeticamente, e `-R$ 0,01` viria depois
 * de `R$ 25.569,89`.
 */
export function construirColunas(
  handlers: HandlersColuna,
): DataTableColumnDef<Repasse>[] {
  return [
    {
      field: "mes",
      headerName: "Mês",
      type: "text",
      sortable: true,
      isPrimary: true,
      enableColumnFilter: true,
      filterType: "multiSelect",
      filterOptions: OPCOES_MES,
      /* `multiSelect` e não `select`: o operador vira `isAnyOf` (DataTable/USAGE.md:636),
         e quem confere repasse olha um trimestre, não um mês por vez. */
    },
    {
      field: "ano",
      headerName: "Ano",
      type: "number",
      sortable: true,
      /* Sem separador de milhar: ano não é quantidade. O `type: "number"` alinharia à
         direita por default — aqui fica à esquerda de propósito, porque o par Mês+Ano lê
         como uma coisa só e uma alinhada à direita separaria os dois visualmente. */
      align: "left",
      render: ({ row }) => <span className="tabular-nums">{row.ano}</span>,
    },
    {
      field: "repasseLiquido",
      headerName: "Repasse líquido",
      type: "currency",
      sortable: true,
      render: ({ row }) => <Dinheiro valor={row.repasseLiquido} />,
    },
    {
      field: "takeRate",
      /* A referência rotula "Take rate <marca> líquido". A marca do sistema de origem não
         entra em texto de produto — e "Take rate líquido" não perde informação: o take rate
         é, por definição, o da plataforma. */
      headerName: "Take rate líquido",
      type: "currency",
      sortable: true,
      /* Neutro, não verde: o take rate é receita da plataforma, não do parceiro que está
         olhando a tela. Pintar de sucesso diria "isto é seu ganho", e é o contrário. */
      render: ({ row }) => (
        <span className="tabular-nums text-fg-default">
          {row.takeRate.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      enableColumnFilter: true,
      filterType: "multiSelect",
      filterOptions: OPCOES_STATUS,
      render: ({ row }) => <StatusChip status={row.status} />,
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      sortable: false,
      hideable: false,
      /* `onClick`, não `onSelect`: item de ação de LINHA tem assinatura própria
         (`DataTableActionItem`), diferente dos itens do `moreMenu` do toolbar. */
      getActions: ({ row }) => [
        {
          id: "ver-detalhes",
          label: "Ver detalhes",
          icon: <Eye />,
          onClick: () => handlers.onVerDetalhes(row),
        },
      ],
    },
  ];
}
