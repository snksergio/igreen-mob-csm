import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * As duas peças do padrão `edit-page` do Design System (`?app=edit-page`), transcritas.
 *
 * ## Por que transcrever e não importar
 *
 * `SectionCard` e `StepNav` vivem em `src/preview/pages/**` do repo do DS — são
 * **composição do showcase**, não API pública: não estão no barrel, não estão no
 * `registry.json`, e portanto não chegam por npm. A própria doc do `Card` registra isso:
 * *"era composição local do showcase"*.
 *
 * Transcrever é o caminho previsto — o que o padrão entrega é o **desenho** (card com
 * header em faixa + nav lateral pegajosa), e o desenho é feito de classes de token, que
 * viajam. As classes abaixo são as do showcase, sem invenção.
 *
 * ⚠️ Uma divergência deliberada: aqui o `StepNav` usa `<a href>` semântico? **Não** — o
 * showcase usa `<button>` e está certo, porque o destino é uma seção da mesma página e o
 * gesto é rolar, não navegar. Mantido igual.
 */

/**
 * Card de seção — `bg-surface` + borda sutil, header em faixa `bg-subtle` com divisória.
 */
export function CartaoDeSecao({
  titulo,
  icone,
  acao,
  children,
  className,
}: {
  titulo?: ReactNode;
  icone?: ReactNode;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const temCabecalho = !!(titulo || acao);

  return (
    <section
      className={`overflow-hidden rounded-radius-lg border border-border-subtle bg-bg-surface shadow-sh-sm ${
        className ?? ""
      }`}
    >
      {temCabecalho && (
        <header className="flex items-center justify-between gap-gp-md border-b border-border-subtle bg-bg-subtle p-pad-2xl">
          <div className="flex items-center gap-gp-md">
            {icone && (
              <span className="grid size-8 shrink-0 place-items-center rounded-radius-md bg-bg-muted text-fg-muted">
                {icone}
              </span>
            )}
            {titulo && (
              <h2 className="text-title-md font-semibold text-fg-default">
                {titulo}
              </h2>
            )}
          </div>
          {acao}
        </header>
      )}
      <div className="p-pad-2xl">{children}</div>
    </section>
  );
}

export type Etapa = {
  id: string;
  icone: LucideIcon;
  titulo: string;
  descricao: string;
};

/** Nav lateral pegajosa: ícone + título + descrição, o ativo com destaque de marca. */
export function NavDeEtapas({
  etapas,
  ativa,
  onSelecionar,
  className,
}: {
  etapas: Etapa[];
  ativa: string;
  onSelecionar: (id: string) => void;
  className?: string;
}) {
  return (
    <nav
      className={`flex flex-col gap-gp-xs rounded-radius-lg border border-border-subtle bg-bg-surface p-pad-md shadow-sh-sm ${
        className ?? ""
      }`}
      aria-label="Seções da conta"
    >
      {etapas.map((e) => {
        const Icone = e.icone;
        const ativo = e.id === ativa;
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelecionar(e.id)}
            aria-current={ativo ? "step" : undefined}
            className={`flex items-start gap-gp-md rounded-radius-md border p-pad-lg text-left transition-colors ${
              ativo
                ? "border-border-brand bg-bg-brand-subtle"
                : "border-transparent hover:bg-bg-muted"
            }`}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-radius-md border ${
                ativo
                  ? "border-transparent bg-bg-brand text-fg-on-brand"
                  : /* bg-surface + borda: sem ela o ícone funde com o cinza do hover. */
                    "border-border-subtle bg-bg-surface text-fg-muted"
              }`}
            >
              <Icone className="size-icon-sm" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-body-sm font-semibold ${
                  ativo ? "text-fg-brand" : "text-fg-default"
                }`}
              >
                {e.titulo}
              </span>
              <span className="mt-gp-2xs block text-caption-sm leading-snug text-fg-muted">
                {e.descricao}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
