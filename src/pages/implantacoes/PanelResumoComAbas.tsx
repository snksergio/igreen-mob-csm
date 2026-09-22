import { useEffect, useState } from "react";
import { Button, FloatingPanel, FloatingPanelSection } from "@snksergio/design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@snksergio/design-system/shadcn";
import {
  ETAPA_POR_ID,
  concluida,
  indiceDaEtapa,
  progressoGeral,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import { BarraDoFunil, ChipDeSituacao, TrilhaDeEtapas } from "./implantacoes-ui";
import {
  AcoesDeCabecalho,
  AcoesDeEtapa,
  BlocoDeCadastro,
  BlocoDePrazos,
  BlocoDoPonto,
  BotoesDeEtapa,
  ChecklistDaEtapa,
  ResumoRapido,
  contadorDaEtapa,
} from "./implantacoes-blocos";

/**
 * **Proposta E — resumo fixo + duas abas.** Uma coluna, para o painel padrão do produto.
 *
 * ## A ordem de leitura
 *
 * 1. **Resumo** — cliente, local, etapa, investimento, responsável e previsão, no
 *    formato ícone/rótulo/valor. São as mesmas colunas da tabela do funil: quem clicou
 *    numa linha quer continuar vendo o que o fez clicar.
 * 2. **Andamento** — a trilha das sete etapas, clicável.
 * 3. **Abas** — `Checklist` é o trabalho; `Detalhamento` é a ficha completa e o cadastro.
 *
 * ## O que ficou diferente do painel original
 *
 * O original empilhava checklist e cinco seções de leitura numa coluna só, e chegar ao
 * cadastro exigia rolar o painel inteiro. Aqui a leitura mora atrás de uma aba e o
 * checklist abre direto — invertendo o peso, como o operador pediu.
 *
 * ⚠️ O resumo NÃO é colapsável. Ele existe justamente para estar sempre à vista; um
 * chevron ali convidaria a fechá-lo e o painel voltaria a esconder o que importa.
 */

type AbaId = "checklist" | "detalhamento";

export function PanelResumoComAbas({
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
  const [aba, setAba] = useState<AbaId>("checklist");
  const [etapaVista, setEtapaVista] = useState<EtapaId>(imp.etapa);

  useEffect(() => {
    setEtapaVista(imp.etapa);
  }, [imp.id, imp.etapa]);

  const vista =
    indiceDaEtapa(etapaVista) <= indiceDaEtapa(imp.etapa) ? etapaVista : imp.etapa;
  const ehEtapaAtual = vista === imp.etapa;

  /** Clicar na trilha abre o checklist daquela etapa, sem mover a implantação. */
  const verEtapa = (e: EtapaId) => {
    setEtapaVista(e);
    setAba("checklist");
  };

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={760}
      resizable
      maximizable
      resizableMinWidth={560}
      resizableStorageKey="igreen-mob-cms.implantacao.resumo-abas.width"
      bodyPadded={false}
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
      headerActions={
        <AcoesDeCabecalho implantacao={imp} onEditar={onEditar} onExcluir={onExcluir} />
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <BotoesDeEtapa implantacao={imp} onMover={onMoverEtapa} />
        </>
      }
    >
      <FloatingPanelSection title="Resumo" collapsible={false}>
        <ResumoRapido implantacao={imp} />
      </FloatingPanelSection>

      <FloatingPanelSection title="Andamento">
        <div className="flex flex-col gap-gp-2xl">
          <div className="flex flex-col gap-gp-md">
            <div className="flex items-baseline justify-between gap-gp-md">
              <span className="text-caption-md text-fg-muted">Funil concluído</span>
              <span className="text-body-sm font-semibold tabular-nums text-fg-default">
                {Math.round(progressoGeral(imp) * 100)}%
              </span>
            </div>
            <BarraDoFunil implantacao={imp} />
          </div>
          <p className="text-caption-sm leading-snug text-fg-subtle">
            Clique numa etapa já percorrida para abrir o checklist dela.
          </p>
          <TrilhaDeEtapas implantacao={imp} onIr={verEtapa} />
        </div>
      </FloatingPanelSection>

      {/* ⚠️ As abas ficam DENTRO do fluxo de seções, com o mesmo gutter — sem isso elas
          encostariam nas bordas do painel, que é `bodyPadded={false}`. */}
      <div className="px-pad-4xl py-pad-3xl">
        <Tabs
          value={aba}
          onValueChange={(v) => setAba(v as AbaId)}
          fullWidth
          className="flex flex-col"
        >
          <TabsList>
            <TabsTrigger value="checklist">
              Checklist {contadorDaEtapa(imp, vista)}
            </TabsTrigger>
            <TabsTrigger value="detalhamento">Detalhamento</TabsTrigger>
          </TabsList>

          <TabsContent
            value="checklist"
            className="flex flex-col gap-gp-xl pt-pad-2xl"
          >
            <div className="flex flex-col gap-[2px]">
              <span className="text-body-md font-semibold text-fg-default">
                {ETAPA_POR_ID[vista].label}
              </span>
              <span className="text-caption-md leading-snug text-fg-muted">
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
              /* Com botões: o rodapé também tem, mas quem acabou de marcar o último item
                 está olhando para cá, e é daqui que a pessoa prossegue. */
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

          <TabsContent
            value="detalhamento"
            className="flex flex-col gap-gp-3xl pt-pad-2xl"
          >
            <div className="flex flex-col gap-gp-lg">
              <span className="text-body-sm font-semibold text-fg-default">
                O ponto (somente leitura)
              </span>
              <BlocoDoPonto implantacao={imp} />
            </div>

            <div className="flex flex-col gap-gp-lg">
              <span className="text-body-sm font-semibold text-fg-default">
                Prazos e responsável (somente leitura)
              </span>
              <BlocoDePrazos implantacao={imp} />
            </div>

            <div className="flex flex-col gap-gp-lg">
              <span className="text-body-sm font-semibold text-fg-default">
                Observação
              </span>
              {imp.observacao ? (
                <p className="text-body-sm leading-relaxed text-fg-muted">
                  {imp.observacao}
                </p>
              ) : (
                <p className="text-body-sm italic text-fg-subtle">
                  Sem observação registrada.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-gp-lg border-t border-border-subtle pt-pad-3xl">
              <span className="text-body-sm font-semibold text-fg-default">Cadastro</span>
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
      </div>
    </FloatingPanel>
  );
}
