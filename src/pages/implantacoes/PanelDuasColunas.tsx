import { useState } from "react";
import { Clock, MapPin, Zap } from "lucide-react";
import {
  Avatar,
  Button,
  Chip,
  FloatingPanel,
  FloatingPanelSection,
} from "@snksergio/design-system";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@snksergio/design-system/shadcn";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  ETAPAS,
  ETAPA_POR_ID,
  atrasada,
  concluida,
  dataCurta,
  diasNaEtapa,
  indiceDaEtapa,
  moeda,
  potencia,
  progressoGeral,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import { ChipDeSituacao, TrilhaDeEtapas } from "./implantacoes-ui";
import {
  AcoesDeCabecalho,
  AcoesDeEtapa,
  BlocoDePrazos,
  BlocoDoPonto,
  BotoesDeEtapa,
  ChecklistDaEtapa,
  PassosCompactos,
  contadorDaEtapa,
} from "./implantacoes-blocos";

/**
 * **Proposta B — duas colunas.** Larga, para trabalhar a implantação.
 *
 * ## O que a terceira rodada mudou
 *
 * | pedido do operador | o que virou |
 * |---|---|
 * | "o nome ficou com fonte grande; manter o padrão do header das outras telas" | `titleSlot` no formato de sempre: nome, subtítulo e chips — e nada de `heading` dentro da coluna |
 * | "editar e excluir no header, seguindo o padrão do panel" | foram para o `headerActions`, que é o slot do DS entre o título e o X |
 * | "a esquerda ficou espremida; usar as seções colapsáveis do painel" | 384px e `FloatingPanelSection` de verdade, com chevron |
 * | "o cadastro não precisa ficar ali; deixar as ações no rodapé" | rodapé com Fechar + Voltar + Avançar; o bloco de aviso ficou só com o texto |
 * | "não precisa o 1. no centro da barra" | a faixa passou a dizer o nome da etapa e "Etapa 2 de 7" |
 * | "no histórico, manter o design de timeline" | `TrilhaDeEtapas`, a mesma da proposta D |
 * | "o detalhamento ficou jogado" | virou `FloatingPanelSection`, igual ao resto do produto |
 * | "não precisa do divider embaixo do cabeçalho da etapa" | as abas já separam; a borda saiu |
 */

type AbaId = "checklist" | "historico" | "dados";

function Dado({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-gp-md py-pad-sm">
      <span className="shrink-0 text-body-sm text-fg-muted">{label}</span>
      <span className="min-w-0 text-right text-body-sm text-fg-default">{valor}</span>
    </div>
  );
}

export function PanelDuasColunas({
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

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={1180}
      resizable
      maximizable
      resizableMinWidth={920}
      resizableStorageKey="igreen-mob-cms.implantacao.duas-colunas.width"
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
      /* ⚠️ `headerActions` é o slot do DS entre o título e o X — é ele que garante o
         alinhamento vertical com o botão de fechar. Montar os botões dentro do
         `titleSlot`, como fiz antes, os deixava fora de registro. */
      headerActions={
        <AcoesDeCabecalho
          implantacao={imp}
          onEditar={onEditar}
          onExcluir={onExcluir}
        />
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
      {/* ⚠️ `h-full` e não `flex-1`: o corpo do `FloatingPanel` é container de SCROLL, não
          flex pai — com `flex-1` as colunas nasciam com a altura do conteúdo (530px num
          painel de 852, medido). Abaixo de `lg` volta a `h-auto`, senão o empilhado seria
          cortado em vez de rolar. */}
      <div className="flex h-auto flex-col lg:h-full lg:flex-row lg:overflow-hidden">
        {/* ══ Coluna de identidade — seções do próprio DS, colapsáveis ═══════ */}
        <aside className="scrollbar-thin flex shrink-0 flex-col overflow-y-auto border-b border-border-default lg:w-[384px] lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-gp-md border-b border-border-default px-pad-4xl py-pad-2xl">
            <span className="flex items-start gap-gp-sm text-body-sm text-fg-default">
              <MapPin className="mt-[2px] size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
              <span className="min-w-0 break-words font-medium">
                {imp.local}
                <span className="block text-caption-sm font-normal text-fg-muted">
                  {imp.cidade} · {imp.uf}
                </span>
              </span>
            </span>
            <span className="flex flex-wrap gap-gp-sm">
              <Chip color="primary" variant="soft" size="sm" shape="rounded">
                {indiceDaEtapa(imp.etapa) + 1} de {ETAPAS.length} ·{" "}
                {ETAPA_POR_ID[imp.etapa].label}
              </Chip>
              <Chip color="neutral" variant="soft" size="sm" shape="rounded">
                <span className="tabular-nums">
                  {Math.round(progressoGeral(imp) * 100)}% do funil
                </span>
              </Chip>
            </span>
          </div>

          <FloatingPanelSection title="Investimento">
            <div className="flex flex-col gap-gp-sm">
              <span className="text-stat-sm font-bold tabular-nums text-fg-default">
                {moeda(imp.investimento)}
              </span>
              <span className="flex items-center gap-gp-sm text-caption-md text-fg-muted">
                <Zap className="size-icon-xs" aria-hidden />
                {imp.pontos} × {potencia(imp.potenciaKw)}
              </span>
            </div>
          </FloatingPanelSection>

          <FloatingPanelSection title="Condução">
            <div className="flex flex-col">
              <Dado
                label="Responsável"
                valor={
                  <span className="flex items-center justify-end gap-gp-md">
                    <Avatar size="xs" colorHex={corDoAvatar(imp.responsavel)} aria-hidden>
                      {iniciais(imp.responsavel)}
                    </Avatar>
                    {imp.responsavel}
                  </span>
                }
              />
              <Dado
                label="Aberta em"
                valor={<span className="tabular-nums">{dataCurta(imp.abertaEm)}</span>}
              />
              <Dado
                label="Previsão"
                valor={
                  <span
                    className={`tabular-nums ${atrasada(imp) ? "font-semibold text-fg-danger" : ""}`}
                  >
                    {dataCurta(imp.previsaoDeInstalacao)}
                  </span>
                }
              />
              <Dado
                label="Nesta etapa há"
                valor={
                  <span className="flex items-center justify-end gap-gp-sm tabular-nums">
                    <Clock className="size-icon-xs text-fg-subtle" aria-hidden />
                    {diasNaEtapa(imp)} {diasNaEtapa(imp) === 1 ? "dia" : "dias"}
                  </span>
                }
              />
            </div>
          </FloatingPanelSection>

          <FloatingPanelSection title="Progresso do funil">
            <div className="flex flex-col gap-gp-md">
              <div className="flex items-baseline justify-between gap-gp-md">
                <span className="text-body-sm text-fg-muted">Itens cumpridos</span>
                <span className="text-body-md font-semibold tabular-nums text-fg-default">
                  {Math.round(progressoGeral(imp) * 100)}%
                </span>
              </div>
              <span className="block h-[6px] w-full overflow-hidden rounded-radius-full bg-bg-muted">
                <span
                  className={`block h-full rounded-radius-full ${
                    concluida(imp) ? "bg-bg-success" : "bg-bg-brand"
                  }`}
                  style={{ width: `${progressoGeral(imp) * 100}%` }}
                />
              </span>
            </div>
          </FloatingPanelSection>

          {imp.observacao && (
            <FloatingPanelSection title="Observação">
              <p className="text-body-sm leading-relaxed text-fg-muted">{imp.observacao}</p>
            </FloatingPanelSection>
          )}
        </aside>

        {/* ══ Coluna de trabalho ═════════════════════════════════════════════ */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Sem `border-b`: as abas logo abaixo já separam visualmente, e duas linhas
              coladas leem como moldura. */}
          <div className="px-pad-4xl pb-pad-lg pt-pad-3xl">
            <PassosCompactos implantacao={imp} />
          </div>

          <Tabs
            value={aba}
            onValueChange={(v) => setAba(v as AbaId)}
            fullWidth
            className="flex min-h-0 flex-1 flex-col px-pad-4xl"
          >
            <TabsList>
              <TabsTrigger value="checklist">
                Checklist {contadorDaEtapa(imp, imp.etapa)}
              </TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="dados">Dados</TabsTrigger>
            </TabsList>

            <TabsContent
              value="checklist"
              className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-gp-xl overflow-y-auto pb-pad-3xl pt-pad-2xl"
            >
              <div className="flex flex-col gap-[2px]">
                <span className="text-body-md font-semibold text-fg-default">
                  {ETAPA_POR_ID[imp.etapa].label}
                </span>
                <span className="text-caption-md leading-snug text-fg-muted">
                  {ETAPA_POR_ID[imp.etapa].resumo}
                </span>
              </div>
              <ChecklistDaEtapa
                implantacao={imp}
                etapa={imp.etapa}
                onAlternar={onAlternarItem}
                variante="cartao"
              />
              {/* Só o aviso: voltar e avançar moram no rodapé deste painel. */}
              <AcoesDeEtapa implantacao={imp} onMover={onMoverEtapa} somenteAviso />
            </TabsContent>

            <TabsContent
              value="historico"
              className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-pad-3xl pt-pad-2xl"
            >
              {/* Timeline, não cartões numerados — o desenho que o operador aprovou. */}
              <TrilhaDeEtapas implantacao={imp} />
            </TabsContent>

            <TabsContent
              value="dados"
              className="scrollbar-thin -mx-pad-4xl min-h-0 flex-1 overflow-y-auto pb-pad-3xl"
            >
              <FloatingPanelSection title="O ponto">
                <BlocoDoPonto implantacao={imp} />
              </FloatingPanelSection>
              <FloatingPanelSection title="Prazos e responsável">
                <BlocoDePrazos implantacao={imp} />
              </FloatingPanelSection>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </FloatingPanel>
  );
}
