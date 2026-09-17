import { Construction } from "lucide-react";
import { PAGE_LABELS, type PageId } from "~/nav/nav-data";

export function PlaceholderPage({ page }: { page: PageId }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-gp-md py-sp-2xl">
      <span className="flex size-form-xl items-center justify-center rounded-radius-full bg-bg-subtle text-fg-muted">
        <Construction className="size-icon-md" />
      </span>
      <h2 className="text-title-md text-fg-default">{PAGE_LABELS[page]}</h2>
      <p className="max-w-sm text-center text-body-sm text-fg-muted">
        Tela mapeada no inventário e ainda não construída. Esta rodada entrega Transações
        como molde.
      </p>
    </div>
  );
}
