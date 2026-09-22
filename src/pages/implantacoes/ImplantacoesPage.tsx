import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import {
  AlertModal,
  Avatar,
  Button,
  Chip,
  DataTable,
  Kpi,
  KpiGroup,
  PageHeader,
  type DataTableColumnDef,
  type KanbanColumn,
} from "@snksergio/design-system";
import { avisoDeAcao, avisoDeExcluido, avisoFechavel } from "~/components/feedback";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  ETAPAS,
  ETAPA_POR_ID,
  IMPLANTACOES,
  IMPLANTACOES_TEXTOS,
  atrasada,
  concluida,
  dataCurta,
  indiceDaEtapa,
  moeda,
  pendenciasObrigatorias,
  progressoDaEtapa,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";
import {
  BarraDoFunil,
  ChipDeEtapa,
  ProgressoDaEtapa,
} from "./implantacoes-ui";
import { ImplantacaoDetailPanel } from "./ImplantacaoDetailPanel";
import { ImplantacaoFormPanel } from "./ImplantacaoFormPanel";
import { PanelAssistente } from "./PanelAssistente";
import { PanelCompacto } from "./PanelCompacto";
import { PanelDuasColunas } from "./PanelDuasColunas";

/**
 * Funil de implantação — Kanban e tabela sobre os mesmos dados.
 *
 * ## Por que as duas visões, e não uma
 *
 * Elas respondem perguntas diferentes. O **Kanban** responde "como está o funil" — onde
 * estão os gargalos, que coluna está entupida. A **tabela** responde "o que eu faço
 * agora" — ordenar por previsão, filtrar por responsável, achar as atrasadas. Obrigar a
 * escolher uma seria escolher por quem usa.
 *
 * O `DataTable` faz as duas com a MESMA configuração de dados: busca, filtro e ordenação
 * são aplicados antes de o Kanban agrupar. Trocar de visão não perde o recorte.
 *
 * ## A regra de movimentação
 *
 * Arrastar é permitido, mas não é livre — ver `moverEtapa`:
 *
 * | movimento | resultado |
 * |---|---|
 * | uma etapa para a frente, checklist obrigatório cumprido | permitido |
 * | uma etapa para a frente, com pendência | **bloqueado**, e a tela diz o que falta |
 * | pular etapa | **bloqueado** |
 * | para trás, qualquer distância | permitido |
 *
 * Sem a trava, o checklist vira decoração: bastaria arrastar o cartão para "instalação"
 * para a implantação dizer que acabou. Com ela, a posição no board é uma afirmação
 * verificável. Voltar é livre porque descobrir na viabilidade que a carga não fecha é
 * motivo legítimo para regredir — um funil que só anda para a frente obriga a mentir.
 */

function construirColunas(handlers: {
  onVer: (i: Implantacao) => void;
  onEditar: (i: Implantacao) => void;
  onExcluir: (i: Implantacao) => void;
}): DataTableColumnDef<Implantacao>[] {
  return [
    {
      field: "cliente",
      headerName: "Implantação",
      type: "text",
      isPrimary: true,
      width: 184,
      valueGetter: (row) => `${row.cliente} ${row.id}`,
      render: ({ row }) => (
        <span className="flex min-w-0 flex-col gap-[2px] py-pad-xs">
          <span className="block whitespace-normal break-words text-body-sm font-medium leading-snug text-fg-default">
            {row.cliente}
          </span>
          <span className="text-caption-sm tabular-nums text-fg-subtle">{row.id}</span>
        </span>
      ),
    },
    {
      field: "local",
      headerName: "Local",
      width: 148,
      valueGetter: (row) => `${row.local} ${row.cidade}`,
      render: ({ row }) => (
        <span className="flex min-w-0 flex-col gap-[2px]">
          <span className="truncate text-body-sm text-fg-default" title={row.local}>
            {row.local}
          </span>
          <span className="truncate text-caption-sm text-fg-muted">
            {row.cidade} · {row.uf}
          </span>
        </span>
      ),
    },
    {
      field: "etapa",
      /* 176 e não 150: o chip "Viabilidade técnica" é o mais largo dos sete, mede 142px,
         e a célula reserva 16px de padding de cada lado — 174 no total. Medido a 1440
         com o rail ABERTO, que é o pior caso de largura útil (1100px). */
      headerName: "Etapa",
      width: 176,
      enableColumnFilter: true,
      filterType: "multiSelect",
      valueGetter: (row) => ETAPA_POR_ID[row.etapa].label,
      /* ⚠️ **Não ordenável, de propósito.** A ordenação do `DataTable` sai do
         `valueGetter`, que aqui devolve o RÓTULO porque é ele que o filtro precisa
         mostrar — e ordenar rótulo é ordenar alfabeto: "Aceite" viria antes de
         "Proposta", invertendo o funil na cara de quem clicou. Não há
         `sortComparator` na API (conferido na tipagem), e um `valueGetter` numérico
         encheria o filtro de "0", "1", "2".
         📋 Lacuna do DS: coluna sem separar valor de EXIBIÇÃO do valor de ORDEM.
         A ordem do funil continua disponível — é o próprio Kanban. */
      sortable: false,
      render: ({ row }) => (
        <span className="flex">
          <ChipDeEtapa etapa={row.etapa} />
        </span>
      ),
    },
    {
      field: "checklist",
      headerName: "Checklist",
      width: 120,
      valueGetter: (row) => {
        const { feitos, total } = progressoDaEtapa(row);
        return feitos / total;
      },
      render: ({ row }) => <ProgressoDaEtapa implantacao={row} />,
    },
    {
      field: "investimento",
      headerName: "Investimento",
      width: 124,
      align: "right",
      valueGetter: (row) => row.investimento,
      render: ({ row }) => (
        <span className="tabular-nums text-fg-default">{moeda(row.investimento)}</span>
      ),
    },
    {
      field: "responsavel",
      headerName: "Responsável",
      width: 136,
      enableColumnFilter: true,
      filterType: "multiSelect",
      valueGetter: (row) => row.responsavel,
      render: ({ row }) => (
        <span className="flex min-w-0 items-center gap-gp-sm">
          <Avatar size="xs" colorHex={corDoAvatar(row.responsavel)} aria-hidden>
            {iniciais(row.responsavel)}
          </Avatar>
          <span className="truncate text-body-sm text-fg-default">{row.responsavel}</span>
        </span>
      ),
    },
    {
      field: "previsaoDeInstalacao",
      headerName: "Previsão",
      width: 112,
      align: "right",
      valueGetter: (row) => row.previsaoDeInstalacao,
      render: ({ row }) => (
        <span
          className={`tabular-nums ${
            atrasada(row) ? "font-semibold text-fg-danger" : "text-fg-default"
          }`}
        >
          {dataCurta(row.previsaoDeInstalacao)}
        </span>
      ),
    },
    {
      field: "acoes",
      headerName: "Ações",
      type: "actions",
      align: "right",
      width: 96,
      sortable: false,
      getActions: ({ row }) => [
        { id: "ver", label: "Ver implantação", icon: <Eye />, onClick: () => handlers.onVer(row) },
        { id: "editar", label: "Editar dados", icon: <Pencil />, onClick: () => handlers.onEditar(row) },
        {
          id: "excluir",
          label: "Excluir implantação",
          icon: <Trash2 />,
          destructive: true,
          onClick: () => handlers.onExcluir(row),
        },
      ],
    },
  ];
}

/**
 * Três propostas de painel, uma por implantação, para comparar lado a lado.
 *
 * ⚠️ **Isto é um comparador, não arquitetura.** Ligar o desenho do painel ao ID do
 * registro só faz sentido enquanto a escolha não foi feita; assim que uma proposta for
 * aprovada, este mapa some e o painel escolhido vale para todas. Está aqui, e não atrás
 * de um seletor na toolbar, porque comparar exige abrir os três sem configurar nada.
 *
 * | implantação | proposta | forma |
 * |---|---|---|
 * | Rede Boa Praça (`IMP-2026-001`) | **A** | cartão de status, uma coluna estreita |
 * | Pousada Serra Azul (`IMP-2026-002`) | **B** | workspace em duas colunas, com abas |
 * | Grupo Via Norte (`IMP-2026-003`) | **C** | assistente, uma etapa por vez |
 *
 * As outras onze continuam no painel atual — é o controle da comparação.
 */
const PROPOSTA_POR_IMPLANTACAO: Record<string, "a" | "b" | "c"> = {
  "IMP-2026-001": "a",
  "IMP-2026-002": "b",
  "IMP-2026-003": "c",
};

/** Colunas do board — derivadas de `ETAPAS`, na ordem do funil. */
const COLUNAS_DO_BOARD: KanbanColumn[] = ETAPAS.map((e) => ({
  id: e.id,
  label: e.label,
  dotColor: e.cor,
}));

export function ImplantacoesPage() {
  /**
   * O funil é ESTADO da página, não constante importada: marcar checklist e mover etapa
   * precisam aparecer na tabela, no board e no painel ao mesmo tempo. Uma cópia por
   * componente divergiria no primeiro clique.
   */
  const [implantacoes, setImplantacoes] = useState<Implantacao[]>(IMPLANTACOES);
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [emEdicao, setEmEdicao] = useState<Implantacao | null>(null);
  const [criando, setCriando] = useState(false);
  const [aExcluir, setAExcluir] = useState<Implantacao | null>(null);

  /* Guardamos o ID, não o objeto: o painel precisa refletir a marcação do checklist
     feita dentro dele mesmo, e um objeto congelado no state mostraria o valor antigo. */
  const detalhe = implantacoes.find((i) => i.id === detalheId) ?? null;
  const proposta = detalhe ? PROPOSTA_POR_IMPLANTACAO[detalhe.id] : undefined;

  const alternarItem = (impId: string, itemId: string) =>
    setImplantacoes((atual) =>
      atual.map((i) =>
        i.id !== impId
          ? i
          : {
              ...i,
              feitos: i.feitos.includes(itemId)
                ? i.feitos.filter((x) => x !== itemId)
                : [...i.feitos, itemId],
            },
      ),
    );

  /**
   * A trava do funil. Devolve `true` quando moveu.
   *
   * ⚠️ Recusar em silêncio seria pior que não travar: quem arrasta e vê o cartão voltar
   * sozinho conclui que a tela está quebrada. Cada recusa diz o motivo e, no caso de
   * pendência, **quantos** itens faltam.
   */
  const moverEtapa = (imp: Implantacao, destino: EtapaId): boolean => {
    const de = indiceDaEtapa(imp.etapa);
    const para = indiceDaEtapa(destino);
    if (de === para) return false;

    if (para > de + 1) {
      avisoDeAcao({
        titulo: "Não dá para pular etapa",
        detalhe: `De ${ETAPA_POR_ID[imp.etapa].label} só se vai para ${
          ETAPA_POR_ID[ETAPAS[de + 1].id].label
        }. O checklist do meio existe por algum motivo.`,
        tipo: "warning",
      });
      return false;
    }

    if (para > de) {
      const pendentes = pendenciasObrigatorias(imp);
      if (pendentes.length > 0) {
        avisoFechavel({
          tipo: "warning",
          titulo: IMPLANTACOES_TEXTOS.travadaTitulo,
          detalhe:
            pendentes.length === 1
              ? `Falta: ${pendentes[0].texto}.`
              : `Faltam ${pendentes.length} itens obrigatórios em ${
                  ETAPA_POR_ID[imp.etapa].label
                }.`,
        });
        return false;
      }
    }

    setImplantacoes((atual) =>
      atual.map((i) =>
        i.id !== imp.id
          ? i
          : { ...i, etapa: destino, etapaDesde: new Date().toISOString().slice(0, 10) },
      ),
    );

    avisoDeAcao({
      titulo:
        para > de
          ? `Avançou para ${ETAPA_POR_ID[destino].label}`
          : `Voltou para ${ETAPA_POR_ID[destino].label}`,
      detalhe: `${imp.cliente} · ${imp.id}`,
      tipo: para > de ? "success" : "info",
    });
    return true;
  };

  const abrirEdicao = (i: Implantacao) => {
    setDetalheId(null);
    setEmEdicao(i);
  };

  const colunas = useMemo(
    () =>
      construirColunas({
        onVer: (i) => setDetalheId(i.id),
        onEditar: abrirEdicao,
        onExcluir: (i) => {
          setDetalheId(null);
          setAExcluir(i);
        },
      }),
    [],
  );

  const total = implantacoes.length;
  const emAtraso = implantacoes.filter((i) => atrasada(i)).length;
  const concluidas = implantacoes.filter((i) => concluida(i)).length;
  const investimentoAberto = implantacoes
    .filter((i) => !concluida(i))
    .reduce((s, i) => s + i.investimento, 0);

  const KPIS = [
    { label: "No funil", valor: String(total), hint: `${total - concluidas} em andamento` },
    { label: "Atrasadas", valor: String(emAtraso), hint: "previsão já passou", ruim: emAtraso > 0 },
    { label: "Investimento em aberto", valor: moeda(investimentoAberto), hint: "o que ainda não instalou" },
    { label: "Concluídas", valor: String(concluidas), hint: "carregador publicado" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Implantações"
        description={`${IMPLANTACOES_TEXTOS.aviso} · Três propostas de painel em teste: abra Rede Boa Praça (A), Pousada Serra Azul (B) ou Grupo Via Norte (C).`}
        badge={
          <Chip color="neutral" variant="soft" size="sm" shape="rounded">
            {total} no funil · {emAtraso} {emAtraso === 1 ? "atrasada" : "atrasadas"}
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Plus />}
            onClick={() => setCriando(true)}
          >
            Nova implantação
          </Button>
        }
      />

      {/* ⚠️ `xl:grid-cols-4` e não o default do DS: `columns={4}` emite `lg:grid-cols-4`,
          e a 1024 a coluna nasce com ~171px — estreita demais para o valor em reais.
          Mesma correção do Dashboard. As bordas horizontais também são nossas: o
          `divided` só separa na vertical a partir de `sm`. */}
      <KpiGroup columns={4} divided className="lg:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k, indice) => (
          <Kpi
            key={k.label}
            label={k.label}
            value={
              k.ruim ? <span className="text-fg-danger">{k.valor}</span> : k.valor
            }
            hint={k.hint}
            tone={k.ruim ? "danger" : "neutral"}
            className={
              indice >= 2 ? "sm:border-t xl:border-t-0 border-border-subtle" : ""
            }
          />
        ))}
      </KpiGroup>

      <DataTable<Implantacao>
        rows={implantacoes}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        /* ⚠️ Coluna e cartão MAIORES que o default do Kanban.

           O DS crava `w-[296px]` na coluna e `p-pad-xl` no cartão, sem prop para
           mudar — medido no DOM. Com sete colunas e cartão de seis informações
           (cliente, local, checklist, valor, barra do funil, previsão) 280px de
           cartão espremia tudo; o operador pediu mais ar.

           O gancho é `data-column-id` / `data-card-id`, atributos que o próprio
           componente escreve — não a classe utilitária `w-[296px]`, que é detalhe de
           implementação e muda sem aviso. A especificidade do seletor descendente
           (0,2,0) vence a da classe do DS (0,1,0) sem precisar de `!important`; é a
           saída recomendada pela L-072 para não brigar com o `tailwind-merge`.

           Se o DS parar de emitir esses atributos, o board volta ao tamanho compacto —
           degradação visível, não tela quebrada. */
        className={[
          "flex-1 min-h-0",
          /* Só de `sm` para cima: 344px numa tela de 375 não deixaria ver um cartão
             inteiro sem rolar. No celular vale o 296 do DS, que cabe. */
          "sm:[&_[data-column-id]]:w-[344px]",
          "[&_[data-card-id]]:gap-gp-lg [&_[data-card-id]]:p-pad-2xl",
        ].join(" ")}
        persistId="igreen-mob-cms.implantacoes"
        onRowClick={(row) => setDetalheId(row.id)}
        /* Abre no BOARD: a primeira pergunta de quem entra aqui é "como está o funil",
           e é ela que o Kanban responde. A tabela fica a um clique no segmentado. */
        defaultViewMode="kanban"
        kanbanConfig={{
          groupByField: "etapa",
          columns: COLUNAS_DO_BOARD,
          openCardId: detalheId ?? undefined,
          enableDnD: true,
          onCardMove: (cardId, _de, para) => {
            const imp = implantacoes.find((i) => i.id === cardId);
            if (imp) moverEtapa(imp, para as EtapaId);
          },
          emptyLabel: "Nenhuma nesta etapa",
          hideFooterAdd: true,
          renderCard: ({ row }) => ({
            title: row.cliente,
            subtitle: row.local,
            avatar: (
              <Avatar size="sm" colorHex={corDoAvatar(row.responsavel)} aria-hidden>
                {iniciais(row.responsavel)}
              </Avatar>
            ),
            chip: (
              <Chip
                color={
                  concluida(row) ? "success" : atrasada(row) ? "danger" : "neutral"
                }
                variant="soft"
                size="sm"
                shape="pill"
              >
                {progressoDaEtapa(row).feitos}/{progressoDaEtapa(row).total} no checklist
              </Chip>
            ),
            value: (
              <span className="tabular-nums">{moeda(row.investimento)}</span>
            ),
            footerLeft: (
              /* A barra do funil no rodapé do card responde, sem abrir nada, "quanto
                 desta implantação já está feito" — a coluna diz só onde ela está. */
              <span className="block w-[96px]">
                <BarraDoFunil implantacao={row} />
              </span>
            ),
            footerRight: (
              <span
                className={`text-caption-sm tabular-nums ${
                  atrasada(row) ? "font-semibold text-fg-danger" : "text-fg-muted"
                }`}
              >
                {dataCurta(row.previsaoDeInstalacao)}
              </span>
            ),
          }),
          getCardMenuItems: (row) => [
            { label: "Ver implantação", icon: <Eye />, onClick: () => setDetalheId(row.id) },
            { label: "Editar dados", icon: <Pencil />, onClick: () => abrirEdicao(row) },
            {
              label: "Excluir",
              icon: <Trash2 />,
              destructive: true,
              onClick: () => setAExcluir(row),
            },
          ],
        }}
        toolbar={{
          title: "Todas",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
        }}
        allowCreateView={false}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      {/* ⚠️ Cada proposta é um componente próprio e monta só quando é a vez dela. Um
          painel único com prop `variant` teria os três layouts no mesmo arquivo, e a
          comparação ficaria refém de quem consegue ler condicional aninhada. */}
      {detalhe && proposta === "a" && (
        <PanelCompacto
          implantacao={detalhe}
          onClose={() => setDetalheId(null)}
          onMoverEtapa={(etapa) => moverEtapa(detalhe, etapa)}
          onEditar={abrirEdicao}
          onExcluir={(i) => {
            setDetalheId(null);
            setAExcluir(i);
          }}
        />
      )}
      {detalhe && proposta === "b" && (
        <PanelDuasColunas
          implantacao={detalhe}
          onClose={() => setDetalheId(null)}
          onAlternarItem={(itemId) => alternarItem(detalhe.id, itemId)}
          onMoverEtapa={(etapa) => moverEtapa(detalhe, etapa)}
          onEditar={abrirEdicao}
          onExcluir={(i) => {
            setDetalheId(null);
            setAExcluir(i);
          }}
        />
      )}
      {detalhe && proposta === "c" && (
        <PanelAssistente
          implantacao={detalhe}
          onClose={() => setDetalheId(null)}
          onAlternarItem={(itemId) => alternarItem(detalhe.id, itemId)}
          onMoverEtapa={(etapa) => moverEtapa(detalhe, etapa)}
        />
      )}
      {!proposta && (
        <ImplantacaoDetailPanel
          implantacao={detalhe}
          onClose={() => setDetalheId(null)}
          onAlternarItem={(itemId) => detalhe && alternarItem(detalhe.id, itemId)}
          onMoverEtapa={(etapa) => detalhe && moverEtapa(detalhe, etapa)}
          onEditar={abrirEdicao}
          onExcluir={(i) => {
            setDetalheId(null);
            setAExcluir(i);
          }}
        />
      )}

      <ImplantacaoFormPanel
        implantacao={emEdicao}
        aberto={criando || !!emEdicao}
        onClose={() => {
          setCriando(false);
          setEmEdicao(null);
        }}
        onSalvar={(salva) =>
          setImplantacoes((atual) =>
            atual.some((i) => i.id === salva.id)
              ? atual.map((i) => (i.id === salva.id ? salva : i))
              : [salva, ...atual],
          )
        }
      />

      {aExcluir && (
        <AlertModal
          open
          onOpenChange={(v) => !v && setAExcluir(null)}
          tone="danger"
          title={IMPLANTACOES_TEXTOS.excluirTitulo}
          description={`${aExcluir.cliente} — ${IMPLANTACOES_TEXTOS.excluirDescricao}`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={() => {
            setImplantacoes((atual) => atual.filter((i) => i.id !== aExcluir.id));
            avisoDeExcluido({
              o: "Implantação",
              detalhe: `${aExcluir.cliente} saiu do funil.`,
            });
            setAExcluir(null);
          }}
        />
      )}
    </div>
  );
}
