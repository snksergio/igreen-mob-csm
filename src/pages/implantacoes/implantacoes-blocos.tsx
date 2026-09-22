import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CircleDollarSign,
  Lock,
  MapPin,
  Pencil,
  Route,
  Trash2,
  UserRound,
} from "lucide-react";
import { Avatar, Button, Chip } from "@snksergio/design-system";
import { Checkbox } from "@snksergio/design-system/shadcn";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  CHECKLIST_POR_ETAPA,
  ETAPAS,
  ETAPA_POR_ID,
  atrasada,
  concluida,
  dataCurta,
  diasNaEtapa,
  diasParaPrevisao,
  etapaAnterior,
  indiceDaEtapa,
  moeda,
  pendenciasObrigatorias,
  podeAvancar,
  potencia,
  progressoDaEtapa,
  proximaEtapa,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import { Propriedade } from "./implantacoes-ui";

/**
 * Peças compartilhadas pelas quatro propostas de painel.
 *
 * ## Por que um arquivo só
 *
 * As propostas divergem no ARRANJO, não no conteúdo: todas mostram o ponto, os prazos, o
 * cadastro e o checklist. Escrever esses blocos quatro vezes faria a comparação medir
 * quem digitou melhor, não qual desenho é melhor — e um ajuste de copy exigiria quatro
 * edições. Aqui o que varia entre propostas é só onde cada bloco entra e em que
 * densidade.
 */

/* ══ Passos compactos ════════════════════════════════════════════════════════
   Sete blocos e uma legenda. É o desenho que o operador aprovou na proposta A, e por
   isso substituiu a esteira de chevrons da B: chevron com rótulo escrito vira barra de
   rolagem horizontal com sete etapas, e rolar para saber onde se está é o oposto do que
   um indicador de progresso serve. */
export function PassosCompactos({
  implantacao,
  className = "",
}: {
  implantacao: Implantacao;
  className?: string;
}) {
  const atual = indiceDaEtapa(implantacao.etapa);
  return (
    <div className={`flex flex-col gap-gp-md ${className}`}>
      {/* ⚠️ Sem os rótulos de borda (`Proposta … Instalação`) e sem o "1." no meio. O
          operador leu o número central como um valor solto — e ele competia com o nome
          da etapa, que é a única coisa que essa faixa precisa afirmar. Quem quer a lista
          inteira tem a aba Histórico; aqui só interessa ONDE se está. */}
      <div className="flex items-baseline justify-between gap-gp-md">
        <span className="min-w-0 truncate text-body-sm font-semibold text-fg-default">
          {ETAPA_POR_ID[implantacao.etapa].label}
        </span>
        <span className="shrink-0 text-caption-sm tabular-nums text-fg-muted">
          Etapa {atual + 1} de {ETAPAS.length}
        </span>
      </div>
      <div
        className="flex gap-gp-xs"
        role="img"
        aria-label={`Etapa ${atual + 1} de ${ETAPAS.length}: ${ETAPA_POR_ID[implantacao.etapa].label}`}
      >
        {ETAPAS.map((e, i) => (
          <span
            key={e.id}
            title={`${i + 1}. ${e.label}`}
            className={`h-[6px] flex-1 rounded-radius-full ${
              i <= atual ? "bg-bg-brand" : "bg-bg-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-caption-sm leading-snug text-fg-muted">
        {ETAPA_POR_ID[implantacao.etapa].resumo}
      </span>
    </div>
  );
}

/* ══ Cabeçalho de seção ═════════════════════════════════════════════════════ */
export function TituloDeSecao({
  children,
  acao,
}: {
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-gp-md">
      <span className="text-body-sm font-semibold text-fg-default">{children}</span>
      {acao}
    </div>
  );
}

/* ══ Checklist ══════════════════════════════════════════════════════════════
   Duas densidades: `linha` (divisória, painel estreito) e `cartao` (borda, painel largo
   ou assistente). O conteúdo e o comportamento são os mesmos — muda só o peso visual. */
export function ChecklistDaEtapa({
  implantacao,
  etapa,
  onAlternar,
  variante = "linha",
}: {
  implantacao: Implantacao;
  etapa: EtapaId;
  onAlternar: (itemId: string) => void;
  variante?: "linha" | "cartao";
}) {
  return (
    <ul className={variante === "cartao" ? "flex flex-col gap-gp-md" : "flex flex-col"}>
      {CHECKLIST_POR_ETAPA[etapa].map((item) => {
        const feito = implantacao.feitos.includes(item.id);
        return (
          <li
            key={item.id}
            className={
              variante === "linha" ? "border-b border-border-subtle last:border-b-0" : ""
            }
          >
            {/* A linha inteira é o alvo. O `Checkbox` do DS é um `<button>`, que
                `<label htmlFor>` não alcança — daí a `div` clicável com o controle em
                `pointer-events-none`, para não disparar dois toggles que se anulam. */}
            <div
              onClick={() => onAlternar(item.id)}
              className={
                variante === "cartao"
                  ? `flex cursor-pointer items-center gap-gp-lg rounded-radius-lg border px-pad-2xl py-pad-xl transition-colors ${
                      feito
                        ? "border-border-brand bg-bg-brand-subtle"
                        : "border-border-default bg-bg-surface hover:border-border-brand hover:bg-bg-muted"
                    }`
                  : "flex cursor-pointer items-center gap-gp-md rounded-radius-sm px-pad-md py-pad-lg transition-colors hover:bg-bg-muted has-[:focus-visible]:bg-bg-muted"
              }
            >
              <Checkbox
                checked={feito}
                onCheckedChange={() => onAlternar(item.id)}
                aria-label={item.texto}
                className="pointer-events-none shrink-0"
              />
              {/* ⚠️ O chip fica à DIREITA da linha, não embaixo do texto. Empilhado ele
                  empurrava o item seguinte e fazia a lista perder o ritmo — e o
                  obrigatório é um atributo do item, não uma segunda informação. */}
              <span className="min-w-0 flex-1 break-words text-body-sm leading-snug">
                <span
                  className={
                    feito && variante === "linha"
                      ? "text-fg-muted line-through"
                      : "text-fg-default"
                  }
                >
                  {item.texto}
                </span>
              </span>
              {item.obrigatorio && (
                <Chip
                  color={feito ? "success" : "warning"}
                  variant="soft"
                  size="sm"
                  shape="pill"
                  className="shrink-0"
                >
                  {feito ? "OK" : "Obrigatório"}
                </Chip>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Aviso do estado do checklist + os dois botões de fluxo.
 *
 * ⚠️ **Voltar e avançar moram JUNTO do checklist**, e não só no rodapé do painel. A
 * decisão de mover acontece na última caixinha marcada; obrigar a procurar o botão no
 * canto oposto foi o que o operador chamou de confuso na primeira rodada.
 */
export function AcoesDeEtapa({
  implantacao,
  onMover,
  somenteAviso = false,
}: {
  implantacao: Implantacao;
  onMover: (e: EtapaId) => void;
  /** Sem botões — para painéis que levam voltar/avançar para o rodapé. */
  somenteAviso?: boolean;
}) {
  const proxima = proximaEtapa(implantacao.etapa);
  const anterior = etapaAnterior(implantacao.etapa);
  const avanca = podeAvancar(implantacao);
  const pendentes = pendenciasObrigatorias(implantacao);
  const pronta = pendentes.length === 0;

  return (
    <div
      className={`flex flex-col gap-gp-lg rounded-radius-lg border px-pad-2xl py-pad-xl sm:flex-row sm:items-center sm:justify-between ${
        pronta
          ? "border-border-success-muted bg-bg-success-muted"
          : "border-border-warning-muted bg-bg-warning-muted"
      }`}
    >
      <p
        className={`text-caption-md leading-snug ${
          pronta ? "text-fg-success" : "text-fg-warning"
        }`}
      >
        {concluida(implantacao)
          ? "Implantação concluída. O carregador está publicado no app."
          : pronta
            ? "Etapa cumprida. Pode avançar."
            : pendentes.length === 1
              ? `Falta: ${pendentes[0].texto}.`
              : `Faltam ${pendentes.length} itens obrigatórios.`}
      </p>
      {!somenteAviso && (
      <div className="flex shrink-0 flex-wrap gap-gp-md">
        <Button
          variant="outline"
          color="secondary"
          size="sm"
          iconLeft={<ArrowLeft />}
          disabled={!anterior}
          onClick={() => anterior && onMover(anterior)}
        >
          Voltar
        </Button>
        <Button
          variant="filled"
          color="primary"
          size="sm"
          iconRight={avanca ? <ArrowRight /> : <Lock />}
          disabled={!proxima || !avanca}
          onClick={() => proxima && onMover(proxima)}
        >
          {proxima ? `Avançar para ${ETAPA_POR_ID[proxima].label}` : "Última etapa"}
        </Button>
      </div>
      )}
    </div>
  );
}

/**
 * Voltar + avançar para o RODAPÉ do painel.
 *
 * O rodapé do `FloatingPanel` é onde o produto inteiro põe ação primária. Quando o
 * painel tem rodapé, é lá que os dois botões moram, e o bloco de aviso fica só com o
 * texto (`AcoesDeEtapa somenteAviso`) — dois pares de botões dizendo a mesma coisa em
 * telas diferentes é o que faz o operador procurar qual é o de verdade.
 */
export function BotoesDeEtapa({
  implantacao,
  onMover,
}: {
  implantacao: Implantacao;
  onMover: (e: EtapaId) => void;
}) {
  const proxima = proximaEtapa(implantacao.etapa);
  const anterior = etapaAnterior(implantacao.etapa);
  const avanca = podeAvancar(implantacao);
  return (
    <>
      <Button
        variant="outline"
        color="secondary"
        size="sm"
        iconLeft={<ArrowLeft />}
        disabled={!anterior}
        onClick={() => anterior && onMover(anterior)}
      >
        Voltar etapa
      </Button>
      <Button
        variant="filled"
        color="primary"
        size="sm"
        iconRight={avanca ? <ArrowRight /> : <Lock />}
        disabled={!proxima || !avanca}
        onClick={() => proxima && onMover(proxima)}
      >
        {proxima ? `Avançar para ${ETAPA_POR_ID[proxima].label}` : "Última etapa"}
      </Button>
    </>
  );
}

/**
 * Editar + excluir como ícones, para o `headerActions` do `FloatingPanel`.
 *
 * ⚠️ É esse o slot do DS para ações de cabeçalho — fica entre o `titleSlot` e o X, e é
 * ele que garante o alinhamento vertical com o botão de fechar. Montar os dois botões
 * dentro do `titleSlot`, como fiz na primeira rodada, deixava-os fora de registro assim
 * que o título passava de uma linha.
 */
export function AcoesDeCabecalho({
  implantacao,
  onEditar,
  onExcluir,
}: {
  implantacao: Implantacao;
  onEditar: (i: Implantacao) => void;
  onExcluir: (i: Implantacao) => void;
}) {
  return (
    <>
      <Button
        variant="outline"
        color="secondary"
        size="sm"
        iconLeft={<Pencil />}
        aria-label="Editar dados"
        title="Editar dados"
        onClick={() => onEditar(implantacao)}
      />
      <Button
        variant="outline"
        color="critical"
        size="sm"
        iconLeft={<Trash2 />}
        aria-label="Excluir implantação"
        title="Excluir implantação"
        onClick={() => onExcluir(implantacao)}
      />
    </>
  );
}

/* ══ Fichas de leitura ══════════════════════════════════════════════════════ */

export function BlocoDoPonto({ implantacao }: { implantacao: Implantacao }) {
  const imp = implantacao;
  return (
    <div className="flex flex-col">
      <Propriedade label="Cliente" valor={imp.cliente} />
      <Propriedade
        label="Local"
        valor={
          /* Sem elipse: nome de local cortado faz conferir o ponto errado. */
          <span className="block whitespace-normal break-words leading-snug">
            {imp.local}
          </span>
        }
      />
      <Propriedade label="Cidade" valor={`${imp.cidade} · ${imp.uf}`} />
      <Propriedade
        label="Pontos previstos"
        valor={
          <span className="tabular-nums">
            {imp.pontos} × {potencia(imp.potenciaKw)}
          </span>
        }
      />
      <Propriedade
        label="Investimento previsto"
        valor={<span className="font-semibold tabular-nums">{moeda(imp.investimento)}</span>}
      />
    </div>
  );
}

export function BlocoDePrazos({ implantacao }: { implantacao: Implantacao }) {
  const imp = implantacao;
  const dias = diasParaPrevisao(imp);
  return (
    <div className="flex flex-col">
      <Propriedade
        label="Responsável"
        valor={
          <span className="flex items-center justify-start gap-gp-md sm:justify-end">
            <Avatar size="xs" colorHex={corDoAvatar(imp.responsavel)} aria-hidden>
              {iniciais(imp.responsavel)}
            </Avatar>
            {imp.responsavel}
          </span>
        }
      />
      <Propriedade
        label="Aberta em"
        valor={<span className="tabular-nums">{dataCurta(imp.abertaEm)}</span>}
      />
      <Propriedade
        label="Nesta etapa há"
        valor={
          <span className="tabular-nums">
            {diasNaEtapa(imp)} {diasNaEtapa(imp) === 1 ? "dia" : "dias"}
          </span>
        }
      />
      <Propriedade
        label="Previsão de instalação"
        valor={
          <span
            className={`tabular-nums ${atrasada(imp) ? "font-semibold text-fg-danger" : ""}`}
          >
            {dataCurta(imp.previsaoDeInstalacao)}
            {!concluida(imp) && (
              <span className="ml-gp-sm text-caption-sm font-normal text-fg-muted">
                {dias < 0
                  ? `${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} de atraso`
                  : `em ${dias} ${dias === 1 ? "dia" : "dias"}`}
              </span>
            )}
          </span>
        }
      />
    </div>
  );
}

export function BlocoDeCadastro({
  implantacao,
  onEditar,
  onExcluir,
}: {
  implantacao: Implantacao;
  onEditar: (i: Implantacao) => void;
  onExcluir: (i: Implantacao) => void;
}) {
  return (
    <div className="flex flex-wrap gap-gp-md">
      <Button
        variant="outline"
        color="secondary"
        size="sm"
        iconLeft={<Pencil />}
        onClick={() => onEditar(implantacao)}
      >
        Editar dados
      </Button>
      <Button
        variant="outline"
        color="critical"
        size="sm"
        iconLeft={<Trash2 />}
        onClick={() => onExcluir(implantacao)}
      >
        Excluir implantação
      </Button>
    </div>
  );
}

/**
 * Resumo sempre visível, no formato do print: ícone + rótulo à esquerda, valor em
 * negrito à direita.
 *
 * ⚠️ São as MESMAS informações da tabela do funil, de propósito. Quem clicou numa linha
 * quer continuar vendo o que o fez clicar; obrigar a abrir uma aba para reconferir o
 * valor ou o responsável é fazer a pessoa guardar dado de cabeça entre duas telas.
 */
export function ResumoRapido({ implantacao }: { implantacao: Implantacao }) {
  const imp = implantacao;
  const linhas: { icone: ReactNode; label: string; valor: ReactNode }[] = [
    { icone: <Building2 className="size-icon-sm" />, label: "Cliente", valor: imp.cliente },
    {
      icone: <MapPin className="size-icon-sm" />,
      label: "Local",
      valor: (
        <span className="block whitespace-normal break-words text-right leading-snug">
          {imp.local}
        </span>
      ),
    },
    {
      icone: <Route className="size-icon-sm" />,
      label: "Etapa",
      valor: (
        <span className="flex justify-end">
          <Chip color="primary" variant="soft" size="sm" shape="pill">
            {indiceDaEtapa(imp.etapa) + 1} de {ETAPAS.length} ·{" "}
            {ETAPA_POR_ID[imp.etapa].label}
          </Chip>
        </span>
      ),
    },
    {
      icone: <CircleDollarSign className="size-icon-sm" />,
      label: "Investimento",
      valor: <span className="tabular-nums">{moeda(imp.investimento)}</span>,
    },
    {
      icone: <UserRound className="size-icon-sm" />,
      label: "Responsável",
      valor: (
        <span className="flex items-center justify-end gap-gp-sm">
          <Avatar size="xs" colorHex={corDoAvatar(imp.responsavel)} aria-hidden>
            {iniciais(imp.responsavel)}
          </Avatar>
          {imp.responsavel}
        </span>
      ),
    },
    {
      icone: <CalendarDays className="size-icon-sm" />,
      label: "Previsão",
      valor: (
        <span
          className={`tabular-nums ${atrasada(imp) ? "text-fg-danger" : ""}`}
        >
          {dataCurta(imp.previsaoDeInstalacao)}
        </span>
      ),
    },
  ];

  return (
    <dl className="flex flex-col gap-gp-xl">
      {linhas.map((l) => (
        <div
          key={l.label}
          className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[176px_1fr] sm:items-center"
        >
          <dt className="flex items-center gap-gp-md text-body-sm text-fg-muted">
            <span className="grid shrink-0 place-items-center text-fg-subtle">
              {l.icone}
            </span>
            {l.label}
          </dt>
          <dd className="min-w-0 text-body-sm font-semibold text-fg-default sm:text-right">
            {l.valor}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Contador `3/4` da etapa, para rótulo de aba. */
export function contadorDaEtapa(implantacao: Implantacao, etapa: EtapaId): string {
  const { feitos, total } = progressoDaEtapa(implantacao, etapa);
  return `${feitos}/${total}`;
}
