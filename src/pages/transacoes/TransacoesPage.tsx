import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  DatePicker,
  PageHeader,
  presetView,
  type DateRange,
  type DataTablePresetView,
} from "@snksergio/design-system";
import { dentroDoPeriodo, rotuloDoPeriodo } from "~/components/periodo";
import { construirColunas } from "./transacoes-columns";
import { TRANSACOES_MOCK, type Transacao } from "./transacoes-mock";
import { TransacaoDetailPanel } from "./sections/TransacaoDetailPanel";
import {
  ALTURA_DE_TABELA,
  RAIZ_DE_PAGINA,
} from "~/components/altura-de-tabela";

/**
 * As duas visões fixas.
 *
 * ⚠️ `operator: "isAnyOf"` é obrigatório, não estilo: o `presetView` cai em `"equals"`
 * quando o operador é omitido (builders/preset-view.ts:112), e a coluna `status` é
 * `filterType: "multiSelect"`, cujos operadores válidos são `isAnyOf`/`isNoneOf`
 * (DataTable/USAGE.md:636). Com `equals` o preset aplica mas o Select de operador do
 * popover de Filtros abre VAZIO — o filtro funciona e a UI mente sobre o porquê.
 *
 * ⛔ **ORÇAMENTO DE ABAS: estas 2 são o limite.** O `maxViewTabs` do `DataTable` é `3`
 * **contando a "Default"**, e o excedente é CORTADO por `.slice()` — em produção, em
 * silêncio (em DEV sai um `console.warn`). Uma 3ª visão aqui simplesmente não aparece.
 * Pra ter mais, passe `maxViewTabs` explícito no `DataTable`.
 */
const VISOES: DataTablePresetView[] = [
  presetView({
    id: "preset:em-andamento",
    name: "Em andamento",
    filters: [{ field: "status", operator: "isAnyOf", value: ["em-andamento"] }],
  }),
  presetView({
    id: "preset:falhas",
    name: "Falhas",
    filters: [{ field: "status", operator: "isAnyOf", value: ["falha"] }],
  }),
];

export function TransacoesPage() {
  /**
   * `undefined` de propósito, não `mesCorrente()`.
   *
   * O `DatePicker` do DS **não tem trigger customizável** — o label é computado do
   * `value` e o formato é pt-BR fixo (`DatePicker/USAGE.md`, Gotchas). A única forma
   * de o trigger dizer "Mês atual" em vez de "01 de set. de 2026 – 30 de set. de 2026"
   * é o `value` estar vazio, porque aí ele mostra o `placeholder`.
   *
   * E isso não é contorno: "nenhuma seleção explícita" É o estado em que o recorte é o
   * mês atual. O dado abaixo segue o mesmo raciocínio — `periodo ?? mesCorrente()` —
   * então rótulo e linhas nunca divergem.
   */
  const [periodo, setPeriodo] = useState<DateRange | undefined>(undefined);
  const [detalhe, setDetalhe] = useState<Transacao | null>(null);

  const colunas = useMemo(
    () => construirColunas({ onVerDetalhes: setDetalhe }),
    [],
  );

  /**
   * Rótulo completo do período, pro `title` do seletor — o `DatePicker` não expõe o
   * label que computa.
   *
   * ⚠️ Rótulo e filtro vêm do MESMO módulo (`~/components/periodo`), agora compartilhado
   * com a tela de Resumo. As duas telas listam as mesmas transações: duas cópias de
   * `mesCorrente` discordando sobre onde o mês começa seria um defeito em que cada tela,
   * sozinha, pareceria certa.
   */
  const rotuloPeriodo = useMemo(() => rotuloDoPeriodo(periodo), [periodo]);

  /**
   * O período filtra de verdade. Um seletor de data que não filtra é pior que nenhum
   * numa tela de aprovação: o avaliador conclui que o filtro está quebrado.
   */
  const linhas = useMemo(
    () => TRANSACOES_MOCK.filter((t) => dentroDoPeriodo(t.data, periodo)),
    [periodo],
  );

  return (
    // `gap-gp-2xl` = 16px. NÃO é escolha: é o ritmo canônico do DS entre o `PageHeader`
    // e o próximo bloco (`_claude/rules/ds-design.md`, e o esqueleto do `DESIGN.md`), e
    // é o que o VP usa na raiz da página (MapaClientesPage.tsx:484). Estava `gap-gp-xl`
    // (12px) — apertado, e divergindo da regra.
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Transações"
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        /* Contagem no título, padrão do VP (MapaClientesPage.tsx:488): `shape="rounded"`
           aqui, distinto do `pill` dos chips de status da tabela — são coisas diferentes
           e a forma diferencia.

           ⚠️ Conta o recorte de PERÍODO, não o que a tabela mostra. São dois escopos
           distintos e cada um tem seu número: o período é da PÁGINA (badge no título), e
           filtro de coluna / visão / busca são da TABELA (rodapé "1–8 de 8"). Com a visão
           "Falhas" ativa o badge diz 64 e o rodapé diz 8 — não é divergência, são
           perguntas diferentes. O `DataTableRef` não expõe a contagem pós-filtro
           (data-table.types.ts:918), então unificar exigiria mudança no DS. */
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {linhas.length} {linhas.length === 1 ? "transação" : "transações"}
          </Chip>
        }
        /* `filled` + `primary` + `iconLeft` — o idioma do VP pra ação de página
           (MapaClientesPage.tsx:494). `outline` fazia a única ação da tela parecer
           secundária. O `iconLeft` é a prop, não ícone como children: o Button já
           resolve o gap e o tamanho do svg. */
        actions={
          <Button variant="filled" color="primary" size="md" iconLeft={<Download />}>
            Baixar dados
          </Button>
        }
      />

      <DataTable<Transacao>
        rows={linhas}
        columns={colunas}
        getRowId={(r) => r.id}
        /* ⚠️ `flex-1 min-h-0` é o que mantém a PAGINAÇÃO SEMPRE VISÍVEL — não é
           enfeite de layout. Sem isso, subir o tamanho da página pra 50 fazia a
           tabela crescer, a PÁGINA rolar, e o rodapé de paginação sair da tela até
           alguém rolar até o fim.

           O `DataTable` já entrega o `<Table>` interno com `min-h-0 max-h-full`
           (data-table.tsx:1138), e o container de scroll dele é
           `flex-1 min-h-0 overflow-auto` (table.styles.ts:27). Esse mecanismo só
           ARMA quando a raiz do `DataTable` tem altura limitada: aí o corpo rola por
           dentro e toolbar + rodapé ficam parados. Sem `flex-1 min-h-0` a raiz assume
           a altura do conteúdo, e `max-h-full` não tem o que resolver.

           Idiom do DS, não invenção nossa: é o que a tela de Financeiro do showcase
           passa (`ClientesFinanceiroShowcase.tsx:797`). Exige pai com altura — o
           wrapper acima é `flex min-h-0 flex-1 flex-col`. */
        className={ALTURA_DE_TABELA}
        /* `persistId` NAO e opcional aqui: a barra de visoes so renderiza quando
           `persistId && defaultViews.length > 0` (data-table.tsx:1766). Sem ele o
           `defaultViews` e aceito, compila, e as abas simplesmente nao aparecem — sem
           erro nenhum. Medido em 2026-09-16. */
        persistId="igreen-mob-cms.transacoes"
        defaultViews={VISOES}
        /* Abas fixas: só "Default" + "Falhas". `false` esconde o "+" de salvar visão
           própria (L-054) — o usuário não cria visões nesta tela. */
        allowCreateView={false}
        showEmptyFilterChips={["empresa", "local", "carregador", "status"]}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
          /* Slot de componente do toolbar — renderiza entre o refresh e a busca, que é
             onde os dois inputs de data moravam. `toolbar.actions` não serve: seus kinds
             são `button`/`dropdown`/`input` e nenhum recebe componente.

             Exige DS `0.64.0`+. Em 0.63.0 a prop era declarada, o TS aceitava e **nada
             renderizava** — o defeito que o `datatable-toolbar-slots.test.tsx` do DS agora
             tranca. Este projeto está na 0.64.0. */
          /* O `title` vai no WRAPPER porque o `DatePicker` não repassa `title` — só
             `className`. Sem ele, truncar a 150px esconderia o fim do período sem dar
             como recuperá-lo: "11 de set. de 20…" não diz até quando. O hover devolve
             o intervalo inteiro. */
          customLeft: (
            <span title={rotuloPeriodo}>
            <DatePicker
              mode="range"
              value={periodo}
              onValueChange={setPeriodo}
              placeholder="Mês atual"
              align="end"
              /* Largura TRAVADA, não `w-auto`. O label do trigger é computado do valor
                 e cresce muito quando há período escolhido — "Mês atual" tem 9 caracteres
                 e "01 de set. de 2026 – 30 de set. de 2026" tem 39. Com `w-auto` o
                 controle empurra a busca e os ícones do toolbar pra fora.

                 O `truncate` já existe no `<span>` interno do DatePicker
                 (datepicker.tsx:180), então só faltava o teto: com largura fixa ele
                 reticencia em vez de esticar. Px na unha de propósito — a escala de
                 container do DS começa em 480px e não serve pra controle de toolbar. */
              className="w-[150px]"
            />
            </span>
          ),
        }}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <TransacaoDetailPanel transacao={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}
