import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  Receipt,
  Ticket,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  FloatingPanel,
  type DataTableColumnDef,
} from "@snksergio/design-system";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@snksergio/design-system/shadcn";
import {
  AJUDA_BASE_DE_CALCULO,
  AJUDA_REPASSE,
  baseDeCalculo,
  transacoesDoRepasse,
  type Repasse,
  type TransacaoDoRepasse,
} from "./repasses-mock";
import { Dinheiro, brl } from "./repasses-ui";

/**
 * Painel de detalhe de um repasse — adaptação do bloco **`dsgreen-paneldetail-3`**.
 *
 * ## Por que painel, e não tela nova
 *
 * Na referência o "Ver detalhes" navega pra `/pt/financial-details/<uuid>` — **outra
 * tela**, com "Voltar". Aqui é painel, decisão do operador, e o bloco `-3` existe pra
 * exatamente este caso: campos + métricas + uma tabela escopada no registro.
 *
 * Ganho concreto: a lista de repasses fica visível atrás, então comparar Setembro com
 * Agosto é fechar e abrir, não navegar e voltar duas vezes.
 *
 * ## O que veio do bloco, e o que mudou
 *
 * Do bloco: `size="xl"` (720px) **por requisito da tabela**, `resizable` + `maximizable`,
 * a faixa de métricas com `divide-x divide-border-default`, o `Table` primitivo (não
 * `DataTable`), as larguras numa constante única, `tabular-nums` em número e data, e o
 * wrapper de `gap` obrigatório no corpo.
 *
 * Mudou: o topo em duas colunas de propriedades virou **um card de valor** — porque o que
 * este detalhe tem de mais importante é UM número, o repasse líquido, e o bloco diz
 * explicitamente que card no topo só se justifica "pra algo que se destaque de verdade (um
 * saldo, um alerta)". É o mesmo desenho do `Saldo disponível` da tela de Finance do
 * showcase, com o texto de ajuda da referência dentro do card.
 *
 * ## A tabela: 7 das 9 colunas da referência
 *
 * A origem mostra **DATA · LOCAL · CARREGADOR · MOTORISTA · ENERGIA · TEMPO · VALOR BRUTO
 * · CUPOM · TOTAL PAGO**. Nove colunas somam ~930px e a linha útil de um painel `xl` mede
 * **670px** — o bloco é explícito: se não couber em `xl`, scroll horizontal dentro de
 * painel é pior que abrir tela cheia.
 *
 * Ficaram de fora **CARREGADOR** (identificador técnico, `FZ2503000145` — não é o que se lê
 * num extrato financeiro) e **TEMPO** (duração não entra na conta do repasse). As três
 * colunas de dinheiro ficam TODAS, porque juntas elas mostram a conta:
 * `bruto − cupom = total pago`. Tirar uma esconde o porquê do valor.
 *
 * O painel é `resizable` e `maximizable` — quem precisar de mais largura tem o caminho.
 */

/**
 * Colunas do extrato.
 *
 * ⚠️ **`DataTable`, não o `Table` primitivo — e isso contraria o bloco `-3` de propósito.**
 * O bloco diz que `DataTable` dentro de painel compete com o painel (dois níveis de
 * filtro, dois lugares de paginação) e manda usar o primitivo. A condição dele pra isso
 * é a tabela ser um "recorte curto e fechado" — e o próprio bloco continua: *"se você
 * precisar de filtro, ordenação persistente ou PAGINAÇÃO nessa tabela, ela deixou de ser
 * recorte"*.
 *
 * É o caso: o extrato de um mês tem dezenas de transações e precisa paginar. A objeção do
 * bloco se resolve desligando o TOOLBAR (`enable*: false` em tudo): sem ele não há dois
 * níveis de filtro nem toolbar encostado no header do painel, e a paginação do rodapé é a
 * única da tela.
 *
 * `autoFit` faz as larguras serem PISO e não trava (L-052b): a sobra é distribuída
 * proporcionalmente, então a tabela acompanha o resize do painel em vez de sobrar ou
 * faltar espaço. É o que faltava nas versões de largura somada à mão.
 */
const COLUNAS: DataTableColumnDef<TransacaoDoRepasse>[] = [
  {
    field: "dataHora",
    headerName: "Data",
    width: 104,
    render: ({ row }) => (
      <span className="flex flex-col gap-gp-2xs">
        <span className="tabular-nums">{row.dataHora.split(" • ")[0]}</span>
        <span className="text-caption-md tabular-nums text-fg-muted">
          {row.dataHora.split(" • ")[1]}
        </span>
      </span>
    ),
  },
  {
    field: "local",
    headerName: "Local",
    width: 260,
    ellipsis: true,
    /* Sem o prefixo da empresa: ela é a mesma em todas as linhas do painel, e o prefixo
       come 13 caracteres. O `title` devolve o nome completo no hover — truncar sem forma
       de recuperar é esconder dado. */
    render: ({ row }) => (
      <span title={row.local}>{semPrefixo(row.local)}</span>
    ),
  },
  {
    field: "carregador",
    headerName: "Carregador",
    width: 140,
    copyable: true,
    /* `copyable` porque é identificador: é o valor que a pessoa cola num chamado. E id
       truncado é pior que nome truncado — dois carregadores viram a mesma string. */
    render: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{row.carregador}</span>
    ),
  },
  { field: "motorista", headerName: "Motorista", width: 180, ellipsis: true },
  {
    field: "energiaKwh",
    headerName: "kWh",
    align: "right",
    width: 80,
    render: ({ row }) => (
      <span className="tabular-nums">
        {row.energiaKwh.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    field: "valorBruto",
    headerName: "Bruto",
    type: "currency",
    align: "right",
    width: 100,
    render: ({ row }) => (
      <span className="tabular-nums text-fg-muted">{brl.format(row.valorBruto)}</span>
    ),
  },
  {
    field: "cupom",
    headerName: "Cupom",
    type: "currency",
    align: "right",
    width: 104,
    /* "—" quando não há cupom, como a referência mostra — e não `R$ 0,00`, que lê como
       cupom de valor zero em vez de ausência de cupom. */
    render: ({ row }) =>
      row.cupom > 0 ? (
        <span className="tabular-nums text-fg-warning">−{brl.format(row.cupom)}</span>
      ) : (
        <span className="text-fg-subtle">—</span>
      ),
  },
  {
    field: "totalPago",
    headerName: "Pago",
    type: "currency",
    align: "right",
    width: 104,
    render: ({ row }) => <Dinheiro valor={row.totalPago} />,
  },
];

/**
 * Tira o prefixo da empresa do nome do local.
 *
 * Os locais vêm como `IGREEN MOB - SEDE`, e dentro do painel a empresa é a mesma em
 * todas as linhas: o prefixo só gasta 13 caracteres da coluna. Mesma decisão dos badges
 * de local na sidebar (`EscopoGlobal.tsx`).
 */
function semPrefixo(local: string): string {
  const corte = local.indexOf(" - ");
  return corte === -1 ? local : local.slice(corte + 3);
}

/**
 * Menu de download — CSV ou PDF.
 *
 * A origem tem DOIS botões soltos ("BAIXAR CSV" e "Baixar extrato em PDF"), gastando duas
 * vagas pra uma decisão; aqui é um menu só.
 *
 * Sem props: ele aparece em UM lugar, ao lado do título da tabela. Chegou a existir também
 * no rodapé do painel, e por isso tinha `variant`/`color` — quando o do rodapé saiu, as
 * duas props viraram configuração sem segundo chamador. Voltam no dia em que houver um.
 */
function MenuDeDownload() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          color="secondary"
          size="sm"
          iconLeft={<Download />}
          iconRight={<ChevronDown />}
        >
          Baixar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <FileSpreadsheet />
          Baixar em CSV
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileText />
          Baixar extrato em PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Métrica compacta da faixa: ícone + valor na mesma linha, rótulo abaixo. Vem do bloco. */
function Metrica({
  icone: Icone,
  label,
  valor,
  tom = "brand",
}: {
  icone: typeof Wallet;
  label: string;
  valor: string;
  tom?: "brand" | "warning" | "muted";
}) {
  const cor =
    tom === "warning"
      ? "text-fg-warning"
      : tom === "muted"
        ? "text-fg-muted"
        : "text-fg-brand";

  return (
    <div className="flex flex-col gap-gp-2xs p-pad-2xl">
      <div className={`flex items-center gap-gp-sm ${cor}`}>
        <Icone className="size-icon-sm shrink-0" aria-hidden="true" />
        <span className="text-body-xl font-bold tabular-nums leading-none">{valor}</span>
      </div>
      <span className="text-caption-sm text-fg-muted">{label}</span>
    </div>
  );
}

interface Props {
  repasse: Repasse | null;
  onClose: () => void;
  /** Quantos locais entram no recorte — o card de repasse cita isso, como na referência. */
  locaisSelecionados: number;
  totalDeLocais: number;
  /**
   * Move pro repasse vizinho. É o que dá função às setas `‹ ›` do título da tabela.
   * Quem resolve o vizinho é a PÁGINA, porque só ela conhece a lista filtrada.
   */
  onNavegar: (direcao: "anterior" | "seguinte") => void;
  temAnterior: boolean;
  temSeguinte: boolean;
}

export function RepasseDetailPanel({
  repasse,
  onClose,
  locaisSelecionados,
  totalDeLocais,
  onNavegar,
  temAnterior,
  temSeguinte,
}: Props) {

  const base = useMemo(
    () => (repasse ? baseDeCalculo(repasse) : null),
    [repasse],
  );

  const transacoes = useMemo(
    () => (repasse ? transacoesDoRepasse(repasse) : []),
    [repasse],
  );

  if (!repasse || !base) return null;

  const rotuloDoPeriodo = `${repasse.mes} ${repasse.ano}`;

  return (
    <FloatingPanel
      open={!!repasse}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      /* `xl` = 720px. Requisito da tabela de 7 colunas, não preferência — em `lg` (560px)
         ela viraria scroll horizontal. Mesmo critério do `dsgreen-paneldetail-3`. */
      /* ⚠️ **1160px por default, não o preset `xl` (720).** O `size` do `FloatingPanel`
         aceita número, e aqui a largura é REQUISITO da tabela, não preferência: as oito
         colunas pedem ~1240px úteis pra nenhuma truncar, e sobra folga pro `autoFit`
         distribuir.

         Passei por 720 e por 880 antes: em 720 truncavam três colunas, em 880 ainda
         truncava o nome de local mais longo e o id do carregador. O bloco `-3` diz que
         tabela com scroll horizontal dentro de painel é pior que abrir tela cheia — e a
         saída dele, quando não cabe, é justamente subir a largura.

         O piso de resize é 880 pra ninguém arrastar de volta pro tamanho em que a
         tabela volta a ser cortada; o teto vai a 1440. */
      size={1280}
      resizable
      resizableMinWidth={880}
      resizableMaxWidth={1600}
      maximizable
      resizableStorageKey="igreen-mob-cms.repasse-detalhe.width"
      titleSlot={
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            Repasse de {repasse.mes} {repasse.ano}
          </span>
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs text-fg-muted">
            <span className="tabular-nums">
              {locaisSelecionados} de {totalDeLocais} locais
            </span>
            <span className="opacity-50">·</span>
            <Chip color="warning" variant="soft" size="sm">
              Em aberto
            </Chip>
          </span>
        </div>
      }
      /* Sem `headerActions`: o botão de PDF que morava aqui virou item do dropdown
         `Baixar` do rodapé. Duas portas pro mesmo download é o tipo de duplicação que
         faz a pessoa parar pra decidir qual das duas é a certa. */
      /* Rodapé só com `Fechar`. O `Baixar` saiu daqui: ele já existe ao lado do título
         da tabela, que é onde o recorte baixado está sendo olhado. Dois gatilhos pro mesmo
         download em telas diferentes do painel é a mesma duplicação que tirou o PDF do
         header — e no rodapé ele ainda ganhava peso de ação primária, quando a ação
         primária deste painel é ler, não exportar. */
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {/* ⚠️ `h-full` + `min-h-0`, e não só `flex-col`.

          É o que faz a PAGINAÇÃO ficar sempre visível. O body do `FloatingPanel` é
          `flex-1 min-h-0 overflow-y-auto` (floating-panel.styles.ts:75) — uma caixa de
          altura limitada. Com o conteúdo em `h-full`, ele passa a medir exatamente essa
          altura, o body para de rolar, e a tabela lá embaixo pode reivindicar a sobra com
          `flex-1 min-h-0` e rolar POR DENTRO.

          Sem isto, subir o tamanho da página pra 50 fazia a tabela crescer, o BODY do
          painel rolar, e o rodapé de paginação sair de vista — o mesmo defeito que as
          telas de lista tiveram, e a mesma correção.

          O gap continua obrigatório: o body do `FloatingPanel` não tem gap entre filhos
          (`row-gap: normal`, medido no DS). Sem ele, card, métricas e tabela ficam com 0px
          entre si. Não confundir com o `PanelBody` do `Panel`, que tem gap embutido. */}
      <div className="flex h-full min-h-0 flex-col gap-gp-3xl">
        {/* 1. O número que importa, em card próprio.
               É a exceção que o bloco autoriza — "card no topo só pra algo que se destaque
               de verdade (um saldo, um alerta)". Aqui é um saldo, e é o mesmo desenho do
               `Saldo disponível` da tela de Finance do showcase. O texto de ajuda e a
               contagem de locais são literais da referência. */}
        <div className="flex flex-col gap-gp-lg rounded-radius-lg bg-bg-success-muted p-pad-2xl">
          <div className="flex flex-wrap items-start justify-between gap-gp-md">
            <div className="flex flex-col gap-gp-2xs">
              {/* ⚠️ Tokens COPIADOS do `Saldo disponível` do `FinanceDetailPanel` do
                  showcase (`finance-detail-panel.tsx:131`): fundo `bg-bg-success-muted`
                  sem borda, rótulo `caption-sm` em `fg-muted` — sem caixa alta —, e
                  valor `body-2xl font-bold` em `fg-success`.
                  A versão anterior usava `stat-lg` (30px) com rótulo em caixa alta:
                  grande demais dentro de um painel, e fora do padrão da casa. */}
              <span className="text-caption-sm text-fg-muted">
                Repasse líquido do período
              </span>
              <span className="text-body-2xl font-bold leading-none tabular-nums text-fg-success">
                {brl.format(repasse.repasseLiquido)}
              </span>
            </div>
            {/* ⚠️ **O seletor de mês saiu daqui.** Ele morava neste card e virou a
                navegação `‹ ›` ao lado do título da tabela, no desenho do
                `dsgreen-paneldetail-3`. Dois controles pro mesmo estado — um dropdown
                aqui e setas lá — obrigam a pessoa a decidir qual é o "certo", e foi o
                mesmo motivo que tirou o botão de PDF do header do painel.

                Custo assumido: a origem tem "Todos os meses" no dropdown, e setas não
                expressam isso. Se esse recorte for necessário, ele volta como opção da
                navegação, não como segundo controle. */}
          </div>

          {/* A "notificação" do card: contagem de locais + o texto literal da origem
              explicando que o valor é a soma do recorte. Sem isto o número parece ser
              da empresa inteira, e não é.

              ⚠️ **Sem caixa colorida própria.** Era um `bg-bg-info-muted`
              (azul-arroxeado) e ficou ruim sobre o verde do card: duas famílias de cor
              disputando a mesma superfície, e a informação lendo como alerta de outro
              assunto. Agora é tipografia sobre o próprio verde, separada por uma linha
              — ícone em `fg-success` pra pertencer ao card, texto em `fg-muted` pra
              ficar abaixo do número na hierarquia. */}
          <div className="flex items-start gap-gp-md border-t border-border-success-muted pt-pad-lg">
            {/* ⚠️ SEM `mt` de correção. O ícone é `size-icon-sm` (16px) e o texto é
                `caption-md`, cujo line-height também é 16px — medido. Com as duas caixas do
                mesmo tamanho, `items-start` já centra uma na outra, e o `mt-[2px]` que
                estava aqui empurrava o ícone exatamente 2px pra baixo (centro em 199 contra
                197 do texto). Offset ótico só se justifica quando as caixas DIFEREM. */}
            <Info className="size-icon-sm shrink-0 text-fg-success" aria-hidden />
            <p className="text-caption-md text-fg-muted">
              <span className="font-semibold tabular-nums text-fg-default">
                {locaisSelecionados} de {totalDeLocais} locais selecionados.
              </span>{" "}
              {AJUDA_REPASSE}
            </p>
          </div>
        </div>

        {/* 2. Base de cálculo — a faixa de métricas do bloco.
               `divide-border-default` é obrigatório: `divide-x` cru é só largura e a
               divisória cairia em `currentColor` (L-039 aplicada ao `divide`). */}
        <div className="flex flex-col gap-gp-lg">
          <div className="flex flex-col gap-gp-2xs">
            <span className="text-body-md font-semibold text-fg-default">
              Base de cálculo do período
            </span>
            <span className="text-caption-md text-fg-muted">
              {AJUDA_BASE_DE_CALCULO}
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border-default overflow-hidden rounded-radius-lg border border-border-default bg-bg-surface sm:grid-cols-4 sm:divide-y-0">
            <Metrica
              icone={Receipt}
              label="Total vendido"
              valor={brl.format(base.totalVendido)}
              tom="muted"
            />
            <Metrica
              icone={Ticket}
              label="Cupons CPO"
              valor={brl.format(base.cuponsCpo)}
              tom="warning"
            />
            <Metrica
              icone={Wallet}
              label="Total pago"
              valor={brl.format(base.totalPago)}
            />
            <Metrica
              icone={TrendingUp}
              label="Take rate"
              valor={brl.format(base.takeRate)}
              tom="muted"
            />
          </div>
        </div>

        {/* 3. O extrato do período.

            ⚠️ `flex-1 min-h-0`: esta seção é a única que ESTICA. Card de repasse e base
            de cálculo têm altura de conteúdo e ficam parados no topo; a tabela fica com
            todo o resto e rola por dentro. É o que mantém os números sempre à vista
            enquanto a pessoa percorre o extrato. */}
        <div className="flex min-h-0 flex-1 flex-col gap-gp-lg">
          <div className="flex flex-wrap items-center justify-between gap-gp-md">
            <div className="flex items-center gap-gp-md">
              {/* O MÊS como título, com a navegação `‹ ›` ao lado — o desenho do
                  `dsgreen-paneldetail-3`. "Transações do período" dizia menos que o
                  próprio período: a tabela já está debaixo do título "Transações do
                  período" do painel, e o que falta saber aqui é QUAL período. */}
              {/* Só o mês. O subtítulo dizia "Transações · 10 mais recentes" e as duas
                  metades morreram: a seção já se chama "Transações do período", e o
                  extrato deixou de ser recorte de 10 quando ganhou paginação — o rodapé
                  da tabela agora diz "1–10 de N", que é a informação verdadeira. */}
              <span className="text-body-md font-semibold text-fg-default">
                {rotuloDoPeriodo}
              </span>
              {/* ⚠️ As setas TROCAM o repasse de verdade — elas chamam `onNavegar`, que a
                  página resolve pro repasse vizinho do mesmo ano, e o painel inteiro
                  (título, card, base de cálculo, extrato) acompanha. O bloco é
                  explícito: se `‹ ›` não trocam o dado, tire — controle que não controla
                  é pior que ausência de controle. Desabilitam nas pontas da lista. */}
              <div className="flex items-center gap-gp-xs">
                <Button
                  variant="soft"
                  color="secondary"
                  size="icon-xs"
                  aria-label="Repasse anterior"
                  disabled={!temAnterior}
                  onClick={() => onNavegar("anterior")}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="soft"
                  color="secondary"
                  size="icon-xs"
                  aria-label="Repasse seguinte"
                  disabled={!temSeguinte}
                  onClick={() => onNavegar("seguinte")}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
            {/* ⚠️ Exporta o RECORTE (o mês visível), não a base — a pessoa assume que um
                botão dentro do painel leva o que ela está vendo. Se fosse a base inteira,
                o botão pertenceria à tela. Regra do bloco.

                É o ÚNICO gatilho de download do painel — o que existia no rodapé saiu.
                Aqui ele fica encostado no que se baixa; no rodapé ganhava peso de ação
                primária, e a ação primária deste painel é ler, não exportar. */}
            <MenuDeDownload />
          </div>

          {/* ⚠️ Toolbar DESLIGADO em tudo — é o que resolve a objeção do bloco `-3` a
              `DataTable` dentro de painel: sem toolbar não há dois níveis de filtro nem
              barra encostada no header, e sobra só a paginação, que é o motivo de estar
              aqui. Se algum dia precisar de busca no extrato, ela vira tela própria.

              `autoFit`: as larguras acima são PISO e a sobra é rateada, então a tabela
              acompanha o resize do painel. O que prende o rodapé de paginação é o
              `flex-1 min-h-0` do `className` — ver a nota lá. */}
          <DataTable<TransacaoDoRepasse>
            rows={transacoes}
            columns={COLUNAS}
            getRowId={(r) => r.id}
            autoFit
            /* ⚠️ `standard` (56px), não `compact` (40px). A célula de Data tem DUAS linhas
               — data em cima, hora em `caption` embaixo — e a 40px as duas encostavam uma
               na outra e nas bordas da linha. 56 é o passo seguinte da escala do DS
               (`table.styles.ts:160`), não um padding na unha: o `py` das células é `0` e
               quem define a altura é o `h-[Npx]` da linha, então mexer em padding aqui não
               teria efeito nenhum. */
            density="standard"
            /* ⚠️ `[&>div:first-child]:hidden` esconde o TOOLBAR.

               Desligar `enableSearch`/`enableFilters`/`enableColumns`/`enableDensity`/
               `enableExport` não remove a barra: ela continua renderizando com **40px de
               altura e dois botões** (refresh e o menu de mais ações) — medido. O
               `DataTable` **não tem prop pra esconder o toolbar**; o primeiro filho da raiz
               dele é sempre o `toolbarWrap` (data-table.tsx:1540).

               Seletor de filho, e não `display:none` por id, pra não depender de classe
               interna do DS. É o ponto frágil deste arquivo: se a ordem dos filhos da raiz
               mudar, isto esconde a coisa errada. Candidato a cascata no DS — uma prop
               `showToolbar={false}` resolveria sem consumidor mexer em filho.

               E `flex-1 min-h-0` é o par do `h-full` do wrapper: o `DataTable` já entrega o
               `<Table>` interno com `min-h-0 max-h-full` e o container de scroll dele é
               `flex-1 min-h-0 overflow-auto` — mas esse mecanismo só ARMA quando a raiz
               tem altura limitada. Com ele, o corpo da tabela rola e o rodapé de
               paginação fica preso embaixo.

               `min-h-[320px]` é piso de segurança: em viewport baixa, o card e as
               métricas podem não deixar sobra nenhuma, e sem piso a tabela colapsaria
               pra zero. Com ele, o painel volta a rolar — degradação, não quebra. */
            className="min-h-[320px] flex-1 [&>div:first-child]:hidden"
            toolbar={{
              enableSearch: false,
              enableFilters: false,
              enableColumns: false,
              enableDensity: false,
              enableExport: false,
            }}
            paginationConfig={{
              enabled: true,
              initialPageSize: 10,
              pageSizeOptions: [10, 25, 50],
            }}
          />
        </div>
      </div>
    </FloatingPanel>
  );
}
