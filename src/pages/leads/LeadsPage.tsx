import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CircleCheck,
  Eye,
  Inbox,
  MessageCircle,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import {
  Chip,
  DataTable,
  DatePicker,
  Kpi,
  KpiGroup,
  PageHeader,
  presetView,
  type DataTableColumnDef,
  type DateRange,
  type KanbanColumn,
} from "@snksergio/design-system";
import { avisoDeAcao, avisoFechavel } from "~/components/feedback";
import {
  LINHA_PROPRIA_NO_TOOLBAR,
  RAIZ_DE_PAGINA,
  TABELA_DE_PAGINA,
} from "~/components/altura-de-tabela";
import {
  ESTADO_LABEL,
  HOJE,
  LEADS,
  LEADS_TEXTOS,
  PRODUTO_LABEL,
  type Contato,
  type EstadoDoLead,
  type Lead,
  type ResultadoDoContato,
  dataCurta,
  diasRestantes,
  estadoEfetivo,
  expirandoEm48h,
  linkDoWhatsApp,
  marcosDoLead,
  moeda,
  precisaDeAcao,
  tempoRelativo,
  telefoneLegivel,
  ultimoContato,
} from "./leads-mock";
import {
  ChipDeEstado,
  ChipsDeProdutos,
  PrazoDaJanela,
  ProgressoDoLead,
} from "./leads-ui";
import { LeadDetailPanel } from "./LeadDetailPanel";

/**
 * Leads de recarga — a lista de quem tocou em "Carregar aqui" nos postos do licenciado.
 *
 * ## Por que a tela abre em LISTA e não em Kanban
 *
 * Implantações abre no board porque a primeira pergunta lá é "como está o funil". Aqui a
 * primeira pergunta é outra: **"com quem eu falo agora?"** — e ela tem resposta única,
 * ordenável, que um board não dá.
 *
 * O benchmark de 29/09 mediu o porquê: contatar um lead em 5 minutos em vez de 30
 * multiplica por 21 a chance de qualificar, e a média das empresas é de 42 horas. O ganho
 * desta tela sobre o WhatsApp não é organizar — é **priorizar**.
 *
 * ⚠️ **A prioridade chega pela ORDEM DAS LINHAS, não por uma visão pré-selecionada.**
 * `defaultViews` não tem prop para dizer qual preset começa ativo — conferido na
 * tipagem —, então a aba que abre é sempre a `Default`, sem filtro. Em vez de forçar
 * com `sortModel` controlado (que brigaria com o sort de cada visão ao trocar de aba),
 * a página entrega as rows JÁ ordenadas por urgência. A Default abre com o mais
 * urgente em cima, e `Precisa de ação` fica a um clique para quem quer só esses.
 * 📋 Lacuna do DS: `defaultViews` sem `initialViewId`.
 *
 * O Kanban continua a um clique no segmentado, para quem quer ver a distribuição.
 *
 * ## A janela de 7 dias é prazo, não inatividade
 *
 * Detalhe em `leads-mock.ts`. O resumo que muda a tela: o relógio corre do pré-cadastro,
 * contato não estende, e por isso a coluna diz **"Expira em 3 dias"** e nunca "parado há
 * 4 dias" — os dois rótulos descrevem relógios diferentes.
 *
 * ## ⚠️ Quem fica com o lead ainda não está decidido
 *
 * `CONTEXT.md` diz "quem cadastrou o motorista"; a regra recebida diz "quem comercializou
 * o eletroposto". Este mock assume a segunda. A escolha muda quais LINHAS existem, não
 * quais colunas — a tela serve às duas. É a dúvida D1 do benchmark, marcada como P0.
 */

/**
 * As visões salvas.
 *
 * ⚠️ `Precisa de ação` usa `isAnyOf` com três valores em vez de três visões separadas: os
 * três estados (`Novo`, `Tentei contato`, `Em conversa`) são o MESMO trabalho — leads com
 * o relógio correndo. Separá-los obrigaria a trocar de aba para não perder ninguém, que é
 * exatamente o que a tela existe para evitar.
 *
 * Não há visão "Expirando em 48h": esse aviso mora no KPI, onde ele é visto sem clicar.
 * Uma aba que só acende às vezes é uma aba que ninguém abre.
 *
 * 📋 Lacuna do DS, quarta tela em que aparece (antes: Cupons, Locais e Implantações): com
 * presets declarados, o `toolbar.title` perde o nome próprio e a aba volta a chamar
 * "Default". Mantido `title` porque ele volta a valer se as visões saírem.
 */
/**
 * A anatomia do KPI — círculo no ícone e o valor subindo um degrau.
 *
 * Declarado aqui e não importado porque é assim em todas as telas deste projeto
 * (Dashboard, Resumo, Implantações): a constante é local, repetida. 📋 Lacuna do DS:
 * `Kpi` não tem `iconShape`, e quatro telas quererem círculo é o sinal de que a forma
 * do `iconBox` devia ser prop.
 */
const AJUSTES_DO_KPI =
  "[&>header>span]:rounded-radius-full [&>div:first-of-type]:-mt-gp-xs";

const VISOES = [
  presetView({
    id: "preset:precisa-de-acao",
    name: "Precisa de ação",
    filters: [
      {
        field: "estado",
        operator: "isAnyOf",
        value: ["Novo", "Tentei contato", "Em conversa"],
      },
    ],
    sort: [{ field: "prazo", direction: "asc" }],
  }),
  presetView({
    id: "preset:convertidos",
    name: "Convertidos",
    filters: [{ field: "estado", value: "Convertido" }],
    sort: [{ field: "criadoEm", direction: "desc" }],
  }),
  presetView({
    id: "preset:expirados",
    name: "Expirados",
    filters: [{ field: "estado", value: "Expirado" }],
    sort: [{ field: "prazo", direction: "asc" }],
  }),
];

/**
 * Colunas do board.
 *
 * ⚠️ Só os cinco estados ARMAZENADOS. `Expirado` é derivado do relógio e não pode ser uma
 * coluna: ninguém arrasta um cartão para "expirado", e um lead sairia da coluna sozinho à
 * meia-noite, sem ação de ninguém. No board o expirado fica na coluna do estado em que
 * parou — que é a verdade sobre o trabalho feito.
 */
const COLUNAS_DO_BOARD: KanbanColumn[] = [
  { id: "novo", label: "Novo", dotColor: "var(--color-fg-brand)" },
  { id: "tentei-contato", label: "Tentei contato", dotColor: "var(--color-fg-warning)" },
  { id: "em-conversa", label: "Em conversa", dotColor: "var(--color-fg-info)" },
  { id: "convertido", label: "Convertido", dotColor: "var(--color-fg-success)" },
  { id: "perdido", label: "Perdido", dotColor: "var(--color-fg-subtle)" },
];

function construirColunas(handlers: {
  onVer: (l: Lead) => void;
  onWhatsApp: (l: Lead) => void;
}): DataTableColumnDef<Lead>[] {
  return [
    {
      field: "cliente",
      headerName: "Cliente",
      type: "text",
      isPrimary: true,
      width: 196,
      /* `copyable` com `value` próprio: o que se copia de um lead é o TELEFONE, não o
         nome — mas a célula precisa mostrar os dois. Sem o override, o botão de copiar
         levaria "Nome (31) 9...", que não cola em lugar nenhum. */
      copyable: { value: (row) => telefoneLegivel(row.telefone), label: "Telefone" },
      valueGetter: (row) => `${row.cliente} ${row.telefone} ${row.id}`,
      render: ({ row }) => (
        <span className="flex min-w-0 flex-col gap-[2px] py-pad-xs">
          <span className="block whitespace-normal break-words text-body-sm font-medium leading-snug text-fg-default">
            {row.cliente}
          </span>
          <span className="text-caption-sm tabular-nums text-fg-subtle">
            {telefoneLegivel(row.telefone)}
          </span>
        </span>
      ),
    },
    {
      field: "local",
      headerName: "Posto",
      width: 154,
      ellipsis: true,
      valueGetter: (row) => row.local,
      render: ({ row }) => (
        <span className="flex min-w-0 flex-col gap-[2px]">
          <span
            className="truncate text-body-sm text-fg-default"
            title={row.local}
          >
            {row.local.replace(/^(IGREEN|PV) MOB - /, "")}
          </span>
          <span className="text-caption-sm tabular-nums text-fg-muted">
            {dataCurta(row.criadoEm)}
          </span>
        </span>
      ),
    },
    {
      field: "prazo",
      headerName: "Prazo",
      width: 152,
      /* Ordena pelo NÚMERO de dias restantes, e exibe a frase. É o caso em que separar
         valor de ordem funciona: `valueGetter` devolve número, e o `render` cuida do
         texto — ao contrário da coluna Estado abaixo, onde o filtro precisa do rótulo. */
      valueGetter: (row) => diasRestantes(row),
      render: ({ row }) => <PrazoDaJanela lead={row} />,
    },
    {
      field: "estado",
      headerName: "Estado",
      width: 148,
      enableColumnFilter: true,
      filterType: "multiSelect",
      /* Devolve o RÓTULO porque é o que o filtro e as visões salvas usam. Por isso a
         ordenação sai desligada: ordenar rótulo é ordenar alfabeto, e "Convertido" viria
         antes de "Novo", invertendo a ordem do trabalho. Não há `sortComparator` na API.
         📋 Mesma lacuna do DS registrada em Implantações: a coluna não separa valor de
         EXIBIÇÃO de valor de ORDEM. Quem quer a ordem do trabalho usa o Kanban. */
      sortable: false,
      valueGetter: (row) => ESTADO_LABEL[estadoEfetivo(row)],
      render: ({ row }) => (
        <span className="flex">
          <ChipDeEstado lead={row} />
        </span>
      ),
    },
    {
      /**
       * Progresso — o que faltava na tabela.
       *
       * O chip de Estado diz ONDE a pessoa está; ele não diz o QUANTO já andou, e essa
       * era a pergunta que obrigava a abrir o painel. Os quatro segmentos aqui são os
       * mesmos quatro círculos de lá: quem vê a linha reconhece o desenho ao abrir.
       *
       * Ordena pelo NÚMERO de marcos cumpridos — é o caso em que valor de ordem e valor
       * de exibição coincidem sem truque.
       */
      field: "progresso",
      headerName: "Progresso",
      /* A largura saiu de três medições na tela, não de estimativa: a 132 a barra ficava
         com 56px úteis (quatro tracinhos de 12px, que o operador chamou de pequeno), a 160
         ia a ~85 e ficou grande demais para o peso que a coluna tem. 146 põe a barra em
         ~70px. Mas com `autoFit` a sobra volta para a coluna e a barra crescia de novo —
         quem trava o tamanho é o `w-[72px]` da própria barra, em `leads-ui`. Esta largura
         agora só precisa caber barra + rótulo. */
      width: 136,
      valueGetter: (row) => marcosDoLead(row).filter((m) => m.cumprido).length,
      render: ({ row }) => <ProgressoDoLead lead={row} />,
    },
    {
      field: "produtos",
      headerName: "Produtos que já tem",
      /* 140 e não 186: a coluna de Progresso entrou depois e a barra precisava de ar, e
         o orçamento saiu daqui, do Posto e da Última ação — os três toleram encolher
         porque o valor deles já quebra em duas linhas quando precisa. */
      width: 150,
      sortable: false,
      enableColumnFilter: true,
      filterType: "multiSelect",
      valueGetter: (row) =>
        row.produtos.length === 0
          ? "Nenhum"
          : row.produtos.map((p) => PRODUTO_LABEL[p]).join(", "),
      render: ({ row }) => <ChipsDeProdutos lead={row} />,
    },
    {
      field: "ultimaAcao",
      headerName: "Última ação",
      width: 140,
      valueGetter: (row) => ultimoContato(row)?.quando ?? "",
      render: ({ row }) => {
        const c = ultimoContato(row);
        if (!c)
          return (
            <span className="text-body-sm text-fg-subtle">Nunca contatado</span>
          );
        return (
          <span className="flex min-w-0 flex-col gap-[2px]">
            <span className="truncate text-body-sm text-fg-default">
              {c.resultado === "respondeu"
                ? "Respondeu"
                : c.resultado === "recusou"
                  ? "Recusou"
                  : "Sem resposta"}
            </span>
            <span className="text-caption-sm text-fg-muted">
              {tempoRelativo(c.quando)}
            </span>
          </span>
        );
      },
    },
    {
      field: "acoes",
      headerName: "",
      type: "actions",
      align: "right",
      width: 96,
      sortable: false,
      getActions: ({ row }) => [
        { id: "ver", label: "Ver lead", icon: <Eye />, onClick: () => handlers.onVer(row) },
        {
          id: "whatsapp",
          label: "Abrir WhatsApp",
          icon: <MessageCircle />,
          onClick: () => handlers.onWhatsApp(row),
        },
      ],
    },
  ];
}

export function LeadsPage() {
  /* Os leads são ESTADO da página: registrar contato precisa aparecer na tabela, no board
     e no painel ao mesmo tempo. Uma cópia por componente divergiria no primeiro clique. */
  const [leads, setLeads] = useState<Lead[]>(LEADS);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<DateRange | undefined>(undefined);

  const detalhe = leads.find((l) => l.id === detalheId) ?? null;

  /**
   * Registrar contato — o ato explícito.
   *
   * O resultado escolhido é que decide o estado; o licenciado não escolhe estado numa
   * lista. "Recusou" fecha o lead, as outras duas o mantêm na janela. Um lead já
   * convertido não muda de estado por contato — a conversão veio de um fato.
   */
  function registrarContato(
    leadId: string,
    dados: { canal: Contato["canal"]; resultado: ResultadoDoContato; nota: string },
  ) {
    setLeads((atual) =>
      atual.map((l) => {
        if (l.id !== leadId) return l;
        const contato: Contato = {
          id: `c-${Date.now()}`,
          quando: new Date(HOJE).toISOString(),
          canal: dados.canal,
          resultado: dados.resultado,
          nota: dados.nota || undefined,
        };
        const novoEstado: EstadoDoLead =
          l.estado === "convertido"
            ? "convertido"
            : dados.resultado === "recusou"
              ? "perdido"
              : dados.resultado === "respondeu"
                ? "em-conversa"
                : "tentei-contato";
        return {
          ...l,
          estado: novoEstado,
          motivoDaPerda:
            dados.resultado === "recusou"
              ? dados.nota || "Recusou a oferta."
              : l.motivoDaPerda,
          contatos: [...l.contatos, contato],
        };
      }),
    );
    avisoDeAcao({
      titulo: "Contato registrado",
      detalhe:
        dados.resultado === "respondeu"
          ? "O lead foi para Em conversa."
          : dados.resultado === "recusou"
            ? "O lead foi marcado como Perdido."
            : "O lead foi para Tentei contato.",
    });
  }

  function converter(lead: Lead) {
    setLeads((atual) =>
      atual.map((l) =>
        l.id === lead.id
          ? { ...l, estado: "convertido", converteuEm: l.converteuEm ?? "energia" }
          : l,
      ),
    );
    avisoDeAcao({
      titulo: "Lead convertido",
      detalhe: `${lead.cliente} saiu da janela de fidelização.`,
    });
  }

  function abrirWhatsApp(lead: Lead) {
    window.open(linkDoWhatsApp(lead), "_blank", "noopener");
    /* ⚠️ **Não muda o estado.** O `wa.me` só pré-preenche; o envio acontece no WhatsApp e
       não volta para cá. Marcar "contatado" daqui registraria intenção como se fosse ato.
       O aviso convida ao registro em vez de fingir que ele aconteceu. */
    avisoFechavel({
      titulo: "WhatsApp aberto",
      detalhe: "Depois de falar, registre o que aconteceu no painel do lead.",
    });
  }

  const colunas = useMemo(
    () => construirColunas({ onVer: (l) => setDetalheId(l.id), onWhatsApp: abrirWhatsApp }),
    [],
  );

  /* Recorte de tempo sobre a DATA DO PRÉ-CADASTRO — padrão deste projeto (toolbar, ao
     lado da busca). Sem recorte, mostra tudo. */
  const visiveis = useMemo(() => {
    if (!periodo?.from) return leads;
    const de = new Date(periodo.from);
    de.setHours(0, 0, 0, 0);
    const ate = periodo.to ? new Date(periodo.to) : new Date(periodo.from);
    ate.setHours(23, 59, 59, 999);
    return leads.filter((l) => {
      const d = new Date(l.criadoEm);
      return d >= de && d <= ate;
    });
  }, [leads, periodo]);

  /**
   * A ordem que faz a tela responder "com quem eu falo agora" sem ninguém clicar.
   *
   * Quem precisa de ação vem primeiro, e dentro desse grupo o prazo mais curto vem no
   * topo. Depois os encerrados, mais recentes primeiro. É ordem de LINHA, não `sort`
   * do componente: qualquer clique no cabeçalho continua sobrescrevendo, e trocar de
   * visão aplica o sort da visão sem brigar com nada.
   */
  const ordenadas = useMemo(() => {
    const urgencia = (l: Lead) => (precisaDeAcao(l) ? 0 : 1);
    return [...visiveis].sort((a, b) => {
      const ua = urgencia(a);
      const ub = urgencia(b);
      if (ua !== ub) return ua - ub;
      if (ua === 0) return diasRestantes(a) - diasRestantes(b);
      return b.criadoEm.localeCompare(a.criadoEm);
    });
  }, [visiveis]);

  const naJanela = visiveis.filter((l) => precisaDeAcao(l)).length;
  const urgentes = visiveis.filter((l) => expirandoEm48h(l)).length;
  const emConversa = visiveis.filter((l) => estadoEfetivo(l) === "em-conversa").length;
  const convertidos = visiveis.filter((l) => l.estado === "convertido");
  const receitaConvertida = convertidos.reduce((s, l) => s + l.recarga.valor, 0);

  const KPIS: {
    label: string;
    valor: string;
    hint: string;
    icone: LucideIcon;
    tom?: "danger" | "success";
  }[] = [
    {
      label: "Precisam de ação",
      valor: String(naJanela),
      hint: "com a janela aberta",
      icone: Inbox,
    },
    {
      /* O aviso ANTES de expirar é a única prática do GetNinjas que vale copiar — lá o
         crédito expira e a plataforma avisa por e-mail antes. A diferença: aqui o aviso
         mora DENTRO da tela, onde é visto sem depender de outro canal. */
      label: "Expiram em 48h",
      valor: String(urgentes),
      hint: urgentes > 0 ? "fale hoje" : "nada urgente",
      icone: urgentes > 0 ? AlertTriangle : CalendarCheck,
      tom: urgentes > 0 ? "danger" : undefined,
    },
    {
      label: "Em conversa",
      valor: String(emConversa),
      hint: "já responderam",
      icone: MessagesSquare,
    },
    {
      label: "Convertidos",
      valor: String(convertidos.length),
      hint: `${moeda(receitaConvertida)} em recargas`,
      icone: CircleCheck,
      tom: convertidos.length > 0 ? "success" : undefined,
    },
  ];

  return (
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Leads"
        description={LEADS_TEXTOS.aviso}
        badge={
          <Chip
            color={urgentes > 0 ? "danger" : "neutral"}
            variant="soft"
            size="sm"
            shape="rounded"
          >
            {naJanela} na janela
            {urgentes > 0 ? ` · ${urgentes} expirando` : ""}
          </Chip>
        }
      />

      <KpiGroup columns={4} divided className="lg:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k, indice) => {
          const Icone = k.icone;
          return (
            <Kpi
              key={k.label}
              label={k.label}
              value={
                k.tom === "danger" ? (
                  <span className="text-fg-danger">{k.valor}</span>
                ) : (
                  k.valor
                )
              }
              hint={k.hint}
              icon={<Icone />}
              tone={k.tom ?? "neutral"}
              className={[
                AJUSTES_DO_KPI,
                indice >= 2 ? "sm:border-t xl:border-t-0 border-border-subtle" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          );
        })}
      </KpiGroup>

      <DataTable<Lead>
        rows={ordenadas}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className={[
          TABELA_DE_PAGINA,
          "sm:[&_[data-column-id]]:w-[320px]",
          "[&_[data-card-id]]:gap-gp-lg [&_[data-card-id]]:p-pad-2xl",
        ].join(" ")}
        /* ⚠️ `.v2` porque a coluna Progresso entrou depois do primeiro uso da tela.

           O `persistId` grava `columnOrder` no navegador. Uma coluna que não existia
           quando aquele estado foi salvo **não some**, mas vai parar no FIM da fileira —
           medido aqui, injetando à mão um `columnOrder` sem `progresso` e recarregando:
           ela reapareceu depois de "Última ação", inclusive depois da coluna de ações.
           Numa tabela que já é mais larga que a tela, isso é o mesmo que não existir
           para quem não rolar até o fim.

           Bumpar a chave descarta o layout salvo e todo mundo volta ao default. O custo
           é real e vale dizer: quem tinha reordenado ou escondido colunas perde isso.

           📋 Lacuna do DS: não há migração do estado persistido quando o conjunto de
           colunas muda — nem posição declarada para a coluna desconhecida, nem versão de
           schema que invalide sozinha. Bumpar a chave na mão é a única saída. */
        persistId="igreen-mob-cms.leads.v2"
        onRowClick={(row) => setDetalheId(row.id)}
        /* Abre na TABELA. Ver o JSDoc do topo: a primeira pergunta aqui é "com quem falo
           agora", e ela é uma ordenação, não uma distribuição. */
        defaultViewMode="table"
        kanbanConfig={{
          groupByField: "estado",
          columns: COLUNAS_DO_BOARD,
          openCardId: detalheId ?? undefined,
          enableDnD: true,
          onCardMove: (cardId, _de, para) => {
            const lead = leads.find((l) => l.id === cardId);
            if (!lead) return;
            /* ⚠️ `Convertido` não se arrasta, nas duas direções.
               Conversão vem de um FATO — recarga paga, produto ativado —, não de alguém
               declarar que aconteceu. É a separação que o HubSpot faz entre jornada
               (`Lifecycle Stage`) e trabalho de vendas (`Lead Status`), e é o que impede
               a coluna de virar otimismo. */
            if (para === "convertido") {
              avisoFechavel({
                titulo: "Conversão não se arrasta",
                detalhe:
                  "Ela vem do fato: recarga paga ou produto ativado. Use o botão no painel do lead.",
              });
              return;
            }
            if (lead.estado === "convertido") {
              avisoFechavel({
                titulo: "Lead já convertido",
                detalhe: "Ele saiu da janela e não volta para o trabalho.",
              });
              return;
            }
            setLeads((atual) =>
              atual.map((l) =>
                l.id === cardId ? { ...l, estado: para as EstadoDoLead } : l,
              ),
            );
          },
          emptyLabel: "Nenhum lead aqui",
          hideFooterAdd: true,
          renderCard: ({ row }) => ({
            title: row.cliente,
            subtitle: row.local.replace(/^(IGREEN|PV) MOB - /, ""),
            chip: <ChipsDeProdutos lead={row} />,
            value: (
              <span className="tabular-nums">
                {row.recarga.concluida ? moeda(row.recarga.valor) : "—"}
              </span>
            ),
            /* No board a COLUNA já diz o estado, então o rodapé carrega o que ela não
               diz: quanto andou e quanto falta de prazo. */
            footerLeft: (
              <span className="flex w-[136px]">
                <ProgressoDoLead lead={row} />
              </span>
            ),
            footerRight: <PrazoDaJanela lead={row} />,
          }),
          getCardMenuItems: (row) => [
            { label: "Ver lead", icon: <Eye />, onClick: () => setDetalheId(row.id) },
            {
              label: "Abrir WhatsApp",
              icon: <MessageCircle />,
              onClick: () => abrirWhatsApp(row),
            },
          ],
        }}
        toolbar={{
          title: "Todos os leads",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
          customLeft: (
            /* Recorte por data do pré-cadastro — o "filtrar por data" que o WhatsApp não
               dá. Mesmo lugar e mesma largura travada de Transações e Resumo. */
            <span className={LINHA_PROPRIA_NO_TOOLBAR}>
              <DatePicker
                mode="range"
                value={periodo}
                onValueChange={setPeriodo}
                placeholder="Todo o período"
                align="end"
                className="w-[160px] max-md:w-full"
              />
            </span>
          ),
        }}
        defaultViews={VISOES}
        /* ⚠️ 4 e não o default 3: `maxViewTabs` CONTA a aba Default, e o excedente é
           cortado em silêncio na produção. Com três presets, o terceiro sumiria.
           📋 Lacuna do DS de forma: o default recorta sem o consumidor pedir. */
        maxViewTabs={4}
        allowCreateView={false}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <LeadDetailPanel
        lead={detalhe}
        onClose={() => setDetalheId(null)}
        onRegistrarContato={registrarContato}
        onConverter={(l) => {
          converter(l);
          setDetalheId(null);
        }}
      />
    </div>
  );
}
