import type { ReactNode } from "react";
import { Chip } from "@snksergio/design-system";
import { Check, Clock, MessageCircle, Phone, Store, X } from "lucide-react";
import {
  CANAL_LABEL,
  ESTADO_LABEL,
  PRODUTO_LABEL,
  RESULTADO_LABEL,
  dataHora,
  estadoEfetivo,
  faixaDoPrazo,
  interrupcaoDaTrilha,
  marcosDoLead,
  produtosEmAberto,
  rotuloDoPrazo,
  type Contato,
  type EstadoVisivel,
  type Lead,
} from "./leads-mock";

/**
 * Chip do estado do lead.
 *
 * O mapa de cor não é decorativo: `convertido` é o único `success`, porque é o único que
 * veio de um FATO (recarga paga, produto ativado) e não de uma declaração de quem estava
 * trabalhando o lead. `expirado` é neutro e apagado de propósito — vermelho ali gritaria
 * todo dia por algo que já não tem conserto.
 */
const COR_DO_ESTADO: Record<
  EstadoVisivel,
  "neutral" | "primary" | "success" | "warning" | "danger"
> = {
  novo: "primary",
  "tentei-contato": "warning",
  "em-conversa": "primary",
  convertido: "success",
  perdido: "neutral",
  expirado: "neutral",
};

export function ChipDeEstado({ lead }: { lead: Lead }) {
  const estado = estadoEfetivo(lead);
  return (
    <Chip
      color={COR_DO_ESTADO[estado]}
      variant="soft"
      size="sm"
      shape="pill"
      className={estado === "expirado" || estado === "perdido" ? "opacity-70" : undefined}
    >
      {ESTADO_LABEL[estado]}
    </Chip>
  );
}

/**
 * O prazo da janela, em texto e cor.
 *
 * ## Duas decisões que parecem detalhe e não são
 *
 * **1. "Expira em 3 dias", nunca "parado há 4 dias".** O Pipedrive, que tem a mecânica
 * mais parecida do mercado, mede INATIVIDADE — lá qualquer contato zera o contador. A
 * nossa janela é PRAZO: corre do pré-cadastro e contato nenhum estende. Os dois rótulos
 * descrevem relógios diferentes, e usar o do Pipedrive diria que a culpa é de quem não
 * agiu, quando é só o contrato acabando.
 *
 * **2. Cor E texto, nunca só cor.** A urgência está escrita na frase; a cor só reforça.
 * Quem não distingue o vermelho continua lendo "Expira hoje".
 */
const CLASSE_DA_FAIXA: Record<ReturnType<typeof faixaDoPrazo>, string> = {
  tranquilo: "text-fg-muted",
  atencao: "text-fg-warning font-medium",
  perigo: "text-fg-danger font-semibold",
  expirado: "text-fg-subtle",
  encerrado: "text-fg-subtle",
};

export function PrazoDaJanela({ lead }: { lead: Lead }) {
  const faixa = faixaDoPrazo(lead);
  const urgente = faixa === "perigo" || faixa === "atencao";
  return (
    <span
      className={`inline-flex items-center gap-gp-xs text-body-sm tabular-nums ${CLASSE_DA_FAIXA[faixa]}`}
    >
      {urgente && <Clock className="size-icon-sm shrink-0" aria-hidden />}
      {rotuloDoPrazo(lead)}
    </span>
  );
}

/**
 * Os produtos iGreen que a pessoa já tem — no lugar de uma "temperatura".
 *
 * ## Por que não existe chama de lead quente aqui
 *
 * `Quente / Morno / Frio` junta duas perguntas que andam em direções opostas:
 *
 * | | facilidade de abordar | tamanho da oportunidade |
 * |---|---|---|
 * | cliente com 4 produtos | alta — já confia na marca | **mínima**, não sobrou o que vender |
 * | cliente com 0 produtos | baixa — não conhece ninguém | **máxima** |
 *
 * Um número só não carrega as duas, e qualquer peso que eu escolhesse seria invenção
 * minha. Mostrar o que a pessoa TEM é fato verificável; o licenciado faz a conta em um
 * olhar, e ela é a conta dele, não a minha.
 *
 * A célula vazia (`—`) é informação, não falta de dado: é o lead que mais vale.
 */
export function ChipsDeProdutos({ lead }: { lead: Lead }) {
  if (lead.produtos.length === 0)
    return (
      <span className="text-body-sm text-fg-subtle" title="Não tem nenhum produto iGreen">
        —
      </span>
    );
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-gp-xs">
      {lead.produtos.map((p) => (
        <Chip key={p} color="neutral" variant="soft" size="sm" shape="rounded">
          {PRODUTO_LABEL[p]}
        </Chip>
      ))}
    </span>
  );
}

/** "Sobrou Seguros e Telecom" — a leitura que a coluna de produtos provoca, em prosa. */
export function ResumoDaOportunidade({ lead }: { lead: Lead }) {
  const abertos = produtosEmAberto(lead);
  const tem = lead.produtos.map((p) => PRODUTO_LABEL[p]);
  const faltam = abertos.map((p) => PRODUTO_LABEL[p]);

  const frase = (l: string[]) =>
    l.length === 1 ? l[0] : `${l.slice(0, -1).join(", ")} e ${l[l.length - 1]}`;

  return (
    <p className="text-body-sm leading-relaxed text-fg-muted">
      {tem.length === 0 ? (
        <>
          Ainda <strong className="font-semibold text-fg-default">não tem</strong> nenhum
          produto iGreen — os quatro estão em aberto.
        </>
      ) : faltam.length === 0 ? (
        <>
          Já é cliente dos <strong className="font-semibold text-fg-default">quatro</strong>{" "}
          produtos. Não há o que oferecer além da recarga.
        </>
      ) : (
        <>
          Já é cliente de{" "}
          <strong className="font-semibold text-fg-default">{frase(tem)}</strong>. Em
          aberto: <strong className="font-semibold text-fg-default">{frase(faltam)}</strong>.
        </>
      )}
    </p>
  );
}

/** Ícone por canal do contato. */
const ICONE_DO_CANAL = {
  whatsapp: MessageCircle,
  ligacao: Phone,
  presencial: Store,
} as const;

/**
 * O histórico de contatos.
 *
 * É a razão de a tela existir: o WhatsApp não guarda isso. Cada linha diz canal,
 * resultado e quando — o suficiente para, uma semana depois, saber se vale insistir.
 *
 * Estado vazio é o caso mais comum na visão padrão (lead novo) e por isso tem texto
 * próprio, não um traço.
 */
export function HistoricoDeContatos({ contatos }: { contatos: Contato[] }) {
  if (contatos.length === 0)
    return (
      <p className="text-body-sm text-fg-subtle">
        Ninguém falou com esta pessoa ainda.
      </p>
    );

  return (
    <ol className="flex flex-col gap-gp-lg">
      {[...contatos].reverse().map((c) => {
        const Icone = ICONE_DO_CANAL[c.canal];
        return (
          <li key={c.id} className="flex items-start gap-gp-md">
            <span
              className={`mt-[2px] grid size-comp-lg shrink-0 place-items-center rounded-radius-base ${
                c.resultado === "respondeu"
                  ? "bg-bg-success-muted text-fg-success"
                  : c.resultado === "recusou"
                    ? "bg-bg-danger-muted text-fg-danger"
                    : "bg-bg-muted text-fg-muted"
              }`}
            >
              <Icone className="size-icon-sm" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col gap-[2px]">
              <span className="text-body-sm font-medium text-fg-default">
                {CANAL_LABEL[c.canal]} · {RESULTADO_LABEL[c.resultado]}
              </span>
              <span className="text-caption-sm tabular-nums text-fg-subtle">
                {dataHora(c.quando)}
              </span>
              {c.nota && (
                <span className="mt-[2px] text-body-sm leading-relaxed text-fg-muted">
                  {c.nota}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Linha rótulo/valor dos painéis — **a mesma de Implantações**, não uma variante.
 *
 * ⚠️ A primeira versão desta tela usava rótulo EM CIMA do valor, em grade de duas ou
 * três colunas. Funcionava e estava errado pelo motivo que o operador apontou: o
 * projeto já tem um desenho de ficha, e ele é este — rótulo à esquerda, valor à
 * direita, régua fina entre as linhas. Duas fichas com desenhos diferentes no mesmo
 * produto fazem o usuário reaprender a ler a cada painel.
 *
 * Empilha no celular: `[176px_1fr]` deixaria pouco mais de 170px para o valor num
 * painel de 375px, e nome de posto quebraria em três linhas ao lado de um rótulo curto.
 */
export function Propriedade({
  rotulo,
  children,
}: {
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs border-b border-border-subtle py-pad-lg last:border-b-0 sm:grid-cols-[176px_1fr] sm:items-center">
      <span className="text-body-sm text-fg-muted">{rotulo}</span>
      <span className="min-w-0 text-body-sm text-fg-default sm:text-right">
        {children}
      </span>
    </div>
  );
}

/**
 * A trilha do lead — quatro marcos, horizontal no painel, empilhada no celular.
 *
 * ## O que ela mostra, e o que ela recusa a mostrar
 *
 * Os marcos vêm de `marcosDoLead`, e o JSDoc de lá explica por que são quatro e não os
 * cinco estados. O resumo: `Tentei contato` é uma falha, não um degrau; `Perdido` e
 * `Expirado` são saídas. Uma escada com os cinco premiaria não ter conseguido falar e
 * poria a perda no lugar do objetivo.
 *
 * ## ⚠️ Não é clicável, ao contrário da trilha de Implantações
 *
 * Lá cada etapa é um botão: o usuário MOVE a implantação. Aqui nenhum marco é uma
 * escolha — todos vêm de fato (existe contato? houve resposta? pagou?). Um marco
 * clicável convidaria a declarar "respondeu" sem ninguém ter respondido, que é
 * exatamente o que o registro de contato existe para impedir.
 *
 * Horizontal porque são quatro rótulos curtos: cabem em 480px, que é a largura mínima
 * do painel. A vertical de Implantações existe porque lá são sete passos com contador.
 */
export function TrilhaDoLead({ lead }: { lead: Lead }) {
  const marcos = marcosDoLead(lead);
  const interrompida = interrupcaoDaTrilha(lead);
  const ultimoCumprido = marcos.reduce((acc, m, i) => (m.cumprido ? i : acc), 0);
  const ultimo = marcos.length - 1;
  /* Quanto do trilho já está pintado: 0 no primeiro marco, 1 no último. */
  const andado = ultimoCumprido / ultimo;

  return (
    <div className="flex flex-col gap-gp-lg">
      <div className="relative">
        {/* ── O trilho ──────────────────────────────────────────────────────
            Absoluto e ÚNICO, em vez de um pedaço de fio dentro de cada item.

            A primeira versão punha o fio dentro do item (`[círculo][fio flex-1]`), e foi
            isso que produziu o defeito que o operador viu no print: sem fio no último
            item, o círculo dele ficava encostado à ESQUERDA da própria coluna, sobrando
            um vão à direita — a trilha parecia interrompida antes de acabar.

            `left-[10px] right-[10px]` = o raio do círculo de 20px, então o trilho começa
            e termina exatamente no CENTRO do primeiro e do último. Só aparece de `sm`
            para cima: no celular a lista é uma coluna curta e um fio vertical gastaria
            altura sem dizer nada além da ordem, que os números já dizem. */}
        <span className="absolute left-[10px] right-[10px] top-[9px] hidden h-[2px] rounded-radius-full bg-border-default sm:block" aria-hidden />
        <span
          className="absolute left-[10px] top-[9px] hidden h-[2px] rounded-radius-full bg-bg-brand sm:block"
          style={{ width: `calc((100% - 20px) * ${andado})` }}
          aria-hidden
        />

        <ol
          className="relative flex flex-col gap-gp-md sm:flex-row sm:gap-0"
          aria-label="Progresso do lead"
        >
          {marcos.map((m, i) => {
            const ehPrimeiro = i === 0;
            const ehUltimo = i === ultimo;
            const proximo = !m.cumprido && i === ultimoCumprido + 1 && !interrompida;
            const morto = !m.cumprido && !!interrompida;

            /* ── A geometria que o operador pediu ──────────────────────────
               Ponta esquerda encostada, ponta direita encostada, e os do meio
               centralizados — círculo E texto juntos, nunca um alinhado de um jeito e
               o outro de outro: o rótulo tem que ficar embaixo do SEU círculo.

               ⚠️ As colunas das pontas valem METADE. Com quatro colunas iguais e os
               extremos ancorados, os círculos cairiam em 0 · 1,5U · 2,5U · 4U — vãos de
               1,5 / 1,0 / 1,5, visivelmente tortos. Com 0,5 · 1 · 1 · 0,5 eles caem em
               0 · U · 2U · 3U, igualmente espaçados. */
            const alinhamento = ehPrimeiro
              ? "sm:items-start sm:text-left"
              : ehUltimo
                ? "sm:items-end sm:text-right"
                : "sm:items-center sm:text-center";

            return (
              <li
                key={m.id}
                /* ⚠️ **Sem `sm:items-*` aqui.** A primeira versão tinha
                   `sm:items-start` na base E o alinhamento por posição na variável
                   abaixo. As duas classes sobreviviam — `tailwind-merge` não entra numa
                   template string — e, com a mesma especificidade, quem ganhava era a
                   ordem do CSS: `items-start` vencia sempre. Medido: os quatro círculos
                   ficaram em 10 · 105 · 296 · 487 numa trilha de 572, ou seja todos
                   colados à esquerda da própria coluna e o último a 75px do fim — que é
                   exatamente o defeito que o print do operador mostrou.

                   É a L-072 do DS em miniatura: com classe que o merge não reconhece,
                   declare o valor em UM lugar só. O alinhamento mora todo em
                   `alinhamento`, inclusive o `items-start` do primeiro. */
                className={`flex min-w-0 items-center gap-gp-md sm:flex-col sm:gap-gp-xs ${
                  ehPrimeiro || ehUltimo ? "sm:flex-[0.5]" : "sm:flex-1"
                } ${alinhamento}`}
              >
                <span
                  className={`z-10 grid size-[20px] shrink-0 place-items-center rounded-radius-full border-2 ${
                    m.cumprido
                      ? "border-transparent bg-bg-brand text-fg-on-brand"
                      : proximo
                        ? "border-border-brand bg-bg-canvas"
                        : "border-border-default bg-bg-canvas"
                  }`}
                >
                  {m.cumprido ? (
                    <Check className="size-[12px]" strokeWidth={3} aria-hidden />
                  ) : morto ? (
                    <X className="size-[11px] text-fg-subtle" strokeWidth={3} aria-hidden />
                  ) : null}
                </span>

                <span className="flex min-w-0 flex-col gap-[1px]">
                  <span
                    className={`text-body-sm leading-snug ${
                      m.cumprido
                        ? "font-semibold text-fg-default"
                        : proximo
                          ? "font-medium text-fg-default"
                          : "text-fg-subtle"
                    }`}
                  >
                    {m.label}
                  </span>
                  <span className="text-caption-sm tabular-nums text-fg-subtle">
                    {m.quando
                      ? dataHora(m.quando)
                      : morto
                        ? "não aconteceu"
                        : proximo
                          ? "é o próximo"
                          : "—"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {interrompida && (
        <p className="text-body-sm leading-relaxed text-fg-muted">
          <strong className="font-semibold text-fg-default">A trilha parou aqui.</strong>{" "}
          {interrompida}
        </p>
      )}
    </div>
  );
}

/**
 * O mesmo progresso da trilha, do tamanho de uma célula de tabela.
 *
 * A tabela dizia o ESTADO (um chip) e não dizia o quanto já andou — que é a pergunta
 * seguinte, e obrigava a abrir o painel para respondê-la.
 *
 * ## ⚠️ A primeira versão era ilegível, e o motivo era o token
 *
 * Ela usava `bg-bg-muted` nos segmentos vazios, com 4px de altura e o `3/4` embaixo.
 * No escuro `bg-muted` é **branco a 3%** — praticamente o próprio fundo da linha. O
 * trilho sumia, sobrava uma poeira verde de 4px, e o rótulo embaixo ainda esticava a
 * altura da linha. Foi o que o operador viu no print.
 *
 * O que mudou, e por quê:
 *
 * | antes | agora | motivo |
 * |---|---|---|
 * | trilho `bg-bg-muted` | **`bg-bg-emphasis`** | 3% → **12%** de branco no escuro; é o token neutro que existe justamente para ter presença |
 * | altura 4px | **6px** | 4px é espessura de régua, não de barra |
 * | rótulo embaixo | **ao lado** | a linha da tabela não cresce — pedido do operador |
 *
 * ## Segmentos, e não uma barra contínua
 *
 * Os marcos são discretos e são quatro; uma barra lisa em 50% convidaria a ler "metade
 * do caminho" como se houvesse um contínuo entre um marco e o outro. Não há: ou a pessoa
 * respondeu, ou não. Os quatro blocos também casam com os quatro círculos do painel —
 * quem vê a linha reconhece o desenho ao abrir o lead.
 *
 * Trilha interrompida pinta o que andou em `bg-fg-subtle` em vez de verde: um lead
 * perdido com dois blocos de marca leria como progresso, quando é o oposto.
 */
export function ProgressoDoLead({ lead }: { lead: Lead }) {
  const marcos = marcosDoLead(lead);
  const feitos = marcos.filter((m) => m.cumprido).length;
  const total = marcos.length;
  const parou = interrupcaoDaTrilha(lead) !== null;
  const completo = feitos === total;

  const corDoCumprido = parou
    ? "bg-fg-subtle"
    : completo
      ? "bg-bg-success"
      : "bg-bg-brand";

  return (
    /* `w-full`: a célula não impõe largura, então um flex em LINHA encolhe para o
       conteúdo e os segmentos `flex-1` resolvem para ZERO — medido, a barra nasceu com
       9px e os quatro segmentos com 0. Na versão anterior isso não aparecia porque o
       container era `flex-col`, e aí o `align-items: stretch` dava a largura de graça. */
    <span className="flex w-full min-w-0 items-center gap-gp-md">
      {/* ⚠️ Largura FIXA, não `flex-1`. Com `autoFit` a sobra da tabela é rateada entre
          as colunas, então uma barra elástica cresce junto e passa a dominar a linha:
          baixar a largura da coluna de 160 para 146 mudou a barra de 85 para 84px,
          praticamente nada. Com 72px ela fica do mesmo tamanho em qualquer resolução —
          quatro blocos de ~16px, que leem como barra sem competir com o nome do
          cliente. */}
      <span
        className="flex w-[72px] shrink-0 gap-[3px]"
        role="img"
        aria-label={`${feitos} de ${total} marcos${parou ? ", trilha interrompida" : ""}`}
      >
        {marcos.map((m) => (
          <span
            key={m.id}
            className={`h-[6px] flex-1 rounded-radius-full ${
              m.cumprido ? corDoCumprido : "bg-bg-emphasis"
            }`}
          />
        ))}
      </span>
      <span
        className={`shrink-0 text-caption-md font-medium tabular-nums ${
          completo && !parou
            ? "text-fg-success"
            : parou
              ? "text-fg-subtle"
              : "text-fg-muted"
        }`}
      >
        {feitos}/{total}
      </span>
    </span>
  );
}
