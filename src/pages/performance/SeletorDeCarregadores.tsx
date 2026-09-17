import { useState } from "react";
import { ChevronDown, PlugZap, Search } from "lucide-react";
import { Button, InputGroup, InputGroupAddon, InputGroupInput } from "@snksergio/design-system";
import {
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@snksergio/design-system/shadcn";
import {
  CARREGADORES_POR_LOCAL,
  type GrupoDeCarregadores,
} from "./performance-mock";

/**
 * Multi-select de CARREGADORES do filtro de Performance.
 *
 * Forma medida na referência (2026-09-16): gatilho com rótulo composto, e o painel com
 * cabeçalho `Selecionar carregadores`, uma linha `Todos os carregadores`, busca, e as
 * opções **agrupadas por local** — cada carregador com o nome que tem lá (`AC 7,4 KW
 * Vaga 1`, `60 KW Dual`). O agrupamento não é estética: o mesmo nome de carregador
 * repete entre locais, e sem o cabeçalho do local não se sabe qual é qual.
 *
 * Rótulos do gatilho, também literais da origem (`performance.filters`):
 *   nenhum → "Nenhum carregador"   ·   todos → "Todos os carregadores"
 *   parcial → "N carregadores selecionados"  (singular: "1 carregador selecionado")
 *
 * ⚠️ **Este é o SEGUNDO multi-select que este projeto monta na unha** — o outro é o de
 * locais, na sidebar (`layout/EscopoGlobal.tsx`). O DS não tem multi-select público: o
 * `MultiSelectDropdown` existe, mas privado dentro do `DataTable`
 * (`DataTable/column-types/_filter-field.tsx`). Os dois compartilham a receita (Popover +
 * Checkbox + busca + rodapé fixo fora da área de scroll) e divergem no gatilho e no
 * agrupamento. Na terceira ocorrência, isto deixa de ser aceitável e vira cascata no DS —
 * não antes: dois casos com gatilhos diferentes ainda não desenham a API.
 */

interface Props {
  selecionados: string[];
  onChange: (proximos: string[]) => void;
  grupos?: GrupoDeCarregadores[];
}

/** Chave de seleção — tem que carregar o local, porque o nome do carregador repete. */
const chave = (local: string, carregador: string) => `${local} · ${carregador}`;

function rotuloDoGatilho(qtd: number, total: number): string {
  if (qtd === 0) return "Nenhum carregador";
  if (qtd === total) return "Todos os carregadores";
  return `${qtd} ${qtd === 1 ? "carregador selecionado" : "carregadores selecionados"}`;
}

export function SeletorDeCarregadores({
  selecionados,
  onChange,
  grupos = CARREGADORES_POR_LOCAL,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const todasAsChaves = grupos.flatMap((g) =>
    g.carregadores.map((c) => chave(g.local, c)),
  );

  /* Filtro só de exibição — casa no nome do LOCAL e no do carregador, porque a pessoa
     procura pelos dois ("Vinhedo" e "DC 40"). Não mexe na seleção: quem sai do filtro
     continua marcado, e por isso o contador do rodapé conta sobre o total. */
  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? grupos
        .map((g) => ({
          ...g,
          carregadores: g.local.toLowerCase().includes(termo)
            ? g.carregadores
            : g.carregadores.filter((c) => c.toLowerCase().includes(termo)),
        }))
        .filter((g) => g.carregadores.length > 0)
    : grupos;

  const alternar = (k: string) =>
    onChange(
      selecionados.includes(k)
        ? selecionados.filter((x) => x !== k)
        : [...selecionados, k],
    );

  const abrirOuFechar = (proximo: boolean) => {
    setAberto(proximo);
    if (!proximo) setBusca("");
  };

  const todos = selecionados.length === todasAsChaves.length;

  return (
    <Popover open={aberto} onOpenChange={abrirOuFechar}>
      {/* Casca do `SelectTrigger` do DS, transcrita — o mesmo bloco que o seletor de
          locais usa. Aqui a variante de select é a certa sem discussão: é um campo de
          filtro num toolbar de página, não um controle de sidebar. */}
      <PopoverTrigger
        className="flex min-h-form-lg w-[260px] cursor-pointer items-center justify-between gap-gp-md rounded-radius-lg border border-border-input bg-bg-input px-pad-xl py-pad-xs text-body-sm font-normal text-fg-default outline-none transition-[color,box-shadow,background-color,border-color] hover:bg-bg-input-hover focus-visible:border-border-brand focus-visible:shadow-sh-ring data-[state=open]:border-border-brand data-[state=open]:shadow-sh-ring dark:bg-bg-muted dark:hover:bg-bg-muted-hover"
        aria-label="Filtrar por carregador"
      >
        <PlugZap className="size-icon-sm shrink-0 text-fg-muted" />
        <span
          className={`min-w-0 flex-1 truncate text-left ${
            selecionados.length === 0 ? "text-fg-muted opacity-70" : ""
          }`}
        >
          {rotuloDoGatilho(selecionados.length, todasAsChaves.length)}
        </span>
        <ChevronDown className="size-icon-sm shrink-0 text-fg-muted" />
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={6} className="w-dropdown-lg overflow-hidden p-0">
        {/* Altura no CONTAINER + lista com `min-h-0 flex-1` = só a lista rola, e o
            cabeçalho e o rodapé ficam fixos. Mesmo mecanismo do seletor de locais, e
            pelo mesmo motivo: ação que vale pra lista toda não pode sair de vista. */}
        <div className="flex max-h-[min(26rem,65vh)] flex-col">
          <div className="flex shrink-0 flex-col gap-gp-md border-b border-border-subtle px-pad-xl py-pad-lg">
            <span className="text-caption-md font-semibold text-fg-subtle">
              Selecionar carregadores
            </span>
            <InputGroup size="sm">
              <InputGroupAddon align="inline-start">
                <Search className="size-icon-sm text-fg-muted" />
              </InputGroupAddon>
              <InputGroupInput
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar"
                aria-label="Buscar carregador ou local"
              />
            </InputGroup>
          </div>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-pad-sm">
            {/* `Todos os carregadores` é uma LINHA da lista, como na referência, e não um
                botão do rodapé — lá ela fica no topo, antes dos grupos, e o rodapé tem só
                a contagem. Estado indeterminado quando a seleção é parcial: é a única
                forma honesta de dizer "nem tudo, nem nada". */}
            <Linha
              rotulo="Todos os carregadores"
              estado={
                todos ? true : selecionados.length === 0 ? false : "indeterminate"
              }
              onToggle={() => onChange(todos ? [] : [...todasAsChaves])}
              forte
            />

            {filtrados.length === 0 && (
              <p className="px-pad-lg py-pad-xl text-center text-body-sm text-fg-muted">
                Sem dados
              </p>
            )}

            {filtrados.map((g) => (
              <div key={g.local} className="pt-pad-md">
                <p className="truncate px-pad-lg pb-pad-xs text-caption-md font-semibold text-fg-subtle">
                  {g.local}
                </p>
                {g.carregadores.map((c) => {
                  const k = chave(g.local, c);
                  return (
                    <Linha
                      key={k}
                      rotulo={c}
                      estado={selecionados.includes(k)}
                      onToggle={() => alternar(k)}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-gp-md border-t border-border-subtle px-pad-lg py-pad-md">
            <span className="text-caption-md tabular-nums text-fg-muted">
              {selecionados.length} de {todasAsChaves.length}
            </span>
            <Button
              variant="ghost"
              color="secondary"
              size="2xs"
              disabled={selecionados.length === 0}
              onClick={() => onChange([])}
            >
              Limpar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Linha de opção. A `div` externa não tem papel de ARIA e o `Checkbox` do DS é o
 * controle — ver a explicação longa em `layout/EscopoGlobal.tsx`: `<label>` não forwarda
 * clique pro `Checkbox` (a raiz dele é `<button>`), `<button>` externo aninharia botões, e
 * `role="checkbox"` nos dois daria DOIS checkboxes por item pro leitor de tela.
 */
function Linha({
  rotulo,
  estado,
  onToggle,
  forte,
}: {
  rotulo: string;
  estado: boolean | "indeterminate";
  onToggle: () => void;
  forte?: boolean;
}) {
  return (
    <div
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-gp-md rounded-radius-sm px-pad-lg py-pad-md transition-colors hover:bg-bg-muted has-[:focus-visible]:bg-bg-muted"
    >
      <Checkbox
        checked={estado}
        onCheckedChange={onToggle}
        aria-label={rotulo}
        className="pointer-events-none"
      />
      <span
        className={`min-w-0 flex-1 truncate text-body-sm ${
          forte ? "font-semibold text-fg-default" : "text-fg-default"
        }`}
      >
        {rotulo}
      </span>
    </div>
  );
}
