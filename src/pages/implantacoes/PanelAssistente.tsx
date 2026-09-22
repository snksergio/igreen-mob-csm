import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import {
  Button,
  Chip,
  FloatingPanel,
  FormFieldTextarea,
} from "@snksergio/design-system";
import { Checkbox } from "@snksergio/design-system/shadcn";
import {
  CHECKLIST_POR_ETAPA,
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

/**
 * **Proposta C — assistente por etapa.** Uma etapa por vez, com navegação de passo.
 *
 * ## A ideia
 *
 * As outras duas propostas mostram o funil inteiro e deixam a pessoa escolher onde
 * mexer. Esta faz o oposto: **a tela só mostra a etapa aberta**, e o resto do painel é
 * navegação. É a leitura mais próxima de um formulário guiado — serve a quem executa a
 * implantação passo a passo e não quer decidir onde clicar.
 *
 * ## O que resolve
 *
 * "Separar o que é step do que é informativo" fica literal aqui: a **faixa numerada no
 * topo é a única coisa que fala de etapa**, e o miolo nunca mistura as duas naturezas.
 * A ficha do ponto vira uma tira compacta de três dados, e não uma seção — quem está
 * cumprindo checklist não precisa do cadastro competindo por atenção.
 *
 * ## O custo
 *
 * Não dá para ver duas etapas ao mesmo tempo, e o cadastro completo não está aqui. É
 * deliberado: um assistente que mostra tudo deixa de ser assistente.
 */

/** Rótulos curtos — sete nomes inteiros não cabem numa faixa de passos. */
const CURTO: Record<EtapaId, string> = {
  proposta: "Proposta",
  aceite: "Aceite",
  viabilidade: "Viabilidade",
  contrato: "Contrato",
  pagamento: "Pagamento",
  projeto: "Projeto",
  instalacao: "Instalação",
};

function FaixaDePassos({
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
    <ol
      className="scrollbar-thin flex items-start gap-0 overflow-x-auto pb-pad-sm"
      aria-label="Passos da implantação"
    >
      {ETAPAS.map((etapa, i) => {
        const cumprida = i < atual;
        const ehAtual = i === atual;
        const selecionada = i === iVista;
        const alcancavel = i <= atual;
        const { feitos, total } = progressoDaEtapa(implantacao, etapa.id);

        return (
          <li key={etapa.id} className="flex min-w-0 shrink-0 items-start">
            <button
              type="button"
              disabled={!alcancavel}
              onClick={() => alcancavel && onIr(etapa.id)}
              className={`flex w-[104px] flex-col items-center gap-gp-sm rounded-radius-md px-pad-sm py-pad-md transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand ${
                alcancavel ? "hover:bg-bg-muted" : "cursor-not-allowed"
              }`}
            >
              <span
                className={`grid size-[34px] shrink-0 place-items-center rounded-radius-full border-2 text-body-sm font-bold tabular-nums transition-colors ${
                  cumprida
                    ? "border-transparent bg-bg-success text-fg-on-brand"
                    : ehAtual
                      ? "border-border-brand bg-bg-brand text-fg-on-brand"
                      : "border-border-default bg-bg-canvas text-fg-subtle"
                } ${selecionada && !ehAtual ? "ring-4 ring-ring-brand" : ""}`}
              >
                {cumprida ? <Check className="size-[16px]" strokeWidth={3} aria-hidden /> : i + 1}
              </span>
              <span className="flex flex-col items-center gap-[1px]">
                <span className="text-caption-sm uppercase tracking-wide text-fg-subtle">
                  Passo {i + 1}
                </span>
                <span
                  className={`break-words text-center text-caption-md leading-tight ${
                    selecionada ? "font-semibold text-fg-default" : "text-fg-muted"
                  }`}
                >
                  {CURTO[etapa.id]}
                </span>
                <span
                  className={`text-caption-sm tabular-nums ${
                    feitos === total ? "text-fg-success" : "text-fg-subtle"
                  }`}
                >
                  {feitos}/{total}
                </span>
              </span>
            </button>
            {i < ETAPAS.length - 1 && (
              /* O fio vive entre os passos e não dentro deles — é o que faz a faixa
                 parecer uma esteira em vez de sete botões soltos. `mt` alinha o fio ao
                 centro do círculo (34/2 + padding do botão). */
              <span
                className={`mt-[28px] h-[2px] w-[14px] shrink-0 ${
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
  /* Nota local por etapa — não vai para o mock de propósito: é campo de rascunho da
     proposta, e persistir exigiria um formato de dado que ainda não foi decidido. */
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
          {/* Anterior/Próximo navegam a VISTA quando se está olhando o passado, e movem
              a implantação quando se está na etapa corrente. Dois verbos no mesmo par de
              botões seria confuso, então o rótulo muda junto. */}
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
          <FaixaDePassos implantacao={imp} vista={vista} onIr={setVista} />
        </div>

        {/* ══ Zona INFORMATIVA — uma tira, não uma seção ════════════════════ */}
        <div className="grid grid-cols-2 gap-gp-lg border-b border-border-subtle px-pad-4xl py-pad-xl sm:grid-cols-4">
          {[
            { r: "Pontos", v: `${imp.pontos} × ${potencia(imp.potenciaKw)}` },
            { r: "Investimento", v: moeda(imp.investimento) },
            { r: "Responsável", v: imp.responsavel },
            { r: "Previsão", v: dataCurta(imp.previsaoDeInstalacao) },
          ].map((d) => (
            <div key={d.r} className="flex min-w-0 flex-col gap-[1px]">
              <span className="text-caption-sm text-fg-subtle">{d.r}</span>
              <span className="truncate text-body-sm tabular-nums text-fg-default">
                {d.v}
              </span>
            </div>
          ))}
        </div>

        {/* ══ Zona de TRABALHO — só o passo aberto ══════════════════════════ */}
        <div className="flex flex-col gap-gp-2xl px-pad-4xl py-pad-4xl">
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
            <span className="mt-gp-sm flex items-center gap-gp-md">
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

          <ul className="flex flex-col gap-gp-md">
            {CHECKLIST_POR_ETAPA[vista].map((item) => {
              const feito = imp.feitos.includes(item.id);
              return (
                <li key={item.id}>
                  <div
                    onClick={() => onAlternarItem(item.id)}
                    className={`flex cursor-pointer items-center gap-gp-lg rounded-radius-lg border-2 px-pad-2xl py-pad-xl transition-colors ${
                      feito
                        ? "border-border-brand bg-bg-brand-subtle"
                        : "border-border-default bg-bg-surface hover:border-border-brand hover:bg-bg-muted"
                    }`}
                  >
                    <Checkbox
                      checked={feito}
                      onCheckedChange={() => onAlternarItem(item.id)}
                      aria-label={item.texto}
                      className="pointer-events-none"
                    />
                    <span className="min-w-0 flex-1 break-words text-body-sm leading-snug text-fg-default">
                      {item.texto}
                    </span>
                    {item.obrigatorio && (
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
      </div>
    </FloatingPanel>
  );
}
