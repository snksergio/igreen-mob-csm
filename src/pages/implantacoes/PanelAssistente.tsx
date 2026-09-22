import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import {
  Button,
  Chip,
  FloatingPanel,
  FormFieldTextarea,
} from "@snksergio/design-system";
import {
  ETAPAS,
  ETAPA_POR_ID,
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
import {
  BlocoDePrazos,
  BlocoDoPonto,
  ChecklistDaEtapa,
  TituloDeSecao,
} from "./implantacoes-blocos";

/**
 * **Proposta C — assistente por etapa.** Uma etapa por vez.
 *
 * ## O que a segunda rodada mudou
 *
 * | pedido do operador | o que virou |
 * |---|---|
 * | "os steps ficaram muito grandes, com toda a escrita" | virou fita de bolinhas numeradas; só o passo aberto tem rótulo, embaixo |
 * | "não traz as informações" | ficha do ponto e dos prazos entram no fim, depois do checklist |
 * | "o checklist de selecionar ficou ok" | mantido igual, na variante de cartão com o chip de obrigatório |
 *
 * ## Por que o rótulo sai das bolinhas
 *
 * Sete passos com "PASSO 3 / Viabilidade / 2 de 4" empilhados debaixo de cada círculo
 * davam 104px por passo — 728px de fita numa área de 820, com rolagem horizontal e a
 * faixa mais alta que o conteúdo que ela indexa. Com 36px por bolinha a fita inteira
 * cabe em 330px, e o nome do passo aberto aparece uma vez só, em destaque, no miolo.
 */
function FitaDePassos({
  implantacao,
  vista,
  onIr,
}: {
  implantacao: Implantacao;
  vista: EtapaId;
  onIr: (e: EtapaId) => void;
}) {
  const atual = indiceDaEtapa(implantacao.etapa);
  const iVista = indiceDaEtapa(vista);

  return (
    <ol className="flex items-center justify-center" aria-label="Passos da implantação">
      {ETAPAS.map((etapa, i) => {
        const cumprida = i < atual;
        const ehAtual = i === atual;
        const selecionada = i === iVista;
        const alcancavel = i <= atual;
        const { feitos, total } = progressoDaEtapa(implantacao, etapa.id);

        return (
          <li key={etapa.id} className="flex items-center">
            <button
              type="button"
              disabled={!alcancavel}
              onClick={() => alcancavel && onIr(etapa.id)}
              aria-current={selecionada ? "step" : undefined}
              title={`${i + 1}. ${etapa.label} — ${feitos}/${total}`}
              className={`grid size-[30px] shrink-0 place-items-center rounded-radius-full border-2 text-caption-md font-bold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand ${
                cumprida
                  ? "border-transparent bg-bg-success text-fg-on-brand"
                  : ehAtual
                    ? "border-border-brand bg-bg-brand text-fg-on-brand"
                    : "border-border-default bg-bg-canvas text-fg-subtle"
              } ${
                selecionada
                  ? "scale-110 ring-4 ring-ring-brand"
                  : alcancavel
                    ? "hover:scale-105"
                    : "cursor-not-allowed"
              }`}
            >
              {cumprida ? <Check className="size-[14px]" strokeWidth={3} aria-hidden /> : i + 1}
            </button>
            {i < ETAPAS.length - 1 && (
              <span
                className={`h-[2px] w-[18px] shrink-0 ${
                  i < atual ? "bg-bg-success" : "bg-border-default"
                }`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function PanelAssistente({
  implantacao,
  onClose,
  onAlternarItem,
  onMoverEtapa,
}: {
  implantacao: Implantacao;
  onClose: () => void;
  onAlternarItem: (itemId: string) => void;
  onMoverEtapa: (e: EtapaId) => void;
}) {
  const imp = implantacao;
  const [vista, setVista] = useState<EtapaId>(imp.etapa);
  /* Nota local: é rascunho da proposta e não vai para o mock — persistir exigiria um
     formato de dado que ainda não foi decidido. */
  const [nota, setNota] = useState("");

  useEffect(() => {
    setVista(imp.etapa);
    setNota("");
  }, [imp.id, imp.etapa]);

  const iVista = indiceDaEtapa(vista);
  const atual = indiceDaEtapa(imp.etapa);
  const ehAtual = iVista === atual;
  const proxima = proximaEtapa(imp.etapa);
  const avanca = podeAvancar(imp);
  const pendentes = pendenciasObrigatorias(imp);
  const { feitos, total } = progressoDaEtapa(imp, vista);

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={820}
      resizable
      resizableMinWidth={680}
      resizableStorageKey="igreen-mob-cms.implantacao.assistente.width"
      bodyPadded={false}
      title={imp.cliente}
      description={`${imp.id} · ${imp.local}`}
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            iconLeft={<ArrowLeft />}
            disabled={iVista === 0}
            onClick={() => setVista(ETAPAS[iVista - 1].id)}
          >
            Passo anterior
          </Button>
          {ehAtual ? (
            <Button
              variant="filled"
              color="primary"
              size="sm"
              iconRight={avanca ? <ArrowRight /> : <Lock />}
              disabled={!proxima || !avanca}
              onClick={() => proxima && onMoverEtapa(proxima)}
            >
              {proxima ? "Concluir passo e avançar" : "Última etapa"}
            </Button>
          ) : (
            <Button
              variant="filled"
              color="primary"
              size="sm"
              iconRight={<ArrowRight />}
              onClick={() => setVista(ETAPAS[Math.min(iVista + 1, atual)].id)}
            >
              Próximo passo
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col">
        {/* ══ Zona de PASSO — a única que fala de etapa ══════════════════════ */}
        <div className="border-b border-border-default bg-bg-subtle px-pad-4xl py-pad-2xl">
          <FitaDePassos implantacao={imp} vista={vista} onIr={setVista} />
        </div>

        {/* ══ Zona de TRABALHO — só o passo aberto ══════════════════════════ */}
        <div className="flex flex-col gap-gp-2xl px-pad-4xl py-pad-3xl">
          <div className="flex flex-col items-center gap-gp-sm text-center">
            <span className="text-caption-sm uppercase tracking-wide text-fg-subtle">
              Passo {iVista + 1} de {ETAPAS.length}
            </span>
            <span className="text-heading-xs font-bold text-fg-default">
              {ETAPA_POR_ID[vista].label}
            </span>
            <span className="max-w-[46ch] text-body-sm leading-snug text-fg-muted">
              {ETAPA_POR_ID[vista].resumo}
            </span>
            <span className="mt-gp-sm flex flex-wrap items-center justify-center gap-gp-md">
              <Chip
                color={feitos === total ? "success" : "neutral"}
                variant="soft"
                size="sm"
                shape="pill"
              >
                {feitos} de {total} cumpridos
              </Chip>
              {!ehAtual && (
                <Chip color="neutral" variant="soft" size="sm" shape="pill">
                  Etapa já percorrida
                </Chip>
              )}
            </span>
          </div>

          <ChecklistDaEtapa
            implantacao={imp}
            etapa={vista}
            onAlternar={onAlternarItem}
            variante="cartao"
          />

          <FormFieldTextarea
            label="Nota deste passo"
            placeholder="O que ficou combinado, o que está segurando"
            rows={3}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />

          {ehAtual && pendentes.length > 0 && (
            <p className="rounded-radius-md border border-border-warning-muted bg-bg-warning-muted px-pad-2xl py-pad-xl text-caption-md leading-snug text-fg-warning">
              {pendentes.length === 1
                ? `Falta cumprir: ${pendentes[0].texto}.`
                : `Faltam ${pendentes.length} itens obrigatórios para concluir este passo.`}
            </p>
          )}
        </div>

        {/* ══ Zona INFORMATIVA — no fim, porque não é o que se faz aqui ═════ */}
        <div className="flex flex-col gap-gp-3xl border-t border-border-default bg-bg-subtle px-pad-4xl py-pad-3xl">
          <div className="flex flex-col gap-gp-lg">
            <TituloDeSecao>O ponto</TituloDeSecao>
            <div className="rounded-radius-lg bg-bg-surface px-pad-2xl">
              <BlocoDoPonto implantacao={imp} />
            </div>
          </div>
          <div className="flex flex-col gap-gp-lg">
            <TituloDeSecao>Prazos e responsável</TituloDeSecao>
            <div className="rounded-radius-lg bg-bg-surface px-pad-2xl">
              <BlocoDePrazos implantacao={imp} />
            </div>
          </div>
          {imp.observacao && (
            <div className="flex flex-col gap-gp-lg">
              <TituloDeSecao>Observação</TituloDeSecao>
              <p className="text-body-sm leading-relaxed text-fg-muted">{imp.observacao}</p>
            </div>
          )}
          <span className="text-caption-sm text-fg-subtle">
            {imp.pontos} × {potencia(imp.potenciaKw)} · {moeda(imp.investimento)} · previsão{" "}
            {dataCurta(imp.previsaoDeInstalacao)}
          </span>
        </div>
      </div>
    </FloatingPanel>
  );
}
