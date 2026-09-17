import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Avatar, Button, Chip } from "@snksergio/design-system";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@snksergio/design-system/shadcn";
import { CampoDeTags } from "~/components/CampoDeTags";
import { TAGS_DISPONIVEIS } from "./motoristas-mock";

/** Vocabulário visual de Motoristas. */

/** Lista de tags de um motorista. `–` quando vazia, como a referência. */
export function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-fg-subtle">–</span>;
  return (
    <span className="flex flex-wrap items-center gap-gp-sm">
      {tags.map((t) => (
        <Chip key={t} color="neutral" variant="soft" size="sm">
          {t}
        </Chip>
      ))}
    </span>
  );
}

/**
 * Cores de avatar — uma paleta fixa, escolhida pela inicial do nome.
 *
 * Determinística de propósito: a mesma pessoa tem sempre a mesma cor, na lista e no painel.
 * Cor aleatória por render faria o avatar piscar de cor a cada paginação.
 *
 * ⚠️ Passa por `colorHex`, não por classe: o `Avatar` do DS calcula o contraste do texto a
 * partir do hex (L-027) — com `bg-*` na unha, a inicial poderia sair branca sobre amarelo.
 */
const CORES_DE_AVATAR = [
  "#2563EB",
  "#CC092F",
  "#7C3AED",
  "#0891B2",
  "#B45309",
  "#15803D",
  "#BE185D",
  "#4338CA",
];

export function corDoAvatar(nome: string): string {
  const soma = [...nome].reduce((a, c) => a + c.charCodeAt(0), 0);
  return CORES_DE_AVATAR[soma % CORES_DE_AVATAR.length];
}

/** `Bruno Sacramento Vilela` → `BS`. Nome de empresa usa as duas primeiras iniciais. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeira = partes[0]?.[0] ?? "";
  const segunda = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + segunda).toUpperCase();
}

/**
 * Célula de pessoa — avatar, nome e e-mail empilhado.
 *
 * Mesmo desenho da coluna `Licenciado` do app de Finanças do DS. Duas informações numa
 * célula não é aperto: nome e e-mail identificam a MESMA pessoa, e em colunas separadas o
 * olho precisa cruzar a linha pra juntar as duas.
 *
 * ⚠️ O e-mail sai da coluna própria quando esta célula existe — senão ele aparece duas
 * vezes na mesma linha.
 */
export function CelulaDeMotorista({
  nome,
  email,
}: {
  nome: string;
  email: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-gp-md">
      <Avatar
        size="sm"
        colorHex={corDoAvatar(nome)}
        aria-label={nome}
        className="shrink-0"
      >
        {iniciais(nome)}
      </Avatar>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body-sm font-medium text-fg-default">
          {nome}
        </span>
        <span className="truncate text-caption-sm text-fg-muted">{email}</span>
      </span>
    </span>
  );
}

/**
 * Tags editáveis no lugar — a linha inteira reage ao hover e abre um popover.
 *
 * ## O hover pinta a LINHA, não só o ícone
 *
 * O lápis sozinho era invisível até o mouse chegar exatamente nele. Com o fundo da linha
 * mudando, o mouse passando por perto já anuncia que ali há algo clicável — e é assim que
 * se descobre um affordance sem procurar por ele.
 *
 * ## Vazio é um convite, não um travessão
 *
 * Sem tags, a célula mostra `Adicionar` num chip tracejado do tamanho de um controle de
 * verdade. O `–` das outras linhas diz "não tem"; aqui precisa dizer "não tem, e você pode
 * pôr".
 *
 * ⚠️ O lápis é `opacity-0 group-hover:opacity-100` **mais** `focus-visible:opacity-100` —
 * some no repouso, mas volta ao receber foco por Tab. Controle que só existe no hover é
 * controle que não existe para quem não usa mouse. Para esses, o mesmo campo está aberto na
 * seção `Editar` do painel.
 */
export function TagsEditaveis({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-gp-sm">
        {tags.length === 0 ? (
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-form-sm items-center gap-gp-xs rounded-radius-full border border-dashed border-border-default px-pad-xl text-body-xs font-medium text-fg-muted transition-colors hover:border-border-brand hover:text-fg-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
            >
              <Plus className="size-icon-xs shrink-0" aria-hidden />
              Adicionar
            </button>
          </PopoverTrigger>
        ) : (
          <>
            <Tags tags={tags} />
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                color="secondary"
                size="icon-sm"
                aria-label="Editar tags"
                className="opacity-0 transition-opacity group-hover/linha:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              >
                <Pencil />
              </Button>
            </PopoverTrigger>
          </>
        )}
      </span>

      {/* `w-[360px]` e padding próprio: o default do `PopoverContent` é estreito e apertado,
          e aqui dentro moram um campo, os chips já aplicados e as sugestões. */}
      <PopoverContent align="start" className="w-[360px] p-pad-2xl">
        <div className="flex flex-col gap-gp-lg">
          <span className="text-body-sm font-semibold text-fg-default">
            Tags do motorista
          </span>
          {/* `autoFocus`: quem abriu o popover veio digitar — um clique a mais no campo
              desfaria o ganho de editar no lugar. */}
          <CampoDeTags
            tags={tags}
            onChange={onChange}
            autoFocus
            sugestoes={TAGS_DISPONIVEIS}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
