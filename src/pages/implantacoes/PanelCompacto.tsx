import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Pencil,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Avatar,
  Button,
  Chip,
  FloatingPanel,
} from "@snksergio/design-system";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  ETAPAS,
  ETAPA_POR_ID,
  atrasada,
  concluida,
  dataCurta,
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
import { ChipDeSituacao } from "./implantacoes-ui";

/**
 * **Proposta A — cartão de status.** Uma coluna, estreita, para LER o andamento.
 *
 * ## O que muda em relação ao painel atual
 *
 * Três coisas, todas endereçando "mostra pouca informação em cima e as ações ficam
 * embaixo":
 *
 * 1. **Editar e excluir sobem para o cabeçalho**, como ícones ao lado do título. Ação de
 *    cadastro não disputa o rodapé com a ação de fluxo.
 * 2. **A barra segmentada substitui a lista de etapas no topo.** Sete blocos preenchidos
 *    até a etapa atual dizem "onde estou" num relance, sem ocupar sete linhas.
 * 3. **Os dados vêm logo abaixo, com ícone**, em vez de esperarem o fim do painel. Quem
 *    abre quer saber responsável, prazo e valor antes de qualquer outra coisa.
 *
 * ## Onde ela é fraca, de propósito
 *
 * O checklist **não** é editável aqui — a linha do tempo mostra o que aconteceu, não o
 * que fazer. Esta proposta serve a quem acompanha (gestor, comercial), não a quem
 * executa. Trocar isso descaracterizaria a variação.
 */

function Linha({
  icone,
  label,
  children,
}: {
  icone: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[168px_1fr] sm:items-center">
      <span className="flex items-center gap-gp-md text-body-sm text-fg-muted">
        <span className="grid size-icon-md shrink-0 place-items-center text-fg-subtle">
          {icone}
        </span>
        {label}
      </span>
      <span className="min-w-0 text-body-sm text-fg-default">{children}</span>
    </div>
  );
}

/** Barra de sete blocos — preenchidos até a etapa atual, inclusive. */
function BarraSegmentada({ implantacao }: { implantacao: Implantacao }) {
  const atual = indiceDaEtapa(implantacao.etapa);
  return (
    <div className="flex flex-col gap-gp-md">
      <div className="flex gap-gp-xs" role="img" aria-label={`Etapa ${atual + 1} de 7`}>
        {ETAPAS.map((e, i) => (
          <span
            key={e.id}
            className={`h-[6px] flex-1 rounded-radius-full ${
              i <= atual ? "bg-bg-brand" : "bg-bg-muted"
            }`}
          />
        ))}
      </div>
      {/* Rótulos só das etapas de borda mais a atual: sete rótulos lado a lado em 520px
          viram sopa. O nome da etapa corrente já está em destaque no cabeçalho. */}
      <div className="flex items-baseline justify-between gap-gp-md text-caption-sm">
        <span className="text-fg-subtle">{ETAPAS[0].label}</span>
        <span className="font-semibold text-fg-brand">
          {atual + 1}. {ETAPA_POR_ID[implantacao.etapa].label}
        </span>
        <span className="text-fg-subtle">{ETAPAS[ETAPAS.length - 1].label}</span>
      </div>
    </div>
  );
}

/** Linha do tempo das sete etapas — cumprida, atual, futura. */
function LinhaDoTempo({ implantacao }: { implantacao: Implantacao }) {
  const atual = indiceDaEtapa(implantacao.etapa);
  return (
    <ol className="flex flex-col">
      {ETAPAS.map((etapa, i) => {
        const passada = i < atual;
        const ehAtual = i === atual;
        const { feitos, total } = progressoDaEtapa(implantacao, etapa.id);
        return (
          <li key={etapa.id} className="flex gap-gp-lg">
            <span className="relative flex w-[28px] shrink-0 flex-col items-center self-stretch">
              <span
                className={`z-10 grid size-[28px] shrink-0 place-items-center rounded-radius-full border-2 ${
                  passada
                    ? "border-transparent bg-bg-brand"
                    : ehAtual
                      ? "border-border-brand bg-bg-canvas"
                      : "border-border-default bg-bg-canvas"
                }`}
              >
                {passada ? (
                  <svg viewBox="0 0 12 12" className="size-[12px]" aria-hidden>
                    <path
                      d="M2 6.5 4.8 9 10 3.5"
                      fill="none"
                      stroke="var(--color-fg-on-brand)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : ehAtual ? (
                  <span className="size-[9px] rounded-radius-full bg-bg-brand" />
                ) : null}
              </span>
              {i < ETAPAS.length - 1 && (
                <span
                  className={`w-[2px] flex-1 ${passada ? "bg-bg-brand" : "bg-border-default"}`}
                  aria-hidden
                />
              )}
            </span>

            <span className="flex min-w-0 flex-1 items-start justify-between gap-gp-lg pb-pad-2xl">
              <span className="flex min-w-0 flex-col gap-[2px]">
                <span
                  className={`break-words text-body-sm leading-snug ${
                    ehAtual
                      ? "font-semibold text-fg-default"
                      : passada
                        ? "font-medium text-fg-default"
                        : "text-fg-subtle"
                  }`}
                >
                  {etapa.label}
                </span>
                <span className="text-caption-sm leading-snug text-fg-muted">
                  {etapa.resumo}
                </span>
              </span>
              <span
                className={`shrink-0 text-caption-sm tabular-nums ${
                  feitos === total && total > 0 ? "text-fg-success" : "text-fg-subtle"
                }`}
              >
                {feitos}/{total}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function PanelCompacto({
  implantacao,
  onClose,
  onMoverEtapa,
  onEditar,
  onExcluir,
}: {
  implantacao: Implantacao;
  onClose: () => void;
  onMoverEtapa: (e: EtapaId) => void;
  onEditar: (i: Implantacao) => void;
  onExcluir: (i: Implantacao) => void;
}) {
  const imp = implantacao;
  const proxima = proximaEtapa(imp.etapa);
  const avanca = podeAvancar(imp);
  const pendentes = pendenciasObrigatorias(imp);

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={560}
      resizable
      resizableStorageKey="igreen-mob-cms.implantacao.compacto.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 items-start justify-between gap-gp-lg">
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="truncate text-heading-xs font-bold text-fg-default">
              {imp.cliente}
            </span>
            <span className="flex items-center gap-gp-sm text-caption-md font-normal text-fg-muted">
              <span className="tabular-nums">{imp.id}</span>
              <span className="opacity-50">·</span>
              <ChipDeSituacao implantacao={imp} />
            </span>
          </div>
          {/* ⚠️ As ações de cadastro moram AQUI, não no rodapé. O rodapé é do fluxo. */}
          <div className="flex shrink-0 items-center gap-gp-sm">
            <Button
              variant="outline"
              color="secondary"
              size="sm"
              iconLeft={<Pencil />}
              aria-label="Editar dados"
              title="Editar dados"
              onClick={() => onEditar(imp)}
            />
            <Button
              variant="outline"
              color="critical"
              size="sm"
              iconLeft={<Trash2 />}
              aria-label="Excluir implantação"
              title="Excluir implantação"
              onClick={() => onExcluir(imp)}
            />
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconRight={<ArrowRight />}
            disabled={!proxima || !avanca}
            onClick={() => proxima && onMoverEtapa(proxima)}
          >
            {proxima ? `Avançar para ${ETAPA_POR_ID[proxima].label}` : "Última etapa"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-gp-4xl px-pad-4xl py-pad-3xl">
        <BarraSegmentada implantacao={imp} />

        <div className="flex flex-col gap-gp-xl">
          <Linha icone={<Users className="size-icon-sm" />} label="Responsável">
            <span className="flex items-center gap-gp-md">
              <Avatar size="xs" colorHex={corDoAvatar(imp.responsavel)} aria-hidden>
                {iniciais(imp.responsavel)}
              </Avatar>
              {imp.responsavel}
            </span>
          </Linha>
          <Linha icone={<MapPin className="size-icon-sm" />} label="Local">
            <span className="block whitespace-normal break-words leading-snug">
              {imp.local}
              <span className="block text-caption-sm text-fg-muted">
                {imp.cidade} · {imp.uf}
              </span>
            </span>
          </Linha>
          <Linha icone={<Zap className="size-icon-sm" />} label="Pontos previstos">
            <span className="tabular-nums">
              {imp.pontos} × {potencia(imp.potenciaKw)}
            </span>
          </Linha>
          <Linha
            icone={<CalendarDays className="size-icon-sm" />}
            label="Previsão de instalação"
          >
            <span
              className={`tabular-nums ${atrasada(imp) ? "font-semibold text-fg-danger" : ""}`}
            >
              {dataCurta(imp.previsaoDeInstalacao)}
            </span>
          </Linha>
          <Linha
            icone={<CircleDollarSign className="size-icon-sm" />}
            label="Investimento"
          >
            <span className="flex">
              <Chip color="neutral" variant="soft" size="sm" shape="rounded">
                <span className="tabular-nums">{moeda(imp.investimento)}</span>
              </Chip>
            </span>
          </Linha>
        </div>

        {imp.observacao && (
          <div className="flex flex-col gap-gp-md">
            <span className="text-body-sm font-semibold text-fg-default">Observação</span>
            <p className="text-body-sm leading-relaxed text-fg-muted">{imp.observacao}</p>
          </div>
        )}

        <div className="flex flex-col gap-gp-xl border-t border-border-subtle pt-pad-4xl">
          <div className="flex items-baseline justify-between gap-gp-md">
            <span className="text-body-sm font-semibold text-fg-default">
              Linha do tempo
            </span>
            {pendentes.length > 0 && !concluida(imp) && (
              <span className="text-caption-sm text-fg-warning">
                {pendentes.length}{" "}
                {pendentes.length === 1 ? "pendência trava" : "pendências travam"} o avanço
              </span>
            )}
          </div>
          <LinhaDoTempo implantacao={imp} />
        </div>
      </div>
    </FloatingPanel>
  );
}
