import { Eye } from "lucide-react";
import type { DataTableColumnDef } from "@snksergio/design-system";
import {
  Dinheiro,
  Etiqueta,
  MotoristaCelula,
  StatusChip,
} from "./transacoes-ui";
import {
  CARREGADORES,
  EMPRESAS,
  LOCAIS,
  type Transacao,
  type TransacaoStatus,
} from "./transacoes-mock";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const KWH = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function duracaoLegivel(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}min`;
}

/** Célula de duas linhas: valor em cima, contexto em caption embaixo. */
function CelulaDupla({ principal, apoio }: { principal: string; apoio: string }) {
  return (
    <span className="flex flex-col gap-gp-2xs">
      <span className="text-body-sm text-fg-default tabular-nums">{principal}</span>
      <span className="text-caption-md text-fg-muted tabular-nums">{apoio}</span>
    </span>
  );
}

/**
 * Rótulos só pras OPÇÕES do filtro. O chip visual vem do `transacoes-ui`, que é a fonte
 * única — declarar o mapa duas vezes é como a mesma informação ganha duas aparências.
 */
const ROTULO_STATUS: Record<TransacaoStatus, string> = {
  finalizado: "Finalizado",
  "em-andamento": "Em andamento",
  falha: "Falha",
};

const OPCOES_STATUS = (Object.keys(ROTULO_STATUS) as TransacaoStatus[]).map((s) => ({
  value: s,
  label: ROTULO_STATUS[s],
}));

interface HandlersColuna {
  /** Abre o painel de detalhe da transação. */
  onVerDetalhes: (row: Transacao) => void;
}

/**
 * As colunas são uma FUNÇÃO, não uma constante, porque a coluna de ações precisa do
 * handler do painel — e um módulo não tem acesso ao state da página.
 *
 * ⚠️ Os filtros de Empresa, Local, Carregador e Recargas são `multiSelect`, não
 * `select`. O operador vira `isAnyOf` automaticamente (DataTable/USAGE.md:636), então
 * o usuário marca vários valores e a tabela filtra pela união — que é o que a tela
 * pede: ninguém olha um local por vez quando tem 38 deles no seletor do topo.
 */
export function construirColunas(
  handlers: HandlersColuna,
): DataTableColumnDef<Transacao>[] {
  return [
    { field: "data", headerName: "Data", type: "date", sortable: true },
    {
      field: "empresa",
      headerName: "Empresa",
      type: "text",
      enableColumnFilter: true,
      filterType: "multiSelect",
      filterOptions: EMPRESAS.map((e) => ({ value: e, label: e })),
      render: ({ row }) => <Etiqueta>{row.empresa}</Etiqueta>,
    },
    {
      field: "local",
      headerName: "Local",
      type: "text",
      ellipsis: true,
      enableColumnFilter: true,
      filterType: "multiSelect",
      filterOptions: LOCAIS.map((l) => ({ value: l, label: l })),
    },
    {
      field: "aplicativo",
      headerName: "Aplicativo",
      type: "text",
      render: ({ row }) => <Etiqueta>{row.aplicativo}</Etiqueta>,
    },
    {
      field: "motorista",
      headerName: "Motorista",
      type: "text",
      sortable: true,
      copyable: true,
      /* 240 = o mesmo da coluna de licenciado do `example-finance`
         (`finance-screen.tsx:117`). Com `autoFit` isto é PISO, não trava: entra no
         rateio da sobra e pode crescer. É a única coluna com piso declarado, porque é
         a única que carrega avatar + nome — as outras o `autoFit` resolve sozinho. */
      width: 240,
      isPrimary: true,
      render: ({ row }) => <MotoristaCelula nome={row.motorista} />,
    },
    {
      field: "carregador",
      headerName: "Carregador",
      type: "text",
      copyable: true,
      enableColumnFilter: true,
      filterType: "multiSelect",
      filterOptions: CARREGADORES.map((c) => ({ value: c, label: c })),
    },
    {
      field: "energiaKwh",
      headerName: "Energia",
      align: "right",
      sortable: true,
      render: ({ row }) => (
        <CelulaDupla
          principal={`${KWH.format(row.energiaKwh)} kWh`}
          apoio={`${row.socInicial}% - ${row.socFinal}%`}
        />
      ),
    },
    {
      field: "valor",
      headerName: "Valor",
      type: "currency",
      align: "right",
      sortable: true,
      render: ({ row }) => <Dinheiro valor={row.valor} />,
    },
    {
      field: "veiculo",
      headerName: "Veículo",
      type: "text",
      valueFormatter: (v) => (v ? String(v) : "-"),
    },
    {
      field: "cupomValor",
      headerName: "Cupom",
      align: "right",
      /* TETO, não piso. O conteúdo é curto ("R$ 6,94" + "CPO") e `–` em 59 das 64
         linhas, mas o `autoFit` distribui a sobra proporcionalmente e essa coluna
         recebia largura de sobra pro que mostra. `maxWidth` a tira do rateio pra cima
         sem travá-la — travar de verdade seria `width` + `maxWidth` iguais. */
      maxWidth: 104,
      render: ({ row }) =>
        row.cupomValor === null ? (
          <span className="text-body-sm text-fg-muted">-</span>
        ) : (
          <CelulaDupla principal={BRL.format(row.cupomValor)} apoio={row.cupomTipo ?? ""} />
        ),
    },
    {
      field: "duracaoMin",
      headerName: "Duração",
      sortable: true,
      render: ({ row }) => (
        <CelulaDupla
          principal={duracaoLegivel(row.duracaoMin)}
          apoio={`${row.horaInicio} - ${row.horaFim}`}
        />
      ),
    },
    {
      field: "status",
      headerName: "Recargas",
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
      /* `onClick`, nao `onSelect`: o item de acao de LINHA tem assinatura propria
         (`DataTableActionItem`), diferente dos itens do `moreMenu` do toolbar, que usam
         `onSelect`. Trocar os dois nao compila. */
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
