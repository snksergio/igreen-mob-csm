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
 */
export const ALTURA_DE_TABELA = "flex-1 min-h-0 max-lg:min-h-[70vh]";

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
