import { useState, type CSSProperties } from "react";
import { ChevronDown, MapPin, X } from "lucide-react";
import { Button } from "@snksergio/design-system";
import { Checkbox } from "@snksergio/design-system/shadcn";
import {
  COR_DO_STATUS,
  FAIXAS_DE_POTENCIA,
  ROTULO_STATUS,
  STATUS_NA_ORDEM,
  type FaixaDePotencia,
  type StatusPlugue,
} from "./monitoramento-mock";

/**
 * Painel de filtros à direita do mapa — a composição do `Scheduler` do DS, feita na mão.
 *
 * ## Por que na mão, e não o componente
 *
 * Decisão do operador (2026-09-16): o `Scheduler` traz toolbar, mini-calendário e modelo de
 * evento, e nada disso serve aqui. O que se quer dele é a **composição** — coluna de filtro
 * à direita, do lado do conteúdo, com botão que a mostra e esconde. Isso são ~120 linhas
 * locais; importar o componente pra usar 10% dele traria as outras 90.
 *
 * As classes abaixo são as do `scheduler.styles.ts`, transcritas. Onde há um px na unha
 * (`-mx-pad-sm px-pad-sm`), o motivo é o mesmo que o DS documenta: o fundo do hover sangra
 * 6px pra fora, mas o TEXTO fica alinhado com o padding da seção — sem isso o rótulo do
 * grupo fica 6px mais dentro que o título "Filtros".
 *
 * ## Coluna, não overlay — e é essa a razão de existir
 *
 * O `Scheduler` explica: filtro é o controle cujo resultado se quer ver **enquanto** se
 * mexe. Num popover, marcar uma caixa e conferir o efeito são dois gestos (marcar → fechar →
 * olhar → reabrir). Como coluna, é um. Por isso ele EMPURRA o mapa em vez de cobri-lo.
 *
 * ## A caixa colorida É a legenda
 *
 * É a sacada do componente, e é o que permite fundir os dois blocos que antes eram
 * separados: a cor da caixa de cada estado é a MESMA cor do pin no mapa. Uma legenda
 * apartada repetiria as sete cores e os sete nomes num segundo lugar, que é onde legendas
 * começam a discordar do que explicam.
 *
 * ## Aqui "marcado" = visível, ao contrário do resto do sistema
 *
 * ⚠️ O `filterModel` do DS trata lista vazia como **sem restrição**. Esta tela inverte:
 * ela é um painel de CAMADAS de mapa, tudo nasce marcado e desmarcar esconde. Ver o JSDoc
 * de `TUDO_MARCADO` na página pro porquê.
 *
 * Consequência direta aqui: o grupo diz "Todas" quando está **cheio**, não quando está
 * vazio, e o link de reset MARCA tudo em vez de limpar.
 */

/* ── Classes transcritas do `scheduler.styles.ts` ──────────────────────── */

const SECAO =
  "flex shrink-0 flex-col gap-gp-md border-b border-border-default p-sp-xl last:border-b-0";

/* `sticky` não cria fundo: sem `bg-bg-surface` o conteúdo passa por baixo do título. E o
   `z-[1]` porque o `Checkbox` do Radix cria contexto de empilhamento próprio — sem ele o
   que rola sobrepõe o cabeçalho. Os dois são obrigatórios, não decoração. */
const SECAO_CABECALHO = `${SECAO} sticky top-0 z-[1] bg-bg-surface py-pad-lg`;

const GRUPO_CABECALHO =
  "flex w-full cursor-pointer items-center justify-between gap-gp-md min-h-form-sm rounded-radius-sm border-0 bg-transparent -mx-pad-sm px-pad-sm outline-none text-body-sm font-semibold text-fg-default transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand [&_svg]:size-icon-sm [&_svg]:shrink-0 [&_svg]:text-fg-subtle";

/* `<label>` nativo embrulhando o `Checkbox`, não `<button>`: o label propaga o clique,
   mantém a semântica de checkbox no leitor de tela e faz a linha inteira virar alvo — é a
   L-025 do DS. */
const OPCAO =
  "flex cursor-pointer items-center gap-gp-md min-h-form-sm rounded-radius-sm -mx-pad-sm px-pad-sm text-body-sm text-fg-default transition-colors duration-150 hover:bg-bg-muted has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-ring-brand";

const CONTAGEM = "shrink-0 text-caption-sm tabular-nums text-fg-subtle";

export interface EstadoDosFiltros {
  status: StatusPlugue[];
  potencia: FaixaDePotencia[];
}

function Grupo({
  titulo,
  marcados,
  total,
  children,
}: {
  titulo: string;
  marcados: number;
  total: number;
  children: React.ReactNode;
}) {
  /* Abertos por default: colapsar tudo economizaria altura e esconderia justamente o que o
     painel existe pra mostrar. Quem tem muitos campos fecha os que não usa. */
  const [aberto, setAberto] = useState(true);

  return (
    <div className={`${SECAO} gap-gp-sm`}>
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className={GRUPO_CABECALHO}
      >
        <span className="flex min-w-0 items-baseline gap-gp-sm">
          <span className="truncate">{titulo}</span>
          {/* "Todas" quando está CHEIO — o oposto do `Scheduler`, porque aqui o repouso
              é tudo marcado. Sem isto o grupo diria "7" no estado sem recorte, e o número
              pareceria filtro aplicado. */}
          <span className={CONTAGEM}>
            {marcados === total ? "Todas" : `${marcados}/${total}`}
          </span>
        </span>
        <ChevronDown
          className={`transition-transform duration-150 ${aberto ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
      {aberto && <div className="flex flex-col">{children}</div>}
    </div>
  );
}

export function PainelDeFiltros({
  filtros,
  tudoMarcado,
  onAlternarStatus,
  onAlternarPotencia,
  onLimpar,
  onFechar,
  contagemDeStatus,
  contagemDePotencia,
}: {
  filtros: EstadoDosFiltros;
  /** O conjunto completo — é contra ele que "Todas" e o link de reset se medem. */
  tudoMarcado: EstadoDosFiltros;
  onAlternarStatus: (s: StatusPlugue) => void;
  onAlternarPotencia: (f: FaixaDePotencia) => void;
  onLimpar: () => void;
  onFechar: () => void;
  /** ⚠️ Contagem de cada opção ANTES do filtro do PRÓPRIO grupo — ver o JSDoc da página. */
  contagemDeStatus: Record<StatusPlugue, number>;
  contagemDePotencia: Record<FaixaDePotencia, number>;
}) {
  /* O que restringe a tela é o que está DE FORA — ver `desmarcados` na página. */
  const desmarcados =
    tudoMarcado.status.length -
    filtros.status.length +
    (tudoMarcado.potencia.length - filtros.potencia.length);

  return (
    <aside
      aria-label="Filtros do monitoramento"
      /* `w-[280px] shrink-0` — largura fixa e não fração: as linhas de opção têm rótulo,
         caixa e contagem, e uma fração de viewport as quebraria em telas médias.
         `h-full` + `overflow-y-auto` é o que cumpre "mesma altura do mapa, com scroll". */
      className="flex h-full w-[280px] shrink-0 flex-col overflow-y-auto rounded-radius-xl border border-border-default bg-bg-surface scrollbar-thin"
    >
      <div className={SECAO_CABECALHO}>
        <div className="flex items-center justify-between gap-gp-md">
          <span className="text-body-sm font-semibold text-fg-default">
            Filtros
          </span>
          <div className="flex shrink-0 items-center gap-gp-sm">
            {/* "Marcar todas", não "Limpar": com o repouso cheio, um link chamado
                Limpar que ENCHE tudo diria o contrário do que faz. */}
            {desmarcados > 0 && (
              <button
                type="button"
                onClick={onLimpar}
                className="ml-pad-sm cursor-pointer border-0 bg-transparent p-0 text-body-xs font-medium text-fg-brand underline-offset-2 outline-none transition-opacity duration-150 hover:underline focus-visible:underline"
              >
                Marcar todas
              </button>
            )}
            <Button
              variant="ghost"
              color="secondary"
              size="icon-2xs"
              aria-label="Fechar painel de filtros"
              onClick={onFechar}
            >
              <X />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Estado ───────────────────────────────────────────────────────
          A caixa colorida faz o trabalho da legenda: a cor dela é a cor do pin. */}
      <Grupo
        titulo="Estado"
        marcados={filtros.status.length}
        total={tudoMarcado.status.length}
      >
        {STATUS_NA_ORDEM.map((s) => {
          const id = `filtro-estado-${s}`;
          return (
            <label key={s} htmlFor={id} className={OPCAO}>
              <Checkbox
                id={id}
                checked={filtros.status.includes(s)}
                onCheckedChange={() => onAlternarStatus(s)}
                /* A cor vem de CSS var porque ela é DADO (`chart-*`, `fg-danger`,
                   `fg-subtle`) e não cabe nas seis variantes semânticas do
                   `schedulerOptionBox`. Mesma exceção que o `ChoroplethMap` documenta pra
                   cor vinda de dado. O tique é `bg-canvas` — escuro sobre as cores de
                   chart, que no dark são claras. */
                style={{ "--cor-do-status": COR_DO_STATUS[s] } as CSSProperties}
                className="shrink-0 data-[state=checked]:border-[var(--cor-do-status)] data-[state=checked]:bg-[var(--cor-do-status)] [&_svg]:text-bg-canvas"
              />
              <span className="min-w-0 flex-1 truncate">{ROTULO_STATUS[s]}</span>
              <span className={CONTAGEM}>{contagemDeStatus[s]}</span>
            </label>
          );
        })}
      </Grupo>

      {/* ── Potência ─────────────────────────────────────────────────────
          Na referência as faixas são só legenda — explicam o tamanho do pin e não fazem
          nada. Aqui viram filtro: a informação já estava na tela, e uma linha que parece
          clicável e não é custa mais que uma que funciona. */}
      <Grupo
        titulo="Potência"
        marcados={filtros.potencia.length}
        total={tudoMarcado.potencia.length}
      >
        {FAIXAS_DE_POTENCIA.map((f) => {
          const id = `filtro-potencia-${f.id}`;
          return (
            <label key={f.id} htmlFor={id} className={OPCAO}>
              <Checkbox
                id={id}
                checked={filtros.potencia.includes(f.id)}
                onCheckedChange={() => onAlternarPotencia(f.id)}
                className="shrink-0"
              />
              {/* Pins do MESMO tamanho, cor diferente — ver o JSDoc de
                  `FAIXAS_DE_POTENCIA`. Com tamanhos diferentes o rótulo dançava e a
                  diferença de 6px entre faixas vizinhas não se percebia. */}
              <MapPin
                className="size-icon-md shrink-0"
                style={{ color: f.cor }}
                strokeWidth={1.8}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate">{f.rotulo}</span>
              <span className={CONTAGEM}>{contagemDePotencia[f.id]}</span>
            </label>
          );
        })}
      </Grupo>
    </aside>
  );
}
