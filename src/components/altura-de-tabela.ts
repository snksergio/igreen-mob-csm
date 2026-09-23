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
