import type { DateRange } from "@snksergio/design-system";

/**
 * Helpers de recorte de tempo — compartilhados pelas telas que filtram por período.
 *
 * Nasceram em Transações e Resumo pediu os mesmos dois. Duas cópias de `mesCorrente`
 * divergiriam no primeiro ajuste de fuso, e as duas telas mostram o MESMO conjunto de
 * transações: uma discordando da outra sobre onde o mês começa seria o pior tipo de
 * defeito, porque cada tela sozinha pareceria certa.
 */

/**
 * O mês corrente, de 1 ao último dia.
 *
 * ⚠️ **Função, não constante de módulo**: o valor depende de "hoje", e uma constante
 * congelaria o mês em que o bundle foi gerado.
 */
export function mesCorrente(): DateRange {
  const hoje = new Date();
  return {
    from: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
    to: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
  };
}

/**
 * `yyyy-MM-dd` → `Date` local à meia-noite.
 *
 * ⚠️ Não usa `new Date(iso)`: essa forma interpreta a string como **UTC**, e no fuso do
 * Brasil o dia 1º vira 31 do mês anterior — uma transação sumiria do recorte do próprio mês.
 */
export function dataLocal(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

/**
 * Filtra por intervalo, com os dois casos de borda do `DatePicker` em modo range.
 *
 * Sem seleção, o recorte é o mês corrente. Com `from` e sem `to`, recorta só o dia do
 * `from` — é o estado intermediário, com o popover ainda aberto.
 */
export function dentroDoPeriodo(iso: string, periodo: DateRange | undefined) {
  const intervalo = periodo?.from ? periodo : mesCorrente();
  const inicio = intervalo.from as Date;
  const fim = intervalo.to ?? inicio;
  const d = dataLocal(iso);
  return d >= inicio && d <= fim;
}

/**
 * Rótulo do intervalo, pro `title` do seletor.
 *
 * Reproduz o formato do próprio `DatePicker` (`month: "short"` em pt-BR, travessão entre as
 * pontas) porque ele não expõe o label que computa. Se o formato do DS mudar, este divergir
 * é visível no hover — é o preço de não haver prop de label.
 */
export function rotuloDoPeriodo(periodo: DateRange | undefined): string {
  const { from, to } = periodo?.from ? periodo : mesCorrente();
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const inicio = fmt(from as Date);
  return to ? `${inicio} – ${fmt(to)}` : inicio;
}
