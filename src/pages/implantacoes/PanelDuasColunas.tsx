import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Zap,
} from "lucide-react";
import {
  Avatar,
  Button,
  Chip,
  FloatingPanel,
} from "@snksergio/design-system";
import { Checkbox } from "@snksergio/design-system/shadcn";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  CHECKLIST_POR_ETAPA,
  ETAPAS,
  ETAPA_POR_ID,
  atrasada,
  concluida,
  dataCurta,
  diasNaEtapa,
  indiceDaEtapa,
  moeda,
  pendenciasObrigatorias,
  podeAvancar,
  potencia,
  progressoDaEtapa,
  progressoGeral,
  proximaEtapa,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import { ChipDeSituacao } from "./implantacoes-ui";

/**
 * **Proposta B — workspace em duas colunas.** Larga, para TRABALHAR a implantação.
 *
 * ## A divisão
 *
 * | coluna | o que fica | por quê |
 * |---|---|---|
 * | **esquerda, 328px** | identidade, valor, ponto, responsável, ações | o que não muda enquanto se trabalha — fica sempre visível |
 * | **direita** | etapas + abas de conteúdo | o que muda a cada clique |
 *
 * É a resposta direta a "dividir em 2 colunas" e a "separar o que é step do que é
 * informativo": a informação fixa não compete por espaço com o fluxo, e a faixa de
 * etapas fica isolada no alto da coluna que muda.
 *
 * ## As abas
 *
 * `Checklist` é onde se trabalha; `Histórico` mostra as sete etapas em lista; `Dados` é
 * o cadastro. Empilhar os três numa coluna só era o que fazia o painel pedir rolagem
 * para tudo. Com abas, cada pergunta tem um lugar e nenhuma exige rolar até o fim.
 *
 * ⚠️ Esta proposta **não cabe no celular** em duas colunas — abaixo de `lg` as colunas
 * empilham, e a da esquerda vira um cabeçalho. É o custo assumido de uma tela de
 * trabalho; quem usa no celular é melhor servido pela proposta A ou C.
 */

const ABAS = [
  { id: "checklist", label: "Checklist" },
  { id: "historico", label: "Histórico" },
  { id: "dados", label: "Dados" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

/**
 * Faixa de etapas em chevrons.
 *
 * O recorte é `clip-path` na unha — o DS não tem componente de breadcrumb de processo, e
 * um `Stepper` genérico não dá a leitura de "esteira" que sete etapas sequenciais pedem.
 * A ponta tem 10px; o item seguinte entra 10px por baixo (`-ml-[10px]`) para os cortes
 * encaixarem sem fresta.
 */
function EsteiraDeEtapas({
  implantacao,
  onIr,
}: {
  implantacao: Implantacao;
  onIr: (e: EtapaId) => void;
}) {
  const atual = indiceDaEtapa(implantacao.etapa);
  const PONTA = 10;
  return (
    <div className="scrollbar-thin flex overflow-x-auto" aria-label="Etapas do funil">
      {ETAPAS.map((etapa, i) => {
        const passada = i < atual;
        const ehAtual = i === atual;
        const alcancavel = i <= atual;
        return (
          <button
            key={etapa.id}
            type="button"
            disabled={!alcancavel}
            onClick={() => alcancavel && onIr(etapa.id)}
            title={etapa.resumo}
            style={{
              clipPath:
                i === 0
                  ? `polygon(0 0, calc(100% - ${PONTA}px) 0, 100% 50%, calc(100% - ${PONTA}px) 100%, 0 100%)`
                  : `polygon(0 0, calc(100% - ${PONTA}px) 0, 100% 50%, calc(100% - ${PONTA}px) 100%, 0 100%, ${PONTA}px 50%)`,
              paddingLeft: i === 0 ? 14 : 14 + PONTA,
              marginLeft: i === 0 ? 0 : -PONTA,
            }}
            className={`flex h-[34px] shrink-0 items-center gap-gp-sm whitespace-nowrap pr-[22px] text-caption-md transition-colors ${
              ehAtual
                ? "bg-bg-brand font-semibold text-fg-on-brand"
                : passada
                  ? "bg-bg-brand-subtle font-medium text-fg-brand hover:bg-bg-muted"
                  : "cursor-not-allowed bg-bg-muted text-fg-subtle"
            }`}
          >
            <span className="tabular-nums opacity-70">{i + 1}</span>
            {etapa.label}
          </button>
        );
      })}
    </div>
  );
}

function Dado({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="text-caption-sm text-fg-muted">{label}</span>
      <span className="text-body-sm text-fg-default">{valor}</span>
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
  const [etapaVista, setEtapaVista] = useState<EtapaId>(imp.etapa);
  const vista = indiceDaEtapa(etapaVista) <= indiceDaEtapa(imp.etapa) ? etapaVista : imp.etapa;

  const proxima = proximaEtapa(imp.etapa);
  const avanca = podeAvancar(imp);
  const pendentes = pendenciasObrigatorias(imp);

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={1080}
      resizable
      maximizable
      resizableMinWidth={860}
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
      {/* ⚠️ `h-full overflow-hidden` e não `flex-1`: o corpo do `FloatingPanel` é um
          container de SCROLL (`overflow-y-auto`), não um flex pai — `flex-1` aqui não
          tem contra o que crescer e as duas colunas nasciam com a altura do conteúdo,
          530px num painel de 852 (medido). Com `h-full` elas ocupam a altura toda, a
          borda entre as colunas vai até embaixo, e quem rola é só a aba da direita. */}
      {/* ⚠️ `h-auto` + `overflow-visible` abaixo de `lg`: empilhado, `h-full` com
          `overflow-hidden` cortaria a segunda coluna em vez de deixar o corpo do painel
          rolar. A trava de altura só faz sentido quando as colunas estão lado a lado. */}
      <div className="flex h-auto flex-col lg:h-full lg:flex-row lg:overflow-hidden">
        {/* ══ Coluna fixa ══════════════════════════════════════════════════ */}
        <aside className="flex shrink-0 flex-col gap-gp-2xl border-b border-border-default px-pad-4xl py-pad-3xl lg:w-[328px] lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-gp-md">
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
          </div>

          {/* ⚠️ O CTA sobe para a coluna fixa. No painel atual ele vivia no rodapé, a
              uma rolagem de distância do checklist que o destrava. */}
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconRight={<ArrowRight />}
            className="w-full"
            disabled={!proxima || !avanca}
            onClick={() => proxima && onMoverEtapa(proxima)}
          >
            {proxima ? `Avançar para ${ETAPA_POR_ID[proxima].label}` : "Última etapa"}
          </Button>
          {!avanca && proxima && (
            <p className="-mt-gp-lg text-caption-sm leading-snug text-fg-warning">
              {pendentes.length === 1
                ? "1 item obrigatório pendente."
                : `${pendentes.length} itens obrigatórios pendentes.`}
            </p>
          )}

          <div className="flex flex-col gap-gp-sm rounded-radius-lg bg-bg-subtle px-pad-2xl py-pad-xl">
            <span className="text-caption-sm text-fg-muted">Investimento previsto</span>
            <span className="text-stat-sm font-bold tabular-nums text-fg-default">
              {moeda(imp.investimento)}
            </span>
            <span className="flex items-center gap-gp-sm text-caption-sm text-fg-muted">
              <Zap className="size-icon-xs" aria-hidden />
              {imp.pontos} × {potencia(imp.potenciaKw)}
            </span>
          </div>

          <div className="flex flex-col gap-gp-xl border-t border-border-subtle pt-pad-2xl">
            <Dado
              label="Responsável"
              valor={
                <span className="flex items-center gap-gp-md">
                  <Avatar size="xs" colorHex={corDoAvatar(imp.responsavel)} aria-hidden>
                    {iniciais(imp.responsavel)}
                  </Avatar>
                  {imp.responsavel}
                </span>
              }
            />
            <Dado
              label="Previsão de instalação"
              valor={
                <span
                  className={`tabular-nums ${atrasada(imp) ? "font-semibold text-fg-danger" : ""}`}
                >
                  {dataCurta(imp.previsaoDeInstalacao)}
                </span>
              }
            />
            <Dado
              label="Progresso do funil"
              valor={
                <span className="flex items-center gap-gp-md">
                  <span className="h-[6px] w-[96px] overflow-hidden rounded-radius-full bg-bg-muted">
                    <span
                      className={`block h-full rounded-radius-full ${
                        concluida(imp) ? "bg-bg-success" : "bg-bg-brand"
                      }`}
                      style={{ width: `${progressoGeral(imp) * 100}%` }}
                    />
                  </span>
                  <span className="tabular-nums">
                    {Math.round(progressoGeral(imp) * 100)}%
                  </span>
                </span>
              }
            />
          </div>

          <div className="mt-auto flex flex-wrap gap-gp-md border-t border-border-subtle pt-pad-2xl">
            <Button
              variant="outline"
              color="secondary"
              size="sm"
              iconLeft={<Pencil />}
              onClick={() => onEditar(imp)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              color="critical"
              size="sm"
              iconLeft={<Trash2 />}
              onClick={() => onExcluir(imp)}
            >
              Excluir
            </Button>
          </div>
          <span className="text-caption-sm text-fg-subtle">
            Aberta em {dataCurta(imp.abertaEm)}
          </span>
        </aside>

        {/* ══ Coluna de trabalho ═══════════════════════════════════════════ */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-gp-lg border-b border-border-default px-pad-4xl py-pad-2xl">
            <div className="flex flex-wrap items-center justify-between gap-gp-md">
              <span className="text-caption-md text-fg-muted">
                Etapa:{" "}
                <strong className="font-semibold text-fg-default">
                  {ETAPA_POR_ID[imp.etapa].label}
                </strong>
              </span>
              <span className="flex items-center gap-gp-sm text-caption-md text-fg-muted">
                <Clock className="size-icon-xs" aria-hidden />
                Nesta etapa há {diasNaEtapa(imp)}{" "}
                {diasNaEtapa(imp) === 1 ? "dia" : "dias"}
              </span>
            </div>
            <EsteiraDeEtapas implantacao={imp} onIr={setEtapaVista} />
          </div>

          <div className="flex gap-gp-2xl border-b border-border-default px-pad-4xl">
            {ABAS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAba(a.id)}
                className={`-mb-px border-b-2 py-pad-xl text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand ${
                  aba === a.id
                    ? "border-border-brand font-semibold text-fg-default"
                    : "border-transparent text-fg-muted hover:text-fg-default"
                }`}
              >
                {a.label}
                {a.id === "checklist" && (
                  <span className="ml-gp-sm text-caption-sm tabular-nums text-fg-subtle">
                    {progressoDaEtapa(imp, vista).feitos}/
                    {progressoDaEtapa(imp, vista).total}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-pad-4xl py-pad-3xl">
            {aba === "checklist" && (
              <div className="flex flex-col gap-gp-xl">
                <div className="flex flex-col gap-[2px]">
                  <span className="text-body-md font-semibold text-fg-default">
                    {ETAPA_POR_ID[vista].label}
                  </span>
                  <span className="text-caption-md text-fg-muted">
                    {ETAPA_POR_ID[vista].resumo}
                  </span>
                </div>
                {vista !== imp.etapa && (
                  <p className="rounded-radius-md border border-border-subtle bg-bg-subtle px-pad-xl py-pad-lg text-caption-md leading-snug text-fg-muted">
                    Etapa já percorrida. Marcar aqui corrige o histórico e não move a
                    implantação.
                  </p>
                )}
                <ul className="flex flex-col gap-gp-md">
                  {CHECKLIST_POR_ETAPA[vista].map((item) => {
                    const feito = imp.feitos.includes(item.id);
                    return (
                      <li key={item.id}>
                        <div
                          onClick={() => onAlternarItem(item.id)}
                          className={`flex cursor-pointer items-start gap-gp-lg rounded-radius-lg border px-pad-2xl py-pad-xl transition-colors ${
                            feito
                              ? "border-border-subtle bg-bg-subtle"
                              : "border-border-default bg-bg-surface hover:bg-bg-muted"
                          }`}
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
              </div>
            )}

            {aba === "historico" && (
              <ol className="flex flex-col gap-gp-md">
                {ETAPAS.map((e, i) => {
                  const { feitos, total } = progressoDaEtapa(imp, e.id);
                  const atual = i === indiceDaEtapa(imp.etapa);
                  return (
                    <li
                      key={e.id}
                      className={`flex items-center justify-between gap-gp-lg rounded-radius-lg border px-pad-2xl py-pad-xl ${
                        atual
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
            )}

            {aba === "dados" && (
              <div className="grid grid-cols-1 gap-gp-2xl sm:grid-cols-2">
                <Dado label="Cliente" valor={imp.cliente} />
                <Dado label="Identificador" valor={<span className="tabular-nums">{imp.id}</span>} />
                <Dado label="Local" valor={imp.local} />
                <Dado label="Cidade" valor={`${imp.cidade} · ${imp.uf}`} />
                <Dado
                  label="Pontos"
                  valor={
                    <span className="tabular-nums">
                      {imp.pontos} × {potencia(imp.potenciaKw)}
                    </span>
                  }
                />
                <Dado
                  label="Investimento"
                  valor={
                    <span className="flex items-center gap-gp-sm tabular-nums">
                      <CircleDollarSign className="size-icon-xs text-fg-subtle" aria-hidden />
                      {moeda(imp.investimento)}
                    </span>
                  }
                />
                <Dado label="Aberta em" valor={<span className="tabular-nums">{dataCurta(imp.abertaEm)}</span>} />
                <Dado
                  label="Previsão"
                  valor={
                    <span className="flex items-center gap-gp-sm tabular-nums">
                      <CalendarDays className="size-icon-xs text-fg-subtle" aria-hidden />
                      {dataCurta(imp.previsaoDeInstalacao)}
                    </span>
                  }
                />
                {imp.observacao && (
                  <div className="sm:col-span-2">
                    <Dado label="Observação" valor={imp.observacao} />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </FloatingPanel>
  );
}
