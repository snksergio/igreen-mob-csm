import {
  Building2,
  MapPin,
  Network,
  Pencil,
  Plus,
  Trash2,
  List as ListIcon,
} from "lucide-react";
import {
  Chip,
  actionColumn,
  type DataTableActionItem,
  type DataTableColumnDef,
} from "@snksergio/design-system";
import { locaisDaEmpresa, type NivelDaRede, type NoDaRede } from "./estrutura-mock";

/**
 * Quebra a linha em vez de truncar.
 *
 * ⚠️ **Nenhuma coluna desta tabela usa `ellipsis`**, e é decisão do operador
 * (2026-09-16): endereço e nome de local cortados em "…" deixam a linha ilegível, e esta
 * é uma tela de CADASTRO — quem chega aqui precisa ler o registro inteiro, não reconhecê-lo
 * de relance.
 *
 * O preço é a linha ficar mais alta, e é por isso que a tabela usa `density="comfortable"`
 * (64px): duas linhas de 13px cabem, e o `h-[64px]` do `Table` do DS é altura FIXA — texto
 * que passasse disso seria cortado pelo container, que é o defeito que o truncamento pelo
 * menos anuncia.
 */
function Quebravel({ children }: { children: string }) {
  return (
    <span className="block whitespace-normal break-words leading-snug">
      {children}
    </span>
  );
}

/**
 * Colunas da árvore — as cinco da referência mais as ações.
 *
 * ## O ícone de nível carrega o que a indentação sozinha não diz
 *
 * A árvore já indenta, mas indentação responde "quem está dentro de quem", não "o que é
 * isto". Rede, empresa e local são coisas de natureza diferente e têm ações diferentes;
 * sem o ícone, a linha de um local com 2 níveis de recuo é só um texto deslocado.
 *
 * ## As ações mudam com o nível, e é isso que a coluna resolve
 *
 * | nível | ações |
 * |---|---|
 * | rede | adicionar empresa |
 * | empresa | ver locais (painel) · editar · adicionar local |
 * | local | editar · excluir |
 *
 * ⚠️ **A rede não tem excluir.** Apagar a raiz apagaria o cadastro inteiro, e um botão de
 * lixeira ao lado de tudo o mais convida ao clique errado. Se um dia for preciso, não é
 * uma lixeira de linha — é outro fluxo, com outro nome.
 */

const ICONE_DO_NIVEL: Record<NivelDaRede, typeof Network> = {
  rede: Network,
  empresa: Building2,
  local: MapPin,
};

const ROTULO_DO_NIVEL: Record<NivelDaRede, string> = {
  rede: "Rede",
  empresa: "Empresa",
  local: "Local",
};

export interface AcoesDaEstrutura {
  onVerLocais: (empresa: NoDaRede) => void;
  onEditar: (no: NoDaRede) => void;
  onExcluir: (no: NoDaRede) => void;
  onNovaEmpresa: (rede: NoDaRede) => void;
  onNovoLocal: (empresa: NoDaRede) => void;
}

export function construirColunas(
  acoes: AcoesDaEstrutura,
): DataTableColumnDef<NoDaRede>[] {
  return [
    {
      field: "nome",
      headerName: "Nome",
      type: "text",
      /* ⚠️ `treeColumn` é o que põe a indentação e o chevron AQUI. Sem nenhuma coluna
         marcada, o `DataTable` escolhe a primeira não-`actions` — que por acaso seria esta
         mesma, mas por acaso não é contrato. */
      treeColumn: true,
      isPrimary: true,
      /* ⚠️ As larguras desta tabela são MEDIDAS: as seis somavam 1254 numa área útil de
         1100, e o e-mail saía cortado em "ren…". Agora somam 1096.

         280 é a maior do grupo de texto porque esta coluna carrega indentação de até três
         níveis, ícone, nome e chip — e agora o nome QUEBRA em vez de truncar, então ela
         precisa comportar duas linhas do nome mais longo. */
      width: 250,
      render: ({ row }) => {
        const Icone = ICONE_DO_NIVEL[row.nivel];
        const locais = row.nivel === "empresa" ? locaisDaEmpresa(row.id).length : 0;
        return (
          <span className="flex min-w-0 items-center gap-gp-md">
            <Icone
              className="size-icon-sm shrink-0 text-fg-subtle"
              aria-label={ROTULO_DO_NIVEL[row.nivel]}
            />
            <Quebravel>{row.nome}</Quebravel>
            {/* A contagem só na empresa: é ela que responde "quantos locais tenho?", que
                é a pergunta que traz alguém a esta tela. */}
            {locais > 0 && (
              <Chip color="neutral" variant="soft" size="sm" shape="pill">
                {locais} {locais === 1 ? "local" : "locais"}
              </Chip>
            )}
            {row.nivel === "local" && !row.ativo && (
              <Chip color="neutral" variant="soft" size="sm" shape="pill">
                Inativo
              </Chip>
            )}
          </span>
        );
      },
    },
    {
      field: "cnpj",
      headerName: "CNPJ",
      type: "text",
      copyable: true,
      /* 184, MEDIDO depois de cortar: em 150 o valor saía `10.000.137/00…`. `10.000.137/0001-00`
         em tabular desenha ~124px, mais o ícone de copiar (~28) e o padding da célula (32).

         ⚠️ Esta é a única coluna que NÃO quebra linha, e é de propósito: `break-words` num
         número partiria `10.000.137/` + `0001-00` em duas linhas, e CNPJ quebrado no meio
         é pior que CNPJ truncado — parece outro número. Aqui a resposta é largura. */
      width: 184,
      render: ({ row }) => <span className="tabular-nums">{row.cnpj}</span>,
    },
    {
      field: "endereco",
      headerName: "Endereço",
      type: "text",
      /* 220 com QUEBRA: o endereço mais longo tem ~50 caracteres, o que em 13px dá ~330px
         — duas linhas de 220 sobram. É o campo que mais se beneficia de não truncar,
         porque endereço pela metade não serve pra nada. */
      width: 220,
      render: ({ row }) => <Quebravel>{row.endereco}</Quebravel>,
    },
    {
      field: "responsavel",
      headerName: "Responsável",
      type: "text",
      /* 134 é o PISO: "Responsável" desenha 80px e o `TableHeadCell` reserva outros 54 pra
         sort e menu (L-052b). O nome mais longo cabe em duas linhas. */
      width: 134,
      render: ({ row }) => <Quebravel>{row.responsavel}</Quebravel>,
    },
    {
      field: "email",
      headerName: "E-mail",
      type: "text",
      copyable: true,
      /* 160: "renata@exemplo.com.br" desenha ~140px e cabe numa linha; o ícone de copiar
         divide o espaço. Quebra se o domínio crescer, em vez de sumir com o fim. */
      width: 160,
      render: ({ row }) => <Quebravel>{row.email}</Quebravel>,
    },
    /* ⚠️ **`actionColumn` + `getActions`, e NÃO um objeto na unha com `render`.** Era o
       que estava aqui, e o `USAGE.md` do `DataTable` nomeia o sintoma exato que apareceu:
       "o botão de ação ficou no meio da tabela".

       A causa é que as três garantias da coluna de ações vêm do `type` resolvido pelo
       `use-data-table-columns`, e um `render` próprio passa por fora delas:

       | garantia | com `render` | com `getActions` |
       |---|---|---|
       | vai pro fim da tabela | não | sim |
       | ancora à direita (`pinned: "right"`) | não | sim |
       | fica fora do rateio do `autoFit` | **não** — medido no DS: 120 declarados viram 220 | sim |

       `hidden` por row é o que permite ação diferente por nível sem três colunas: o
       componente resolve antes de contar, então a rede renderiza 1 ícone e a empresa 3. */
    actionColumn<NoDaRede>({
      /* ⚠️ Largura DECLARADA porque os botões saíram do default. O `actionColumn` deriva a
         largura de `30n + 14` supondo ícone de 28px; os nossos têm 32, e na linha da
         empresa (três ações) os três eram espremidos de volta pra 28 — medido. 124 = 3 × 32
         + os dois gaps + o padding da célula. */
      width: 124,
      getActions: ({ row }): DataTableActionItem<NoDaRede>[] => [
        {
          id: "nova-empresa",
          label: "Adicionar empresa",
          icon: <Plus />,
          hidden: row.nivel !== "rede",
          onClick: acoes.onNovaEmpresa,
        },
        {
          id: "ver-locais",
          label: "Ver locais da empresa",
          icon: <ListIcon />,
          hidden: row.nivel !== "empresa",
          onClick: acoes.onVerLocais,
        },
        {
          id: "editar",
          label: row.nivel === "local" ? "Editar local" : "Editar empresa",
          icon: <Pencil />,
          /* A rede não se edita por aqui — ela é a raiz, e o formulário de empresa não
             serve pra ela. */
          hidden: row.nivel === "rede",
          onClick: acoes.onEditar,
        },
        {
          id: "novo-local",
          label: "Adicionar local",
          icon: <Plus />,
          hidden: row.nivel !== "empresa",
          onClick: acoes.onNovoLocal,
        },
        {
          id: "excluir",
          label: "Excluir local",
          icon: <Trash2 />,
          destructive: true,
          /* ⚠️ A rede NÃO tem excluir: apagar a raiz apagaria o cadastro inteiro, e uma
             lixeira ao lado de tudo o mais convida ao clique errado. A empresa também
             não, pelo mesmo motivo em escala menor — ela leva 17 locais junto. Se um dia
             for preciso, não é lixeira de linha: é outro fluxo, com outro nome. */
          hidden: row.nivel !== "local",
          onClick: acoes.onExcluir,
        },
      ],
    }),
  ];
}
