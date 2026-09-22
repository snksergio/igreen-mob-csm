import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@snksergio/design-system/shadcn";
import type { FormatoMetrica } from "./performance-mock";

/**
 * Vocabulário visual da tela de Performance — formatação de número, ajuda e variação.
 */

const NUM = (min: number, max: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });

/**
 * Formata pelo tipo da métrica.
 *
 * Existe porque o gráfico e o tooltip mostram o valor CRU da série derivada, enquanto as
 * listas mostram a string já formatada que veio medida da referência. Sem um formatador
 * único, o mesmo número apareceria com casas diferentes no eixo e na lista.
 */
export function formatar(valor: number, formato: FormatoMetrica): string {
  switch (formato) {
    case "moeda":
      return `R$ ${NUM(2, 2).format(valor)}`;
    case "porcentagem":
      return `${NUM(2, 2).format(valor)}%`;
    case "decimal":
      return NUM(0, 1).format(valor);
    default:
      return NUM(0, 0).format(valor);
  }
}

/** Versão curta pro eixo Y, onde não cabe `R$ 1.234,56`. */
export function formatarCurto(valor: number, formato: FormatoMetrica): string {
  if (formato === "porcentagem") return `${NUM(0, 0).format(valor)}%`;
  if (valor >= 1000) return `${NUM(0, 1).format(valor / 1000)}k`;
  return NUM(0, 0).format(valor);
}

/**
 * Nome de métrica (ou de coluna) com o texto de ajuda da referência atrás de um ícone.
 *
 * A referência põe ajuda em 5 das 7 métricas e no cabeçalho `Variação`. Não é enfeite: é
 * onde mora a definição de cada número — "% do tempo em que os carregadores estiveram
 * ocupados (24hrs)" é a diferença entre ler a taxa certa e a errada.
 *
 * `delayDuration={0}`: ajuda escondida atrás de meio segundo de espera é ajuda que
 * ninguém descobre.
 */
export function ComAjuda({
  children,
  ajuda,
}: {
  children: ReactNode;
  ajuda?: string;
}) {
  if (!ajuda) return <>{children}</>;

  return (
    <span className="inline-flex min-w-0 items-center gap-gp-xs">
      {children}
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* `<button type="button">`, não o ícone cru: o gatilho precisa ser focável
                pra a ajuda existir pra quem navega por teclado. `stopPropagation` porque
                ele vive DENTRO de uma linha clicável — pedir ajuda não deve trocar a
                métrica selecionada. */}
            <button
              type="button"
              aria-label="Ajuda"
              onClick={(e) => e.stopPropagation()}
              /* `-m-pad-md p-pad-md`: o ícone tem 12px e no celular vira alvo
                 impossível. O padding cresce a área sensível e a margem negativa devolve
                 o espaço — a linha da métrica não se mexe. */
              className="-m-pad-md inline-flex shrink-0 cursor-help items-center p-pad-md text-fg-subtle transition-colors hover:text-fg-default focus-visible:text-fg-default focus-visible:outline-none"
            >
              <HelpCircle className="size-icon-xs" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-tooltip-lg">{ajuda}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}

/**
 * Variação percentual da lista — **neutra, sem cor.**
 *
 * ⚠️ Fidelidade medida, não esquecimento: na referência a variação é `rgb(63,65,65)` com
 * peso 600, o mesmo tom dos outros números. `KpiDelta` pintaria verde/vermelho, e aqui
 * isso mentiria — **Tx. de Ocupação caindo pode ser capacidade nova entrando em
 * operação**, não piora. Quem sabe se é bom é o operador.
 */
export function Variacao({ valor }: { valor: string }) {
  return (
    <span className="text-caption-md font-semibold tabular-nums text-fg-muted">
      {valor}
    </span>
  );
}

/**
 * Variação do CABEÇALHO do card — aqui sim com seta e cor.
 *
 * Diverge da linha de lista de propósito, e o critério é o papel: na lista a variação é
 * uma coluna entre sete valores comparáveis, e colorir sete linhas transforma a lista num
 * semáforo. No cabeçalho ela é o resumo da métrica em foco, uma por vez, e é o padrão do
 * VP (`#/energia/resumo`) que o operador pediu como referência de card.
 */
export function VariacaoDestaque({ valor }: { valor: string }) {
  const positivo = valor.trim().startsWith("+");
  const Seta = positivo ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-gp-2xs text-body-sm font-semibold tabular-nums ${
        positivo ? "text-fg-success" : "text-fg-danger"
      }`}
    >
      <Seta className="size-icon-xs shrink-0" />
      {valor}
      <span className="font-normal text-fg-muted">
        vs. período anterior
      </span>
    </span>
  );
}

/** Unidade ao lado do nome da métrica — `(R$)`, `(kWh)`. Secundária, nunca do tamanho do nome. */
export function Unidade({ children }: { children: ReactNode }) {
  return <span className="text-caption-md text-fg-subtle">{children}</span>;
}
