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
 * 📋 **Lacuna do DS.** O rodapé do `DataTable` desenha UM botão por página, sem
 * reticências e sem janela deslizante, num `<nav>` `flex-nowrap` com `overflow-x:
 * visible`. Medido em Transações a 375px, com **sete** páginas: o `<nav>` tem 339px de
 * `clientWidth` e **370px** de `scrollWidth` — os últimos 31px já saem, e como quem
 * corta é o `overflow-hidden` de um ancestral, não há barra para rolar: os números
 * simplesmente não existem para quem está no celular. Com trinta páginas a conta é a
 * mesma, pior.
 *
 * A correção certa é no DS (reticências ou janela de páginas) e está mapeada. Aqui só
 * devolvemos o acesso: `overflow-x-auto` no `<nav>` faz a fileira rolar.
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
 */
export const RAIZ_DE_PAGINA = "flex flex-col gap-gp-2xl lg:min-h-0 lg:flex-1";

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
