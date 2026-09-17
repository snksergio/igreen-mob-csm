import type { ReactNode } from "react";
import { Switch } from "@snksergio/design-system/shadcn";

/**
 * Card com cabeçalho de seção — título (e switch opcional) numa faixa própria, conteúdo
 * abaixo.
 *
 * ## Por que é compartilhado
 *
 * Nasceu na aba Taxas do painel de Preços e a tela de Carregadores pediu o mesmo desenho
 * para o `Carregador ativado`. Duas cópias do mesmo card divergem na primeira alteração de
 * padding — e este tem três decisões que não são óbvias e que se perderiam numa delas:
 *
 * 1. **O padding é de cada bloco, não do card.** É o que faz a divisória ir de ponta a
 *    ponta; com `px` no `<section>`, o fio para antes das bordas.
 * 2. **O cabeçalho tem fundo um passo mais claro** (`bg-bg-muted` sobre o `bg-bg-surface` do
 *    card). Só o fio deixava o título parecendo a primeira linha do conteúdo.
 * 3. **Sem `children`, o card fica só com o cabeçalho.** É o estado de seção desligada — o
 *    switch é a pergunta, e os campos só existem depois do sim.
 */
export function CardSeccionado({
  titulo,
  switchLigado,
  onSwitch,
  children,
  rodape,
}: {
  titulo: string;
  /** Quando definido, o cabeçalho ganha o switch que liga/desliga a seção. */
  switchLigado?: boolean;
  onSwitch?: (v: boolean) => void;
  children?: ReactNode;
  /** Bloco fixo no fim do corpo — a nota de sincronização, em Preços. */
  rodape?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-radius-xl border border-border-default bg-bg-surface">
      <header className="flex items-center justify-between gap-gp-md border-b border-border-default bg-bg-muted px-pad-2xl py-pad-xl">
        <span className="text-body-md font-semibold text-fg-default">
          {titulo}
        </span>
        {switchLigado !== undefined && (
          <Switch
            checked={switchLigado}
            onCheckedChange={onSwitch}
            aria-label={titulo}
          />
        )}
      </header>
      {children && (
        <div className="flex flex-col gap-gp-2xl p-pad-2xl">
          {children}
          {rodape}
        </div>
      )}
    </section>
  );
}
