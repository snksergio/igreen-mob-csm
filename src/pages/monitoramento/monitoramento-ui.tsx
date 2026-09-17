import { Chip } from "@snksergio/design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@snksergio/design-system/shadcn";
import {
  COR_DO_STATUS,
  ROTULO_STATUS,
  STATUS_NA_ORDEM,
  type Plugue,
  type StatusPlugue,
} from "./monitoramento-mock";

/* ══════════════════════════════════════════════════════════════════════════
   Barra de status — a receita `StatusBars` do `ChartShowcaseDoc` do DS
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Um traço por plugue.
 *
 * ## ⏸️ PARADO — não está na tela, e é de propósito
 *
 * Decisão do operador (2026-09-16), depois de ver funcionando: o modelo **assume um parque
 * de tamanho conhecido**, e não há esse número. Com um cliente de 200 plugues a barra vira
 * mancha; no celular ela vira mancha bem antes. O traço também não é clicável de um jeito
 * que alguém descubra sozinho — a área de toque tem 20px e nada anuncia que ela responde.
 *
 * O componente FICA porque o raciocínio dele continua válido pro dia em que houver recorte
 * com cardinalidade pequena e garantida (um local, um carregador). Quem for reaproveitar:
 * ele já trata o teto e já é clicável; o que falta é o contexto em que caiba.
 *
 * Quem está na tela hoje é `BarraDeProporcao`, logo abaixo.
 *
 * ## O raciocínio original, preservado
 *
 * Na receita do DS cada traço é uma JANELA DE TEMPO (90 dias, 90 traços), e por isso ela
 * precisa do "91.1% uptime" ao lado: o traço sozinho não diz quanto. Aqui cada traço era um
 * objeto físico e a contagem saía exata, sem aproximação de proporção — "4 vermelhos" é
 * literalmente quatro equipamentos.
 *
 * ## O teto
 *
 * Acima de `MAXIMO_DE_TRACOS` um traço por plugue ficaria com menos de 1px e a barra viraria
 * uma mancha. Aí ela cai pra proporcional — cada traço passa a valer vários plugues, e o
 * cabeçalho passa a ser a fonte da contagem. O limiar é declarado, não implícito.
 */
const MAXIMO_DE_TRACOS = 120;

/**
 * Largura de cada traço.
 *
 * ⚠️ **Fixa, e não o `flex-1` da receita do DS.** Lá são 60–90 traços numa faixa de ~1100px,
 * o que dá ~19px cada e produz a silhueta de barra. Com 23 plugues o `flex-1` deu **43px
 * medidos** — traço mais largo que alto, e a "barra" virou uma fileira de azulejos que não
 * se lê como uma coisa só.
 *
 * 20px reproduz a proporção do original (≈1:2 contra os 40px de altura). O preço é a barra
 * não ocupar a linha inteira quando há poucos plugues — e isso é informação, não sobra: o
 * comprimento passa a dizer o tamanho do parque.
 */
const LARGURA_DO_TRACO = 20;

export function BarraDePlugues({
  linhas,
  selecionado,
  onSelecionar,
}: {
  linhas: Plugue[];
  selecionado?: string | null;
  onSelecionar?: (p: Plugue) => void;
}) {
  if (linhas.length === 0) return null;

  const proporcional = linhas.length > MAXIMO_DE_TRACOS;

  /* No modo proporcional os traços deixam de mapear 1:1 e passam a representar fatias
     arredondadas — por isso o `title` muda de "este plugue" pra "estes N". */
  const tracos: { chave: string; status: StatusPlugue; plugue: Plugue | null }[] =
    proporcional
      ? (() => {
          const escala = MAXIMO_DE_TRACOS / linhas.length;
          return STATUS_NA_ORDEM.flatMap((s) => {
            const n = Math.round(linhas.filter((l) => l.status === s).length * escala);
            return Array.from({ length: n }, (_, i) => ({
              chave: `${s}-${i}`,
              status: s,
              plugue: null,
            }));
          });
        })()
      : linhas.map((l) => ({ chave: l.id, status: l.status, plugue: l }));

  return (
    /* `h-[40px] gap-[3px] rounded-[2px]` são literais da receita do DS (`ChartShowcaseDoc`,
       cartão System Status) — px na unha porque são espessura de desenho, não ritmo de
       layout, e a escala de gap do DS começa em 2px.

       `inline-flex` + `flex-wrap`: a barra tem a largura do parque, não da linha, e com
       muitos plugues ela quebra em vez de espremer cada traço a sub-pixel. */
    <div className="inline-flex max-w-full flex-wrap items-stretch gap-[3px]">
      {tracos.map((t) => {
        const cor = COR_DO_STATUS[t.status];
        const rotulo = t.plugue
          ? `${t.plugue.id} · ${t.plugue.local} · ${ROTULO_STATUS[t.status]}`
          : ROTULO_STATUS[t.status];

        /* Só vira botão quando há plugue atrás dele. No modo proporcional o traço não
           representa um objeto clicável, e um botão que não leva a lugar nenhum é pior
           que nenhum. */
        const medida = {
          background: cor,
          width: LARGURA_DO_TRACO,
          height: 40,
        };

        if (!t.plugue || !onSelecionar) {
          return (
            <span
              key={t.chave}
              title={rotulo}
              className="shrink-0 rounded-[2px]"
              style={medida}
            />
          );
        }

        const ativo = selecionado === t.plugue.id;
        return (
          <button
            key={t.chave}
            type="button"
            title={rotulo}
            aria-label={rotulo}
            onClick={() => onSelecionar(t.plugue!)}
            /* `origin-bottom scale-y-*` no hover em vez de mudar largura: crescer a largura
               de um traço empurra todos os outros e a barra inteira treme. */
            className={`shrink-0 rounded-[2px] origin-bottom transition-transform duration-150 hover:scale-y-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand ${
              ativo ? "scale-y-110 ring-2 ring-ring-brand" : ""
            }`}
            style={medida}
          />
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Barra de proporção — a receita do cartão "Monthly Recurring Revenue" do DS
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Percentuais inteiros que somam exatamente 100 — método do maior resto.
 *
 * Arredonda todo mundo pra baixo, conta quantos pontos faltam pra 100 e distribui um a um
 * pra quem tem a maior parte fracionária perdida. É o método padrão pra apresentar
 * partição; `Math.round` individual não garante nada, e o erro aparece justamente quando há
 * muitas fatias pequenas — que é o caso desta tela (quatro status com 1 plugue cada).
 */
export function percentuaisQueSomamCem(
  porStatus: Record<StatusPlugue, number>,
  total: number,
): Record<StatusPlugue, number> {
  const exatos = STATUS_NA_ORDEM.map((s) => ({
    status: s,
    exato: (porStatus[s] / total) * 100,
  }));

  const saida = Object.fromEntries(
    exatos.map((e) => [e.status, Math.floor(e.exato)]),
  ) as Record<StatusPlugue, number>;

  let faltam = 100 - exatos.reduce((a, e) => a + Math.floor(e.exato), 0);

  /* Zerado nunca recebe sobra: um status sem plugue nenhum exibindo "1%" seria pior que a
     soma dar 99. Ordena pelo resto perdido, do maior pro menor. */
  const candidatos = exatos
    .filter((e) => porStatus[e.status] > 0)
    .sort((a, b) => (b.exato % 1) - (a.exato % 1));

  for (let i = 0; faltam > 0 && candidatos.length > 0; i++, faltam--) {
    saida[candidatos[i % candidatos.length].status] += 1;
  }

  return saida;
}

/**
 * Barra empilhada por percentual, com legenda de `%` + rótulo.
 *
 * ## Por que ela substituiu a de traços
 *
 * Porque ela **não depende de quantos plugues existem**. A largura de cada faixa é uma
 * fração, então 23 plugues e 2.300 desenham a mesma barra, e ela continua legível em 320px
 * de celular. A de traços assumia um parque pequeno e conhecido, que não é o caso.
 *
 * ## O que muda em relação à receita do DS
 *
 * Nada de desenho: `h-[8px]`, `gap-[3px]`, `rounded-radius-full`, ponto de legenda
 * `size-[8px] rounded-[2px]`, percentual em negrito antes do rótulo — tudo literal do
 * cartão MRR do `ChartShowcaseDoc`. O que muda é o dado, e uma coisa que o dado obriga:
 *
 * ⚠️ **Status com contagem 0 não vira faixa de 0%.** Uma faixa de largura zero ainda
 * desenha os 3px de gap ao lado dela — quatro status zerados somariam 12px de buraco que
 * ninguém consegue explicar. Zerados aparecem só na legenda, que é onde "0" é informação.
 *
 * ⚠️ **O percentual é arredondado para exibição, mas a LARGURA usa a fração exata.** Se as
 * duas viessem do valor arredondado, 7 status a 14,28% cada somariam 99,96% e sobraria uma
 * fresta no fim da barra.
 *
 * ⚠️ **O arredondamento é por MAIOR RESTO, não `Math.round` em cada um.** Medido com os 23
 * plugues reais: `round` individual dava `57 + 4 + 9 + 4 + 4 + 17 + 4 = 99%`. Uma legenda que
 * apresenta uma partição e soma 99 põe em dúvida o número inteiro ao lado — e quem confere
 * não tem como saber que o que falta é arredondamento e não um plugue perdido.
 */
export function BarraDeProporcao({
  porStatus,
  total,
}: {
  porStatus: Record<StatusPlugue, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-[8px] overflow-hidden rounded-radius-full bg-bg-muted" />
    );
  }

  const faixas = STATUS_NA_ORDEM.filter((s) => porStatus[s] > 0).map((s) => ({
    status: s,
    fracao: (porStatus[s] / total) * 100,
  }));

  const pctExibido = percentuaisQueSomamCem(porStatus, total);

  return (
    <div className="flex flex-col gap-gp-xl">
      <div className="flex h-[8px] gap-[3px] overflow-hidden rounded-radius-full">
        {faixas.map((f) => (
          <span
            key={f.status}
            title={`${ROTULO_STATUS[f.status]} — ${porStatus[f.status]} de ${total}`}
            style={{ width: `${f.fracao}%`, background: COR_DO_STATUS[f.status] }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-x-gp-4xl gap-y-gp-md">
        {STATUS_NA_ORDEM.map((s) => {
          const pct = pctExibido[s];
          return (
            /* Zerado fica apagado em vez de sumir: "Carregando 0" é resposta, e a legenda
               mudando de tamanho a cada atualização seria pior que a linha extra. */
            <span
              key={s}
              className={`flex items-center gap-gp-xs text-caption-sm text-fg-muted ${
                porStatus[s] === 0 ? "opacity-45" : ""
              }`}
            >
              <span
                className="size-[8px] shrink-0 rounded-[2px]"
                style={{ background: COR_DO_STATUS[s] }}
              />
              <span className="font-semibold tabular-nums text-fg-default">
                {pct}%
              </span>
              {ROTULO_STATUS[s]}
              <span className="tabular-nums opacity-70">({porStatus[s]})</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Legenda com contagem.
 *
 * O ponto de 8px e o `caption-sm text-fg-muted` são da receita. O que muda é o número
 * colado no rótulo: na receita a legenda só explica a cor, e aqui ela também É o resumo —
 * sem isso a tela precisaria de uma segunda lista dizendo quantos há de cada.
 */
export function LegendaDePlugues({
  porStatus,
  ativos,
  onAlternar,
}: {
  porStatus: Record<StatusPlugue, number>;
  /** Status visíveis. `null` = todos (nenhum recorte aplicado). */
  ativos?: StatusPlugue[] | null;
  onAlternar?: (s: StatusPlugue) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-gp-4xl gap-y-gp-md">
      {STATUS_NA_ORDEM.map((s) => {
        const apagado = ativos ? !ativos.includes(s) : false;
        const conteudo = (
          <>
            <span
              className="size-[8px] shrink-0 rounded-radius-full"
              style={{ background: COR_DO_STATUS[s] }}
            />
            {ROTULO_STATUS[s]}
            <span className="font-semibold tabular-nums text-fg-default">
              {porStatus[s]}
            </span>
          </>
        );

        const classe = `flex items-center gap-gp-xs text-caption-sm text-fg-muted transition-opacity ${
          apagado ? "opacity-40" : ""
        }`;

        if (!onAlternar) {
          return (
            <span key={s} className={classe}>
              {conteudo}
            </span>
          );
        }

        return (
          <button
            key={s}
            type="button"
            onClick={() => onAlternar(s)}
            className={`${classe} rounded-radius-sm hover:opacity-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand`}
          >
            {conteudo}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Células da tabela
   ══════════════════════════════════════════════════════════════════════════ */

/** Cor do Chip por status — o mapa de cor da barra é CSS var e não serve de prop do Chip. */
const COR_DO_CHIP: Record<
  StatusPlugue,
  "success" | "info" | "primary" | "warning" | "danger" | "neutral"
> = {
  disponivel: "success",
  preparando: "info",
  carregando: "info",
  finalizando: "primary",
  falha: "warning",
  offline: "danger",
  indisponivel: "neutral",
};

export function ChipDeStatus({ status }: { status: StatusPlugue }) {
  return (
    <Chip color={COR_DO_CHIP[status]} variant="soft" size="sm" shape="pill">
      {ROTULO_STATUS[status]}
    </Chip>
  );
}

/**
 * O ponto de conexão.
 *
 * Ponto colorido sozinho não é acessível — verde e vermelho a 8px são o par que mais gente
 * confunde. Por isso ele carrega `aria-label` e `Tooltip`: a cor é o atalho, o texto é a
 * informação.
 */
export function PontoDeConexao({ conectado }: { conectado: boolean }) {
  const texto = conectado ? "Conectado" : "Desconectado";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={texto}
          className={`block size-[10px] rounded-radius-full ${
            conectado ? "bg-bg-success" : "bg-bg-danger"
          }`}
        />
      </TooltipTrigger>
      <TooltipContent>{texto}</TooltipContent>
    </Tooltip>
  );
}

/** `16/09/2026` em cima, `18:43:07` embaixo — o desenho de duas linhas da referência. */
export function CarimboDeStatus({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <span className="flex flex-col gap-gp-2xs leading-tight">
      <span className="text-body-sm tabular-nums text-fg-default">
        {d.toLocaleDateString("pt-BR")}
      </span>
      <span className="text-caption-md tabular-nums text-fg-muted">
        {d.toLocaleTimeString("pt-BR", { hour12: false })}
      </span>
    </span>
  );
}

/**
 * Disponibilidade.
 *
 * O vermelho entra abaixo de 85% porque é o ponto em que a referência já mostra problema
 * (66,0% no desconectado, 84,4% no de falha) e os saudáveis ficam acima de 90 — o limiar
 * cai no vale entre os dois grupos, não no meio de um deles.
 */
export function Disponibilidade({ pct }: { pct: number }) {
  return (
    <span
      className={`tabular-nums font-semibold ${
        pct < 85 ? "text-fg-danger" : pct < 95 ? "text-fg-warning" : "text-fg-success"
      }`}
    >
      {pct.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}%
    </span>
  );
}
