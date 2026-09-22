import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button, FloatingPanel, FloatingPanelSection } from "@snksergio/design-system";
import {
  ETAPAS,
  ETAPA_POR_ID,
  indiceDaEtapa,
  progressoDaEtapa,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import { ChipDeSituacao } from "./implantacoes-ui";
import {
  AcoesDeCabecalho,
  AcoesDeEtapa,
  BlocoDeCadastro,
  BlocoDePrazos,
  BlocoDoPonto,
  ChecklistDaEtapa,
  PassosCompactos,
  contadorDaEtapa,
} from "./implantacoes-blocos";

/**
 * **Proposta A — cartão de status.** Uma coluna estreita, tudo empilhado.
 *
 * ## O que a segunda rodada mudou
 *
 * | pedido do operador | o que virou |
 * |---|---|
 * | "linha do tempo como categoria, com arrow para expandir, vindo retraída" | seção própria: os sete blocos sempre visíveis, e um botão revela a trilha completa |
 * | "faltou o checklist para ele marcar" | seção de checklist da etapa corrente, com voltar/avançar junto |
 * | "faltou o ponto, prazo, responsáveis e o cadastro" | três seções de leitura no fim |
 * | "o editar/remover ficou desalinhado com o X, e o título grande precisa de elipse" | cabeçalho em `items-center` e `truncate` no nome |
 *
 * ## Por que a linha do tempo nasce fechada
 *
 * Ela é histórico. Quem abre o painel quer saber **onde está** (os sete blocos respondem
 * em 6px de altura) e **o que fazer** (o checklist logo abaixo). Sete etapas com resumo
 * ocupavam meia tela antes de qualquer coisa acionável aparecer.
 */
export function PanelCompacto({
  implantacao,
  onClose,
  onAlternarItem,
  onMoverEtapa,
  onEditar,
  onExcluir,
}: {
  implantacao: Implantacao;
  onClose: () => void;
  onAlternarItem: (itemId: string) => void;
  onMoverEtapa: (e: EtapaId) => void;
  onEditar: (i: Implantacao) => void;
  onExcluir: (i: Implantacao) => void;
}) {
  const imp = implantacao;
  const [linhaAberta, setLinhaAberta] = useState(false);
  const atual = indiceDaEtapa(imp.etapa);

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={620}
      resizable
      resizableStorageKey="igreen-mob-cms.implantacao.compacto.width"
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {imp.cliente}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="shrink-0 tabular-nums">{imp.id}</span>
            <span className="shrink-0 opacity-50">·</span>
            <span className="truncate">{imp.local}</span>
            <ChipDeSituacao implantacao={imp} />
          </span>
        </div>
      }
      /* ⚠️ `headerActions` é o slot do DS para isto — entre o título e o X. Na primeira
         rodada eu montei os dois botões DENTRO do `titleSlot`, e eles saíam de registro
         com o X assim que o título passava de uma linha. */
      headerActions={
        <AcoesDeCabecalho implantacao={imp} onEditar={onEditar} onExcluir={onExcluir} />
      }
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <FloatingPanelSection
        title="Linha do tempo"
        /* O botão de expandir vive no cabeçalho da seção, não solto depois dos blocos:
           é o título que ele controla. */
      >
        <div className="flex flex-col gap-gp-xl">
          <PassosCompactos implantacao={imp} />

          <button
            type="button"
            onClick={() => setLinhaAberta((v) => !v)}
            aria-expanded={linhaAberta}
            className="flex items-center justify-center gap-gp-sm rounded-radius-md border border-border-default py-pad-md text-caption-md font-medium text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg-default focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
          >
            {linhaAberta ? "Recolher linha do tempo" : "Expandir para ver a linha do tempo"}
            <ChevronDown
              className={`size-icon-sm transition-transform ${linhaAberta ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {linhaAberta && (
            <ol className="flex flex-col">
              {ETAPAS.map((etapa, i) => {
                const passada = i < atual;
                const ehAtual = i === atual;
                const { feitos, total } = progressoDaEtapa(imp, etapa.id);
                return (
                  <li key={etapa.id} className="flex gap-gp-lg">
                    <span className="relative flex w-[24px] shrink-0 flex-col items-center self-stretch">
                      <span
                        className={`z-10 grid size-[22px] shrink-0 place-items-center rounded-radius-full border-2 ${
                          passada
                            ? "border-transparent bg-bg-brand"
                            : ehAtual
                              ? "border-border-brand bg-bg-canvas"
                              : "border-border-default bg-bg-canvas"
                        }`}
                      >
                        {passada ? (
                          <svg viewBox="0 0 12 12" className="size-[11px]" aria-hidden>
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
                          <span className="size-[8px] rounded-radius-full bg-bg-brand" />
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
                          {i + 1}. {etapa.label}
                        </span>
                        <span className="text-caption-sm leading-snug text-fg-muted">
                          {etapa.resumo}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-caption-sm tabular-nums ${
                          feitos === total ? "text-fg-success" : "text-fg-subtle"
                        }`}
                      >
                        {feitos}/{total}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection
        title={`Checklist · ${ETAPA_POR_ID[imp.etapa].label}`}
      >
        <div className="flex flex-col gap-gp-xl">
          <div className="flex items-center justify-between gap-gp-md">
            <p className="text-caption-sm leading-snug text-fg-subtle">
              Clique na linha para marcar o que já foi feito.
            </p>
            <span className="shrink-0 text-caption-md tabular-nums text-fg-muted">
              {contadorDaEtapa(imp, imp.etapa)}
            </span>
          </div>
          <ChecklistDaEtapa
            implantacao={imp}
            etapa={imp.etapa}
            onAlternar={onAlternarItem}
          />
          <AcoesDeEtapa implantacao={imp} onMover={onMoverEtapa} />
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="O ponto">
        <BlocoDoPonto implantacao={imp} />
      </FloatingPanelSection>

      <FloatingPanelSection title="Prazos e responsável">
        <BlocoDePrazos implantacao={imp} />
      </FloatingPanelSection>

      {imp.observacao && (
        <FloatingPanelSection title="Observação">
          <p className="text-body-sm leading-relaxed text-fg-muted">{imp.observacao}</p>
        </FloatingPanelSection>
      )}

      <FloatingPanelSection title="Cadastro">
        <BlocoDeCadastro
          implantacao={imp}
          onEditar={onEditar}
          onExcluir={onExcluir}
        />
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
