import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Chip } from "@snksergio/design-system";
import {
  ETAPAS,
  ETAPA_POR_ID,
  atrasada,
  concluida,
  indiceDaEtapa,
  progressoDaEtapa,
  progressoGeral,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";

/**
 * Chip da etapa.
 *
 * ⚠️ A cor vem do `ETAPAS[].cor`, não de um `color` do `Chip`: as sete etapas formam uma
 * rampa (cinza → âmbar → verde) e o `Chip` só oferece cores semânticas soltas. Usar
 * `color="warning"` em CONTRATO diria "atenção", que não é o caso — é só o meio do
 * caminho. O `style` aplica a cor do token diretamente.
 */
export function ChipDeEtapa({ etapa }: { etapa: EtapaId }) {
  const e = ETAPA_POR_ID[etapa];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-gp-xs rounded-radius-full border px-pad-lg py-[3px] text-caption-md font-semibold"
      style={{
        color: e.cor,
        borderColor: `color-mix(in oklch, ${e.cor} 40%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${e.cor} 12%, transparent)`,
      }}
    >
      <span
        className="size-[6px] shrink-0 rounded-radius-full"
        style={{ backgroundColor: e.cor }}
        aria-hidden
      />
      {e.label}
    </span>
  );
}

/** Selo de conclusão / atraso — o estado que o operador procura antes de tudo. */
export function ChipDeSituacao({ implantacao }: { implantacao: Implantacao }) {
  if (concluida(implantacao))
    return (
      <Chip color="success" variant="soft" size="sm" shape="pill">
        Concluída
      </Chip>
    );
  if (atrasada(implantacao))
    return (
      <Chip color="danger" variant="soft" size="sm" shape="pill">
        Atrasada
      </Chip>
    );
  return (
    <Chip color="neutral" variant="soft" size="sm" shape="pill">
      Em andamento
    </Chip>
  );
}

/**
 * Progresso do checklist da etapa atual — `3/4` com barra.
 *
 * Dois números e uma barra em vez de percentual: com três ou quatro itens, "75%" é uma
 * tradução que o operador precisa desfazer de cabeça para saber que falta **um**.
 */
export function ProgressoDaEtapa({
  implantacao,
  className = "",
}: {
  implantacao: Implantacao;
  className?: string;
}) {
  const { feitos, total } = progressoDaEtapa(implantacao);
  const completo = feitos === total;
  return (
    <span className={`flex min-w-0 flex-col gap-[3px] ${className}`}>
      <span className="flex items-baseline gap-gp-xs text-caption-md tabular-nums">
        <span
          className={
            completo ? "font-semibold text-fg-success" : "font-semibold text-fg-default"
          }
        >
          {feitos}
        </span>
        <span className="text-fg-muted">/ {total}</span>
      </span>
      <span
        className="h-[4px] w-full overflow-hidden rounded-radius-full bg-bg-muted"
        role="img"
        aria-label={`${feitos} de ${total} itens do checklist cumpridos`}
      >
        <span
          className={`block h-full rounded-radius-full ${
            completo ? "bg-bg-success" : "bg-bg-brand"
          }`}
          style={{ width: `${total === 0 ? 0 : (feitos / total) * 100}%` }}
        />
      </span>
    </span>
  );
}

/**
 * Trilha das sete etapas — onde a implantação está e o que já ficou para trás.
 *
 * ## Por que não o `Stepper` do DS
 *
 * Aqui cada passo carrega um **contador de checklist** (`3/4`) e precisa continuar legível
 * em 375px com sete passos. Um stepper horizontal com sete rótulos vira sopa de letra
 * nessa largura; empilhado em coluna, cada etapa ganha uma linha inteira e o contador
 * cabe à direita. É a mesma escolha da trilha do modal de carregador, pelo motivo oposto:
 * lá eram três passos e coube na horizontal.
 */
export function TrilhaDeEtapas({
  implantacao,
  onIr,
}: {
  implantacao: Implantacao;
  /** Quando vem, cada etapa cumprida ou atual vira botão de navegação. */
  onIr?: (e: EtapaId) => void;
}) {
  const atual = indiceDaEtapa(implantacao.etapa);

  return (
    <ol className="flex flex-col" aria-label="Etapas da implantação">
      {ETAPAS.map((etapa, i) => {
        const passada = i < atual;
        const ehAtual = i === atual;
        const { feitos, total } = progressoDaEtapa(implantacao, etapa.id);
        const cumprida = feitos === total;
        const alcancavel = !!onIr && i <= atual;

        const miolo = (
          <>
            {/* Marcador + fio: o fio é do PRÓPRIO item (menos o último), e não um
                elemento solto entre eles — assim ele acompanha a altura da linha, que
                muda quando o rótulo quebra em duas no celular. */}
            <span className="relative flex w-[22px] shrink-0 flex-col items-center self-stretch">
              <span
                className={`z-10 mt-[2px] grid size-[18px] shrink-0 place-items-center rounded-radius-full border-2 ${
                  passada || (ehAtual && cumprida)
                    ? "border-transparent bg-bg-brand text-fg-on-brand"
                    : ehAtual
                      ? "border-border-brand bg-bg-canvas"
                      : "border-border-default bg-bg-canvas"
                }`}
              >
                {passada || (ehAtual && cumprida) ? (
                  <Check className="size-[11px]" strokeWidth={3} aria-hidden />
                ) : null}
              </span>
              {i < ETAPAS.length - 1 && (
                <span
                  className={`w-[2px] flex-1 ${passada ? "bg-bg-brand" : "bg-border-default"}`}
                  aria-hidden
                />
              )}
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-[2px] pb-pad-xl">
              <span className="flex items-baseline justify-between gap-gp-md">
                <span
                  className={`min-w-0 break-words text-body-sm leading-snug ${
                    ehAtual
                      ? "font-semibold text-fg-default"
                      : passada
                        ? "font-medium text-fg-muted"
                        : "text-fg-subtle"
                  }`}
                >
                  {etapa.label}
                </span>
                <span
                  className={`shrink-0 text-caption-sm tabular-nums ${
                    cumprida ? "text-fg-success" : ehAtual ? "text-fg-default" : "text-fg-subtle"
                  }`}
                >
                  {feitos}/{total}
                </span>
              </span>
              {ehAtual && (
                <span className="text-caption-sm leading-snug text-fg-muted">
                  {etapa.resumo}
                </span>
              )}
            </span>
          </>
        );

        return (
          <li key={etapa.id} className="flex gap-gp-md">
            {alcancavel ? (
              /* `-mx-pad-md px-pad-md` alarga a área de toque sem deslocar a trilha —
                 mesma receita dos ícones de ajuda. */
              <button
                type="button"
                onClick={() => onIr(etapa.id)}
                className="-mx-pad-md flex flex-1 gap-gp-md rounded-radius-md px-pad-md text-left transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
              >
                {miolo}
              </button>
            ) : (
              <span className="flex flex-1 gap-gp-md">{miolo}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Barra fina do progresso do funil inteiro, para o cabeçalho do painel e do card. */
export function BarraDoFunil({ implantacao }: { implantacao: Implantacao }) {
  const p = progressoGeral(implantacao);
  return (
    <span
      className="block h-[4px] w-full overflow-hidden rounded-radius-full bg-bg-muted"
      role="img"
      aria-label={`${Math.round(p * 100)}% do funil concluído`}
    >
      <span
        className={`block h-full rounded-radius-full ${
          concluida(implantacao) ? "bg-bg-success" : "bg-bg-brand"
        }`}
        style={{ width: `${p * 100}%` }}
      />
    </span>
  );
}

/**
 * Linha rótulo/valor dos painéis.
 *
 * Empilha no celular — `[160px_1fr]` deixaria 171px para o valor num painel de 375px, e
 * nome de local quebraria em três linhas ao lado de um rótulo curto.
 */
export function Propriedade({
  label,
  valor,
}: {
  label: string;
  valor: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs border-b border-border-subtle py-pad-lg last:border-b-0 sm:grid-cols-[176px_1fr] sm:items-center">
      <span className="text-body-sm text-fg-muted">{label}</span>
      <span className="min-w-0 text-body-sm text-fg-default sm:text-right">{valor}</span>
    </div>
  );
}
