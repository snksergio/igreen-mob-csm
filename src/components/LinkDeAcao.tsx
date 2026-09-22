import type { ReactNode } from "react";

/**
 * Ação em forma de link — texto verde sublinhado, sem container.
 *
 * ## Quando é link e quando é botão
 *
 * Botão é para a ação que a pessoa veio fazer; link é para o atalho que ajuda no caminho.
 * `Marcar todos`, `Desmarcar` e `Gerar Código` são atalhos: ninguém abre o formulário para
 * clicar neles, e um botão com container competiria com o `Salvar` do rodapé.
 *
 * ⚠️ É `<button>`, não `<a>`. Não navega para lugar nenhum — o sublinhado é a aparência, e
 * um `<a>` sem `href` não recebe foco por teclado nem responde a Enter.
 *
 * Mesmas classes do link `Perfil padrão` da lista de Carregadores; quando uma quarta
 * ocorrência aparecer, aquele deve migrar pra cá também.
 */
export function LinkDeAcao({
  children,
  onClick,
  disabled,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      /* `-my-pad-md py-pad-md`: texto de 16px de altura é alvo de toque ruim no
         celular (medido: 18px). O padding vertical leva a área sensível a ~40px e a
         margem negativa devolve o espaço, então nenhuma linha se desloca. */
      className="-my-pad-md rounded-radius-sm py-pad-md text-body-sm font-medium text-fg-brand underline underline-offset-2 transition-colors hover:text-fg-brand-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand disabled:cursor-not-allowed disabled:text-fg-subtle disabled:no-underline"
    >
      {children}
    </button>
  );
}
