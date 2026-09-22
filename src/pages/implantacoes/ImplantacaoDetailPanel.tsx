import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Lock, Pencil, Trash2 } from "lucide-react";
import {
  Avatar,
  Button,
  Chip,
  FloatingPanel,
  FloatingPanelSection,
} from "@snksergio/design-system";
import { Checkbox } from "@snksergio/design-system/shadcn";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  CHECKLIST_POR_ETAPA,
  ETAPA_POR_ID,
  atrasada,
  concluida,
  dataCurta,
  diasNaEtapa,
  diasParaPrevisao,
  etapaAnterior,
  moeda,
  pendenciasObrigatorias,
  podeAvancar,
  potencia,
  progressoGeral,
  proximaEtapa,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import {
  BarraDoFunil,
  ChipDeEtapa,
  ChipDeSituacao,
  Propriedade,
  TrilhaDeEtapas,
} from "./implantacoes-ui";

/**
 * Painel de detalhe de uma implantação — e é aqui que o checklist é cumprido.
 *
 * ## O painel é de LEITURA e de UMA escrita
 *
 * Tudo é read-only menos o checklist e o botão de avançar. Marcar item é o trabalho
 * diário; trocar cliente, valor ou previsão é edição de cadastro e vive no formulário.
 * Misturar os dois faria o operador abrir o modo de escrita dez vezes por dia para dar um
 * clique em caixinha — e correr o risco de alterar um valor por engano.
 *
 * ## A trilha navega, o checklist acompanha
 *
 * Clicar numa etapa já cumprida mostra o checklist DELA, sem mover a implantação. Serve
 * para conferir o que foi feito lá atrás; etapas futuras não são clicáveis, porque não há
 * o que conferir num trabalho que não começou.
 *
 * ⚠️ O checklist de etapa passada continua **editável**: descobrir que a ART nunca foi
 * emitida é motivo para desmarcar, e travar o passado obrigaria o operador a mentir no
 * presente. Desmarcar item obrigatório de etapa anterior não puxa a implantação de volta
 * sozinha — quem decide regredir é uma pessoa, pelo botão.
 */
export function ImplantacaoDetailPanel({
  implantacao,
  onClose,
  onAlternarItem,
  onMoverEtapa,
  onEditar,
  onExcluir,
}: {
  implantacao: Implantacao | null;
  onClose: () => void;
  onAlternarItem: (itemId: string) => void;
  onMoverEtapa: (etapa: EtapaId) => void;
  onEditar: (i: Implantacao) => void;
  onExcluir: (i: Implantacao) => void;
}) {
  const [etapaVista, setEtapaVista] = useState<EtapaId | null>(null);

  /* Ao trocar de implantação (ou reabrir), a trilha volta para a etapa atual. Sem isto o
     painel abriria mostrando o checklist da etapa que o operador espiou na anterior. */
  useEffect(() => {
    setEtapaVista(implantacao?.etapa ?? null);
  }, [implantacao?.id, implantacao?.etapa]);

  if (!implantacao) return null;
  const imp = implantacao;
  const vista = etapaVista ?? imp.etapa;
  const ehEtapaAtual = vista === imp.etapa;

  const pendentes = pendenciasObrigatorias(imp);
  const proxima = proximaEtapa(imp.etapa);
  const anterior = etapaAnterior(imp.etapa);
  const avanca = podeAvancar(imp);
  const dias = diasParaPrevisao(imp);

  return (
    <FloatingPanel
      open={!!imp}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      size={760}
      resizable
      maximizable
      resizableStorageKey="igreen-mob-cms.implantacao-detalhe.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {imp.cliente}
          </span>
          <span className="flex flex-wrap items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="tabular-nums">{imp.id}</span>
            <span className="opacity-50">·</span>
            <ChipDeEtapa etapa={imp.etapa} />
            <ChipDeSituacao implantacao={imp} />
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            iconLeft={<ArrowLeft />}
            disabled={!anterior}
            onClick={() => anterior && onMoverEtapa(anterior)}
          >
            Voltar etapa
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={avanca ? <ArrowRight /> : <Lock />}
            disabled={!proxima || !avanca}
            onClick={() => proxima && onMoverEtapa(proxima)}
          >
            {proxima ? `Avançar para ${ETAPA_POR_ID[proxima].label}` : "Última etapa"}
          </Button>
        </>
      }
    >
      <FloatingPanelSection title="Andamento">
        <div className="flex flex-col gap-gp-xl">
          <div className="flex flex-col gap-gp-sm">
            <div className="flex items-baseline justify-between gap-gp-md">
              <span className="text-caption-md text-fg-muted">Funil concluído</span>
              <span className="text-body-sm font-semibold tabular-nums text-fg-default">
                {Math.round(progressoGeral(imp) * 100)}%
              </span>
            </div>
            <BarraDoFunil implantacao={imp} />
          </div>

          <div className="flex flex-col gap-gp-md">
            {/* A trilha é navegável e não parecia. Uma linha resolve o que um ícone de
                afordância não resolveria em sete itens. */}
            <p className="text-caption-sm leading-snug text-fg-subtle">
              Clique numa etapa já percorrida para revisar o checklist dela.
            </p>
            <TrilhaDeEtapas implantacao={imp} onIr={setEtapaVista} />
          </div>
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection
        title={`Checklist · ${ETAPA_POR_ID[vista].label}`}
      >
        <div className="flex flex-col gap-gp-lg">
          <p className="text-caption-sm leading-snug text-fg-subtle">
            Clique na linha para marcar o que já foi feito.
          </p>

          {!ehEtapaAtual && (
            /* Sem este aviso, marcar caixinha numa etapa passada parece mover a
               implantação — e não move. */
            <p className="rounded-radius-md border border-border-subtle bg-bg-subtle px-pad-xl py-pad-lg text-caption-md leading-snug text-fg-muted">
              Você está vendo uma etapa já percorrida. Marcar ou desmarcar aqui corrige o
              histórico e <strong className="font-semibold">não</strong> move a
              implantação.
            </p>
          )}

          <ul className="flex flex-col">
            {CHECKLIST_POR_ETAPA[vista].map((item) => {
              const feito = imp.feitos.includes(item.id);
              return (
                <li key={item.id} className="border-b border-border-subtle last:border-b-0">
                  {/* A linha inteira é o alvo — ver o JSDoc do seletor de locais: o
                      `Checkbox` do DS é um `<button>`, que `<label htmlFor>` não
                      alcança, então a linha é uma `div` clicável e o checkbox fica
                      `pointer-events-none` para não disparar dois toggles. */}
                  <div
                    onClick={() => onAlternarItem(item.id)}
                    className="flex cursor-pointer items-start gap-gp-md rounded-radius-sm px-pad-md py-pad-lg transition-colors hover:bg-bg-muted has-[:focus-visible]:bg-bg-muted"
                  >
                    <Checkbox
                      checked={feito}
                      onCheckedChange={() => onAlternarItem(item.id)}
                      aria-label={item.texto}
                      className="pointer-events-none mt-[2px]"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <span
                        className={`break-words text-body-sm leading-snug ${
                          feito ? "text-fg-muted line-through" : "text-fg-default"
                        }`}
                      >
                        {item.texto}
                      </span>
                      {item.obrigatorio && !feito && (
                        <span className="flex">
                          <Chip color="warning" variant="soft" size="sm" shape="pill">
                            Obrigatório
                          </Chip>
                        </span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {ehEtapaAtual && pendentes.length > 0 && (
            <p className="rounded-radius-md border border-border-warning-muted bg-bg-warning-muted px-pad-xl py-pad-lg text-caption-md leading-snug text-fg-warning">
              {pendentes.length === 1
                ? "Falta 1 item obrigatório para avançar."
                : `Faltam ${pendentes.length} itens obrigatórios para avançar.`}
            </p>
          )}
          {ehEtapaAtual && pendentes.length === 0 && proxima && (
            /* ⚠️ O botão de avançar aparece AQUI, além do rodapé. Marcar o último item e
               ter de procurar a ação a 400px de distância, no canto oposto, era o que
               tornava o fluxo confuso — a decisão acontece na última caixinha marcada, e
               é ali que a saída tem de estar. O rodapé continua como atalho permanente. */
            <div className="flex flex-col gap-gp-md rounded-radius-md border border-border-success-muted bg-bg-success-muted px-pad-xl py-pad-lg sm:flex-row sm:items-center sm:justify-between">
              <p className="text-caption-md leading-snug text-fg-success">
                Etapa cumprida. Pode avançar.
              </p>
              <Button
                variant="filled"
                color="primary"
                size="sm"
                iconRight={<ArrowRight />}
                className="max-md:w-full"
                onClick={() => onMoverEtapa(proxima)}
              >
                Avançar para {ETAPA_POR_ID[proxima].label}
              </Button>
            </div>
          )}
          {concluida(imp) && (
            <p className="rounded-radius-md border border-border-success-muted bg-bg-success-muted px-pad-xl py-pad-lg text-caption-md leading-snug text-fg-success">
              Implantação concluída. O carregador está publicado no app.
            </p>
          )}
        </div>
      </FloatingPanelSection>

      {/* Daqui para baixo é LEITURA. A distinção estava só implícita, e o operador
          não tem por que adivinhar onde o painel deixa de responder ao clique. */}
      <FloatingPanelSection title="O ponto (somente leitura)">
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
            valor={
              <span className="font-semibold tabular-nums">{moeda(imp.investimento)}</span>
            }
          />
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="Prazos e responsável (somente leitura)">
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
      </FloatingPanelSection>

      {imp.observacao && (
        <FloatingPanelSection title="Observação">
          <p className="text-body-sm leading-relaxed text-fg-muted">{imp.observacao}</p>
        </FloatingPanelSection>
      )}

      <FloatingPanelSection title="Cadastro">
        {/* As duas ações de escrita ficam aqui embaixo, e não no rodapé: o rodapé é do
            fluxo (avançar/voltar), que é o que se faz nesta tela todo dia. Excluir ao
            lado de "Avançar etapa" seria vizinhança perigosa. */}
        <div className="flex flex-wrap gap-gp-md">
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            iconLeft={<Pencil />}
            onClick={() => onEditar(imp)}
          >
            Editar dados
          </Button>
          <Button
            variant="outline"
            color="critical"
            size="sm"
            iconLeft={<Trash2 />}
            onClick={() => onExcluir(imp)}
          >
            Excluir implantação
          </Button>
        </div>
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
