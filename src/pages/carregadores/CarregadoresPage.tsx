import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button, Chip, DataTable, PageHeader } from "@snksergio/design-system";
import { PERFIS_DE_PRECO, type PerfilDePreco } from "~/pages/precos/precos-mock";
import { PrecoDetailPanel } from "~/pages/precos/PrecoDetailPanel";
import { CARREGADORES, type Carregador } from "./carregadores-mock";
import { construirColunas } from "./carregadores-columns";
import { CarregadorDetailPanel } from "./CarregadorDetailPanel";
import { ModalExcluirCarregador } from "./carregadores-modais";
import { ModalAdicionarCarregador } from "./ModalAdicionarCarregador";
import {
  ALTURA_DE_TABELA,
  RAIZ_DE_PAGINA,
} from "~/components/altura-de-tabela";

/**
 * Tela de Carregadores — medida em `/pt/chargers?page=1` (2026-09-16).
 *
 * Sexta tela de tabela do produto, e a mais larga: nove colunas. Segue o mesmo esqueleto das
 * outras cinco — `PageHeader` com contagem e ação, `DataTable` com `flex-1 min-h-0`, painel
 * aberto por clique na linha, `toolbar.title` nomeando a visão única.
 *
 * ## Duas telas conversando
 *
 * O link `Perfil padrão` da coluna Preço abre o **painel de Preços**, o mesmo componente da
 * tela de Preços — não uma cópia. É o que garante que editar o preço a partir daqui e a
 * partir de lá sejam a mesma coisa.
 *
 * ⚠️ Os dois painéis podem estar abertos ao mesmo tempo (o de preço por cima do de
 * carregador), e é intencional: quem chegou no preço vindo do carregador quer voltar pro
 * carregador ao fechar, não pra lista.
 */
export function CarregadoresPage() {
  const [emEdicao, setEmEdicao] = useState<Carregador | null>(null);
  const [excluindo, setExcluindo] = useState<Carregador | null>(null);
  const [perfilAberto, setPerfilAberto] = useState<PerfilDePreco | null>(null);
  const [adicionando, setAdicionando] = useState(false);

  /**
   * Resolve o perfil de preço a abrir.
   *
   * Casa pelo LOCAL primeiro: o perfil de preço pertence a um local, e todos se chamam
   * "Perfil padrão", então o nome sozinho não identifica qual. Sem correspondência de local,
   * cai no primeiro com aquele nome — é mock, e o painel é o mesmo.
   */
  const abrirPerfil = (nome: string, local?: string) => {
    const porLocal = local
      ? PERFIS_DE_PRECO.find((p) => p.local === local && p.nome === nome)
      : undefined;
    setPerfilAberto(
      porLocal ?? PERFIS_DE_PRECO.find((p) => p.nome === nome) ?? null,
    );
  };

  const colunas = useMemo(
    () =>
      construirColunas({
        onEditar: setEmEdicao,
        onExcluir: setExcluindo,
        onAbrirPerfil: (row) =>
          abrirPerfil(row.perfilDePreco ?? "", row.local),
      }),
    [],
  );

  return (
    <div className={RAIZ_DE_PAGINA}>
      <PageHeader
        title="Carregadores"
        /* Texto literal da referência — o aviso recorrente do escopo global. */
        description="Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página."
        badge={
          <Chip color="primary" variant="soft" size="sm" shape="rounded">
            {CARREGADORES.length} carregadores
          </Chip>
        }
        actions={
          <Button
            variant="filled"
            color="primary"
            size="md"
            iconLeft={<Plus />}
            onClick={() => setAdicionando(true)}
          >
            Adicionar carregador
          </Button>
        }
      />

      <DataTable<Carregador>
        rows={CARREGADORES}
        columns={colunas}
        getRowId={(r) => r.id}
        autoFit
        /* ⚠️ `flex-1 min-h-0` é o que mantém a paginação sempre visível — mesmo idiom das
           outras cinco telas de tabela. */
        className={ALTURA_DE_TABELA}
        persistId="igreen-mob-cms.carregadores"
        allowCreateView={false}
        onRowClick={(row) => setEmEdicao(row)}
        toolbar={{
          /* `soloLabel` da barra de visões — padrão deste projeto. */
          title: "Todos os carregadores",
          enableSearch: true,
          enableFilters: true,
          enableColumns: true,
          enableDensity: true,
          enableExport: true,
        }}
        paginationConfig={{
          enabled: true,
          /* 10 por página, como a referência — que mostra "1 de 4". */
          initialPageSize: 10,
          pageSizeOptions: [10, 20, 50],
        }}
      />

      <CarregadorDetailPanel
        carregador={emEdicao}
        onClose={() => setEmEdicao(null)}
        onAbrirPerfil={(nome) => abrirPerfil(nome, emEdicao?.local)}
        onExcluir={(c) => setExcluindo(c)}
      />

      {/* O painel de PREÇO é o mesmo componente da tela de Preços — ver o JSDoc. */}
      <PrecoDetailPanel
        perfil={perfilAberto}
        onClose={() => setPerfilAberto(null)}
      />

      {adicionando && (
        <ModalAdicionarCarregador
          open
          onClose={() => setAdicionando(false)}
        />
      )}

      {excluindo && (
        <ModalExcluirCarregador
          carregador={excluindo}
          open
          onClose={() => setExcluindo(null)}
        />
      )}
    </div>
  );
}
