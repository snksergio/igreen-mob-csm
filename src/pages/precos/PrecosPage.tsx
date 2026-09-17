import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  PageHeader,
} from "@snksergio/design-system";
import { PERFIS_DE_PRECO, type PerfilDePreco } from "./precos-mock";
import { construirColunas } from "./precos-columns";
import { PrecoDetailPanel } from "./PrecoDetailPanel";
import { ModalCriarPerfil } from "./precos-modais";

/**
 * Tela de Preços — medida em `/pt/price?page=1` (2026-09-16).
 *
 * Quinta tela de tabela do produto, e segue o padrão já fechado por Transações, Repasses e
 * Gestão de Carga: `PageHeader` com contagem + ação, `DataTable` com `flex-1 min-h-0`,
 * painel de edição aberto pelo clique na linha e pela ação da coluna.
 *
 * ## Sem recorte de tempo, como Gestão de Carga
 *
 * Perfil de preço é configuração vigente, não histórico — não há período a filtrar. Por isso
 * o `toolbar.customLeft` fica vazio aqui, diferente de Transações (intervalo), Performance
 * (intervalo) e Repasses (ano).
 *
 * ## Sem visões salvas, então a aba única tem nome
 *
 * `toolbar.title` vira o `soloLabel` da barra de visões: "Perfis de preço" em vez do
 * literal "Default", que não diria nada sobre o que está na tela. Padrão deste projeto.
 *
 * ## Criar é modal; editar é painel
 *
 * Não é inconsistência — é a diferença entre as duas tarefas. Criar são quatro campos que
 * terminam num `Salvar`: interrompe e volta. Editar é trabalho longo, em três abas, com três
 * botões de salvar independentes e um modal de regra por dentro — isso é painel, e fechá-lo
 * não pode depender de ter terminado.
 */
export function PrecosPage() {
  const [emEdicao, setEmEdicao] = useState<PerfilDePreco | null>(null);
  const [criando, setCriando] = useState(false);

  const colunas = useMemo(
    () => construirColunas({ onEditar: setEmEdicao }),
    [],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-gp-2xl">
      <PageHeader
        title="Preços"
        /* Texto literal da referência — o aviso recorrente do escopo global. */
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {PERFIS_DE_PRECO.length}{" "}
            {PERFIS_DE_PRECO.length === 1 ? "perfil" : "perfis"}
          </Chip>
        }
        /* Na referência o `Criar novo perfil` fica acima da tabela, à esquerda. Aqui vai pro
           `PageHeader`, que é onde as outras quatro telas põem a ação de página — e é o que
           mantém o topo com um só nível de comando. */
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Plus />}
            onClick={() => setCriando(true)}
          >
            Criar novo perfil
          </Button>
        }
      />

      <DataTable<PerfilDePreco>
        rows={PERFIS_DE_PRECO}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        /* ⚠️ `flex-1 min-h-0` é o que mantém a paginação sempre visível — o mecanismo interno
           do `DataTable` só ARMA quando a raiz tem altura limitada. Mesmo idiom das outras
           quatro telas de tabela. */
        className="flex-1 min-h-0"
        persistId="igreen-mob-cms.precos"
        allowCreateView={false}
        onRowClick={(row) => setEmEdicao(row)}
        toolbar={{
          /* `soloLabel` da barra de visões — ver o JSDoc. */
          title: "Perfis de preço",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
        }}
        paginationConfig={{
          enabled: true,
          /* 10 por página, como a referência — que mostra "1 de 5" pra ≈50 perfis. */
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <PrecoDetailPanel perfil={emEdicao} onClose={() => setEmEdicao(null)} />

      {criando && (
        <ModalCriarPerfil open onClose={() => setCriando(false)} />
      )}
    </div>
  );
}
