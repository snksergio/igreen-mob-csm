import { Chip } from "@snksergio/design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@snksergio/design-system/shadcn";

/**
 * Célula de MUITOS valores — o problema central desta tela.
 *
 * ## Por que não é só uma contagem
 *
 * Três das cinco colunas da referência são multi-valor: tipos de alerta, locais cobertos e
 * e-mails notificados. Um grupo tem de 1 a 9 tipos, de 1 a 17 locais e de 1 a N e-mails, e
 * a lista da origem estava vazia — então não há desenho pra copiar.
 *
 * Duas saídas óbvias, e o que cada uma perde:
 *
 * | | perde |
 * |---|---|
 * | só a contagem ("4 tipos") | quem lê precisa abrir o painel pra saber SE o dele está lá — que é a pergunta |
 * | todos os valores | a linha cresce sem teto e a tabela vira um muro |
 *
 * O meio é mostrar **os primeiros e contar o resto**: quem procura um valor específico
 * costuma achar nos primeiros, e o `+N` diz que há mais sem prometer quanto espaço. O
 * `title` no `+N` entrega a lista inteira sem custar altura.
 */
export function ChipsComResto({
  itens,
  limite = 2,
  cor = "neutral",
  vazio = "—",
}: {
  itens: string[];
  /** Quantos aparecem antes do `+N`. */
  limite?: number;
  cor?: "neutral" | "primary" | "danger" | "success";
  vazio?: string;
}) {
  if (itens.length === 0) {
    return <span className="text-fg-subtle">{vazio}</span>;
  }

  const visiveis = itens.slice(0, limite);
  const resto = itens.slice(limite);

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-gp-xs">
      {visiveis.map((i) => (
        <Chip key={i} color={cor} variant="soft" size="sm" title={i}>
          <span className="max-w-[140px] truncate">{i}</span>
        </Chip>
      ))}
      {resto.length > 0 && (
        /* O `+N` é `Tooltip`, não `title` cru: numa célula com vários chips o `title`
           nativo demora ~1s e some sozinho, e aqui ele é a única forma de ver o resto sem
           abrir o painel. */
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-default text-caption-md font-semibold tabular-nums text-fg-muted">
              +{resto.length}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px]">
            {resto.join(" · ")}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
