import { useMemo, useState } from "react";
import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Chip,
  FloatingPanel,
  FloatingPanelSection,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@snksergio/design-system";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@snksergio/design-system/shadcn";
import { locaisDaEmpresa, type NoDaRede } from "./estrutura-mock";

/**
 * Painel de uma empresa — a ficha curta e a lista dos locais dela.
 *
 * ## É a resposta ao problema que a referência tem
 *
 * Lá, abrir uma empresa despeja **28 cards de local** dentro da tabela. A página cresce
 * alguns milhares de pixels, a linha da empresa some do campo de visão e não há como
 * procurar um local sem rolar o conjunto inteiro. O painel troca isso por uma superfície
 * do tamanho certo: ficha em cima, lista com busca embaixo.
 *
 * ## A ficha tem quatro campos, e é de propósito
 *
 * Nome, CNPJ, endereço e responsável — o que identifica a empresa. Tudo o mais (dados
 * bancários, perfil de preço) mora no formulário de edição, que é onde se MEXE nisso. Um
 * painel que mostra tudo vira um formulário somente-leitura, e aí a pessoa abre o de
 * edição só pra conseguir enxergar melhor.
 */

/** Linha da ficha: ícone à esquerda, rótulo, valor à direita — padrão da Gestão de Carga. */
function Propriedade({
  icone: Icone,
  label,
  valor,
}: {
  icone: LucideIcon;
  label: string;
  valor: string;
}) {
  return (
    <>
      <div className="flex min-h-form-md items-center gap-gp-md text-body-sm text-fg-muted">
        <Icone className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex min-h-form-md min-w-0 items-center text-body-sm text-fg-default">
        {valor}
      </div>
    </>
  );
}

/**
 * Larguras da tabela de locais.
 *
 * ⚠️ Constante porque o `Table` do DS posiciona por largura DECLARADA: o `width` da célula
 * tem que ser o MESMO do head, senão as colunas desalinham.
 */
const COL = { nome: 300, cidade: 140, status: 96, acoes: 96 } as const;

/** Quebra em vez de truncar — mesma regra da tabela principal. */
function Quebravel({ children }: { children: string }) {
  return (
    <span className="block whitespace-normal break-words leading-snug">
      {children}
    </span>
  );
}

export function EmpresaDetailPanel({
  empresa,
  onClose,
  onEditarEmpresa,
  onNovoLocal,
  onEditarLocal,
  onExcluirLocal,
}: {
  empresa: NoDaRede | null;
  onClose: () => void;
  onEditarEmpresa: (e: NoDaRede) => void;
  onNovoLocal: (e: NoDaRede) => void;
  onEditarLocal: (l: NoDaRede) => void;
  onExcluirLocal: (l: NoDaRede) => void;
}) {
  const [busca, setBusca] = useState("");

  const locais = useMemo(
    () => (empresa ? locaisDaEmpresa(empresa.id) : []),
    [empresa],
  );

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return locais;
    /* Busca por nome E cidade: numa lista de 17 locais com o mesmo prefixo
       ("IGREEN MOB - …"), procurar pelo nome sozinho quase não recorta. */
    return locais.filter(
      (l) =>
        l.nome.toLowerCase().includes(termo) ||
        (l.cidade ?? "").toLowerCase().includes(termo),
    );
  }, [locais, busca]);

  if (!empresa) return null;
  const e = empresa;

  return (
    <FloatingPanel
      open={!!e}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      /* `xl` = 720px. A tabela de locais tem quatro colunas e o nome é longo; em 560 ela
         viraria scroll horizontal. */
      size="xl"
      resizable
      maximizable
      resizableStorageKey="estrutura.empresa-panel.width"
      bodyPadded={false}
      /* Torna o corpo uma coluna flex pra que a lista de locais ocupe a sobra e role por
         dentro, em vez de deixar vão embaixo. O corpo do `FloatingPanel` é
         `flex-1 min-h-0 overflow-y-auto` e não é flex container — seletor de CLASSE e não
         posicional porque a ordem dos filhos muda com `resizable`/`footer`.
         📋 Lacuna do DS: falta um `bodyClassName`. */
      className="[&>div.overflow-y-auto]:flex [&>div.overflow-y-auto]:flex-col"
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {e.nome}
          </span>
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="tabular-nums">{e.cnpj}</span>
            <span className="opacity-50">·</span>
            <Chip color="neutral" variant="soft" size="sm" shape="pill">
              {locais.length} {locais.length === 1 ? "local" : "locais"}
            </Chip>
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Pencil />}
            onClick={() => onEditarEmpresa(e)}
          >
            Editar empresa
          </Button>
        </>
      }
    >
      <FloatingPanelSection title="Empresa">
        <div className="grid grid-cols-[160px_1fr] items-center gap-x-gp-md">
          <Propriedade icone={Building2} label="Nome" valor={e.nome} />
          <Propriedade icone={Building2} label="CNPJ" valor={e.cnpj} />
          <Propriedade icone={MapPin} label="Endereço" valor={e.endereco} />
          <Propriedade
            icone={UserRound}
            label="Responsável"
            valor={e.responsavel}
          />
          <Propriedade icone={Mail} label="E-mail" valor={e.email} />
        </div>
      </FloatingPanelSection>

      {/* ⚠️ `flex-1 min-h-0` — é ele que faz a lista comer a sobra do painel em vez de
          deixar vão embaixo, e é ele que transfere a rolagem pra ela. Só arma por causa do
          `[&>div.overflow-y-auto]:flex-col` lá em cima. */}
      <div className="flex min-h-[260px] flex-1 flex-col gap-gp-xl border-t border-border-default px-pad-xl py-pad-2xl">
        <div className="flex flex-wrap items-center justify-between gap-gp-md">
          <span className="text-body-md font-semibold text-fg-default">
            Locais
          </span>
          <div className="flex items-center gap-gp-md">
            <InputGroup className="w-[200px]">
              <InputGroupAddon>
                <Search className="size-icon-sm text-fg-subtle" />
              </InputGroupAddon>
              <InputGroupInput
                value={busca}
                onChange={(ev) => setBusca(ev.target.value)}
                placeholder="Buscar local"
                aria-label="Buscar local"
              />
            </InputGroup>
            {/* `md` e não `sm`: ele fica ao lado do campo de busca, que tem altura de
                controle (`form-lg`), e em `sm` sobrava um degrau visível entre os dois.
                E `filled` e não `outline`: é a ação primária deste bloco. */}
            <Button
              variant="filled"
              color="primary"
              size="md"
              iconLeft={<Plus />}
              onClick={() => onNovoLocal(e)}
            >
              Novo local
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto rounded-radius-lg border border-border-default">
          {visiveis.length === 0 ? (
            <p className="p-pad-4xl text-center text-body-sm text-fg-muted">
              {locais.length === 0
                ? "Esta empresa ainda não tem locais."
                : "Nenhum local encontrado para esta busca."}
            </p>
          ) : (
            /* `Table` do DS, não `<table>` na unha: o cabeçalho sticky dele já traz camada
               e fundo próprios, e as linhas não passam por cima ao rolar.

               `comfortable` (64px) porque o nome do local QUEBRA em duas linhas em vez de
               truncar — informação de cadastro cortada não serve. */
            <Table density="comfortable" ariaLabel={`Locais de ${e.nome}`}>
              <TableHead>
                <TableHeadCell field="nome" width={COL.nome}>
                  Local
                </TableHeadCell>
                <TableHeadCell field="cidade" width={COL.cidade}>
                  Cidade
                </TableHeadCell>
                <TableHeadCell field="status" width={COL.status}>
                  Status
                </TableHeadCell>
                <TableHeadCell field="acoes" width={COL.acoes} align="right">
                  Ações
                </TableHeadCell>
              </TableHead>
              <TableBody>
                {visiveis.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell field="nome" width={COL.nome}>
                      <Quebravel>{l.nome}</Quebravel>
                    </TableCell>
                    <TableCell field="cidade" width={COL.cidade}>
                      <span className="block whitespace-normal break-words leading-snug text-fg-muted">
                        {l.cidade}/{l.uf}
                      </span>
                    </TableCell>
                    <TableCell field="status" width={COL.status}>
                      <Chip
                        color={l.ativo ? "success" : "neutral"}
                        variant="soft"
                        size="sm"
                        shape="pill"
                      >
                        {l.ativo ? "Ativo" : "Inativo"}
                      </Chip>
                    </TableCell>
                    <TableCell field="acoes" width={COL.acoes} align="right">
                      <span className="flex justify-end gap-gp-xs">
                        <Button
                          variant="ghost"
                          color="secondary"
                          size="icon-sm"
                          aria-label={`Editar ${l.nome}`}
                          onClick={() => onEditarLocal(l)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          color="critical"
                          size="icon-sm"
                          aria-label={`Excluir ${l.nome}`}
                          onClick={() => onExcluirLocal(l)}
                        >
                          <Trash2 />
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </FloatingPanel>
  );
}
