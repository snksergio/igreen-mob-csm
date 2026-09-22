import type { ComponentType, ReactNode, SVGProps } from "react";
import { Copy } from "lucide-react";
import { Button } from "@snksergio/design-system";
import type { StatusConexao } from "./carregadores-mock";

/**
 * Vocabulário visual de Carregadores.
 */

/** Forma mínima de um ícone do lucide — evita importar o tipo do pacote no consumidor. */
type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Status de conexão na lista.
 *
 * Verde para `Online`, neutro para `Offline` — e é texto, não `Chip`: são nove colunas nesta
 * tabela, e uma pastilha colorida aqui disputaria atenção com o link de Preço e os dois
 * botões de ação da mesma linha. A referência também usa texto colorido.
 */
export function StatusConexaoTexto({ status }: { status: StatusConexao }) {
  return (
    <span
      className={`font-medium ${
        status === "Online" ? "text-fg-success" : "text-fg-muted"
      }`}
    >
      {status}
    </span>
  );
}

/**
 * Linha somente-leitura da ficha de dispositivo — **o mesmo desenho do painel de Gestão de
 * Carga**: ícone à esquerda, rótulo em `fg-muted`, valor à direita numa coluna alinhada.
 *
 * O ícone não é enfeite: é o que permite varrer a ficha por tipo de propriedade sem ler
 * rótulo por rótulo. E o grid (em vez de `justify-between`) é o que alinha todos os valores
 * numa coluna só — com `justify-between` cada um pararia numa distância diferente da borda,
 * conforme o tamanho do rótulo, e a leitura de ficha se perde.
 *
 * A primeira versão tinha divisória por linha e nenhum ícone; ficou parecendo uma tabela de
 * duas colunas dentro de um card, não a ficha que as outras telas usam.
 */
export function LinhaDeDispositivo({
  icone: Icone,
  label,
  valor,
  interativa,
}: {
  icone: LucideIcon;
  label: string;
  valor: ReactNode;
  /**
   * Linha que se edita no lugar: ganha fundo no hover e vira `group/linha`, pra que o
   * controle escondido dentro dela apareça quando o mouse passa por perto.
   *
   * ⚠️ Ela deixa de ser duas células soltas do grid e passa a ocupar as duas colunas
   * (`col-span-2`) com o MESMO template por dentro. É o único jeito de a linha ter fundo
   * próprio sem perder o alinhamento da coluna de valores: células irmãs de um grid não
   * têm um wrapper comum onde pintar.
   */
  interativa?: boolean;
}) {
  const rotulo = (
    <div className="flex min-h-form-md items-center gap-gp-md text-body-sm text-fg-muted">
      <Icone className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
      <span className="truncate">{label}</span>
    </div>
  );
  const conteudo = (
    <div className="flex min-h-form-md min-w-0 items-center text-body-sm font-medium text-fg-default">
      {valor}
    </div>
  );

  if (interativa) {
    return (
      /* ⚠️ O template interno é `var(--col-rotulo)` EXATO, não menos o padding: com
         `-mx-pad-md` + `px-pad-md` a área de conteúdo volta a ter a mesma origem e a mesma
         largura do grid pai. Subtrair os 8px (meu primeiro palpite) desalinhava o valor
         desta linha em 8px de todas as outras — medido. */
      <div className="group/linha col-span-2 -mx-pad-md grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs rounded-radius-md px-pad-md transition-colors hover:bg-bg-muted sm:grid-cols-[var(--col-rotulo)_1fr] sm:items-center">
        {rotulo}
        {conteudo}
      </div>
    );
  }

  return (
    <>
      {/* `min-h-form-md` nas DUAS células: sem isso a linha de texto puro fica mais baixa
          que a que tem `Chip`, e a ficha perde o ritmo. */}
      {rotulo}
      {conteudo}
    </>
  );
}

/**
 * Campo de texto somente-leitura com botão de copiar — a URL pública do plugue.
 *
 * `readOnly` e não `disabled`: o valor precisa continuar selecionável e legível com contraste
 * normal. `disabled` esmaeceria justamente a URL que a pessoa veio ler.
 */
export function CampoCopiavel({ valor }: { valor: string }) {
  return (
    <div className="flex min-h-form-lg items-center gap-gp-sm rounded-radius-lg border border-border-input bg-bg-muted px-pad-lg">
      <input
        readOnly
        value={valor}
        className="min-w-0 flex-1 bg-transparent text-body-sm text-fg-muted outline-none"
        aria-label="Endereço público do plugue"
      />
      <Button
        variant="ghost"
        color="secondary"
        size="icon-sm"
        aria-label="Copiar endereço"
        onClick={() => navigator.clipboard?.writeText(valor)}
      >
        <Copy />
      </Button>
    </div>
  );
}
