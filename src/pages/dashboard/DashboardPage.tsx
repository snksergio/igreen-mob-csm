import { useMemo, useState } from "react";
import { Gauge, LayoutDashboard, PlugZap } from "lucide-react";
import {
  Chip,
  DatePicker,
  PageHeader,
  type DateRange,
} from "@snksergio/design-system";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@snksergio/design-system/shadcn";
import {
  DASHBOARD_TEXTOS,
  diasNoPeriodo,
  serieAnterior,
  serieDoPeriodo,
} from "./dashboard-mock";
import { AbaVisaoGeral } from "./AbaVisaoGeral";
import { AbaFinanceiro } from "./AbaFinanceiro";
import { AbaCarregadores } from "./AbaCarregadores";

/**
 * Dashboard — medido em `/pt/dashboard` (2026-09-16).
 *
 * ## Um recorte de tempo, não quatro
 *
 * A referência tem **quatro** seletores de data: um no topo, um em "Evolução no período",
 * um por aba e um para a disponibilidade. Eles são independentes — dá pra deixar o topo em
 * setembro e a evolução em agosto, e a tela não avisa. Comparar dois números da mesma
 * página deixa de ser possível sem conferir quatro campos.
 *
 * A pedido do operador, aqui existe **um**, no cabeçalho, ao lado das abas, e ele manda
 * nas três. A única exceção é a janela de disponibilidade da aba Carregadores, que é uma
 * janela deslizante e não um intervalo — o motivo está no JSDoc de
 * `JANELAS_DE_DISPONIBILIDADE`.
 *
 * ## As abas são o `Tabs` do DS, não `ChipGroup` nem `TabsNavigation`
 *
 * ⚠️ A 1ª versão usava `ChipGroup` — errado, e o operador apontou. O componente certo é o
 * `Tabs` de `@snksergio/design-system/shadcn` (a página `#/tabs` do showcase), na
 * variação **default** (`segmented`) e com **ícone à esquerda** do rótulo, que é o
 * exemplo "With Icons" da doc: o ícone é filho do `TabsTrigger`, antes do texto, e o gap
 * vem do próprio trigger.
 *
 * E não é o `TabsNavigation`, apesar do nome: aquele é a tira estilo navegador, para
 * sessões que o usuário **abre e fecha** (conversa, chamado), com avatar, subtítulo,
 * status, badge e botão de fechar. A própria doc do DS traça essa linha — "alternar
 * seções DENTRO de uma tela" é `Tabs`.
 *
 * ⚠️ `Tabs` sai pelo subpath `/shadcn`, não pelo barrel raiz. E `variant` vai no
 * `<Tabs>`, propagado por contexto — nunca no `TabsList` ou no `TabsTrigger`.
 *
 * Sem `fullWidth`: a doc desaconselha em página livre, e três abas esticadas na largura
 * inteira leem como filtro, não como seções.
 *
 * ## O conteúdo NÃO usa `TabsContent`
 *
 * As três abas são pesadas (gráficos, listas de 17 a 30 itens, 18 faixas de
 * disponibilidade). `TabsContent` monta os três painéis e esconde dois; aqui o switch
 * renderiza só o ativo. Em troca, a ligação `aria-controls`/`role="tabpanel"` é nossa —
 * daí o `id` e o `role` no `<section>` abaixo.
 *
 * ## A página inteira roda com um recálculo só
 *
 * `serieDoPeriodo` e `serieAnterior` são memoizadas aqui, no topo, e descem por prop. Cada
 * aba chama `totais()` sobre o que recebeu. Deixar cada aba gerar a própria série abriria
 * a porta para as três discordarem sobre o mesmo recorte — que é exatamente o defeito da
 * referência, num lugar mais difícil de ver.
 */

const ABAS = [
  { id: "visao-geral", rotulo: "Visão geral", icone: LayoutDashboard },
  { id: "financeiro", rotulo: "Financeiro", icone: Gauge },
  { id: "carregadores", rotulo: "Carregadores", icone: PlugZap },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export function DashboardPage() {
  /**
   * `undefined` de propósito, como em Transações: o `DatePicker` do DS computa o rótulo do
   * gatilho a partir do `value` e não aceita trigger custom, então a única forma de ele
   * dizer "Mês atual" é o valor estar vazio. E "nenhuma seleção" **é** o estado em que o
   * recorte é o mês corrente — o dado usa a mesma regra, então rótulo e números nunca
   * divergem.
   */
  const [periodo, setPeriodo] = useState<DateRange | undefined>(undefined);
  const [aba, setAba] = useState<AbaId>("visao-geral");

  const serie = useMemo(() => serieDoPeriodo(periodo), [periodo]);
  const anterior = useMemo(() => serieAnterior(periodo), [periodo]);
  const dias = diasNoPeriodo(periodo);

  return (
    <div className="flex flex-col gap-gp-2xl">
      <PageHeader
        title="Dashboard"
        description={DASHBOARD_TEXTOS.aviso}
        badge={
          <Chip color="neutral" variant="soft" size="sm" shape="rounded">
            {dias} {dias === 1 ? "dia" : "dias"}
          </Chip>
        }
        actions={
          /* O seletor mora aqui — o lugar do botão padrão de uma PageHeader — e não numa
             barra própria acima da tabela. É o que a L-051 pede e o que mantém a promessa
             de que existe um recorte só. */
          <DatePicker
            mode="range"
            value={periodo}
            onValueChange={setPeriodo}
            placeholder="Mês atual"
            align="end"
            /* Largura travada: o rótulo do gatilho é computado do valor e vai de 9 pra 39
               caracteres quando há período escolhido. Sem teto, o controle empurra o resto
               do cabeçalho. Mesma decisão de Transações. */
            className="w-[220px]"
          />
        }
      />

      <Tabs value={aba} onValueChange={(v) => setAba(v as AbaId)}>
        <TabsList>
          {ABAS.map((a) => (
            <TabsTrigger key={a.id} value={a.id} aria-controls="painel-do-dashboard">
              <a.icone className="size-icon-md" aria-hidden />
              {a.rotulo}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section
        id="painel-do-dashboard"
        role="tabpanel"
        aria-label={ABAS.find((a) => a.id === aba)?.rotulo}
      >
        {aba === "visao-geral" ? (
          <AbaVisaoGeral serie={serie} serieAnterior={anterior} />
        ) : aba === "financeiro" ? (
          <AbaFinanceiro serie={serie} serieAnterior={anterior} />
        ) : (
          <AbaCarregadores serie={serie} serieAnterior={anterior} />
        )}
      </section>
    </div>
  );
}
