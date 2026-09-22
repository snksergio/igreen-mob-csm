import { useEffect, useState } from "react";
import { Button, FloatingPanel } from "@snksergio/design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@snksergio/design-system/shadcn";
import {
  ETAPA_POR_ID,
  concluida,
  indiceDaEtapa,
  progressoGeral,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import {
  BarraDoFunil,
  ChipDeEtapa,
  ChipDeSituacao,
  TrilhaDeEtapas,
} from "./implantacoes-ui";
import {
  AcoesDeEtapa,
  BlocoDeCadastro,
  BlocoDePrazos,
  BlocoDoPonto,
  ChecklistDaEtapa,
  TituloDeSecao,
  contadorDaEtapa,
} from "./implantacoes-blocos";

/**
 * **Proposta D — ficha com abas.** O primeiro painel, reorganizado em três abas.
 *
 * ## De onde veio
 *
 * É o painel original — trilha vertical das sete etapas, checklist da etapa corrente,
 * fichas de leitura — com o pedido do operador: *"talvez adicionando alguma aba para
 * mostrar o checklist de aceite, e as informações do ponto, prazo responsáveis,
 * observações e cadastro"*.
 *
 * ## A divisão em três
 *
 * | aba | responde |
 * |---|---|
 * | **Andamento** | onde a implantação está, e como chegou aqui |
 * | **Checklist** | o que falta fazer agora |
 * | **Informações** | o ponto, os prazos, a observação e o cadastro |
 *
 * A diferença para a proposta B, que também usa abas: **aqui não há coluna fixa**. O
 * painel é estreito, tudo acontece numa coluna, e a aba troca o assunto inteiro. B
 * mantém identidade e valor sempre à vista porque é tela de trabalho prolongado; D é
 * ficha — abre, resolve uma coisa, fecha.
 *
 * ## A trilha continua clicável
 *
 * Tocar numa etapa já percorrida leva a aba `Checklist` para o checklist DELA, sem mover
 * a implantação. É o que dá utilidade à trilha além de decoração — e o aviso dentro da
 * aba deixa isso explícito.
 */

type AbaId = "andamento" | "checklist" | "informacoes";

export function PanelFichaComAbas({
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
  const [aba, setAba] = useState<AbaId>("andamento");
  const [etapaVista, setEtapaVista] = useState<EtapaId>(imp.etapa);

  /* Ao trocar de implantação ou de etapa, a vista volta para a corrente — senão o painel
     reabre mostrando o checklist da etapa que se espiou na anterior. */
  useEffect(() => {
    setEtapaVista(imp.etapa);
  }, [imp.id, imp.etapa]);

  const vista =
    indiceDaEtapa(etapaVista) <= indiceDaEtapa(imp.etapa) ? etapaVista : imp.etapa;
  const ehEtapaAtual = vista === imp.etapa;

  /** Clicar na trilha muda o checklist E leva para a aba dele. */
  const verEtapa = (e: EtapaId) => {
    setEtapaVista(e);
    setAba("checklist");
  };

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={720}
      resizable
      maximizable
      resizableStorageKey="igreen-mob-cms.implantacao.ficha-abas.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {imp.cliente}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="shrink-0 tabular-nums">{imp.id}</span>
            <span className="shrink-0 opacity-50">·</span>
            <ChipDeEtapa etapa={imp.etapa} />
            <ChipDeSituacao implantacao={imp} />
          </span>
        </div>
      }
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <Tabs
        value={aba}
        onValueChange={(v) => setAba(v as AbaId)}
        fullWidth
        className="flex flex-col px-pad-4xl pt-pad-3xl"
      >
        <TabsList>
          <TabsTrigger value="andamento">Andamento</TabsTrigger>
          <TabsTrigger value="checklist">
            Checklist {contadorDaEtapa(imp, vista)}
          </TabsTrigger>
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
        </TabsList>

        {/* ── Andamento ─────────────────────────────────────────────────── */}
        <TabsContent
          value="andamento"
          className="flex flex-col gap-gp-3xl pb-pad-4xl pt-pad-3xl"
        >
          <div className="flex flex-col gap-gp-md">
            <div className="flex items-baseline justify-between gap-gp-md">
              <span className="text-caption-md text-fg-muted">Funil concluído</span>
              <span className="text-body-sm font-semibold tabular-nums text-fg-default">
                {Math.round(progressoGeral(imp) * 100)}%
              </span>
            </div>
            <BarraDoFunil implantacao={imp} />
          </div>

          <div className="flex flex-col gap-gp-lg">
            <TituloDeSecao>Etapas</TituloDeSecao>
            <p className="text-caption-sm leading-snug text-fg-subtle">
              Clique numa etapa já percorrida para abrir o checklist dela.
            </p>
            <TrilhaDeEtapas implantacao={imp} onIr={verEtapa} />
          </div>

          <AcoesDeEtapa implantacao={imp} onMover={onMoverEtapa} />
        </TabsContent>

        {/* ── Checklist ─────────────────────────────────────────────────── */}
        <TabsContent
          value="checklist"
          className="flex flex-col gap-gp-xl pb-pad-4xl pt-pad-3xl"
        >
          <div className="flex flex-col gap-[2px]">
            <span className="text-body-md font-semibold text-fg-default">
              {ETAPA_POR_ID[vista].label}
            </span>
            <span className="text-caption-md text-fg-muted">
              {ETAPA_POR_ID[vista].resumo}
            </span>
          </div>

          {!ehEtapaAtual && (
            <p className="rounded-radius-md border border-border-subtle bg-bg-subtle px-pad-xl py-pad-lg text-caption-md leading-snug text-fg-muted">
              Etapa já percorrida. Marcar aqui corrige o histórico e{" "}
              <strong className="font-semibold">não</strong> move a implantação.
            </p>
          )}

          <ChecklistDaEtapa
            implantacao={imp}
            etapa={vista}
            onAlternar={onAlternarItem}
          />

          {ehEtapaAtual ? (
            <AcoesDeEtapa implantacao={imp} onMover={onMoverEtapa} />
          ) : (
            <Button
              variant="outline"
              color="secondary"
              size="sm"
              className="self-start"
              onClick={() => setEtapaVista(imp.etapa)}
            >
              Voltar para a etapa atual
            </Button>
          )}
        </TabsContent>

        {/* ── Informações ───────────────────────────────────────────────── */}
        <TabsContent
          value="informacoes"
          className="flex flex-col gap-gp-3xl pb-pad-4xl pt-pad-3xl"
        >
          <div className="flex flex-col gap-gp-lg">
            <TituloDeSecao>O ponto</TituloDeSecao>
            <BlocoDoPonto implantacao={imp} />
          </div>

          <div className="flex flex-col gap-gp-lg">
            <TituloDeSecao>Prazos e responsável</TituloDeSecao>
            <BlocoDePrazos implantacao={imp} />
          </div>

          <div className="flex flex-col gap-gp-lg">
            <TituloDeSecao>Observação</TituloDeSecao>
            {imp.observacao ? (
              <p className="text-body-sm leading-relaxed text-fg-muted">{imp.observacao}</p>
            ) : (
              <p className="text-body-sm italic text-fg-subtle">
                Sem observação registrada.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-gp-lg border-t border-border-subtle pt-pad-3xl">
            <TituloDeSecao>Cadastro</TituloDeSecao>
            <p className="text-caption-sm leading-snug text-fg-subtle">
              {concluida(imp)
                ? "Implantação concluída — editar aqui altera o histórico."
                : "Editar muda os dados do ponto, não o andamento."}
            </p>
            <BlocoDeCadastro
              implantacao={imp}
              onEditar={onEditar}
              onExcluir={onExcluir}
            />
          </div>
        </TabsContent>
      </Tabs>
    </FloatingPanel>
  );
}
