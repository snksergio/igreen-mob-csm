import { useState } from "react";
import { Building2, ChevronDown, MapPin, Search } from "lucide-react";
import {
  Badge,
  Button,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@snksergio/design-system";
import {
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@snksergio/design-system/shadcn";

/**
 * Escopo global do CMS — empresa e locais, no TOPO DA SIDEBAR.
 *
 * É o recorte que, no sistema de referência, **todas as páginas internas obedecem**: a
 * pessoa escolhe a empresa e quais locais entram, e Resumo / Transações / Performance /
 * Repasses respondem a essa seleção. É por isso que quase toda tela repete o aviso
 * *"Dados correspondentes aos locais selecionados no topo"*.
 *
 * ⚠️ **Esta rodada monta só a UI e o estado.** Nenhuma página filtra por ele ainda —
 * decisão explícita do operador.
 *
 * ## Onde cada um mora, e por quê
 *
 * | controle | lugar na sidebar | prop do `AppShell` |
 * |---|---|---|
 * | EMPRESA  | seletor do topo (ícone + título + subtítulo + dropdown) | `sidebarModule`  |
 * | LOCAIS   | slot livre logo abaixo dele | `sidebarTopSlot` |
 *
 * ⛔ **Os locais NÃO vão na busca.** A primeira versão disto usou `sidebarSearchCommand`
 * pra montar o multi-select dentro da paleta da busca. Funcionava e ficou ruim: o gatilho
 * da busca é um botão com lupa e badge `⌘K` fixos, então o controle de escopo se
 * apresentava como busca, e o rodapé de ações rolava junto com a lista (ele vive dentro do
 * `CommandList`, que É a área de scroll). **Busca é busca.** O DS ganhou `sidebarTopSlot`
 * pra conteúdo arbitrário (2026-09-16) e o controle passou a ser nosso, montado aqui.
 */

export interface Escopo {
  empresa: string;
  locais: string[];
}

/* ══════════════════════════════════════════════════════════════════════════
   A casca do gatilho é a do `SelectTrigger` do DS

   Pedido do operador: *"quero que ele se pareça com o input de select, tendo os mesmos
   tokens, como se fosse um multi-select ou menu drop-down"*. Então estas classes NÃO são
   escolha nossa — são as do `SelectTrigger` (`src/components/shadcn/select.tsx`),
   transcritas: mesma altura (`min-h-form-lg`), mesmo radius, mesmo par claro/escuro de
   fundo e hover, mesma borda, mesma tipografia e o mesmo realce de foco/aberto
   (`border-border-brand` + `shadow-sh-ring`, não `ring-4`).

   ⚠️ **Transcrição, não import.** O `SelectTrigger` só existe acoplado ao `Select` do
   Radix, que é single-select por construção (`value` é string) — não dá pra reusar o
   componente aqui. Se o DS um dia publicar um multi-select próprio, este bloco morre e o
   componente entra no lugar.

   A versão anterior espelhava o `styles.module.trigger` (card do seletor de módulo:
   `bg-bg-sidebar-accent` + `shadow-sh-sm` + ícone em quadrado arredondado). Ficou parecido
   com a EMPRESA e nada parecido com um campo de formulário — que é o que isto é.
   ══════════════════════════════════════════════════════════════════════════ */

const CASCA_DE_SELECT = [
  "flex min-h-form-lg w-full cursor-pointer items-center justify-between gap-gp-md",
  "rounded-radius-lg px-pad-xl py-pad-xs",
  "bg-bg-input dark:bg-bg-muted",
  "hover:bg-bg-input-hover dark:hover:bg-bg-muted-hover",
  "border border-border-input",
  "text-body-sm font-normal text-fg-default",
  "transition-[color,box-shadow,background-color,border-color] outline-none",
  "focus-visible:border-border-brand data-[state=open]:border-border-brand",
  "focus-visible:shadow-sh-ring data-[state=open]:shadow-sh-ring",
].join(" ");

/* ══════════════════════════════════════════════════════════════════════════
   Variação `busca` — a casca do campo de BUSCA da própria sidebar

   Segunda opção pedida pelo operador, pra comparar lado a lado com a de select. A fonte
   é `styles.search` do `SingleMenuSidebar` (`single-menu-sidebar.styles.ts`), transcrita:
   `bg-bg-muted` (o fundo mais escuro que ele notou), `rounded-radius-lg`, sem borda
   nenhuma.

   Quatro desvios deliberados, cada um com motivo:

   · **o `⌘K` sai** — pedido explícito, e correto: atalho anunciado que não existe é pior
     que atalho ausente;
   · **`pr-pad-sm` vira `pr-pad-lg`** — o original tem padding assimétrico (10px à
     esquerda, 6px à direita) porque à direita morava o `⌘K`, que traz folga própria. Sem
     ele o chevron encostava na borda; 10px dos dois lados devolve a simetria;
   · **`focus-within:` vira `focus-visible:` + `data-[state=open]:`** — o original embrulha
     um `<input>`, que recebe foco por dentro; aqui a raiz É o elemento focável, e o estado
     "ativo" inclui a paleta aberta, que o `focus-within` não alcança;
   · **`min-h-form-md`** — o original ganha altura do `<input>` que tem dentro; com badges
     de 24px no lugar, sem piso explícito a casca mudaria de altura conforme o estado.
     36px é a altura medida do campo de busca real.

   ⚠️ O `opacity-60` do `inner` original NÃO vem: ele apaga o conteúdo em repouso, o que
   serve a um placeholder ("Buscar…" é convite, não informação) e atrapalha um valor — os
   nomes selecionados e o contador são o dado que a pessoa precisa ler sem interagir.
   ══════════════════════════════════════════════════════════════════════════ */

const CASCA_DE_BUSCA = [
  "flex min-h-form-md w-full cursor-pointer items-center justify-between gap-gp-md",
  "rounded-radius-lg bg-bg-muted py-pad-sm pl-pad-lg pr-pad-lg",
  "border border-transparent",
  "text-body-sm font-medium text-fg-default",
  "transition-all outline-none",
  "hover:bg-bg-muted-hover",
  "focus-visible:bg-bg-surface data-[state=open]:bg-bg-surface",
  "focus-visible:ring-4 focus-visible:ring-ring-brand",
  "data-[state=open]:ring-4 data-[state=open]:ring-ring-brand",
].join(" ");

/**
 * Quantos locais aparecem como badge de nome antes do contador `+N`.
 *
 * **Um.** Medido no rail expandido (237px úteis): com o `Badge` no tamanho padrão do DS
 * (24px, 12px de texto) e o contador ao lado, dois badges ficam com **58px e 66px** — seis
 * ou sete caracteres cada, `Usina So…` e `BIG MAI…`, dois nomes ilegíveis. Um só fica com
 * ~125px e cabe inteiro ou quase.
 *
 * Já foi 2 quando o badge era `size="sm"` (20px / 10px de texto), que era menor e menos
 * padrão. Trocar pelo tamanho default do DS custou a segunda vaga.
 */
const BADGES_VISIVEIS = 1;

/**
 * Config do seletor do topo da sidebar (`sidebarModule` do `AppShell`).
 *
 * `options` presente ⇒ vira dropdown; ausente ⇒ é só display. Como o mock tem uma
 * empresa só, o dropdown existe mas com um item — de propósito: em produção varia, e
 * esconder o dropdown agora faria a UI mudar de forma quando a segunda empresa entrar.
 */
export function moduloDaEmpresa(
  escopo: Escopo,
  empresas: readonly string[],
  onChange: (e: Escopo) => void,
) {
  return {
    icon: <Building2 />,
    title: escopo.empresa,
    subtitle: "Empresa selecionada",
    /* `SingleMenuModuleOption` exige `{ id, label, icon }` — `label`, não `title`, e o
       ícone é obrigatório. O `title` do seletor (acima) é outro campo: aquele é o rótulo
       do estado atual, estes são os itens do dropdown. */
    options: empresas.map((e) => ({ id: e, label: e, icon: <Building2 /> })),
    onModuleChange: (id: string) => onChange({ ...escopo, empresa: id }),
  };
}

/**
 * Rótulo do estado quando ele cabe numa frase só — nenhum local, ou todos.
 *
 * O caso "todos" é pedido explícito: com a seleção cheia, mostrar oito badges não informa
 * nada. `Todos os locais (8)` informa.
 */
export function rotuloDeLocais(escopo: Escopo, total: number): string | null {
  if (escopo.locais.length === 0) return "Nenhum local";
  if (escopo.locais.length === total) return `Todos os locais (${total})`;
  return null;
}

/**
 * Nome curto do local pro badge.
 *
 * Os nomes reais vêm prefixados com a empresa (`IGREEN MOB - SEDE`), e o prefixo é
 * redundante dentro do escopo: a empresa está no campo IMEDIATAMENTE acima. Tirá-lo é o
 * que faz o badge caber legível em vez de virar `IGREEN MO…` oito vezes.
 */
function nomeCurto(local: string): string {
  const corte = local.indexOf(" - ");
  return corte === -1 ? local : local.slice(corte + 3);
}

/**
 * Qual casca o gatilho veste. Duas existem porque o operador pediu as duas pra comparar
 * na tela, não porque haja um caso de uso diferente — quando ele escolher, a outra sai.
 *
 * `select` → casca do `SelectTrigger`: borda visível, fundo de input, cara de campo de
 *   formulário. Anuncia "isto é um campo que eu preencho".
 * `busca`  → casca do campo de busca da própria sidebar: fundo mais escuro, sem borda.
 *   Anuncia "isto é um controle da sidebar", igual ao que já mora dois blocos acima.
 */
export type VarianteDeLocais = "select" | "busca";

interface SeletorDeLocaisProps {
  escopo: Escopo;
  locais: readonly string[];
  onChange: (e: Escopo) => void;
  /** Default `select` — a primeira versão, pra não mudar de cara sem alguém pedir. */
  variante?: VarianteDeLocais;
}

/**
 * Multi-select dos LOCAIS — o que vai no `sidebarTopSlot`.
 *
 * Gatilho com a casca do `SelectTrigger` do DS (ver `CASCA_DE_SELECT`) e os selecionados
 * como **badges** dentro dele. Sem lupa e sem `⌘K`, porque não é busca; com pin de mapa na
 * frente e seta pra baixo no fim, porque é um campo de seleção.
 *
 * Sem rótulo externo: o estado inicial é tudo selecionado, e `Todos os locais (8)` já
 * identifica o campo. Quem carrega a identidade nos estados parciais é o pin.
 */
export function SeletorDeLocais({
  escopo,
  locais,
  onChange,
  variante = "select",
}: SeletorDeLocaisProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const casca = variante === "busca" ? CASCA_DE_BUSCA : CASCA_DE_SELECT;

  /* Filtro só de exibição: NÃO mexe na seleção. Quem está marcado e sai do filtro
     continua marcado — por isso o contador do rodapé conta sobre `locais`, não sobre
     `filtrados`, e "Selecionar todas" também vale pra lista inteira. Fazer as ações
     seguirem o filtro seria outro produto ("selecionar os N que estou vendo"), e daria
     uma ação cujo efeito muda conforme o que foi digitado. */
  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? locais.filter((l) => l.toLowerCase().includes(termo))
    : locais;

  /* Abrir de novo começa limpo. Sem isso o filtro da consulta anterior persiste e a
     lista abre "faltando" locais, sem nada na tela explicando por quê. */
  const abrirOuFechar = (proximo: boolean) => {
    setAberto(proximo);
    if (!proximo) setBusca("");
  };

  const alternar = (local: string) =>
    onChange({
      ...escopo,
      locais: escopo.locais.includes(local)
        ? escopo.locais.filter((l) => l !== local)
        : [...escopo.locais, local],
    });

  const rotulo = rotuloDeLocais(escopo, locais.length);
  /* A ordem de `escopo.locais` é a ordem de clique. Reordenar pela lista canônica mantém
     os badges estáveis: sem isso, marcar e desmarcar reembaralha o que está visível. */
  const selecionados = locais.filter((l) => escopo.locais.includes(l));
  const visiveis = selecionados.slice(0, BADGES_VISIVEIS);
  const restante = selecionados.length - visiveis.length;

  return (
    <Popover open={aberto} onOpenChange={abrirOuFechar}>
      <PopoverTrigger className={casca} aria-label="Locais do escopo">
        {/* Start icon no lugar do rótulo externo. O campo abre com tudo selecionado, e
            "Todos os locais (8)" já diz o que é — o pin carrega a identidade nos estados
            em que o texto vira badge de nome.
            `size-icon-sm` (16px) é o token por trás do `size-4` que o `SelectTrigger` usa
            na unha e da lupa do campo de busca — os dois medem o mesmo. */}
        <MapPin className="size-icon-sm shrink-0 text-fg-muted" />

        {/* ⚠️ Esta linha existe pra TRAVAR a altura, e `min-h-form-md` na casca não
            resolvia: `min-height` é piso, não trava. O estado de texto media 36px e o de
            badges 38px (o `Badge` md tem 24px de altura própria), então o campo pulava 2px
            ao trocar de estado — e o vizinho, o campo de busca real, tem 38px fixos.
            `min-h-comp-xs` é o MESMO token de altura do `Badge` md: os dois estados passam
            a medir 24px de conteúdo, e a casca fecha em 38px sempre. */}
        <span className="flex min-h-comp-xs min-w-0 flex-1 items-center gap-gp-xs">
          {rotulo ? (
            /* `opacity-70` + `fg-muted` no zerado é o mesmo tratamento que o
               `SelectTrigger` dá a `data-[placeholder]` — nada selecionado lê como
               placeholder, seleção cheia lê como valor. */
            <span
              className={`min-w-0 flex-1 truncate text-left ${
                escopo.locais.length === 0
                  ? "text-fg-muted opacity-70"
                  : "text-fg-default"
              }`}
            >
              {rotulo}
            </span>
          ) : (
            <>
              {/* ⛔ O contador fica FORA deste container. Dentro do mesmo flex que trunca,
                  ele era o elemento que vazava a casca — o container encolhe até o
                  conteúdo caber, e o badge, com `whitespace-nowrap`, não encolhe. */}
              <span className="flex min-w-0 flex-1 items-center gap-gp-xs overflow-hidden">
                {visiveis.map((l) => (
                  /* Badge do DS nos defaults dele (`secondary` · `soft` · `md` · shape
                     `default`) — só o `min-w-0` é nosso, e é layout, não token: sem ele o
                     flex item não encolhe e o badge empurra o vizinho pra fora.
                     O `<span truncate>` interno também é necessário: `truncate` no próprio
                     Badge não corta, porque a raiz dele é `inline-flex` e `text-overflow`
                     não se aplica a container flex — só ao bloco que CONTÉM o texto. */
                  <Badge key={l} className="min-w-0">
                    <span className="truncate">{nomeCurto(l)}</span>
                  </Badge>
                ))}
              </span>
              {restante > 0 && (
                /* O contador é `primary` — é o padrão de COUNTER do próprio Badge
                   ("Counter: default shape, soft primary", badge.tsx:12). Diferencia dos
                   neutros ao lado sem inventar variante: verde = "tem mais selecionado",
                   cinza = "este está selecionado". */
                <Badge
                  color="primary"
                  className="shrink-0 tabular-nums font-bold"
                  title={`+${restante} ${restante === 1 ? "local" : "locais"} selecionado${restante === 1 ? "" : "s"}`}
                >
                  +{restante}
                </Badge>
              )}
            </>
          )}
        </span>

        {/* `ChevronDown`, não `ChevronsUpDown`: o de duas pontas é do seletor de módulo
            (troca de contexto). O select do DS usa a seta pra baixo, 16px, `fg-muted` —
            aqui pelo token `size-icon-sm` em vez do `size-4` que ele escreve na unha. */}
        <ChevronDown className="size-icon-sm shrink-0 text-fg-muted" />
      </PopoverTrigger>

      {/* `p-0` + `overflow-hidden`: o padding mora em cada faixa, porque a do meio é a
          única que rola e as outras duas são fixas. Padding no container faria o
          conteúdo rolar por baixo dele. */}
      <PopoverContent
        align="start"
        sideOffset={6}
        /* `w-dropdown-lg` = 320px do token de container do DS (`--container-dropdown-lg`),
           no lugar do `w-[288px]` que estava na unha. */
        className="w-dropdown-lg overflow-hidden p-0"
      >
        {/* Altura máxima no CONTAINER, não na lista: é o que permite o rodapé ficar
            fixo. `flex-col` + a lista com `min-h-0 flex-1` = só ela rola.
            ⚠️ Este `max-h` fica na unha porque o DS **não tem** escala de altura máxima
            pra área de scroll — os tokens de `container` são de largura. 22rem ≈ 6 linhas
            e meia, que é o que faz o corte ficar visível (afordância de que rola). */}
        <div className="flex max-h-[min(22rem,60vh)] flex-col">
          <div className="flex shrink-0 flex-col gap-gp-md border-b border-border-subtle px-pad-xl py-pad-lg">
            <span className="text-caption-md font-semibold text-fg-subtle">
              Locais de {escopo.empresa}
            </span>

            {/* Busca da LISTA — `InputGroup` do DS, o composto pra input com ícone dentro
                (`InputGroupAddon align="inline-start"`). Fica na faixa FIXA junto do
                título: filtrar é ação sobre a lista, não item dela, então rolar não pode
                escondê-la — mesmo argumento do rodapé. */}
            <InputGroup size="sm">
              <InputGroupAddon align="inline-start">
                <Search className="size-icon-sm text-fg-muted" />
              </InputGroupAddon>
              <InputGroupInput
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar local"
                aria-label="Buscar local na lista"
              />
            </InputGroup>
          </div>

          {/* ⚠️ `min-h-0` não é decorativo: sem ele o item flex não encolhe abaixo do
              conteúdo, a lista cresce além do `max-h` do pai e o rodapé sai da tela —
              que era exatamente o sintoma relatado ("preciso dar scroll pra ver"). */}
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-pad-sm">
            {filtrados.length === 0 && (
              <p className="px-pad-lg py-pad-xl text-center text-body-sm text-fg-muted">
                Nenhum local encontrado.
              </p>
            )}
            {filtrados.map((l) => {
              const marcado = escopo.locais.includes(l);
              return (
                /* A linha é uma `div` sem papel de ARIA; **o `Checkbox` do DS é o
                   controle**, e é ele que carrega `role="checkbox"`, o foco e o teclado.
                   Três coisas que não dão certo aqui e explicam a forma:

                   · `<label>` NÃO forwarda o clique: a raiz do `Checkbox` é um `<button>`,
                     e button não é elemento "labelable";
                   · `<button>` na linha aninharia botão dentro de botão (DOM inválido);
                   · `role="checkbox"` na linha + o do `Checkbox` = DOIS checkboxes por
                     item pro leitor de tela (medido: 16 papéis pra 8 locais).

                   `pointer-events-none` no `Checkbox` faz TODO clique chegar na linha —
                   sem isso, clicar no quadradinho disparava `onCheckedChange` E o
                   `onClick` da linha, dois toggles que se anulam. Não bloqueia o teclado:
                   com foco nele, Espaço alterna pelo `onCheckedChange`. */
                <div
                  key={l}
                  onClick={() => alternar(l)}
                  className="flex cursor-pointer items-center gap-gp-md rounded-radius-sm px-pad-lg py-pad-md transition-colors hover:bg-bg-muted has-[:focus-visible]:bg-bg-muted"
                >
                  <Checkbox
                    checked={marcado}
                    onCheckedChange={() => alternar(l)}
                    aria-label={l}
                    className="pointer-events-none"
                  />
                  <span className="min-w-0 flex-1 truncate text-body-sm text-fg-default">
                    {l}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rodapé FIXO — `shrink-0` fora da área de scroll. As duas ações valem pra
              lista toda, então sumir de vista ao rolar era o defeito, não detalhe. */}
          <div className="flex shrink-0 items-center justify-between gap-gp-md border-t border-border-subtle px-pad-lg py-pad-md">
            <span className="text-caption-md tabular-nums text-fg-muted">
              {escopo.locais.length} de {locais.length}
            </span>
            <span className="flex items-center gap-gp-xs">
              <Button
                variant="ghost"
                color="primary"
                size="2xs"
                disabled={escopo.locais.length === locais.length}
                onClick={() => onChange({ ...escopo, locais: [...locais] })}
              >
                Selecionar todas
              </Button>
              <Button
                variant="ghost"
                color="secondary"
                size="2xs"
                disabled={escopo.locais.length === 0}
                onClick={() => onChange({ ...escopo, locais: [] })}
              >
                Limpar
              </Button>
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
