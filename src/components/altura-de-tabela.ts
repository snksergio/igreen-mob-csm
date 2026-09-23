/**
 * A classe de altura de toda tabela e board que ocupa o resto da tela.
 *
 * ## O defeito que ela corrige
 *
 * `flex-1 min-h-0` entrega à tabela **a sobra** da coluna. No desktop a sobra é a maior
 * parte da tela e o resultado é o desejado. No celular ela é o que restou depois do
 * cabeçalho da página, dos KPIs e da toolbar — medido em Implantações a 375px: quatro
 * KPIs empilhados consomem a tela inteira e o board fica com uma faixa de ~150px, com
 * cartão cortado ao meio. A tabela vira rodapé de si mesma.
 *
 * `max-lg:min-h-[70vh]` põe um piso abaixo de 1024px: a área de dados nunca fica menor
 * que 70% da altura da janela, e o corpo do `AppShell` (que rola) acomoda o excedente.
 * Quem quiser ver os KPIs rola para cima — que é a ordem certa, porque o dado é o que a
 * pessoa veio ver.
 *
 * ## Por que não há `max-h`
 *
 * Porque o `flex-1` já é o teto: a tabela nunca passa do espaço que a coluna lhe dá, a
 * não ser quando o `min-h` força. Um `max-h` em vh **encolheria** a área onde há espaço
 * de sobra — a 1024×800 o corpo entrega ~89vh, e travar em 80vh jogaria fora 76px de
 * tabela para resolver um problema que ali não existe.
 *
 * ## Onde usar
 *
 * Em todo `DataTable`/`DataList` que hoje leva `className="flex-1 min-h-0"`. Se um dia
 * uma tela precisar de outro piso, o lugar de decidir é aqui — não espalhado por treze
 * arquivos.
 *
 * ## A segunda regra: o `⋯` some no celular
 *
 * O botão **Opções** do `TableToolbar` guarda Exportar e Densidade. Exportar um CSV e
 * escolher a altura da linha não são tarefas de celular — e os dois ocupam 40px numa
 * barra onde a busca já entra colapsada em ícone de 45px. Abaixo de `md` ele sai.
 *
 * ⚠️ Por CSS, e não desligando `enableExport`/`enableDensity`: as props não são
 * responsivas, e torná-las condicionais exigiria um `matchMedia` em cada uma das
 * dezesseis páginas para esconder um botão. `hidden` é `display:none`, então ele sai
 * também da ordem de foco e da árvore de acessibilidade — não fica um alvo invisível.
 *
 * O seletor casa pelo `aria-label`, que é o único atributo estável que o DS põe nesse
 * botão (não há `data-*`). Se o rótulo mudar de idioma ou de texto, o `⋯` volta a
 * aparecer no celular — comportamento de hoje, não tela quebrada.
 *
 * ## A terceira: a paginação passa a rolar em vez de ser cortada
 *
 * 📋 **Lacuna do DS — estreita, e não a que eu disse primeiro.** A versão anterior
 * desta nota afirmava que o rodapé do `DataTable` *"desenha um botão por página, sem
 * reticências e sem janela deslizante"*. **É falso.** O operador apontou o `…` no
 * componente do showcase e a medição confirmou: o rodapé JANELA, a partir de **oito**
 * páginas.
 *
 * Medido em Transações a 375px, variando `initialPageSize` sobre as mesmas 64 linhas
 * (`clientWidth` do `<nav>` = 339 nos cinco casos):
 *
 * | páginas | o que desenha   | `scrollWidth` |
 * |---------|-----------------|---------------|
 * | 5       | `1 2 3 4 5`     | 339 ✅        |
 * | 6       | `1 2 3 4 5 6`   | **368** ❌    |
 * | 7       | `1 2 3 4 5 6 7` | **400** ❌    |
 * | 8       | `1 2 … 7 8`     | 339 ✅        |
 * | 32      | `1 2 … 31 32`   | 339 ✅        |
 *
 * Ou seja: a janela existe e funciona; ela só **não entra a tempo**. Entre seis e sete
 * páginas o rodapé desenha tudo, e num `<nav>` `flex-nowrap` com `overflow-x: visible`
 * o excedente é cortado por um ancestral — sem barra, sem alcance. É uma faixa
 * estreita, e é exatamente onde as nossas tabelas caem com 10 linhas por página.
 *
 * A correção certa é no DS (janelar por LARGURA, não por contagem) e está mapeada.
 * Aqui fazemos a fileira **caber**, em dois passos:
 *
 * 1. **`«` e `»` saem no celular.** Eles custam 36px cada, mais os gaps: 80px dos 400.
 *    E são redundantes em TODA configuração dessa barra, não só na faixa que estoura —
 *    o rodapé sempre desenha a primeira e a última página como NÚMERO, inclusive
 *    janelado (`1 2 … 31 32`). Quem quer o fim toca o `32`. Num celular, dois alvos a
 *    menos numa fileira apertada valem mais que um atalho que já existe ao lado.
 * 2. **`overflow-x-auto` fica como rede.** Depois do passo 1 a fileira mede 320 de 339
 *    e não precisa rolar; a rolagem cobre o dia em que um rótulo maior, uma fonte
 *    ampliada ou uma tela de 320px empurrarem de novo.
 *
 * Medido depois, em Resumo a 375px com sete páginas: `scrollWidth` 320, `clientWidth`
 * 339 — a última página passa a nascer dentro da tela, sem arrastar.
 *
 * ⚠️ `justify-start` junto **não é enfeite**. O DS põe `max-sm:justify-center`, e conteúdo
 * centralizado que transborda é cortado dos DOIS lados com o início inalcançável — a
 * barra de rolagem não anda para antes do começo do conteúdo. Centralizar e rolar são
 * incompatíveis; entre os dois, rolar é o que devolve as páginas.
 */
export const TABELA_DE_PAGINA = [
  "flex-1 min-h-0 max-lg:min-h-[70vh]",
  "max-md:[&_[aria-label='Opções']]:hidden",
  "max-md:[&_footer_nav]:overflow-x-auto max-md:[&_footer_nav]:justify-start!",
  "max-md:[&_footer_nav_[aria-label='Primeira_página']]:hidden",
  "max-md:[&_footer_nav_[aria-label='Última_página']]:hidden",
].join(" ");

/**
 * A raiz de toda página de dados.
 *
 * ## O defeito que ela corrige
 *
 * `flex min-h-0 flex-1 flex-col` prende a página à altura do corpo do `AppShell` e
 * transforma cada seção num item de flex que ENCOLHE. No desktop sobra espaço e ninguém
 * encolhe. No celular, com o piso de 70vh na tabela, o que sobra para o resto é o
 * resíduo — medido em Resumo a 390×844: o grupo de KPIs precisava de 662px e renderizava
 * com **61px**, cortado pelo `overflow-hidden` do próprio componente. A tela mostrava
 * uma faixa de KPI ilegível e ninguém conseguia rolar até eles, porque não havia o que
 * rolar: a página cabia inteira, só que espremida.
 *
 * Abaixo de `lg` a página passa a ter **altura de conteúdo**: as seções empilham no
 * tamanho que pedem e quem rola é o corpo do shell. É o comportamento que o operador
 * descreveu — "no mobile as coisas deveriam empurrar, e o scroll fica na página".
 *
 * De `lg` para cima nada muda: `lg:min-h-0 lg:flex-1` devolve o layout de altura fixa,
 * que é o que faz a tabela ocupar o resto da tela sem a página rolar.
 *
 * ## O respiro no fim — `max-lg:pb-pad-4xl`
 *
 * O último bloco (a paginação, quase sempre) encostava na borda de baixo do celular.
 * O invólucro do `AppShell` TEM 18px de `padding-bottom`, e eles não valem: medido em
 * Transações a 375×812, aquele invólucro é um item de flex de altura travada em 752px
 * enquanto o conteúdo pede 902 — o rodapé sai em y=776..812 **fora** da caixa dele, e
 * padding não acompanha o que transborda.
 *
 * Por isso os 24px vão na NOSSA raiz, que é o elemento que transborda: aí eles fazem
 * parte do conteúdo rolável e sobram de verdade embaixo. Só abaixo de `lg`, onde a
 * página rola; acima disso a tabela ocupa a altura fixa e o padding só roubaria linha.
 */
export const RAIZ_DE_PAGINA =
  "flex flex-col gap-gp-2xl max-lg:pb-pad-4xl lg:min-h-0 lg:flex-1";

/**
 * O grupo de ações do `PageHeader` no celular.
 *
 * O slot `actions` põe os controles numa linha. Com três — seletor de carregadores,
 * período e "Download dos dados" na Performance — eles se espremem a 390px e cada um
 * fica com um terço da largura. Empilhados e em 100%, cada um vira um alvo de toque
 * inteiro, que é o que o operador pediu.
 *
 * Aplique no wrapper; os filhos ganham a largura por `[&>*]:w-full`, sem precisar
 * marcar um por um.
 */
export const ACOES_EMPILHAVEIS =
  "flex w-full flex-col gap-gp-md [&>*]:w-full sm:w-auto sm:flex-row sm:items-center sm:[&>*]:w-auto";

/**
 * O controle de recorte do `toolbar.customLeft` ganha a primeira linha inteira no celular.
 *
 * O `TableToolbar` põe `customLeft`, busca e os três botões de ícone numa fileira
 * `flex-wrap`. Medido a 375px em Motoristas, onde o `DatePicker` é `w-[260px]`: a fileira
 * pede 437px de 339 disponíveis e quebra onde calha — o seletor fica sozinho em cima e os
 * botões escorregam pra baixo desalinhados. Em Transações cabe numa linha só, mas o
 * rótulo do período (39 caracteres quando há intervalo escolhido) vive reticenciado nos
 * 150px travados.
 *
 * `w-full` abaixo de `md` transforma o acaso em decisão: o recorte ocupa a linha 1 por
 * inteiro — e aí o intervalo cabe escrito —, busca e ícones dividem a linha 2 com folga.
 *
 * ⚠️ O `DatePicker`/`SelectTrigger` de dentro precisa do `max-md:w-full` **dele**: a
 * largura travada está na classe do próprio controle, não no wrapper.
 */
export const LINHA_PROPRIA_NO_TOOLBAR = "max-md:w-full";
