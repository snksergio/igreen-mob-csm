import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, Info } from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  DatePicker,
  Modal,
  PageHeader,
  type DataTableColumnDef,
  type DateRange,
} from "@snksergio/design-system";
import { Checkbox } from "@snksergio/design-system/shadcn";
import {
  EXPORTAR,
  MOTORISTAS,
  MOTORISTAS_TEXTOS,
  formatarDuracao,
  type Motorista,
} from "./motoristas-mock";
import { CelulaDeMotorista, Tags } from "./motoristas-ui";
import { MotoristaDetailPanel } from "./MotoristaDetailPanel";

/**
 * Tela de Motoristas — medida em `/pt/drivers?page=1` (2026-09-16).
 *
 * Sétima tela de tabela, e a que mais tinha controle solto acima da grade. Os três voltaram
 * pro lugar que o projeto já usa:
 *
 * | na origem | aqui |
 * |---|---|
 * | select `Filtrar por tags` | **chip de filtro** pré-declarado na barra |
 * | `Data Inicial` + `Data Final` | **`DatePicker` range** no `toolbar.customLeft`, ao lado da busca |
 * | botão `Baixar dados` à esquerda | ação do `PageHeader`, abrindo o modal de exportação |
 *
 * ⚠️ **`Tags de preço` foi removido**, como combinado: ele abre um cadastro que não pertence
 * a esta tela, e um botão que leva pra outro lugar no meio da barra de ações da lista é o
 * tipo de coisa que se clica sem querer.
 *
 * ## Duas colunas da referência não estão aqui
 *
 * - **`E-mail`** virou a segunda linha da célula de `Usuários`, no desenho da coluna
 *   `Licenciado` do app de Finanças do DS. Mantê-la separada mostraria o mesmo e-mail duas
 *   vezes na mesma linha.
 * - **`Complemento`** saiu da tabela e ficou só no painel. Ela é campo livre, está vazia em
 *   10/10 linhas da origem, e custava 144px — mais que `Energia` — pra exibir um travessão.
 *   Com ela, `CPF` e `Telefone` não cabiam e saíam cortados; sem ela, cabem os dois.
 */

function construirColunas(): DataTableColumnDef<Motorista>[] {
  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return [
    {
      field: "nome",
      headerName: "Usuários",
      type: "text",
      ellipsis: true,
      isPrimary: true,
      /* ⚠️ As larguras desta tabela são MEDIDAS, não escolhidas: somadas com os valores
         que eu tinha posto davam 1652px numa área útil de 1356 — 296px de scroll
         horizontal. O piso de cada coluna é o texto do header MAIS o que o `TableHeadCell`
         reserva pra sort e menu (L-052b), medido em 54px nas de texto e 33px nas numéricas.

         Mais larga que as outras porque carrega DUAS linhas — nome e e-mail — no desenho
         da coluna `Licenciado` do app de Finanças do DS. Os 136px que a coluna `E-mail`
         tinha vieram pra cá: ela deixou de existir, senão o e-mail apareceria duas vezes
         na mesma linha. */
      width: 276,
      /* Com o e-mail dentro desta célula, é o `valueGetter` que mantém a busca do toolbar
         encontrando por e-mail — sem ele, digitar o domínio não acharia ninguém. */
      valueGetter: (row) => `${row.nome} ${row.email}`,
      render: ({ row }) => (
        <CelulaDeMotorista nome={row.nome} email={row.email} />
      ),
    },
    {
      field: "cpf",
      headerName: "CPF",
      type: "text",
      copyable: true,
      /* 148: `000.000.000-00` desenha ~96px e a célula ainda carrega o ícone de copiar. Em
         120 ele saía como `331.711…` — CPF cortado é pior que CPF ausente, porque parece
         um número e não é. */
      width: 148,
      render: ({ row }) => <span className="tabular-nums">{row.cpf}</span>,
    },
    {
      field: "tags",
      headerName: "Tags",
      width: 96,
      /* Chip de filtro pré-declarado — é o que substitui o select `Filtrar por tags`.

         ⚠️ `Sem tag` no lugar da string vazia: com `""` o `DataTable` não monta opção pro
         valor e o filtro fica sem metade das linhas. E `sortable` fica LIGADO — ordenar por
         tag é o que agrupa quem tem a mesma, que é justamente o que se quer numa coluna
         dessas. */
      enableColumnFilter: true,
      filterType: "select",
      valueGetter: (row) => row.tags[0] ?? "Sem tag",
      render: ({ row }) => <Tags tags={row.tags} />,
    },
    {
      field: "telefone",
      headerName: "Telefone",
      type: "text",
      copyable: true,
      /* 152: `(34) 98729-1234` é o formato mais longo, e também tem ícone de copiar. */
      width: 152,
      render: ({ row }) => <span className="tabular-nums">{row.telefone}</span>,
    },
    {
      field: "carregadores",
      headerName: "Carregadores",
      align: "right",
      width: 120,
      sortable: true,
      render: ({ row }) => (
        <span className="tabular-nums">{row.carregadores}</span>
      ),
    },
    {
      field: "transacoes",
      headerName: "Transações",
      align: "right",
      width: 108,
      sortable: true,
      render: ({ row }) => (
        <span className="tabular-nums">{row.transacoes}</span>
      ),
    },
    {
      field: "energiaKwh",
      headerName: "Energia",
      align: "right",
      width: 104,
      sortable: true,
      render: ({ row }) => (
        <span className="tabular-nums">
          {row.energiaKwh.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}{" "}
          kWh
        </span>
      ),
    },
    {
      field: "duracaoMin",
      headerName: "Duração",
      align: "right",
      width: 92,
      sortable: true,
      render: ({ row }) => (
        <span className="tabular-nums">{formatarDuracao(row.duracaoMin)}</span>
      ),
    },
    {
      field: "valor",
      headerName: "Valor",
      type: "currency",
      align: "right",
      width: 96,
      sortable: true,
      /* Verde só quando há valor — zero em verde diria "entrou dinheiro" sobre uma recarga
         que não cobrou nada. Mesma regra da potência em Gestão de Carga. */
      render: ({ row }) => (
        <span
          className={`tabular-nums font-semibold ${
            row.valor > 0 ? "text-fg-success" : "text-fg-muted"
          }`}
        >
          {brl.format(row.valor)}
        </span>
      ),
    },
  ];
}

/**
 * Modal de exportação.
 *
 * Os dois formatos são ações irmãs, não uma principal e uma secundária — por isso os dois
 * são `outline` do mesmo peso, e não há botão primário no rodapé. Escolher o formato É
 * confirmar a exportação.
 */
function ModalExportar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [incluirLocais, setIncluirLocais] = useState(true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={EXPORTAR.titulo}
      icon={<Download className="size-icon-md" strokeWidth={1.7} />}
      size="md"
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
      }
    >
      {/* A opção vem ANTES dos botões: ela muda o que vai no arquivo, e depois deles seria
          uma escolha oferecida tarde demais. */}
      <label
        htmlFor="incluir-locais"
        className={`flex cursor-pointer items-start gap-gp-md rounded-radius-lg border p-pad-2xl transition-colors ${
          incluirLocais
            ? "border-border-brand bg-bg-success-muted"
            : "border-border-default bg-bg-surface hover:bg-bg-muted"
        }`}
      >
        <Checkbox
          id="incluir-locais"
          checked={incluirLocais}
          onCheckedChange={(v) => setIncluirLocais(v === true)}
          className="mt-[2px]"
        />
        <span className="flex min-w-0 flex-col gap-gp-2xs">
          <span className="text-body-sm font-semibold text-fg-default">
            {EXPORTAR.incluirLocais}
          </span>
          <span className="text-caption-md text-fg-muted">
            {EXPORTAR.incluirLocaisAjuda}
          </span>
        </span>
      </label>

      <div className="grid grid-cols-1 gap-gp-md sm:grid-cols-2">
        <Button
          variant="outline"
          color="primary"
          size="md"
          iconLeft={<FileSpreadsheet />}
          onClick={onClose}
        >
          {EXPORTAR.csv}
        </Button>
        <Button
          variant="outline"
          color="primary"
          size="md"
          iconLeft={<FileText />}
          onClick={onClose}
        >
          {EXPORTAR.pdf}
        </Button>
      </div>
    </Modal>
  );
}

export function MotoristasPage() {
  const [detalhe, setDetalhe] = useState<Motorista | null>(null);
  const [exportando, setExportando] = useState(false);
  /* Mesmo recorte default da referência: do dia 1 até hoje. */
  const [periodo, setPeriodo] = useState<DateRange | undefined>({
    from: new Date("2026-09-01T00:00:00"),
    to: new Date("2026-09-16T23:59:00"),
  });

  const colunas = useMemo(construirColunas, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Motoristas"
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {MOTORISTAS.length} motoristas
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Download />}
            onClick={() => setExportando(true)}
          >
            {MOTORISTAS_TEXTOS.baixarDados}
          </Button>
        }
      />

      {/* Aviso literal da origem. Fica fora do `PageHeader` porque diz respeito ao RECORTE
          da lista — quem está nela precisa saber que só vê quem recarregou nos locais do
          escopo, e não que a página inteira depende do seletor. */}
      <p className="flex items-start gap-gp-sm text-caption-md text-fg-muted">
        <Info className="mt-[1px] size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
        {MOTORISTAS_TEXTOS.aviso}
      </p>

      <DataTable<Motorista>
        rows={MOTORISTAS}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        className="flex-1 min-h-0"
        persistId="igreen-mob-cms.motoristas"
        allowCreateView={false}
        showEmptyFilterChips={["tags"]}
        onRowClick={(row) => setDetalhe(row)}
        toolbar={{
          title: "Todos os motoristas",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
          /* Recorte de tempo no toolbar, ao lado da busca — padrão deste projeto, o mesmo
             de Transações e Repasses. */
          customLeft: (
            <DatePicker
              mode="range"
              value={periodo}
              onValueChange={setPeriodo}
              placeholder="Período"
              className="w-[260px]"
            />
          ),
        }}
        paginationConfig={{
          enabled: true,
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <MotoristaDetailPanel
        motorista={detalhe}
        onClose={() => setDetalhe(null)}
      />

      {exportando && (
        <ModalExportar open onClose={() => setExportando(false)} />
      )}
    </div>
  );
}
