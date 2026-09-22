import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Lock, Pencil, Trash2 } from "lucide-react";
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
      <div className="flex gap-gp-xs" role="img" aria-label={`Etapa ${atual + 1} de 7`}>
        {ETAPAS.map((e, i) => (
          <span
            key={e.id}
            title={e.label}
            className={`h-[6px] flex-1 rounded-radius-full ${
              i <= atual ? "bg-bg-brand" : "bg-bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-gp-md text-caption-sm">
        <span className="truncate text-fg-subtle">{ETAPAS[0].label}</span>
        <span className="shrink-0 font-semibold text-fg-brand">
          {atual + 1}. {ETAPA_POR_ID[implantacao.etapa].label}
        </span>
        <span className="truncate text-fg-subtle">{ETAPAS[ETAPAS.length - 1].label}</span>
      </div>
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
                  : "flex cursor-pointer items-start gap-gp-md rounded-radius-sm px-pad-md py-pad-lg transition-colors hover:bg-bg-muted has-[:focus-visible]:bg-bg-muted"
              }
            >
              <Checkbox
                checked={feito}
                onCheckedChange={() => onAlternar(item.id)}
                aria-label={item.texto}
                className={`pointer-events-none ${variante === "linha" ? "mt-[2px]" : ""}`}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span
                  className={`break-words text-body-sm leading-snug ${
                    feito && variante === "linha"
                      ? "text-fg-muted line-through"
                      : "text-fg-default"
                  }`}
                >
                  {item.texto}
                </span>
                {item.obrigatorio && variante === "linha" && !feito && (
                  <span className="flex">
                    <Chip color="warning" variant="soft" size="sm" shape="pill">
                      Obrigatório
                    </Chip>
                  </span>
                )}
              </span>
              {item.obrigatorio && variante === "cartao" && (
                <Chip
                  color={feito ? "success" : "warning"}
                  variant="soft"
                  size="sm"
                  shape="pill"
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
}: {
  implantacao: Implantacao;
  onMover: (e: EtapaId) => void;
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
    </div>
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

/** Contador `3/4` da etapa, para rótulo de aba. */
export function contadorDaEtapa(implantacao: Implantacao, etapa: EtapaId): string {
  const { feitos, total } = progressoDaEtapa(implantacao, etapa);
  return `${feitos}/${total}`;
}
