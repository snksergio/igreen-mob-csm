import type { ReactNode } from "react";
import { Button, FormFieldInput } from "@snksergio/design-system";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  RadioGroup,
  RadioGroupItem,
} from "@snksergio/design-system/shadcn";
import { CardSeccionado } from "~/components/CardSeccionado";
import { AVISO_SINCRONIZAR } from "./precos-mock";
import { AvisoInfo } from "./precos-ui";

/**
 * Peças da aba **Taxas** do painel de preço.
 *
 * Saíram do `PrecoDetailPanel` quando a aba virou três cards seccionados com campos, radios e
 * notas: o arquivo do painel passava de 600 linhas e as duas coisas que ele faz — orquestrar
 * estado e desenhar formulário — ficavam embaralhadas.
 */

/**
 * Card de uma seção de taxa — o `CardSeccionado` compartilhado, com a nota de sincronização
 * já no rodapé.
 *
 * A nota fica DENTRO do corpo e não tem botão embaixo: o salvar é único, no rodapé do
 * painel. Ela continua aqui porque explica o efeito DESTA seção.
 */
export function CardDeTaxa(props: {
  titulo: string;
  switchLigado?: boolean;
  onSwitch?: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <CardSeccionado
      {...props}
      rodape={<AvisoInfo>{AVISO_SINCRONIZAR}</AvisoInfo>}
    />
  );
}

/**
 * Campo de valor em reais — `FormFieldInput` do DS com os dois adornos.
 *
 * ## Por que NÃO é input na unha
 *
 * A primeira versão montava rótulo + caixa + `<input>` à mão, com `focus-within:ring-4`
 * imitando o foco do DS. Imitação de foco é o tipo de coisa que passa despercebida até
 * divergir: o `Input` do DS anima `ring` E cor de borda juntos, e o meu só tinha o anel —
 * a borda ficava cinza no campo focado.
 *
 * O `FormFieldInput` resolve os dois de uma vez: `startAddon` aceita a string `"R$"` e
 * `endAddon` a unidade, os dois viram `InputGroupText` dentro do `InputGroup`, e o label
 * sai do `FormField` com o peso e o tracking certos (L-023).
 *
 * ## Sem card em volta
 *
 * A referência embrulha cada taxa num cartão verde, e isso somava três molduras pro mesmo
 * dado: a do card da seção, a do cartão e a do input.
 */
export function CampoDeValor({
  label,
  unidade,
  valor,
  onChange,
  className,
}: {
  label: string;
  /** Sufixo dentro do campo: `/ kWh`, `/ hora`, `/ USO`. */
  unidade: string;
  valor: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <FormFieldInput
      label={label}
      type="number"
      value={valor}
      onChange={(e) => onChange(Number(e.target.value))}
      startAddon="R$"
      endAddon={unidade}
      /* `[&_input]:tabular-nums` porque o `FormFieldInput` não tem prop pro input
         interno — o `className` vai no container do `FormField`. */
      className={`[&_input]:tabular-nums ${className ?? ""}`}
    />
  );
}

/**
 * Estado vazio de uma taxa opcional — o convite a configurá-la.
 *
 * Substitui o campo quando o valor é `null`. É o que a referência faz com a cobrança por uso
 * do carregador, e diz que aquilo é opcional sem precisar de texto explicando.
 */
export function TaxaNaoConfigurada({
  titulo,
  onAdicionar,
}: {
  titulo: string;
  onAdicionar: () => void;
}) {
  return (
    <div className="flex flex-col gap-gp-md">
      <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
        {titulo}
      </span>
      <Button
        variant="outline"
        color="secondary"
        size="sm"
        className="w-full justify-start"
        onClick={onAdicionar}
      >
        Definir a taxa
      </Button>
    </div>
  );
}

/**
 * Grupo de opções de isenção — `Tolerância 2ª recarga` e `Isenção de ativação`.
 *
 * ## Cards de radio, com o campo À DIREITA
 *
 * É o desenho do `CardOption type="radio"` do DS: card por opção, radio à esquerda, título e
 * descrição no meio, e o selecionado com borda de marca e fundo. O campo do valor fica na
 * mesma linha, à direita — embaixo ele empurrava a opção seguinte pra longe e a lista perdia
 * o alinhamento.
 *
 * ⚠️ Não é o `CardOption` do DS de fato: ele não aceita um controle extra no card
 * (`card-option.types.ts` — o slot que existe é `icon`, entre o radio e o texto). A receita
 * de espaçamento e o tratamento do selecionado são dele; o campo à direita é nosso.
 *
 * ## O campo da opção não escolhida fica DESABILITADO, não escondido
 *
 * As duas isenções são exclusivas, mas ver os dois valores ajuda a comparar antes de trocar.
 * Escondido, trocar de opção viraria um salto de layout e o valor antigo pareceria perdido.
 */
export function GrupoDeIsencao({
  modo,
  onModo,
  tolerancia,
  onTolerancia,
  isencao,
  onIsencao,
}: {
  modo: "tolerancia" | "isencao";
  onModo: (v: "tolerancia" | "isencao") => void;
  tolerancia: number;
  onTolerancia: (v: number) => void;
  isencao: number;
  onIsencao: (v: number) => void;
}) {
  return (
    <RadioGroup
      value={modo}
      onValueChange={(v) => onModo(v as "tolerancia" | "isencao")}
      className="flex flex-col gap-gp-lg"
    >
      <OpcaoDeIsencao
        id="modo-tolerancia"
        valor="tolerancia"
        ativo={modo === "tolerancia"}
        titulo="Tolerância 2ª recarga"
        descricao="Tempo mínimo entre uma recarga e outra para o usuário não pagar a ativação."
        campo={
          <CampoCompacto
            valor={tolerancia}
            unidade="min"
            disabled={modo !== "tolerancia"}
            onChange={onTolerancia}
            aria-label="Tolerância da 2ª recarga em minutos"
          />
        }
      />
      <OpcaoDeIsencao
        id="modo-isencao"
        valor="isencao"
        ativo={modo === "isencao"}
        titulo="Isenção de ativação"
        descricao="Consumo mínimo necessário para isentar a taxa de ativação."
        campo={
          <CampoCompacto
            valor={isencao}
            unidade="kWh"
            disabled={modo !== "isencao"}
            onChange={onIsencao}
            aria-label="Consumo mínimo em kWh"
          />
        }
      />
    </RadioGroup>
  );
}

function OpcaoDeIsencao({
  id,
  valor,
  ativo,
  titulo,
  descricao,
  campo,
}: {
  id: string;
  valor: string;
  ativo: boolean;
  titulo: string;
  descricao: string;
  campo: ReactNode;
}) {
  return (
    /* `p-pad-xl gap-gp-lg rounded-radius-lg` é a receita do `CardOption` size `md`
       (`card-option.styles.ts:66`). O selecionado leva `bg-bg-success-muted` +
       `border-border-brand`, que é o par que o DS já casou pro destaque de seleção. */
    <div
      className={[
        "flex items-center gap-gp-lg rounded-radius-lg border p-pad-xl transition-colors",
        ativo
          ? "border-border-brand bg-bg-success-muted"
          : "border-border-default bg-bg-surface hover:border-border-input hover:bg-bg-muted",
      ].join(" ")}
    >
      <RadioGroupItem value={valor} id={id} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-gp-2xs">
        {/* `<label htmlFor>` de verdade: clicar no título seleciona o radio, que é o gesto
            que se tenta primeiro num card desses. */}
        <label
          htmlFor={id}
          className="cursor-pointer text-body-sm font-semibold text-fg-default"
        >
          {titulo}
        </label>
        <span className="text-caption-md text-fg-muted">{descricao}</span>
      </div>
      {campo}
    </div>
  );
}

/**
 * Campo numérico curto com unidade — o que vai à direita de cada opção de isenção.
 *
 * ## `InputGroup` direto, não `FormFieldInput`
 *
 * O título do card JÁ nomeia este campo, e o `FormFieldInput` sempre renderiza o label
 * (`hideLabel` existe só no `FormField` base). Repetir "Tolerância da 2ª recarga" dentro do
 * card seria a mesma frase duas vezes na mesma linha.
 *
 * O `InputGroup` é o que o próprio `FormFieldInput` usa por dentro, então o foco é o do DS
 * — anel E cor de borda juntos. O nome vai no `aria-label`: quem usa leitor de tela não
 * perde nada.
 */
function CampoCompacto({
  valor,
  unidade,
  disabled,
  onChange,
  "aria-label": ariaLabel,
}: {
  valor: number;
  unidade: string;
  disabled: boolean;
  onChange: (v: number) => void;
  "aria-label": string;
}) {
  return (
    <InputGroup
      className={`w-[136px] shrink-0 ${disabled ? "opacity-50" : ""}`}
    >
      <InputGroupInput
        type="number"
        value={valor}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="text-right tabular-nums"
        aria-label={ariaLabel}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{unidade}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}
