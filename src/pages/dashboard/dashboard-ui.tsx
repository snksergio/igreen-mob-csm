import { useEffect, useState, type ReactNode } from "react";
import { Award } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChoroplethMap,
  type ChartConfig,
  type ChoroplethGeography,
} from "@snksergio/design-system";
import { Pie, PieChart } from "recharts";

/**
 * As peças de composição do Dashboard.
 *
 * ## Quase nada disto é componente do DS — e a distinção importa
 *
 * O `DashboardShowcase` do Design System resolve card de gráfico, rótulo de seção e
 * ranking com **helpers locais de `src/preview/**`**: eles não estão no barrel e não
 * chegam por npm. O que é API pública e vem de lá: `Kpi`/`KpiGroup`/`KpiDelta`,
 * `ChartContainer` e a família `Table`. O resto abaixo é transcrição das classes do
 * showcase — o desenho viaja porque é feito de token.
 *
 * ⚠️ **`Panel` do barrel NÃO é o card do showcase.** O `Panel` exportado é um drawer
 * Radix (`inset-y-pad-4xl right-pad-4xl`, `outline-float`); o "Panel" que aparece nas
 * páginas de doc é um helper local de mesmo nome que sombreia o export. Importar o do
 * barrel esperando um card entrega uma gaveta.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Superfícies
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Card de gráfico — o `SectionCard` do `DashboardShowcase`, transcrito.
 *
 * `items-stretch` na row + `h-full` aqui é como o showcase iguala a altura de dois cards
 * de tamanhos diferentes na mesma linha.
 */
export function CartaoDeGrafico({
  titulo,
  subtitulo,
  acao,
  children,
  className,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col gap-gp-2xl rounded-radius-xl border border-border-subtle bg-bg-surface p-pad-3xl shadow-sh-sm ${
        className ?? ""
      }`}
    >
      <header className="flex items-center justify-between gap-gp-md">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <h3 className="m-0 text-body-md font-medium text-fg-default">
            {titulo}
          </h3>
          {subtitulo && (
            <p className="m-0 text-body-xs font-normal text-fg-muted">
              {subtitulo}
            </p>
          )}
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}

/**
 * Rótulo de bloco — "Monetização", "Comportamento".
 *
 * A referência usa um `<h2>` solto sobre o fundo da página, sem régua. Aqui é o
 * `SectionLabel` do `KpiDoc`: caixa alta, `tracking` aberto e um fio embaixo. Com seis
 * blocos numa aba, um título sem régua não separa nada — ele vira mais uma linha de texto
 * entre dois cards.
 */
export function RotuloDeSecao({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <p className="text-caption-md font-semibold uppercase tracking-[0.06em] text-fg-muted">
        {children}
      </p>
      <div className="mt-pad-md border-b border-border-subtle" />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Cores
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Paleta CATEGÓRICA — uma cor por fatia.
 *
 * ⚠️ Isto NÃO é a rampa monocromática, e a escolha é deliberada. O
 * `chart-patterns.md` diz que pizza/donut "prefere rampa monocromática da brand (não
 * 'carnaval')" — e, na linha seguinte, abre a exceção: *"Categórico (3–5 fatias/grupos)
 * → `chart-1..5` quando a distinção importa"*. Aqui importa: numa rosca de "AC × DC ×
 * Desconhecido", cinco verdes de luminosidade parecida obrigam a conferir a legenda para
 * saber qual fatia é qual. Com a monocromática, as roscas desta tela ficaram
 * praticamente de uma cor só — medido na primeira versão.
 *
 * As duas restrições que vêm junto, e que este arquivo respeita:
 * · `fg-danger` **não** entra como cor de categoria — é semântico de erro, e vermelho
 *   numa fatia normal faz inferir problema;
 * · teto de CINCO. Não existe `chart-6`; com mais, agrupe em "Outras".
 *
 * A ordem pula o teal (`chart-2`) de propósito: verde e teal brigam em fatia pequena.
 * É o recorte que o `PieChartDoc` usa para três fatias.
 */
export const PALETA_DE_FATIAS = [
  "var(--color-chart-1)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-3)",
  "var(--color-chart-2)",
];

/** Rampa monocromática da marca — para escala de INTENSIDADE (mapa), não categoria. */
export const RAMPA_DA_MARCA = [
  "var(--color-chart-1)",
  "color-mix(in oklch, var(--color-chart-1) 80%, black)",
  "color-mix(in oklch, var(--color-chart-1) 62%, black)",
  "color-mix(in oklch, var(--color-chart-1) 46%, black)",
  "color-mix(in oklch, var(--color-chart-1) 34%, black)",
];

/** Cores de status — verde/âmbar/vermelho, a paleta que o DS reserva para uptime. */
export const COR_DE_STATUS = {
  ok: "var(--color-chart-1)",
  atencao: "var(--color-chart-4)",
  fora: "var(--color-fg-danger)",
  inativo: "var(--color-bg-muted)",
} as const;

/* ────────────────────────────────────────────────────────────────────────────
   Rosca
   ──────────────────────────────────────────────────────────────────────────── */

export interface Fatia {
  chave: string;
  rotulo: string;
  valor: number;
}

/**
 * Rosca com legenda em LISTA ABAIXO.
 *
 * ## Três correções sobre a 1ª versão, todas apontadas pelo operador
 *
 * | era | virou | por quê |
 * |---|---|---|
 * | legenda AO LADO | **abaixo** | ao lado, a rosca encolhia para caber os dois e o furo ficava menor que o texto |
 * | valor central cortado | `leading-none` + `inset-0` | o `line-height` herdado empurrava as duas linhas contra o anel |
 *
 * ## A espessura foi de 24px → 38px → **20px**, e o caminho importa
 *
 * A 1ª versão tinha 24px (`56→80`) e o pedido foi "mais gorda"; virou 38px (`62→100`),
 * que passou do ponto — ali o anel domina o card e o furo aperta o número. O alvo real era
 * a proporção das referências: **anel ≈ 24% do raio**, hoje `62→82` num container de
 * 200px. Fino o bastante para o furo respirar, grosso o bastante para a fatia de 5,6%
 * ainda ter presença.
 *
 * ## Por que o centro não corta
 *
 * São quatro mecanismos, e tirar qualquer um traz o defeito de volta:
 *
 * 1. `absolute inset-0` + `flex items-center justify-center` — o texto não tem largura
 *    fixa e transborda livremente sobre o anel, coisa que um `<text>` de SVG não faz.
 * 2. `leading-none` — mata o `line-height` herdado, que é o que empurrava as linhas.
 * 3. `pointer-events-none` — sem ele o overlay rouba o hover e o tooltip nunca abre.
 * 4. `tabular-nums` — largura estável, o número não "respira" entre recortes.
 *
 * ⚠️ A alternativa seria `<Label>` + `<tspan>` dentro do SVG. O DS tem as duas e usa o
 * overlay nas composições de produto: no `tspan` o tamanho é `fontSize` numérico (fora
 * dos presets) e a posição das duas linhas é `cy-4`/`cy+16` na unha, que quebra assim que
 * o número cresce.
 */
export function Rosca({
  fatias,
  formatar,
  rotuloDoTotal,
  cores = PALETA_DE_FATIAS,
}: {
  fatias: Fatia[];
  /** Como escrever o valor na legenda e no centro. */
  formatar: (v: number) => string;
  rotuloDoTotal: string;
  cores?: string[];
}) {
  const total = fatias.reduce((a, f) => a + f.valor, 0);
  const dados = fatias.map((f, i) => ({ ...f, fill: cores[i % cores.length] }));

  const config: ChartConfig = Object.fromEntries([
    ["valor", { label: rotuloDoTotal }],
    ...fatias.map((f, i) => [
      f.chave,
      { label: f.rotulo, color: cores[i % cores.length] },
    ]),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-gp-2xl">
      <div className="relative mx-auto flex items-center justify-center">
        <ChartContainer config={config} className="aspect-square h-[200px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="rotulo" />}
            />
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="rotulo"
              innerRadius={62}
              outerRadius={82}
              paddingAngle={3}
              /* Ponta arredondada em cada fatia — o acabamento das referências. Vale 8
                 num anel de 20px: o teto é metade da espessura, e encostar nele come
                 comprimento de arco da fatia menor (5,6% aqui), que passa a ler como
                 pílula e não como fração. `paddingAngle` continua abrindo o vão entre
                 fatias; as duas coisas somam. */
              cornerRadius={8}
              strokeWidth={0}
              /* Primeira fatia às 12h, sentido horário — a leitura que se espera. */
              startAngle={90}
              endAngle={-270}
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[2px]">
          <span className="text-title-lg font-bold leading-none tabular-nums text-fg-default">
            {formatar(total)}
          </span>
          <span className="text-caption-sm leading-none text-fg-muted">
            {rotuloDoTotal}
          </span>
        </div>
      </div>

      {/* Legenda abaixo: barrinha de cor, rótulo que estica, valor e o percentual numa
          coluna de largura fixa. A largura fixa é o que alinha os percentuais — só
          `tabular-nums` não resolve, porque "9,4%" e "41,2%" têm contagens diferentes.

          ⚠️ `mt-auto` **fixa a legenda no rodapé do card**. Os três cards da linha têm
          `items-stretch`, então o mais alto define a altura de todos — e a sobra caía
          DEPOIS da legenda, deixando um vão embaixo dela e as três legendas em alturas
          diferentes. Com `mt-auto` a sobra vai para cima, entre a rosca e a legenda: as
          legendas alinham entre si e o desalinhamento sai da parte que o olho compara. */}
      <ul className="mt-auto flex flex-col">
        {dados.map((f) => (
          <li
            key={f.chave}
            className="flex items-center gap-gp-md border-b border-border-subtle py-pad-md last:border-b-0"
          >
            <span
              className="h-[16px] w-[3px] shrink-0 rounded-radius-full"
              style={{ background: f.fill }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-fg-default">
              {f.rotulo}
            </span>
            <span className="shrink-0 text-body-sm font-semibold tabular-nums text-fg-default">
              {formatar(f.valor)}
            </span>
            <span className="w-[56px] shrink-0 text-right text-body-sm tabular-nums text-fg-muted">
              {total ? ((f.valor / total) * 100).toFixed(1) : "0,0"}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Mapa
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Malha de UFs do IBGE, em TopoJSON.
 *
 * ⚠️ `qualidade=minima` não é economia à toa: a malha completa passa de 1 MB e a mínima
 * fica em dezenas de KB, o que num mapa de 300px de altura é indistinguível. O custo é
 * que ela **não traz nome** — só `codarea` —, e é por isso que existe a tabela
 * `SIGLA_DA_UF` no mock.
 */
const MALHA_DO_IBGE =
  "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/json&qualidade=minima&intrarregiao=UF";

export interface UfNoMapa {
  uf: string;
  codigo: string;
  valor: number;
  detalhe: string;
}

/**
 * Mapa de calor da rede por estado.
 *
 * ## A geometria é buscada em runtime, e isso é uma escolha com custo
 *
 * O `ChoroplethMap` do DS **não embute malha nenhuma** — quem chama passa o GeoJSON ou
 * TopoJSON. Há dois caminhos, e nenhum é grátis:
 *
 * | caminho | custo |
 * |---|---|
 * | buscar do IBGE (este) | depende de rede na primeira pintura |
 * | copiar os paths inline do DS | **250 KB** de arquivo versionado no projeto |
 *
 * Escolhi a busca porque o segundo caminho é um arquivo de um quarto de megabyte que só
 * chega pelo canal copy-in do DS (não pelo npm) e que teria de ser mantido à mão. E o
 * risco de rede é coberto: **enquanto a malha não chega, a lista de UFs já está na tela**
 * — ela é a informação, o mapa é a leitura rápida dela. Sem rede, a tela continua
 * respondendo a pergunta, só sem o desenho.
 *
 * ## O mapa tem TETO de largura, e é isso que estabiliza a linha inteira
 *
 * ⚠️ O svg do `ChoroplethMap` é `block h-auto w-full`: a altura dele sai da razão do
 * `viewBox` (800×600), então **ele cresce com a largura do card**. Num monitor largo o
 * mapa passava de 370px de alto e, como a linha usa `items-stretch`, os dois cards de
 * rosca eram esticados junto — daí a área vazia enorme embaixo das legendas, que o
 * operador viu no print.
 *
 * O teto de 300px de largura resolve na raiz: com o `viewBox` 4:3 isso fixa o mapa em
 * ~225px de alto em qualquer resolução, e a linha passa a ser medida pelo conteúdo dos
 * cards, não pela largura da janela. `mx-auto` mantém o desenho centrado no card largo.
 *
 * ## A escala é contínua, não por posição no ranking
 *
 * ⚠️ `colorScale` recebe `(valor, {min, max})` e **não recebe a feature** — pintar o 1º
 * de um tom e o 2º de outro não é expressável nessa API. A escala vai de 30% a 100% da
 * cor da marca, que é a receita do próprio `MapChartDoc`.
 */
export function MapaDeMovimentacao({
  ufs,
  formatar,
}: {
  ufs: UfNoMapa[];
  formatar: (v: number) => string;
}) {
  const [malha, setMalha] = useState<ChoroplethGeography | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch(MALHA_DO_IBGE)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => vivo && setMalha(j))
      .catch(() => vivo && setFalhou(true));
    return () => {
      vivo = false;
    };
  }, []);

  const valores = Object.fromEntries(ufs.map((u) => [u.codigo, u.valor]));
  /* Derivado da própria lista, e não importado do mock: este arquivo é de composição e
     não deve conhecer o dado — quem passa a lista já traz o par código-sigla. */
  const siglaPorCodigo = Object.fromEntries(ufs.map((u) => [u.codigo, u.uf]));

  return (
    <div className="flex flex-1 flex-col gap-gp-2xl">
      <div className="flex min-h-[225px] items-center justify-center">
        {malha ? (
          <div className="mx-auto w-full max-w-[300px]">
            <ChoroplethMap
            geography={malha}
            topologyObject="BRUF"
            values={valores}
            getFeatureId={(f) =>
              String(
                (f.properties as { codarea?: string })?.codarea ?? f.id ?? "",
              )
            }
            getFeatureName={(f) => {
              const cod = String(
                (f.properties as { codarea?: string })?.codarea ?? f.id ?? "",
              );
              return siglaPorCodigo[cod] ?? cod;
            }}
            colorScale={(v, { min, max }) => {
              const t = max === min ? 1 : (v - min) / (max - min);
              return `color-mix(in oklch, var(--color-chart-1) ${Math.round(
                30 + t * 70,
              )}%, black)`;
            }}
            formatValue={formatar}
            showLegend={false}
            strokeWidth={0.5}
            ariaLabel="Movimentação por estado"
              /* `w-full` é obrigatório dentro de flex centrado — é gotcha do USAGE.md. */
              className="w-full"
            />
          </div>
        ) : (
          <p className="text-caption-md text-fg-muted">
            {falhou
              ? "Não foi possível carregar o mapa. Os números seguem abaixo."
              : "Carregando o mapa…"}
          </p>
        )}
      </div>

      {/* `mt-auto` pelo mesmo motivo da rosca: a legenda é o rodapé do card, e a sobra
          de altura pertence ao espaço acima dela. */}
      <ul className="mt-auto grid grid-cols-2 gap-x-gp-2xl gap-y-gp-sm">
        {ufs.slice(0, 6).map((u, i) => (
          <li key={u.uf} className="flex items-center gap-gp-md">
            <span
              className="size-[10px] shrink-0 rounded-radius-full"
              style={{
                background: RAMPA_DA_MARCA[Math.min(i, RAMPA_DA_MARCA.length - 1)],
              }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-body-sm text-fg-default">
              {u.uf}
              <span className="ml-gp-sm text-caption-sm text-fg-muted">
                {u.detalhe}
              </span>
            </span>
            <span className="shrink-0 text-body-sm font-semibold tabular-nums text-fg-default">
              {formatar(u.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Barras sem Recharts
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Barra de proporção — uma linha dividida em fatias, com legenda embaixo.
 *
 * É o padrão "MRR" do `ChartShowcaseDoc`. Substitui a barra empilhada gigante que a
 * referência usa para "Carregadores por status": lá ela tem ~40px de altura e o número
 * escrito dentro, o que obriga a fatia de 3% a caber um texto — e não cabe.
 */
export function BarraDeProporcao({
  fatias,
  cores,
}: {
  fatias: Fatia[];
  cores: string[];
}) {
  const total = fatias.reduce((a, f) => a + f.valor, 0) || 1;

  return (
    <div className="flex flex-col gap-gp-xl">
      <div className="flex h-[8px] gap-[3px] overflow-hidden rounded-radius-full">
        {fatias.map((f, i) => (
          <span
            key={f.chave}
            style={{
              width: `${(f.valor / total) * 100}%`,
              background: cores[i % cores.length],
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-gp-2xl">
        {fatias.map((f, i) => (
          <span
            key={f.chave}
            className="flex items-center gap-gp-sm text-caption-md text-fg-muted"
          >
            <span
              className="size-[8px] shrink-0 rounded-[2px]"
              style={{ background: cores[i % cores.length] }}
              aria-hidden
            />
            <span className="font-semibold tabular-nums text-fg-default">
              {f.valor}
            </span>
            {f.rotulo}
            <span className="tabular-nums">
              ({((f.valor / total) * 100).toFixed(2)}%)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Faixa de disponibilidade — um bloco por intervalo, verde no ar, vermelho fora.
 *
 * Receita `StatusBars` do `ChartShowcaseDoc`, com uma diferença medida: lá são 60 a 72
 * ticks e `h-[40px]`; aqui são 24, e com `flex-1` cada bloco sairia com ~46px de largura
 * contra 40 de altura — quadrados, que leem como células de calendário e não como uma
 * linha do tempo. Daí a altura menor.
 */
export function FaixaDeDisponibilidade({ blocos }: { blocos: boolean[] }) {
  return (
    <div className="flex h-[22px] items-stretch gap-[3px]">
      {blocos.map((noAr, i) => (
        <span
          key={i}
          className="flex-1 rounded-[2px]"
          style={{ background: noAr ? COR_DE_STATUS.ok : COR_DE_STATUS.fora }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Tabela de ranking
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Linha de um ranking.
 *
 * ## Por que LISTA e não tabela
 *
 * A 1ª versão era `Table density="compact"` dentro de um card. Três defeitos, todos
 * apontados pelo operador e todos verdadeiros:
 *
 * 1. **Achatada.** `compact` é 40px de linha — densidade de planilha. Um ranking é lido
 *    de relance, não conferido célula a célula.
 * 2. **Colunas de largura fixa.** `width` em px não se redistribui: sobrava vão à direita
 *    e o nome do local quebrava à esquerda, na mesma linha.
 * 3. **Card sobre card.** A tabela já desenha superfície própria; dentro de um
 *    `CartaoDeGrafico` viravam duas molduras concêntricas.
 *
 * A lista resolve os três: altura por conteúdo, `flex-1 min-w-0` no bloco de texto (que é
 * o que redistribui), e nenhuma superfície própria — ela vive direto no card da seção. É
 * o padrão do `DashboardShowcase` (`AgentPerformanceList`) e o das referências que o
 * operador mandou.
 */
export interface ItemDeRanking {
  /** Identidade da linha. */
  id: string;
  /** Primeira linha, em destaque. */
  titulo: ReactNode;
  /** Segunda linha, menor e apagada. Omita para uma linha só. */
  subtitulo?: ReactNode;
  /** Bloco à esquerda do texto — normalmente um `Avatar`. */
  figura?: ReactNode;
  /** Valor principal, à direita, em destaque. */
  valor: ReactNode;
  /** Abaixo do valor, apagado. Onde entram as métricas de apoio. */
  apoio?: ReactNode;
}

/**
 * Lista ordenada com medalha no primeiro lugar.
 *
 * ⚠️ O #1 sai dourado com ícone de medalha, e os demais em pastilha neutra. Isso é o que
 * o `dashboard-patterns.md` do DS prescreve — e é justamente o que o
 * `DashboardShowcase` **não** faz (lá todos são neutros). Num ranking, o primeiro lugar
 * é a informação; numerar todos igual obriga a ler o número para descobrir quem venceu.
 */
export function ListaDeRanking({
  itens,
  alturaMax,
  rotulo,
}: {
  itens: ItemDeRanking[];
  /** Em px. Com valor, a lista rola; sem, ela cresce com o conteúdo. */
  alturaMax?: number;
  rotulo: string;
}) {
  return (
    <ul
      aria-label={rotulo}
      className="m-0 flex list-none flex-col overflow-y-auto p-0 scrollbar-thin"
      style={alturaMax ? { maxHeight: alturaMax } : undefined}
    >
      {itens.map((item, i) => (
        <li
          key={item.id}
          className="flex items-center gap-gp-lg border-b border-border-subtle py-pad-lg last:border-b-0"
        >
          <span
            className={`grid size-[24px] shrink-0 place-items-center rounded-radius-full text-caption-sm font-bold tabular-nums ${
              i === 0
                ? "bg-bg-warning-muted text-fg-warning"
                : "bg-bg-muted text-fg-muted"
            }`}
            aria-label={`${i + 1}º lugar`}
          >
            {i === 0 ? (
              <Award className="size-icon-2xs" strokeWidth={2.4} aria-hidden />
            ) : (
              i + 1
            )}
          </span>

          {item.figura}

          {/* `flex-1 min-w-0` é o que redistribui: o texto ocupa o que sobra e trunca,
              em vez de empurrar as métricas para fora como fazia a coluna de px fixo. */}
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="truncate text-body-sm font-semibold text-fg-default">
              {item.titulo}
            </span>
            {item.subtitulo && (
              <span className="truncate text-caption-sm text-fg-muted">
                {item.subtitulo}
              </span>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-[2px]">
            <span className="text-body-sm font-semibold tabular-nums text-fg-default">
              {item.valor}
            </span>
            {item.apoio && (
              <span className="text-caption-sm tabular-nums text-fg-muted">
                {item.apoio}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Nome de local sem elipse — cortar leva equipe ao ponto errado. */
export function Quebravel({ children }: { children: ReactNode }) {
  return (
    <span className="block whitespace-normal break-words leading-snug">
      {children}
    </span>
  );
}
