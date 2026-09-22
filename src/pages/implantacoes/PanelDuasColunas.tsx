import { useState } from "react";
import { Clock, MapPin, Zap } from "lucide-react";
import { Avatar, Chip, FloatingPanel } from "@snksergio/design-system";
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
  progressoDaEtapa,
  progressoGeral,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import { ChipDeSituacao } from "./implantacoes-ui";
import {
  AcoesDeEtapa,
  BlocoDeCadastro,
  BlocoDePrazos,
  BlocoDoPonto,
  ChecklistDaEtapa,
  PassosCompactos,
  TituloDeSecao,
  contadorDaEtapa,
} from "./implantacoes-blocos";

/**
 * **Proposta B — duas colunas.** Larga, para trabalhar a implantação.
 *
 * ## O que a segunda rodada mudou
 *
 * | pedido do operador | o que virou |
 * |---|---|
 * | "os steps ficaram feios, com scroll; usar os da proposta 1" | a esteira de chevrons saiu; entrou o `PassosCompactos` |
 * | "usar as abas que a gente já usa no painel" | `Tabs` do DS (`segmented`, `fullWidth`) no lugar das abas sublinhadas na unha |
 * | "a esquerda ficou compacta demais e feia" | virou um painel dentro do painel: seções com título, respiro e divisória |
 * | "no checklist faltou prosseguir e voltar" | `AcoesDeEtapa` fecha a aba |
 *
 * ## A esteira de chevrons não volta
 *
 * Ela desenha bem com quatro etapas, que é o caso da referência. Com sete, cada chevron
 * carrega um rótulo escrito e o conjunto passa de 900px — vira barra de rolagem
 * horizontal. Rolar para descobrir onde se está é o oposto do que um indicador de
 * progresso serve.
 */

type AbaId = "checklist" | "historico" | "dados";

/** Seção da coluna esquerda — mesma anatomia do `FloatingPanelSection`, sem o painel. */
function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-gp-lg border-b border-border-subtle px-pad-3xl py-pad-2xl last:border-b-0">
      <span className="text-caption-md font-semibold uppercase tracking-wide text-fg-subtle">
        {titulo}
      </span>
      {children}
    </section>
  );
}

function Dado({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-gp-md">
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
      size={1120}
      resizable
      maximizable
      resizableMinWidth={880}
      resizableStorageKey="igreen-mob-cms.implantacao.duas-colunas.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 items-center gap-gp-lg">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {imp.cliente}
          </span>
          <span className="shrink-0 text-body-xs font-normal tabular-nums text-fg-muted">
            {imp.id}
          </span>
          <ChipDeSituacao implantacao={imp} />
        </div>
      }
    >
      {/* ⚠️ `h-full` e não `flex-1`: o corpo do `FloatingPanel` é container de SCROLL, não
          flex pai — com `flex-1` as colunas nasciam com a altura do conteúdo (530px num
          painel de 852, medido). Abaixo de `lg` volta a `h-auto`, senão o empilhado seria
          cortado em vez de rolar. */}
      <div className="flex h-auto flex-col lg:h-full lg:flex-row lg:overflow-hidden">
        {/* ══ Coluna de identidade — um painel dentro do painel ═══════════════ */}
        <aside className="scrollbar-thin flex shrink-0 flex-col overflow-y-auto border-b border-border-default lg:w-[344px] lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-gp-md border-b border-border-subtle px-pad-3xl py-pad-3xl">
            <span className="text-heading-xs font-bold leading-tight text-fg-default">
              {imp.cliente}
            </span>
            <span className="flex items-start gap-gp-sm text-body-sm text-fg-muted">
              <MapPin className="mt-[2px] size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
              <span className="min-w-0 break-words">
                {imp.local}
                <span className="block text-caption-sm">
                  {imp.cidade} · {imp.uf}
                </span>
              </span>
            </span>
            <span className="flex flex-wrap gap-gp-sm">
              <Chip color="neutral" variant="soft" size="sm" shape="rounded">
                <span className="tabular-nums">{imp.id}</span>
              </Chip>
              <Chip color="primary" variant="soft" size="sm" shape="rounded">
                {indiceDaEtapa(imp.etapa) + 1} de {ETAPAS.length} ·{" "}
                {ETAPA_POR_ID[imp.etapa].label}
              </Chip>
            </span>
          </div>

          <Secao titulo="Investimento">
            <div className="flex flex-col gap-gp-sm">
              <span className="text-stat-sm font-bold tabular-nums text-fg-default">
                {moeda(imp.investimento)}
              </span>
              <span className="flex items-center gap-gp-sm text-caption-md text-fg-muted">
                <Zap className="size-icon-xs" aria-hidden />
                {imp.pontos} × {potencia(imp.potenciaKw)}
              </span>
            </div>
          </Secao>

          <Secao titulo="Condução">
            <div className="flex flex-col gap-gp-lg">
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
          </Secao>

          <Secao titulo="Progresso do funil">
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
          </Secao>

          {imp.observacao && (
            <Secao titulo="Observação">
              <p className="text-body-sm leading-relaxed text-fg-muted">{imp.observacao}</p>
            </Secao>
          )}

          <Secao titulo="Cadastro">
            <BlocoDeCadastro implantacao={imp} onEditar={onEditar} onExcluir={onExcluir} />
          </Secao>
        </aside>

        {/* ══ Coluna de trabalho ═════════════════════════════════════════════ */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-gp-lg border-b border-border-default px-pad-4xl py-pad-2xl">
            <div className="flex flex-col gap-[2px]">
              <span className="text-body-md font-semibold text-fg-default">
                {ETAPA_POR_ID[imp.etapa].label}
              </span>
              <span className="text-caption-md text-fg-muted">
                {ETAPA_POR_ID[imp.etapa].resumo}
              </span>
            </div>
            <PassosCompactos implantacao={imp} />
          </div>

          <Tabs
            value={aba}
            onValueChange={(v) => setAba(v as AbaId)}
            fullWidth
            className="flex min-h-0 flex-1 flex-col px-pad-4xl pt-pad-2xl"
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
              <ChecklistDaEtapa
                implantacao={imp}
                etapa={imp.etapa}
                onAlternar={onAlternarItem}
                variante="cartao"
              />
              <AcoesDeEtapa implantacao={imp} onMover={onMoverEtapa} />
            </TabsContent>

            <TabsContent
              value="historico"
              className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-pad-3xl pt-pad-2xl"
            >
              <ol className="flex flex-col gap-gp-md">
                {ETAPAS.map((e, i) => {
                  const { feitos, total } = progressoDaEtapa(imp, e.id);
                  const ehAtual = i === indiceDaEtapa(imp.etapa);
                  return (
                    <li
                      key={e.id}
                      className={`flex items-center justify-between gap-gp-lg rounded-radius-lg border px-pad-2xl py-pad-xl ${
                        ehAtual
                          ? "border-border-brand bg-bg-brand-subtle"
                          : "border-border-subtle bg-bg-surface"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-gp-lg">
                        <span
                          className="size-[8px] shrink-0 rounded-radius-full"
                          style={{ backgroundColor: e.cor }}
                          aria-hidden
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-body-sm font-medium text-fg-default">
                            {i + 1}. {e.label}
                          </span>
                          <span className="text-caption-sm text-fg-muted">{e.resumo}</span>
                        </span>
                      </span>
                      <span
                        className={`shrink-0 text-caption-md tabular-nums ${
                          feitos === total ? "text-fg-success" : "text-fg-subtle"
                        }`}
                      >
                        {feitos}/{total}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </TabsContent>

            <TabsContent
              value="dados"
              className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-gp-3xl overflow-y-auto pb-pad-3xl pt-pad-2xl"
            >
              <div className="flex flex-col gap-gp-lg">
                <TituloDeSecao>O ponto</TituloDeSecao>
                <BlocoDoPonto implantacao={imp} />
              </div>
              <div className="flex flex-col gap-gp-lg">
                <TituloDeSecao>Prazos e responsável</TituloDeSecao>
                <BlocoDePrazos implantacao={imp} />
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </FloatingPanel>
  );
}
