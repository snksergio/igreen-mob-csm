import type { ReactNode } from "react";

/**
 * Bloco de um formulário longo: heading, divisória e os campos.
 *
 * ## É o que substitui as abas
 *
 * Os dois formulários desta tela são longos — o de local tem mais de trinta campos. A
 * saída óbvia seria aba, e ela é a errada aqui: quem preenche não sabe o que falta até
 * abrir cada uma, e o Salvar valida campos que estão fora da tela. O heading + divisória
 * dá o mesmo agrupamento sem esconder nada, e a barra de rolagem passa a informar quanto
 * falta.
 *
 * ## As três decisões que ele carrega
 *
 * 1. **`gap-form-gap` (20px) entre os campos**, nunca `gap-gp-*`. É o token dedicado a
 *    formulário (L-024); os semânticos ficam pra card e seção.
 * 2. **Divisória embaixo, de ponta a ponta.** Por isso o padding é do bloco e a borda é do
 *    `<section>`: com `px` no mesmo elemento da borda, o fio pararia antes das margens.
 * 3. **`ultima` remove a última divisória.** Um fio no fim do formulário separa o conteúdo
 *    do rodapé sticky, que já tem borda própria — duas linhas paralelas a 1px.
 */
export function SecaoDeFormulario({
  titulo,
  descricao,
  ultima = false,
  children,
}: {
  titulo: string;
  descricao?: string;
  ultima?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-form-gap px-pad-xl py-pad-3xl ${
        ultima ? "" : "border-b border-border-default"
      }`}
    >
      <div className="flex flex-col gap-gp-2xs">
        <h3 className="text-title-sm font-semibold text-fg-default">{titulo}</h3>
        {descricao && (
          <p className="text-caption-md text-fg-muted">{descricao}</p>
        )}
      </div>
      {children}
    </section>
  );
}
