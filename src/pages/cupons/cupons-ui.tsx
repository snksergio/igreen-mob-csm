import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Chip } from "@snksergio/design-system";
import { LinkDeAcao } from "~/components/LinkDeAcao";
import { Checkbox } from "@snksergio/design-system/shadcn";
import {
  ROTULO_STATUS,
  ROTULO_TIPO,
  type StatusDeCupom,
  type TipoDeCupom,
} from "./cupons-mock";

/** Vocabulário visual de Cupons. */

/**
 * Status na lista.
 *
 * `ativo` verde, `agendado` info, `inativo` neutro — a diferença que importa é entre "está
 * valendo agora" e "ainda não" / "já foi", e o cinza do inativo é o que o tira do caminho
 * sem escondê-lo.
 */
export function StatusChip({ status }: { status: StatusDeCupom }) {
  const cor =
    status === "ativo" ? "success" : status === "agendado" ? "info" : "neutral";
  return (
    <Chip color={cor} variant="soft" size="sm" shape="pill">
      {ROTULO_STATUS[status]}
    </Chip>
  );
}

/** Tipo na lista — etiqueta neutra: é categoria, não estado. */
export function TipoChip({ tipo }: { tipo: TipoDeCupom }) {
  return (
    <Chip color="neutral" variant="soft" size="sm">
      {ROTULO_TIPO[tipo]}
    </Chip>
  );
}

/**
 * Seletor de locais — busca, marcar/desmarcar todos, e lista rolável.
 *
 * ## Por que não é a grade da referência
 *
 * Lá os 34 locais aparecem todos de uma vez, numa grade de cinco colunas que ocupa mais de
 * uma tela. Ninguém lê 34 nomes: ou se procura um, ou se marca tudo. A lista com busca faz
 * exatamente essas duas coisas e cabe em 280px de altura.
 *
 * ## O contador no cabeçalho não é enfeite
 *
 * Com a lista rolando, os marcados podem estar todos fora da área visível — sem o contador,
 * a única forma de saber quantos são é rolar de novo.
 *
 * ⚠️ **`Todos` respeita a BUSCA.** Com um filtro ativo, marcar todos marca os filtrados, não
 * os 28 — marcar o que não se está vendo é o tipo de coisa que só se descobre depois de
 * salvar. O rótulo muda junto (`Marcar os N`), porque um botão que diz "todos" e marca seis
 * é pior que nenhum botão.
 */
export function SeletorDeLocais({
  disponiveis,
  selecionados,
  onChange,
  erro,
}: {
  disponiveis: string[];
  selecionados: string[];
  onChange: (l: string[]) => void;
  erro?: string;
}) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(
    () =>
      disponiveis.filter((l) =>
        l.toLowerCase().includes(busca.trim().toLowerCase()),
      ),
    [disponiveis, busca],
  );

  const marcados = new Set(selecionados);
  const todosFiltradosMarcados =
    filtrados.length > 0 && filtrados.every((l) => marcados.has(l));

  const alternar = (local: string) =>
    onChange(
      marcados.has(local)
        ? selecionados.filter((l) => l !== local)
        : [...selecionados, local],
    );

  const alternarTodos = () => {
    if (todosFiltradosMarcados) {
      onChange(selecionados.filter((l) => !filtrados.includes(l)));
    } else {
      onChange([...new Set([...selecionados, ...filtrados])]);
    }
  };

  return (
    <div className="flex flex-col gap-gp-md">
      <div className="flex flex-wrap items-center justify-between gap-gp-md">
        <span className="flex items-center gap-gp-sm text-body-sm font-semibold text-fg-default">
          Locais
          <Chip
            color={selecionados.length === 0 ? "neutral" : "primary"}
            variant="soft"
            size="sm"
          >
            {selecionados.length} de {disponiveis.length}
          </Chip>
        </span>
        {/* Link, não botão: é um atalho da lista, não a ação que a pessoa veio fazer.
            Com container ele competiria com o `Salvar` do rodapé do painel. */}
        <LinkDeAcao onClick={alternarTodos} disabled={filtrados.length === 0}>
          {todosFiltradosMarcados
            ? "Desmarcar"
            : busca
              ? `Marcar os ${filtrados.length}`
              : "Marcar todos"}
        </LinkDeAcao>
      </div>

      <div className="flex min-h-form-lg items-center gap-gp-sm rounded-radius-lg border border-border-input bg-bg-surface px-pad-lg transition-[border-color,box-shadow] focus-within:border-border-brand focus-within:shadow-sh-ring">
        <Search className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar locais"
          aria-label="Buscar locais"
          className="min-w-0 flex-1 bg-transparent text-body-sm text-fg-default outline-none placeholder:text-fg-subtle"
        />
      </div>

      {/* ⚠️ Altura MÁXIMA, não fixa: com dois resultados de busca, uma caixa de 280px ficaria
          com 240px de vazio. `max-h` deixa a lista encolher e o scroll só aparece quando é
          preciso. */}
      <div
        className={`max-h-[260px] overflow-y-auto rounded-radius-lg border bg-bg-surface p-pad-md scrollbar-thin ${
          erro ? "border-border-danger-muted" : "border-border-default"
        }`}
      >
        {filtrados.length === 0 ? (
          <p className="py-pad-2xl text-center text-body-sm text-fg-muted">
            Nenhum local encontrado.
          </p>
        ) : (
          <ul className="flex flex-col">
            {filtrados.map((local) => {
              const id = `local-${local.replace(/\W+/g, "-")}`;
              return (
                <li key={local}>
                  {/* `<label htmlFor>` de verdade: a linha inteira é alvo de clique, que é o
                      gesto que se tenta numa lista dessas. */}
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-gp-md rounded-radius-sm px-pad-lg py-pad-md text-body-sm text-fg-default transition-colors hover:bg-bg-muted"
                  >
                    <Checkbox
                      id={id}
                      checked={marcados.has(local)}
                      onCheckedChange={() => alternar(local)}
                    />
                    <span className="min-w-0 flex-1 truncate">{local}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {erro && <span className="text-caption-md text-fg-danger">{erro}</span>}
    </div>
  );
}
