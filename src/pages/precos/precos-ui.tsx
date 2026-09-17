import type { ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Chip } from "@snksergio/design-system";
import { ToggleGroup, ToggleGroupItem } from "@snksergio/design-system/shadcn";

/**
 * Vocabulário visual de Preços.
 *
 * O par de opções é o desenho que mais aparece nesta tela — três no cabeçalho do painel e
 * três dentro do modal de regra. Está aqui, e não repetido em cada um, porque seis cópias do
 * mesmo par divergem na primeira alteração.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** `R$ 3,00` — sempre com dois dígitos, `tabular-nums` pra alinhar entre linhas. */
export function Dinheiro({ valor }: { valor: number }) {
  return <span className="tabular-nums">{brl.format(valor)}</span>;
}

export interface OpcaoDoPar<T extends string> {
  valor: T;
  label: string;
  /** `true` desenha o ícone de confirmação/negação à esquerda, como na origem. */
  icone?: "confirma" | "nega";
}

/**
 * Par de opções mutuamente exclusivas — `Disponível | Desativado` e as outras cinco.
 *
 * ## Duas formas, decididas pelo lugar onde aparece
 *
 * Com `descricao`, vira **linha de ajuste**: título em negrito, descrição embaixo, controle à
 * direita — o desenho de lista de configuração, que é como o painel de edição a usa. Sem
 * `descricao`, fica a linha simples de rótulo e controle, que é o que o formulário compacto
 * do modal de regra precisa.
 *
 * A diferença não é estética. No painel os três pares são a configuração mais importante da
 * tela e valem pro perfil inteiro, então cada um merece dizer o que faz. No modal eles são
 * três campos entre quinze, já debaixo de um título de seção — descrição ali seria ruído
 * repetido três vezes.
 *
 * ## `ToggleGroup type="single"`, não dois `Button`
 *
 * Dois botões com estado seriam dois controles independentes que, por acordo, nunca estão os
 * dois ligados — e nada garantiria isso a não ser o código que os pinta. O `ToggleGroup` do
 * Radix garante a exclusão mútua e navega com as setas, que é o que se espera de escolher um
 * de dois.
 *
 * ⚠️ **`type="single"` do Radix aceita string vazia** quando o usuário clica na opção já
 * ativa — ele desmarca. Aqui isso seria um terceiro estado que não existe no domínio (o
 * carregador está disponível ou desativado, não "nenhum dos dois"), então o `onValueChange`
 * ignora o vazio. Sem isso, clicar duas vezes em `Disponível` apagaria a escolha.
 *
 * ## Botões em `form-sm` (32px), não `form-lg` (40px)
 *
 * Com título e descrição na mesma linha, quem dita a altura passa a ser o TEXTO (~38px), e um
 * controle de 40px em cima disso levava a linha pra ~64px — três empilhadas viravam um bloco
 * alto demais pra três interruptores. Em 32px o controle cabe dentro da altura que o texto já
 * ocupa, e a lista volta a ter ritmo de lista.
 *
 * ## Estilo na unha, e por quê
 *
 * O `ToggleGroup` do DS vem com o visual de barra de ferramentas — itens colados, sem
 * container. O desenho pedido são dois cartões lado a lado com o ativo em verde. Como é
 * layout de referência, as classes vão aqui — todas por token, nada literal.
 */
export function ParDeOpcoes<T extends string>({
  label,
  descricao,
  valor,
  opcoes,
  onChange,
}: {
  label: string;
  /** Quando presente, a linha ganha o formato de ajuste (título + descrição). */
  descricao?: string;
  valor: T;
  opcoes: [OpcaoDoPar<T>, OpcaoDoPar<T>];
  onChange: (v: T) => void;
}) {
  const controle = (
    /* **Dois botões com 2px entre eles**, não uma caixa com fio no meio.
​
       A versão "ligada" (caixa única, cantos externos recortados, bordas colapsadas com
       `-ml-px`) custou três rodadas e continuou brigando com o base do `ToggleGroupItem` —
       cada ajuste esbarrava numa classe do componente que o `tailwind-merge` não reconhece
       como conflito. Dois botões independentes, do mesmo tamanho, com um respiro de 2px,
       dizem a mesma coisa e não dependem de nada disso.
​
       ⚠️ O DS **não tem** segmented control. O `ButtonGroup` é split button de 2 slots e o
       próprio USAGE dele avisa: *"Pra agrupar 3+ botões em linked toolbar (Day/Week/Month),
       criar componente próprio futuro"*. O `ToggleGroup` do shadcn dá o comportamento
       (exclusão mútua, navegação por seta, `role=radiogroup`); a pele vem daqui. */
    <ToggleGroup
      type="single"
      value={valor}
      /* Ignora o vazio — ver o JSDoc. */
      onValueChange={(v) => v && onChange(v as T)}
      /* `grid-cols-2` de largura FIXA, e `gap-0` explícito.
         - grid em vez de `inline-flex`: as duas opções ficam com a MESMA largura, e os três
           grupos empilhados ficam idênticos. Com largura natural, `Cobrança normal` (120px)
           empurrava o par e cada linha começava num x diferente.
         - `gap-0` não é redundante: o `ToggleGroup` traz gap no base, e MEDIDO deixava 4px
           entre os itens — o "grupo ligado" com um vão no meio. É a mesma nota que o
           `CardOption` do DS carrega sobre o gap herdado do `RadioGroup`.

         ⚠️ **A borda agora é de cada ITEM, não da caixa.** O selecionado precisa da borda de
         marca em volta dele, e com a borda na caixa isso era impossível: ou ela contornava os
         dois, ou o item pintava por dentro e ficava um fio cinza por fora do verde. Com a
         borda no item, `-ml-px` colapsa as adjacentes num fio só e o `z-10` do ativo põe o
         verde por cima do cinza do vizinho. É o padrão clássico de segmented. */
      /* `gap-gp-xs` = 4px, token do DS. Colunas de largura igual pra que os três grupos
         empilhados fiquem idênticos — com largura natural, `Cobrança normal` empurrava o par
         e cada linha começava num x diferente. */
      className="inline-grid w-[248px] shrink-0 grid-cols-2 gap-gp-xs"
      aria-label={label}
    >
      {opcoes.map((o) => (
        <ToggleGroupItem
          key={o.valor}
          value={o.valor}
          className={[
            "flex min-h-form-sm w-full items-center justify-center gap-gp-xs",
            "px-pad-lg text-center text-caption-md font-medium",
            "rounded-radius-md",
            "border border-border-default bg-bg-surface text-fg-muted transition-colors",
            "hover:bg-bg-muted",
            /* O ativo é o verde da marca em tom sutil — o mesmo par que o DS já casou
               (`bg-bg-brand-subtle` + `fg-brand`), nunca cor literal. */
            "data-[state=on]:border-border-brand data-[state=on]:bg-bg-brand-subtle data-[state=on]:font-semibold data-[state=on]:text-fg-brand",
          ].join(" ")}
        >
          {o.icone === "confirma" && (
            <CheckCircle2 className="size-icon-xs shrink-0" aria-hidden />
          )}
          {o.icone === "nega" && (
            <XCircle className="size-icon-xs shrink-0" aria-hidden />
          )}
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  if (!descricao) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-gp-md">
        <span className="text-body-sm text-fg-muted">{label}</span>
        {controle}
      </div>
    );
  }

  return (
    /* Receita do `CardOption layout="list"` size `lg` do DS (`card-option.styles.ts`):
       `p-pad-2xl gap-gp-xl` no item, e a divisória é a **borda de baixo do item**, com a
       última suprimida. É isso que faz o fio ir de ponta a ponta: ele pertence à linha, que
       ocupa a largura inteira, e o respiro lateral é padding DENTRO dela. Com o padding no
       container, como estava, o fio parava 18px antes de cada borda.

       O DS não serve aqui pronto: `CardOption` embrulha checkbox/radio/switch e não aceita
       controle custom (`card-option.types.ts:5`, "ponto de extensão pra tipos futuros"). O
       espaçamento é o dele; o controle é nosso. */
    <div className="flex items-center justify-between gap-gp-xl border-b border-border-default bg-bg-surface p-pad-2xl last:border-b-0">
      {/* `flex-1 min-w-0` no texto e `shrink-0` no controle. MEDIDO: sem o `flex-1` o bloco
          de texto tomava a largura do conteúdo, empurrava o controle e o `flex-wrap` o jogava
          pra linha de baixo — a linha ia de 61px pra 104px. */}
      <div className="flex min-w-0 flex-1 flex-col gap-gp-2xs">
        <span className="text-body-sm font-semibold text-fg-default">
          {label}
        </span>
        <span className="text-caption-md text-fg-muted">{descricao}</span>
      </div>
      {controle}
    </div>
  );
}

/** Os três pares do cabeçalho do painel e do modal de regra, com os rótulos da origem. */
export const PAR_DISPONIBILIDADE: [
  OpcaoDoPar<"disponivel">,
  OpcaoDoPar<"desativado">,
] = [
  { valor: "disponivel", label: "Disponível", icone: "confirma" },
  { valor: "desativado", label: "Desativado", icone: "nega" },
];

export const PAR_COBRANCA: [OpcaoDoPar<"normal">, OpcaoDoPar<"gratis">] = [
  { valor: "normal", label: "Cobrança normal" },
  { valor: "gratis", label: "Recarga grátis" },
];

/* `Permitir` / `Bloquear` — sem repetir "cupom", que já está no rótulo da linha ("Uso de
   cupons") e na descrição. Repetido, ele só fazia a opção mais longa quebrar em duas linhas:
   "Bloquear cupom" não cabia em 124px e virava `Bloquear` + `cupom`, desalinhando o par. */
export const PAR_CUPONS: [OpcaoDoPar<"permitir">, OpcaoDoPar<"bloquear">] = [
  { valor: "permitir", label: "Permitir", icone: "confirma" },
  { valor: "bloquear", label: "Bloquear", icone: "nega" },
];

/**
 * Descrições das três linhas de ajuste do painel.
 *
 * ⚠️ **NÃO são da referência** — lá só existe o rótulo. Escrevi cada uma pra dizer o efeito
 * REAL da opção sobre o motorista ou sobre o equipamento, porque é isso que o formato de
 * linha de ajuste promete e é a informação que falta pra decidir: "Modo de cobrança" não diz
 * a ninguém que ligar "Recarga grátis" desliga todas as taxas do perfil.
 *
 * Ficam aqui, junto dos pares, e não no mock: são copy nossa, não conteúdo capturado.
 */
/* Uma linha cada, MEDIDO: a coluna de texto tem ~420px num painel de 760, o que em
   `caption-md` dá ~65 caracteres. As primeiras versões tinham 69/80/79 e quebravam em duas
   linhas, deixando as três alturas diferentes entre si. */
export const DESCRICOES_DOS_PARES = {
  disponibilidade: "Desativado, o carregador não aceita novas recargas.",
  cobranca: "Recarga grátis ignora todas as taxas deste perfil.",
  cupons: "Permite o motorista aplicar cupom nas recargas.",
} as const;

/**
 * Nota de sincronização — **neutra**.
 *
 * ## Passou por azul e por verde antes de chegar em cinza
 *
 * `info` deixou o bloco roxo (é o que `bg-bg-info` vale neste tema). `success` resolveu o
 * roxo mas criou o problema maior: num painel onde o campo de taxa, o card selecionado e o
 * chip de estado já são verdes, mais um bloco verde entrava na **briga de destaque** — três
 * elementos disputando o mesmo peso, e nenhum vencendo.
 *
 * Esta nota repete igual embaixo de cada card e diz sempre a mesma coisa. É rodapé, não
 * alerta: quem precisa se destacar ali é o valor da taxa e o botão de salvar. Neutro é o que
 * a deixa legível sem competir.
 *
 * ⚠️ Montado na mão em vez de `Alert`: o `Alert` do DS não tem variante neutra de
 * informação — só `default` (que não tem fundo nem ícone) e `destructive`
 * (`shadcn/alert.tsx:10`).
 */
export function AvisoInfo({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-gp-md rounded-radius-lg border border-border-default bg-bg-muted px-pad-2xl py-pad-xl">
      <svg
        className="mt-[1px] size-icon-sm shrink-0 text-fg-subtle"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <p className="text-caption-md text-fg-muted">{children}</p>
    </div>
  );
}

/** Célula de tags. `–` quando vazia, como a referência. */
export function CelulaDeTags({ tags }: { tags: string[] }) {
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
 * `Sim` / `Não` da coluna Recarga grátis.
 *
 * Texto, não `Chip`: recarga grátis não é STATUS do perfil, é uma propriedade booleana, e
 * chip colorido numa coluna de sim/não pinta metade da tabela sem hierarquizar nada. O `Sim`
 * ganha peso porque é o caso que destoa — dois em dez.
 */
export function SimNao({ valor }: { valor: boolean }) {
  return valor ? (
    <span className="font-semibold text-fg-default">Sim</span>
  ) : (
    <span className="text-fg-muted">Não</span>
  );
}
