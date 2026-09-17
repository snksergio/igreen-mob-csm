import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Chip } from "@snksergio/design-system";
import { Input } from "@snksergio/design-system/shadcn";

/**
 * Botão de sugestão de tag.
 *
 * ## ⚠️ A cor de marca é da tag APLICADA, não da sugestão
 *
 * Por duas rodadas foi o contrário — sugestão verde, tag aplicada cinza — e o operador
 * apontou (2026-09-16). Ele está certo, e a regra é geral: o destaque pertence ao que **é**,
 * não ao que **poderia ser**. Sugestão em verde com escolha em cinza fazia a lista de
 * atalhos gritar mais alto que a resposta do usuário.
 *
 * Agora: aplicada = `Chip primary soft`; sugestão = pontilhado neutro que só ganha cor no
 * hover. O tracejado é o que diz "isto ainda não existe" sem gastar cor, e o `+` continua
 * distinguindo as duas formas.
 *
 * ⚠️ Mudar isto mexe em TRÊS telas — Preços, Motoristas e Estrutura da rede. É o preço de
 * ser compartilhado, e é o certo: a semântica estava invertida nas três.
 */
function SugestaoDeTag({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-form-sm items-center gap-gp-xs rounded-radius-full border border-dashed border-border-default bg-transparent px-pad-xl text-body-xs font-medium text-fg-muted transition-colors hover:border-border-brand hover:bg-bg-muted hover:text-fg-default focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
    >
      <Plus className="size-icon-xs shrink-0" aria-hidden />
      {children}
    </button>
  );
}

/**
 * Campo de tags — digita e pressiona Enter; cada tag vira um `Chip` removível.
 *
 * ## Por que é compartilhado
 *
 * Nasceu no modal `Criar perfil de preço` e Motoristas pediu o mesmo em dois lugares (o
 * popover do badge e o formulário de edição do painel). Três cópias do mesmo campo divergem
 * na primeira alteração — e este tem duas decisões de teclado que se perderiam nelas.
 *
 * ⚠️ **O DS não tem tag-input.** É a ausência que mais reaparece neste projeto, agora em
 * QUATRO telas. Candidata forte a cascata.
 *
 * ## As duas teclas que importam
 *
 * - **Enter confirma a tag e NÃO submete o formulário.** Sem o `preventDefault`, o Enter
 *   dispara o `Salvar` do modal e a tag vira o gesto de fechar tudo.
 * - **Backspace com o campo vazio remove a última.** Sem isso, corrigir um erro de digitação
 *   obriga a mirar o `X` com o mouse — e quem está digitando tags está com as duas mãos no
 *   teclado.
 *
 * Duplicata é ignorada em silêncio: a mesma tag duas vezes não é erro que mereça mensagem, e
 * o campo esvaziando já mostra que ela "entrou".
 */
export function CampoDeTags({
  tags,
  onChange,
  placeholder = "Digite uma tag e pressione Enter",
  ariaLabel = "Tags",
  autoFocus,
  sugestoes,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
  /** Atalhos de um clique para as tags que já existem no sistema. */
  sugestoes?: string[];
}) {
  const [rascunho, setRascunho] = useState("");

  const adicionar = (t: string) => {
    const limpa = t.trim();
    if (limpa && !tags.includes(limpa)) onChange([...tags, limpa]);
    setRascunho("");
  };

  const naoUsadas = (sugestoes ?? []).filter((s) => !tags.includes(s));

  return (
    <div className="flex flex-col gap-gp-md">
      <Input
        value={rascunho}
        autoFocus={autoFocus}
        onChange={(e) => setRascunho(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            adicionar(rascunho);
          } else if (e.key === "Backspace" && !rascunho && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-gp-sm">
          {tags.map((t) => (
            <Chip key={t} color="primary" variant="soft" size="sm">
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="ml-gp-2xs rounded-radius-full text-fg-brand/70 transition-colors hover:text-fg-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
                aria-label={`Remover a tag ${t}`}
              >
                <X className="size-icon-2xs" aria-hidden />
              </button>
            </Chip>
          ))}
        </div>
      )}

      {/* Sugestões: digitar "Frota" de novo em cada motorista é trabalho que a máquina já
          sabe fazer — e tag digitada à mão vira `frota`, `Frota ` e `FROTA` na base. */}
      {naoUsadas.length > 0 && (
        <div className="flex flex-col gap-gp-sm">
          {/* Rótulo em linha própria: com ele na mesma linha dos chips, a palavra
              "Sugestões" virava o primeiro item da fileira e competia com eles. */}
          <span className="text-caption-md text-fg-muted">Sugestões</span>
          <div className="flex flex-wrap items-center gap-gp-sm">
            {naoUsadas.map((s) => (
              <SugestaoDeTag key={s} onClick={() => adicionar(s)}>
                {s}
              </SugestaoDeTag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
