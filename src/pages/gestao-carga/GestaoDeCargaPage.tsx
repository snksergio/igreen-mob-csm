import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import {
  Chip,
  DataTable,
  PageHeader,
  type DataTableColumnDef,
} from "@snksergio/design-system";
import { Etiqueta } from "~/pages/transacoes/transacoes-ui";
import {
  LOCAIS_DE_CARGA,
  potenciaEmUso,
  type LocalDeCarga,
} from "./gestao-carga-mock";
import { Potencia } from "./gestao-carga-ui";
import { GestaoDeCargaDetailPanel } from "./GestaoDeCargaDetailPanel";
import {
  TABELA_DE_PAGINA,
  RAIZ_DE_PAGINA,
} from "~/components/altura-de-tabela";

/**
 * Tela de Gestão de Carga — medida em `/pt/smartspott?page=1` (2026-09-16).
 *
 * Quarta tela de tabela do produto, e a mais simples delas: **três colunas de dado**
 * (`Empresa · Local · Potência em uso`) mais a de ações. Segue o mesmo esqueleto de
 * Transações, Performance e Repasses — `PageHeader` com contagem, `DataTable` com
 * `flex-1 min-h-0`, painel aberto por clique na linha e pela ação.
 *
 * ## Sem filtro de período, e é a única assim
 *
 * As outras três filtram tempo (intervalo em Transações e Performance, ano em Repasses).
 * Esta não tem nenhum: **o que ela mostra é estado AGORA**, não histórico — potência em uso
 * é uma leitura instantânea da rede. Um seletor de data aqui prometeria um recorte temporal
 * que o dado não tem.
 *
 * ## A coluna de potência é derivada, não armazenada
 *
 * `potenciaEmUso()` soma os carregadores do local — os mesmos que o painel lista. Assim o
 * número da lista e o do painel não podem divergir, que é o defeito mais fácil de produzir
 * numa tela mestre-detalhe. Invariante testada.
 */

function construirColunas(handlers: {
  onVerDetalhes: (row: LocalDeCarga) => void;
}): DataTableColumnDef<LocalDeCarga>[] {
  return [
    {
      field: "empresa",
      headerName: "Empresa",
      type: "text",
      width: 132,
      /* Etiqueta neutra, o mesmo tratamento de Empresa em Transações — as duas telas falam
         da mesma entidade e divergir de aparência faria parecer coisa diferente. */
      render: ({ row }) => <Etiqueta>{row.empresa}</Etiqueta>,
    },
    {
      field: "local",
      headerName: "Local",
      type: "text",
      ellipsis: true,
      copyable: true,
      isPrimary: true,
      /* Piso alto porque é a coluna que carrega o nome inteiro — e os nomes desta tela são
         os mais longos do produto ("ESPAÇO 356 (Entrada 4º andar) - Carga rápida", 47
         caracteres). Com `autoFit` isto é piso e entra no rateio da sobra. */
      width: 420,
    },
    {
      field: "potenciaEmUsoKw",
      headerName: "Potência em uso",
      align: "right",
      sortable: true,
      width: 148,
      /* ⚠️ `valueGetter` **e** `render`, os dois derivando da mesma função. Sem o
         `valueGetter` a ordenação leria `row.potenciaEmUsoKw`, que não existe — a coluna
         mostraria `6,7 kW` e ordenaria por `undefined`, ou seja, não ordenaria, calada. */
      valueGetter: (row) => potenciaEmUso(row),
      render: ({ row }) => <Potencia kw={potenciaEmUso(row)} />,
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      sortable: false,
      hideable: false,
      /* `onClick`, não `onSelect`: item de ação de LINHA tem assinatura própria. */
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

export function GestaoDeCargaPage() {
  const [detalhe, setDetalhe] = useState<LocalDeCarga | null>(null);

  const colunas = useMemo(
    () => construirColunas({ onVerDetalhes: setDetalhe }),
    [],
  );

  return (
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Gestão de Carga"
        /* Texto literal da referência — o aviso recorrente do escopo global. */
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {LOCAIS_DE_CARGA.length} locais
          </Chip>
        }
        /* Sem ação de página: a referência não tem botão de download aqui, e não tem porque
           não há o que exportar — a tela é um índice pra chegar no painel de cada local. */
      />

      <DataTable<LocalDeCarga>
        rows={LOCAIS_DE_CARGA}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        /* ⚠️ `flex-1 min-h-0` é o que mantém a paginação sempre visível. O mecanismo
           interno do `DataTable` só ARMA quando a raiz tem altura limitada — mesma razão e
           mesmo idiom das outras três telas de tabela. */
        className={TABELA_DE_PAGINA}
        persistId="igreen-mob-cms.gestao-carga"
        /* Sem visões pré-definidas: esta tela não tem status nem período pra recortar. O
           "+" sai junto, senão sobraria o convite de salvar um recorte que não existe. */
        allowCreateView={false}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          /* ⚠️ **`title` é o `soloLabel` da barra de visões — padrão deste projeto.**
             Quando a aba Default é a ÚNICA, ela se chamaria literalmente "Default", que
             não diz nada sobre o que está na tela. O `DataTable` repassa `toolbar.title`
             como `soloLabel` (`data-table.tsx:1557`) e a aba passa a nomear o conteúdo.
             Assim que existir uma segunda visão o componente volta a chamá-la "Default",
             porque aí o nome precisa distinguir "sem recorte" das visões nomeadas. */
          title: "Lista de cargas",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
        }}
        paginationConfig={{
          enabled: true,
          /* 10 por página, como a referência — que mostra "1 de 4" pra ≈38 locais. */
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <GestaoDeCargaDetailPanel
        local={detalhe}
        onClose={() => setDetalhe(null)}
      />
    </div>
  );
}
