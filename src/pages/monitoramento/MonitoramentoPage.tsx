import { useMemo, useState } from "react";
import { Info, ListFilter, Search } from "lucide-react";
import { Button, Chip, DataTable, PageHeader } from "@snksergio/design-system";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Sheet,
  SheetContent,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@snksergio/design-system/shadcn";
import { useEhCelular } from "~/components/celular";
import {
  FAIXAS_DE_POTENCIA,
  MONITORAMENTO_TEXTOS,
  PLUGUES,
  STATUS_NA_ORDEM,
  faixaDaPotencia,
  locaisNoMapa,
  resumoDosPlugues,
  type FaixaDePotencia,
  type Plugue,
  type StatusPlugue,
} from "./monitoramento-mock";
import { BarraDeProporcao } from "./monitoramento-ui";
import { ALTURA_DO_MAPA, MapaDosLocais } from "./MapaDosLocais";
import { PainelDeFiltros, type EstadoDosFiltros } from "./PainelDeFiltros";
import { construirColunas } from "./monitoramento-columns";
import { PlugueDetailPanel } from "./PlugueDetailPanel";

/**
 * Tela de Monitoramento — medida em `/pt/monitoring?page=1&sort_id=connectorStatus` (2026-09-16).
 *
 * ## Um filtro, três superfícies
 *
 * ⚠️ **A referência tem DOIS filtros de status na mesma tela**: os chips de pin em cima
 * (`CARREGANDO #0 · DISPONÍVEL #19 · DESCONECTADO #20`), que recortam só o mapa, e o select
 * `FILTRO DOS PLUGUES: Todos os status` acima da tabela, que recorta só a tabela. Dois
 * controles do mesmo campo, em lugares diferentes, com efeitos diferentes — quem marca um e
 * não entende por que o outro não respondeu conclui que a tela está quebrada.
 *
 * Aqui é um só: o `PainelDeFiltros` à direita do mapa recorta **mapa, barra e tabela
 * juntos**, e o select some. Na tabela, o que sobra são os chips NATIVOS do `DataTable`
 * (`showEmptyFilterChips`) — filtro solto acima de uma grade é o que a L-051 proíbe.
 *
 * ## Por que três blocos e não um
 *
 * Mapa e barra respondem a perguntas diferentes — ONDE está e COMO está. Empilhar a barra
 * dentro do card do mapa faria a informação mais acionável (quantos caíram) depender de
 * rolar um mapa.
 */

/**
 * Tudo marcado — o estado de repouso.
 *
 * ⚠️ **Isto INVERTE a convenção do `filterModel` do DS**, e a inversão é deliberada
 * (pedido do operador, 2026-09-16). No `DataTable`, no `DataList` e no `Scheduler`,
 * "nenhuma opção marcada" significa **sem restrição**; aqui significa **nada visível**, e
 * o repouso é tudo marcado.
 *
 * O motivo é o que esta tela é: um painel de CAMADAS de mapa, não um formulário de busca.
 * O modelo mental é o de app de calendário — as camadas vêm ligadas e você desliga o que
 * atrapalha. Sete caixas vazias sobre um mapa cheio de pins fariam o painel parecer
 * desligado enquanto o mapa mostra tudo.
 *
 * O preço está pago em três lugares, cada um com comentário próprio: `passaNoStatus`
 * (marcado = visível), o rótulo do grupo no painel ("Todas" quando está CHEIO, não quando
 * está vazio) e `temRecorte` (o verde e o ponto do botão contam o que falta marcar).
 */
const TUDO_MARCADO: EstadoDosFiltros = {
  status: [...STATUS_NA_ORDEM],
  potencia: FAIXAS_DE_POTENCIA.map((f) => f.id),
};

/** Alterna um valor numa lista. */
function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor)
    ? lista.filter((x) => x !== valor)
    : [...lista, valor];
}

export function MonitoramentoPage() {
  const [detalhe, setDetalhe] = useState<Plugue | null>(null);
  const [busca, setBusca] = useState("");
  const [local, setLocal] = useState<string | null>(null);
  /* Aberto por default, ao contrário do `Scheduler` (que abre fechado porque a grade dele
     perde 296px de largura útil). Aqui o painel também É a legenda do mapa, e um mapa que
     nasce sem legenda obriga a descobrir que existe um botão pra ela. */
  const [filtrosAbertos, setFiltrosAbertos] = useState(true);
  const [filtros, setFiltros] = useState<EstadoDosFiltros>(TUDO_MARCADO);

  /* Os três predicados, separados de propósito: cada contagem precisa aplicar todos MENOS
     o do próprio grupo (ver `contagemDeStatus` abaixo). */
  const passaNaBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (p: Plugue) => !termo || p.local.toLowerCase().includes(termo);
  }, [busca]);

  /* ⚠️ **Marcado = visível**, sem o "lista vazia mostra tudo" do resto do sistema. Aqui a
     lista vazia mostra NADA, e é o comportamento certo pro modelo de camadas: desmarcar as
     sete e ver a tela esvaziar é a confirmação de que o controle faz o que diz. Ver
     `TUDO_MARCADO`. */
  const passaNoStatus = (p: Plugue) => filtros.status.includes(p.status);

  const passaNaPotencia = (p: Plugue) =>
    filtros.potencia.includes(faixaDaPotencia(p.potenciaKw));

  const linhas = useMemo(
    () => PLUGUES.filter((p) => passaNaBusca(p) && passaNoStatus(p) && passaNaPotencia(p)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passaNaBusca, filtros],
  );

  /**
   * ⚠️ **A contagem de cada grupo ignora o filtro do PRÓPRIO grupo.**
   *
   * É a regra que o `SchedulerFilterPanel` declara ("counts vem dos eventos ANTES do filtro
   * daquele campo"), e sem ela o painel mente: ao marcar `Offline`, todos os outros estados
   * passariam a mostrar `0` — e o número que deveria dizer "quanto você ganha marcando
   * isto" passaria a dizer "não há nada aqui", que é falso.
   */
  const contagemDeStatus = useMemo(() => {
    const base = PLUGUES.filter((p) => passaNaBusca(p) && passaNaPotencia(p));
    return Object.fromEntries(
      STATUS_NA_ORDEM.map((s) => [s, base.filter((p) => p.status === s).length]),
    ) as Record<StatusPlugue, number>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passaNaBusca, filtros.potencia]);

  const contagemDePotencia = useMemo(() => {
    const base = PLUGUES.filter((p) => passaNaBusca(p) && passaNoStatus(p));
    return Object.fromEntries(
      FAIXAS_DE_POTENCIA.map((f) => [
        f.id,
        base.filter((p) => faixaDaPotencia(p.potenciaKw) === f.id).length,
      ]),
    ) as Record<FaixaDePotencia, number>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passaNaBusca, filtros.status]);

  const resumo = useMemo(() => resumoDosPlugues(linhas), [linhas]);
  const locais = useMemo(() => locaisNoMapa(linhas), [linhas]);
  const colunas = useMemo(
    () => construirColunas({ onVerDetalhes: setDetalhe }),
    [],
  );

  /**
   * Quantas opções estão DESMARCADAS — é isso que significa "tem recorte" agora.
   *
   * ⚠️ Com tudo marcado no repouso, contar as marcadas contaria sempre 10 e o ponto do
   * botão nunca apagaria. O que restringe a tela é o que está DE FORA.
   */
  const desmarcados =
    TUDO_MARCADO.status.length -
    filtros.status.length +
    (TUDO_MARCADO.potencia.length - filtros.potencia.length);

  /**
   * ⚠️ Decisão de ÁRVORE, não de estilo — por isso `matchMedia` e não `max-md:`.
   *
   * No desktop o painel é uma coluna que EMPURRA o mapa (o argumento do `Scheduler`:
   * marcar e conferir num gesto só). Num celular de 375px não há o que empurrar — a
   * coluna de 280px deixaria 59px para o mapa, e as duas metades ficariam inúteis ao
   * mesmo tempo. Aí o MESMO painel vai para uma folha de baixo, que é o que o operador
   * pediu, e o mapa fica inteiro.
   */
  const ehCelular = useEhCelular();

  /** "A ferramenta de filtro está engajada" — painel aberto OU recorte aplicado. */
  const engajado = filtrosAbertos || desmarcados > 0;

  /**
   * As props do painel, num objeto só.
   *
   * Coluna e folha renderizam o MESMO `PainelDeFiltros` com o MESMO estado — a única
   * diferença é a moldura. Duplicar a lista de props abriria a porta para as duas
   * divergirem, e a que quebraria primeiro é a do celular, que é justamente a que
   * ninguém olha ao mexer no desktop.
   */
  const propsDoPainel = {
    filtros,
    tudoMarcado: TUDO_MARCADO,
    contagemDeStatus,
    contagemDePotencia,
    onAlternarStatus: (s: StatusPlugue) =>
      setFiltros((f) => ({ ...f, status: alternar(f.status, s) })),
    onAlternarPotencia: (x: FaixaDePotencia) =>
      setFiltros((f) => ({ ...f, potencia: alternar(f.potencia, x) })),
    onLimpar: () => setFiltros(TUDO_MARCADO),
    onFechar: () => setFiltrosAbertos(false),
  };

  return (
    /* ⚠️ **Sem `min-h-0 flex-1`, ao contrário das outras telas.** Aquele idioma serve a
       página cujo ÚNICO bloco é a tabela: ele limita a altura da raiz pra que o corpo role
       por dentro e a paginação fique parada. Aqui há três blocos empilhados, e a faixa do
       mapa sozinha come 414px — medido, o corpo da tabela ficava com **altura 0** e as
       linhas só apareciam porque o `<main>` transbordava por fora. Aqui quem rola é a
       página.

       ⚠️ **`pb-pad-4xl` é consequência disso.** O `<main>` do `AppShell` tem padding zero
       (medido) e as outras telas não precisam de respiro embaixo porque não rolam — a
       tabela delas termina no rodapé. Esta rola, e sem o padding o último bloco encosta na
       borda: o conteúdo parece CORTADO em vez de terminado. */
    <div className="flex flex-col gap-gp-2xl pb-pad-4xl">
      <PageHeader
        title="Monitoramento"
        description={MONITORAMENTO_TEXTOS.aviso}
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {resumo.total} {resumo.total === 1 ? "plugue" : "plugues"}
          </Chip>
        }
      />

      {/* ── Busca + botão de filtro ────────────────────────────────────────
          A barra do `Scheduler`: busca à esquerda do botão que mostra e esconde a coluna
          de filtros. Os chips que moravam aqui saíram — eles eram três grupos grosseiros
          (Carregando / Disponível / Desconectado) dos sete estados, e no painel cada
          estado tem a própria linha, com contagem e com a cor do pin ao lado. */}
      <div className="flex flex-wrap items-center justify-end gap-gp-md">
        {/* Busca por LOCAL, separada da busca da tabela: esta move os pins do mapa, a da
            toolbar procura dentro das linhas. São escopos diferentes, e por isso têm
            placeholders diferentes. */}
        {/* 280px travados numa fileira de 339 empurravam o botão Filtro para uma
            segunda linha e deixavam a busca sozinha no alto. `flex-1` no celular: os
            dois dividem a mesma linha e a busca fica com toda a sobra. */}
        <InputGroup className="w-[280px] max-md:w-auto max-md:min-w-0 max-md:flex-1">
          <InputGroupAddon>
            <Search className="size-icon-sm text-fg-subtle" />
          </InputGroupAddon>
          <InputGroupInput
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={MONITORAMENTO_TEXTOS.buscarLocal}
            aria-label={MONITORAMENTO_TEXTOS.buscarLocal}
          />
        </InputGroup>

        {/* ── Botão de filtro — a receita do `SchedulerToolbar`, literal ────
            `engajado = painel aberto OU filtro aplicado`. São três combinações na prática,
            e o ponto NÃO é redundante com a cor:

            | estado | botão | ponto |
            |---|---|---|
            | painel aberto, sem filtro | verde | não |
            | filtro aplicado, painel fechado | verde | sim |
            | filtro aplicado, painel aberto | verde | sim |

            É o ponto que separa "abri pra olhar" de "tem filtro mexendo no que eu vejo" —
            e é o portador não-cromático da informação, pra quem não distingue o verde.

            ⚠️ Ponto, e não contador: é o que o `Scheduler` usa, e o número já vive no
            cabeçalho de cada grupo do painel ("Estado 1"). Dois lugares contando a mesma
            coisa é onde eles começam a divergir.

            O `soft` do `Button` não traz borda, então a borda verde entra por className —
            mesma receita do `ToolbarToolButton` do `TableToolbar`. */}
        <span className="relative shrink-0">
          <Button
            variant={engajado ? "soft" : "outline"}
            color={engajado ? "primary" : "secondary"}
            size="md"
            iconLeft={<ListFilter />}
            aria-expanded={filtrosAbertos}
            onClick={() => setFiltrosAbertos((v) => !v)}
            className={
              engajado ? "border-border-brand hover:border-border-brand" : undefined
            }
          >
            Filtro
          </Button>
          {desmarcados > 0 && (
            /* `border-2 border-bg-canvas` recorta o ponto do botão embaixo — sem isso ele
               lê como pixel sujo na borda. Literal do `schedulerFilterDot`. */
            <span
              aria-hidden
              className="pointer-events-none absolute -right-[4px] -top-[4px] z-[2] size-[13px] rounded-radius-full border-2 border-bg-canvas bg-bg-brand"
            />
          )}
        </span>
      </div>

      {/* ── Mapa + filtros ─────────────────────────────────────────────────
          Coluna de verdade, não overlay: o painel EMPURRA o mapa em vez de cobri-lo. É a
          decisão que o `Scheduler` documenta — filtro é o controle cujo resultado se quer
          ver enquanto se mexe, e por cima do mapa marcar e conferir viram dois gestos.

          A altura é declarada AQUI e os dois filhos são `h-full`. É isso que cumpre "mesma
          altura do mapa, com scroll no card": sem a altura no pai, `h-full` no painel não
          tem contra o que resolver os 100%, ele cresce com o conteúdo e arrasta a linha —
          medido, card de 496px ao lado de um mapa de 207. */}
      <div
        className="flex items-stretch gap-gp-2xl"
        style={{ height: ALTURA_DO_MAPA }}
      >
        <MapaDosLocais
          locais={locais}
          selecionado={local}
          onSelecionar={(l) => setLocal((atual) => (atual === l.local ? null : l.local))}
        />

        {!ehCelular && filtrosAbertos && <PainelDeFiltros {...propsDoPainel} />}
      </div>

      {/* A MESMA composição, em folha, no celular.

          `side="bottom"` e não `right`: a coluna nasceu vertical e continua vertical;
          vinda da direita ela seria de novo uma coluna estreita num vão estreito, que é
          o desenho que estamos desfazendo.

          `hideClose` porque o painel já traz o X dele, ligado ao `onFechar` — dois X no
          mesmo canto é a pergunta "qual deles fecha o quê".

          `SheetTitle` em `sr-only`: o Radix exige título acessível no `Dialog` e avisa no
          console quando falta. O título visível ("Filtros") é do painel. */}
      <Sheet open={ehCelular && filtrosAbertos} onOpenChange={setFiltrosAbertos}>
        <SheetContent side="bottom" hideClose className="max-h-[80dvh] p-0">
          <SheetTitle className="sr-only">Filtros do monitoramento</SheetTitle>
          <PainelDeFiltros
            {...propsDoPainel}
            className="flex w-full flex-col overflow-y-auto scrollbar-thin"
          />
        </SheetContent>
      </Sheet>

      {/* ── Plugues por status ───────────────────────────────────────────
          Barra empilhada por PERCENTUAL, no desenho do cartão "Monthly Recurring Revenue"
          do `ChartShowcaseDoc`: rótulo em caption, número grande, barra de 8px e legenda.

          Trocou a de traços porque aquela assumia um parque pequeno e conhecido (ver o
          JSDoc parado de `BarraDePlugues`). Esta desenha igual com 23 ou 2.300 plugues, e
          continua legível na largura de um celular. */}
      <section className="flex flex-col gap-gp-xl rounded-radius-xl border border-border-default bg-bg-surface p-pad-3xl">
        <div className="flex flex-wrap items-end justify-between gap-gp-md">
          <div className="flex flex-col gap-gp-2xs">
            <span className="flex items-center gap-gp-sm text-caption-md text-fg-muted">
              {MONITORAMENTO_TEXTOS.tituloDaBarra}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Info className="size-icon-sm text-fg-subtle" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px]">
                  {MONITORAMENTO_TEXTOS.ajudaDaBarra}
                </TooltipContent>
              </Tooltip>
            </span>
            {/* O número grande é o TOTAL, não o percentual: a barra já diz as fatias, e
                repetir "82%" aqui seria dizer a mesma coisa duas vezes no mesmo cartão. */}
            <span className="text-heading-sm font-bold tabular-nums text-fg-default">
              {resumo.total}
              <span className="ml-gp-sm text-body-md font-normal text-fg-muted">
                {resumo.total === 1 ? "plugue" : "plugues"}
              </span>
            </span>
          </div>

          {/* O número de atenção é a única coisa aqui que pede ação. Zero fica verde —
              "0 exigem atenção" em vermelho ensina a ignorar o vermelho. */}
          <span
            className={`text-body-sm font-semibold tabular-nums ${
              resumo.atencao > 0 ? "text-fg-danger" : "text-fg-success"
            }`}
          >
            {resumo.atencao === 0
              ? "todos operando"
              : `${resumo.atencao} ${
                  resumo.atencao === 1 ? "exige" : "exigem"
                } atenção`}
          </span>
        </div>

        <BarraDeProporcao porStatus={resumo.porStatus} total={resumo.total} />
      </section>

      <DataTable<Plugue>
        rows={linhas}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        /* ⚠️ **Teto de altura, e é ele que segura a paginação na tela.** Sem teto a tabela
           cresce com o número de linhas: em 50 por página o rodapé ia parar ~2.000px
           abaixo, e trocar de página exigia rolar até o fim, trocar, e rolar de volta ao
           topo pra ver o resultado.

           Com teto, o mecanismo interno do `DataTable` arma — o corpo dele já é
           `flex-1 min-h-0 overflow-auto` e só espera um pai de altura limitada. Aí o corpo
           rola por dentro e toolbar e rodapé ficam parados.

           `70vh` e não `80`: sobre a viewport ainda pesam o header do app (56px) e o
           respiro do fim da página. Medido a 900px de altura, 70vh = 630px, o que deixa a
           paginação visível sem rolar quando a tela está no topo da tabela. */
        className="max-h-[70vh]"
        persistId="igreen-mob-cms.monitoramento"
        allowCreateView={false}
        /* Três chips vazios, o teto que cabe na mesma linha da busca em 1440px. `status` é
           o assunto da tela, `local` é o recorte que se faz depois de olhar o mapa, e
           `conectado` é a pergunta operacional do dia: o que parou de falar. */
        showEmptyFilterChips={["local", "conectado", "status"]}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          title: "Todos os plugues",
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

      <PlugueDetailPanel plugue={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}
