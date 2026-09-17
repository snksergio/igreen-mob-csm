import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import {
  AlertModal,
  Button,
  Chip,
  DataTable,
  PageHeader,
  ToolbarToolButton,
  type DataTableRef,
} from "@snksergio/design-system";
import {
  ESTRUTURA,
  ESTRUTURA_TEXTOS,
  caminhoDoNo,
  type NoDaRede,
} from "./estrutura-mock";
import { construirColunas } from "./estrutura-columns";
import { EmpresaDetailPanel } from "./EmpresaDetailPanel";
import { EmpresaFormPanel } from "./EmpresaFormPanel";
import { LocalFormPanel } from "./LocalFormPanel";
import { CartaoDaEstrutura } from "./estrutura-cartao";
import { avisoDeExcluido } from "~/components/feedback";

/**
 * Tela de Estrutura da rede — medida em `/pt/settings/companies-net?page=1` (2026-09-16).
 *
 * ## Árvore de três níveis, com os locais em LINHA e não em card
 *
 * A referência expande a empresa num grid de ~28 cards dentro da tabela: a página cresce
 * alguns milhares de pixels, a linha da empresa sai do campo de visão e não há como
 * procurar um local sem rolar o conjunto inteiro.
 *
 * Aqui o terceiro nível é linha da própria árvore. Ganha três coisas de graça: as mesmas
 * colunas que os outros níveis (endereço e responsável ficam comparáveis), a busca do
 * toolbar alcança o local, e 17 linhas de 44px ocupam menos que 17 cards de 150.
 *
 * ⚠️ **A árvore nasce aberta só até a EMPRESA aparecer** — a raiz expandida, a empresa
 * fechada. É o estado da referência, e é o certo nos dois sentidos: raiz sem filho visível
 * não diz nada, e os 17 locais abertos de saída são justamente o que esta tela evita.
 *
 * ## E o painel continua existindo — pra trabalhar, não pra olhar
 *
 * A árvore responde "como a rede é montada". O painel de empresa responde "quais são os
 * locais DESTA empresa e como mexo neles": ficha curta em cima, lista com busca embaixo.
 * São perguntas diferentes, e é por isso que ter os dois não é duplicar.
 *
 * ## Duas visões, UM componente
 *
 * `Tabela` e `Lista` são o mesmo `DataTable`: `listConfig` troca o corpo por um `<List>`
 * alimentado pelas MESMAS rows processadas, e o toggle entre as duas é nativo da toolbar —
 * ao lado do nome da visão, como o operador pediu (2026-09-16).
 *
 * ⚠️ **A versão anterior era um componente à parte, e tinha dois defeitos que isto resolve
 * de uma vez:** duas toolbars (busca, expandir e recolher existiam duas vezes, com dois
 * estados que podiam discordar) e o efeito escada, porque os slots do `List` são
 * `shrink-0` e o card tem `min-width: auto` — medido, a linha mais longa travava em 1102px
 * e vazava 48px da indentação. Ver o JSDoc de `CartaoDaEstrutura`.
 *
 * As ações são as mesmas nas duas visões porque saem do MESMO objeto `acoes` — é isso que
 * impede a segunda visão de nascer com metade delas e virar tela de segunda classe.
 *
 * ## Pagination desliga sozinha
 *
 * Contrato do `DataTable` em modo tree-data — paginar cortaria ramos. Com 19 linhas isso
 * não pesa; se um dia a rede crescer, o caminho é `virtualize`, não paginação.
 */

export function EstruturaDaRedePage() {
  const tabelaRef = useRef<DataTableRef>(null);

  const [empresaNoPainel, setEmpresaNoPainel] = useState<NoDaRede | null>(null);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState<NoDaRede | null>(null);
  const [formDeEmpresaAberto, setFormDeEmpresaAberto] = useState(false);
  const [localEmEdicao, setLocalEmEdicao] = useState<NoDaRede | null>(null);
  const [empresaDoLocal, setEmpresaDoLocal] = useState<NoDaRede | null>(null);
  const [formDeLocalAberto, setFormDeLocalAberto] = useState(false);
  const [aExcluir, setAExcluir] = useState<NoDaRede | null>(null);

  const abrirFormDeEmpresa = useCallback((e: NoDaRede | null) => {
    setEmpresaEmEdicao(e);
    setFormDeEmpresaAberto(true);
  }, []);

  const abrirFormDeLocal = useCallback(
    (local: NoDaRede | null, empresa: NoDaRede | null) => {
      setLocalEmEdicao(local);
      setEmpresaDoLocal(empresa);
      setFormDeLocalAberto(true);
    },
    [],
  );

  /* As ações num objeto só, memoizado: é o que as duas visões compartilham. */
  const acoes = useMemo(
    () => ({
      onVerLocais: setEmpresaNoPainel,
        /* Uma ação de editar, dois formulários: o nível decide qual. Um `onEditar` por
           nível espalharia a mesma decisão pela coluna e pela página. */
      onEditar: (no: NoDaRede) =>
        no.nivel === "local"
          ? abrirFormDeLocal(no, ESTRUTURA.find((x) => x.id === no.paiId) ?? null)
          : abrirFormDeEmpresa(no),
      onExcluir: setAExcluir,
      onNovaEmpresa: () => abrirFormDeEmpresa(null),
      onNovoLocal: (empresa: NoDaRede) => abrirFormDeLocal(null, empresa),
    }),
    [abrirFormDeEmpresa, abrirFormDeLocal],
  );

  const colunas = useMemo(() => construirColunas(acoes), [acoes]);

  const getTreeDataPath = useCallback((row: NoDaRede) => caminhoDoNo(row), []);

  const totais = useMemo(
    () => ({
      empresas: ESTRUTURA.filter((n) => n.nivel === "empresa").length,
      locais: ESTRUTURA.filter((n) => n.nivel === "local").length,
    }),
    [],
  );

  return (
    /* `min-h-0 flex-1` — o padrão das telas de tabela: raiz de altura limitada pra que
       a grade abaixo ocupe a sobra e role por dentro, com toolbar e rodapé parados. */
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Estrutura da rede"
        description={ESTRUTURA_TEXTOS.aviso}
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {totais.empresas}{" "}
            {totais.empresas === 1 ? "empresa" : "empresas"} · {totais.locais}{" "}
            locais
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Plus />}
            onClick={() => abrirFormDeEmpresa(null)}
          >
            {ESTRUTURA_TEXTOS.novaEmpresa}
          </Button>
        }
      />

      <DataTable<NoDaRede>
        ref={tabelaRef}
        rows={ESTRUTURA}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        /* Teto de altura pra que o rodapé e a toolbar não fujam quando a empresa estiver
           aberta com os 17 locais — o mesmo raciocínio do Monitoramento. */
        /* ⚠️ **Os botões de ação ganham peso, e isso sai do default do DS de propósito.**
         O `DataTableActionsCell` desenha `variant="ghost" size="icon-2xs"` — 28px sem
         fundo nem borda. Ao lado da lista, onde as mesmas ações são `soft` de 32px, eles
         liam como desabilitados. O operador pediu o peso da lista (2026-09-16), e ele
         está certo: editar, adicionar e excluir são as ações da tela, não enfeite de
         linha.

         Escrito como seletor de descendente ancorado em `[data-purpose="actions"]` — o
         atributo que o `Table` do DS põe na célula de ações. Especificidade (0,2,1)
         contra a (0,1,0) da classe do `Button`, então vence sem depender de ordem de CSS
         (o problema que a L-072 descreve).

         📋 Lacuna do DS: `actionColumn` não expõe `variant`/`size` dos botões. */
      className={[
        /* `flex-1 min-h-0`, não `max-h`: a grade ocupa o que sobra da tela. O
           `max-h-[72vh]` que estava aqui veio do Monitoramento, onde existe porque a
           página inteira rola (mapa e barra acima da tabela). Aqui não há nada acima além
           do cabeçalho — é o caso normal. */
        "flex-1 min-h-0",
        /* `scrollbar-gutter: stable` — a calha da barra vertical fica reservada desde o
           início, então expandir a árvore não empurra as colunas.

           ⚠️ **Isto NÃO resolve os 10px de scroll horizontal que sobram com a árvore
           aberta**, e eu cheguei a escrever que resolvia. Medido depois: o container fica
           com `offsetWidth` 1110 e `clientWidth` 1100, e o `autoFit` distribui sobre o
           1110 — ou seja, ele mede a caixa de BORDA e escreve na de CONTEÚDO.

           📋 Lacuna do DS, não contornável daqui sem travar `width`+`maxWidth` em todas as
           colunas — o que tiraria a elasticidade em telas largas pra economizar 10px de
           arrasto numa tabela que já tem grab-to-scroll nativo. Fica declarado. */
        "[&_.scrollbar-thin]:[scrollbar-gutter:stable]",
        /* Neutros: fundo e borda, 32px — o peso dos botões da lista. */
        "[&_[data-purpose=actions]_button]:size-form-sm",
        "[&_[data-purpose=actions]_button]:rounded-radius-md",
        "[&_[data-purpose=actions]_button]:border",
        "[&_[data-purpose=actions]_button]:border-border-default",
        "[&_[data-purpose=actions]_button]:bg-bg-muted",
        "[&_[data-purpose=actions]_button]:hover:border-border-brand",
        /* Destrutivo: fundo vermelho, como o `soft critical` da lista. Selecionado pelo
           `aria-label`, que é o único gancho estável — o `DataTableActionsCell` não põe
           data-attribute por ação, e a cor do `Button` vira classe de texto, não de
           marcação. */
        "[&_[data-purpose=actions]_button[aria-label^=Excluir]]:bg-bg-danger-muted",
        "[&_[data-purpose=actions]_button[aria-label^=Excluir]]:border-border-danger-muted",
        "[&_[data-purpose=actions]_button[aria-label^=Excluir]]:text-fg-danger",
        "[&_[data-purpose=actions]_button[aria-label^=Excluir]]:hover:border-border-danger",
      ].join(" ")}
        /* `comfortable` = 64px por linha. Não é respiro: é o que as duas linhas de texto
           quebrado precisam, agora que nenhuma coluna trunca. Ver `Quebravel`. */
        density="comfortable"
        persistId="igreen-mob-cms.estrutura-rede"
        allowCreateView={false}
        getTreeDataPath={getTreeDataPath}
        treeData={{
          /* `false` + o id da raiz: o Set guarda quem DIVERGE do default, então isto abre
             só a rede. É o estado da referência — e o certo, porque abrir a empresa junto
             despejaria os 17 locais de saída, que é exatamente o que esta tela evita. */
          defaultExpanded: false,
          showDescendantCount: false,
        }}
        defaultExpandedRowIds={["rede"]}
      /* ⚠️ **`listConfig` é o que põe o toggle Tabela/Lista NA TOOLBAR** — o
         `DataTable` detecta a config e desenha o segmentado sozinho, ao lado do nome da
         visão. Não há botão a escrever.

         Sem `getPath`: a lista herda o `getTreeDataPath` da tabela, então as duas
         visões usam a MESMA árvore e o MESMO estado de expansão. Os botões Expandir e
         Recolher continuam valendo pras duas. */
      defaultViewMode="table"
      listConfig={{
        hierarchical: true,
        renderItem: (row) => <CartaoDaEstrutura no={row} acoes={acoes} />,
      }}
        onRowClick={(row) => row.nivel === "empresa" && setEmpresaNoPainel(row)}
        toolbar={{
          title: "Rede",
          enableSearch: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
          /* Ligado a pedido do operador (2026-09-16), e o argumento que eu tinha contra
             não se sustentava: a BUSCA já reconstrói a árvore a partir do resultado, com o
             mesmo efeito sobre a indentação, e ela estava ligada desde o começo. Manter o
             filtro desligado era proteger de um risco que a tela já corria.

             ⚠️ O que continua valendo: filtro que casa só com o filho reconstrói a árvore
             sem o pai, e o nível de indentação some junto. É comportamento do `DataTable`
             em tree-data, não defeito nosso — e é por isso que a coluna de nome carrega
             ÍCONE de nível: com o ícone, a linha continua dizendo "isto é um local" mesmo
             sem a empresa acima dela. */
          enableFilters: true,
          /* Expandir/recolher tudo é do consumidor: o DS expõe por `ref` e não embute
             botão na toolbar. */
          /* ⚠️ `ToolbarToolButton`, não `Button ghost`. Os dois botões vivem DENTRO da
             toolbar, ao lado de Filtros / Colunas / Exportar, e `ghost` os deixava sem
             borda e sem fundo no meio de uma fileira de botões com as duas coisas — lia
             como texto desabilitado. Este é o componente que a própria toolbar usa nas
             ações dela, então o alinhamento é por construção, não por imitação. */
          customLeft: (
            <span className="flex items-center gap-gp-xs">
              <ToolbarToolButton
                icon={<ChevronsUpDown />}
                label="Expandir"
                onClick={() => tabelaRef.current?.expandAllTree()}
              />
              <ToolbarToolButton
                icon={<ChevronsDownUp />}
                label="Recolher"
                onClick={() => tabelaRef.current?.collapseAllTree()}
              />
            </span>
          ),
        }}
      />

      <EmpresaDetailPanel
        empresa={empresaNoPainel}
        onClose={() => setEmpresaNoPainel(null)}
        onEditarEmpresa={abrirFormDeEmpresa}
        onNovoLocal={(e) => abrirFormDeLocal(null, e)}
        onEditarLocal={(l) =>
          abrirFormDeLocal(l, ESTRUTURA.find((x) => x.id === l.paiId) ?? null)
        }
        onExcluirLocal={setAExcluir}
      />

      <EmpresaFormPanel
        aberto={formDeEmpresaAberto}
        empresa={empresaEmEdicao}
        onClose={() => setFormDeEmpresaAberto(false)}
      />

      <LocalFormPanel
        aberto={formDeLocalAberto}
        local={localEmEdicao}
        empresa={empresaDoLocal}
        onClose={() => setFormDeLocalAberto(false)}
      />

      {/* Exclusão confirma por `AlertModal`, o guardrail do DS pra ação destrutiva — nunca
          um modal montado na unha. */}
      {aExcluir && (
        <AlertModal
          open
          onOpenChange={(v) => !v && setAExcluir(null)}
          tone="danger"
          title={`Excluir ${aExcluir.nivel === "local" ? "local" : "empresa"}`}
          description={`${aExcluir.nome} será removido da estrutura. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={() => {
            avisoDeExcluido({ o: "Local", detalhe: `${aExcluir.nome} saiu da estrutura.` });
            setAExcluir(null);
          }}
        />
      )}
    </div>
  );
}
