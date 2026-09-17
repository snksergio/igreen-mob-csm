import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  PageHeader,
  presetView,
  type DataTablePresetView,
} from "@snksergio/design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@snksergio/design-system/shadcn";
import { LOCAIS } from "~/pages/transacoes/transacoes-mock";
import { ANOS, REPASSES, type Repasse } from "./repasses-mock";
import { construirColunas } from "./repasses-columns";
import { RepasseDetailPanel } from "./RepasseDetailPanel";

/**
 * Tela de Repasses — medida em `/pt/financial/transfers` (2026-09-16).
 *
 * ## Mesma estrutura de Transações, e de propósito
 *
 * `PageHeader` com contagem + ação · `DataTable` com `flex-1 min-h-0` · painel de detalhe
 * aberto pelo clique na linha E pela ação "Ver detalhes". Reaproveitar não é preguiça: é o
 * que faz as duas telas de tabela do produto se comportarem igual — mesma posição de
 * filtro, mesmo lugar de paginação, mesmo gesto pra abrir detalhe.
 *
 * ## As duas diferenças em relação a Transações
 *
 * · **Filtra por ANO, não por período.** A referência tem um seletor de ano (`2026`), não
 *   um intervalo de datas — faz sentido: a granularidade da tela já é o mês, e um
 *   `DatePicker` de intervalo sobre linhas mensais deixaria escolher "12/09 a 14/09", que
 *   não corresponde a nenhuma linha. Por isso um `Select`, não o `DatePicker`.
 * · **O detalhe é PAINEL, não tela nova.** Na origem "Ver detalhes" navega pra
 *   `/pt/financial-details/<uuid>`. Decisão do operador; ver o JSDoc do
 *   `RepasseDetailPanel`, que é a adaptação do bloco `dsgreen-paneldetail-3`.
 */

/**
 * Visões por STATUS — "Em aberto" e "Finalizado".
 *
 * ⚠️ `operator: "isAnyOf"`, não `"equals"`: o `presetView` assume `equals` por default, e
 * a coluna de status é `multiSelect` — com `equals` o chip aparece aplicado e a tabela não
 * filtra nada. Medido em Transações, mesma armadilha.
 *
 * ⛔ **ORÇAMENTO DE ABAS: estas 2 são o limite.** O `maxViewTabs` do `DataTable` é `3`
 * **contando a "Default"**, e o excedente é cortado por `.slice()` em silêncio (só um
 * `console.warn` em DEV). Uma 3ª visão aqui não apareceria.
 *
 * "Finalizado" hoje vem vazia: as 12 linhas medidas estão todas "Em aberto". É de
 * propósito — a visão existe porque o status existe no domínio, e o estado vazio diz a
 * verdade em vez de eu inventar repasse pago.
 */
const VISOES: DataTablePresetView[] = [
  presetView({
    id: "preset:em-aberto",
    name: "Em aberto",
    filters: [{ field: "status", operator: "isAnyOf", value: ["em-aberto"] }],
  }),
  presetView({
    id: "preset:finalizado",
    name: "Finalizado",
    filters: [{ field: "status", operator: "isAnyOf", value: ["pago"] }],
  }),
];

export function RepassesPage() {
  const [ano, setAno] = useState<number>(ANOS[0]);
  const [detalhe, setDetalhe] = useState<Repasse | null>(null);

  const colunas = useMemo(
    () => construirColunas({ onVerDetalhes: setDetalhe }),
    [],
  );

  /**
   * O filtro de ano filtra de verdade.
   *
   * Só 2026 tem dado medido, então 2025 e 2024 devolvem lista vazia — e isso é honesto: o
   * estado vazio do `DataTable` aparece e diz que não há repasse no ano. Popular anos
   * anteriores com dado inventado faria a tela parecer mais completa do que a medição
   * autoriza.
   */
  const linhas = useMemo(() => REPASSES.filter((r) => r.ano === ano), [ano]);

  /**
   * Navegação entre repasses — é o que dá função às setas `‹ ›` do painel.
   *
   * Resolvida AQUI e não no painel porque só a página conhece a lista filtrada: o
   * vizinho de Setembro depende do ano selecionado e dos filtros da tabela. O painel
   * recebe a ação e os dois booleanos, e não precisa saber de lista nenhuma.
   */
  const indiceAtual = detalhe
    ? linhas.findIndex((r) => r.id === detalhe.id)
    : -1;

  const navegar = (direcao: "anterior" | "seguinte") => {
    const proximo = indiceAtual + (direcao === "seguinte" ? 1 : -1);
    const alvo = linhas[proximo];
    if (alvo) setDetalhe(alvo);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Repasses"
        /* Texto literal da referência — o aviso recorrente do escopo global. */
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {linhas.length} {linhas.length === 1 ? "repasse" : "repasses"}
          </Chip>
        }
        /* Só a ação de página. O seletor de ano desceu pro toolbar da tabela — ver a
           `customLeft` abaixo. */
        actions={
          <Button variant="filled" color="primary" size="md" iconLeft={<Download />}>
            Baixar dados
          </Button>
        }
      />

      <DataTable<Repasse>
        rows={linhas}
        columns={colunas}
        getRowId={(r) => r.id}
        /* ⚠️ `flex-1 min-h-0` é o que mantém a PAGINAÇÃO SEMPRE VISÍVEL. O `DataTable` já
           entrega o `<Table>` interno com `min-h-0 max-h-full` e o container de scroll
           dele é `flex-1 min-h-0 overflow-auto`, mas esse mecanismo só ARMA quando a raiz
           tem altura limitada. Mesma razão e mesmo idiom de Transações. */
        className="flex-1 min-h-0"
        /* `persistId` NÃO é opcional: a barra de visões só renderiza com
           `persistId && defaultViews.length > 0` (data-table.tsx:1766). Sem ele o
           `defaultViews` é aceito, compila, e as abas simplesmente não aparecem. */
        persistId="igreen-mob-cms.repasses"
        defaultViews={VISOES}
        /* `false` esconde o "+" de salvar visão própria (L-054): as abas aqui são fixas
           — Default · Em aberto · Finalizado — e o usuário não cria visões nesta tela. */
        allowCreateView={false}
        showEmptyFilterChips={["mes", "status"]}
        /* Linha clicável abre o detalhe, igual Transações — e a ação "Ver detalhes" da
           coluna de ações faz o mesmo. Dois caminhos pro mesmo lugar, porque a referência
           só tem o link e o clique na linha é o gesto que a pessoa tenta primeiro. */
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
          /* ⚠️ **Recorte de tempo mora no TOOLBAR, ao lado da busca — padrão deste
             projeto.** Ele estava no `PageHeader`, ao lado de "Baixar dados", e isso
             misturava duas coisas: filtro do dado e ação sobre o dado. Transações já
             punha o `DatePicker` aqui (`toolbar.customLeft`), e ter o mesmo recorte em
             dois lugares diferentes obriga a procurar em cada tela onde está.

             `customLeft`, e não `toolbar.actions`: os kinds de `ToolbarAction` são
             `button`/`dropdown`/`input` e nenhum recebe componente (L-051). Renderiza
             entre o refresh e a busca. Exige DS 0.64.0+. */
          customLeft: (
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger className="w-[104px]" aria-label="Filtrar por ano">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ),
        }}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <RepasseDetailPanel
        repasse={detalhe}
        onClose={() => setDetalhe(null)}
        /* O card do painel cita quantos locais entram na soma — é o texto da referência
           ("38 de 39 locais selecionados"). Aqui vem do escopo global do mock. */
        locaisSelecionados={LOCAIS.length}
        totalDeLocais={LOCAIS.length}
        onNavegar={navegar}
        /* As setas desabilitam nas pontas. Seta clicável que não vai a lugar nenhum é a
           mesma classe de defeito que "controle que não controla". */
        temAnterior={indiceAtual > 0}
        temSeguinte={indiceAtual >= 0 && indiceAtual < linhas.length - 1}
      />
    </div>
  );
}
