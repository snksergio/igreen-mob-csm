import { Building2, MapPin, Network, Pencil, Plus, Trash2, List as ListIcon } from "lucide-react";
import { Button, Chip } from "@snksergio/design-system";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@snksergio/design-system/shadcn";
import { locaisDaEmpresa, type NivelDaRede, type NoDaRede } from "./estrutura-mock";
import type { AcoesDaEstrutura } from "./estrutura-columns";

/**
 * O card da visão em LISTA — o miolo de cada item, via `listConfig.renderItem`.
 *
 * ## Por que o `DataTable` e não um `List` solto
 *
 * A primeira versão desta visão era um componente à parte com `List` + toolbar própria.
 * Funcionava e tinha dois defeitos que só somem indo pro `listConfig`:
 *
 * 1. **Duas toolbars.** Busca, expandir e recolher existiam duas vezes, com dois estados.
 *    Aqui o `DataTable` mantém a MESMA toolbar nas duas visões e só troca o corpo — e o
 *    toggle Tabela/Lista é nativo dela.
 * 2. **O efeito escada.** Os slots do `List` (`meta`, `trailing`) são `shrink-0`, e o card
 *    tem `min-width: auto` — medido, a linha mais longa travava em 1102px de min-content e
 *    vazava 48px da indentação, enquanto as curtas encolhiam. Com `renderItem` eu desenho o
 *    miolo inteiro, então as colunas viram um **grid** e o que sobra encolhe.
 *
 * ## O grid é o que alinha
 *
 * ⚠️ `grid-cols-[minmax(0,1fr)_150px_240px_150px_196px]` — a primeira coluna é a única
 * elástica, e `minmax(0,...)` é o que permite ela encolher de verdade (sem o `0`, o mínimo
 * seria `auto` = min-content, que é exatamente a armadilha que travava o card antes).
 *
 * As quatro seguintes são fixas, então CNPJ, endereço, responsável e as ações caem no mesmo
 * x em todas as linhas — independentemente de quantos níveis de indentação a linha tem,
 * porque a indentação encolhe só a primeira coluna.
 *
 * ## ⚠️ No celular são DUAS colunas, não cinco
 *
 * As três `Coluna` são `hidden md:flex` desde o começo — mas isso escondia o CONTEÚDO e
 * deixava as PISTAS de pé. O grid seguia pedindo `150px + 240px + 150px + 196px` = 736px
 * de trilhas fixas, mais quatro gaps de 32px, dentro de um card de 339px. A única trilha
 * elástica ficava com o que sobrava de um número negativo: o nome e o e-mail espremidos a
 * poucos pixels e os botões de ação empurrados para fora da tela.
 *
 * Era isso que o operador viu no celular como "a visão de lista está completamente
 * bugada" — e não dava para atribuir ao `DataTable`: a conta errada é deste arquivo.
 *
 * Abaixo de `md` o grid tem duas trilhas — identidade e ações — e o gap cai de `3xl` para
 * `lg`. As três `Coluna` continuam `display:none`, que o grid remove da caixa: elas não
 * consomem célula e não empurram nada para uma segunda linha implícita.
 */

const ICONE_DO_NIVEL: Record<NivelDaRede, typeof Network> = {
  rede: Network,
  empresa: Building2,
  local: MapPin,
};

/** Rótulo de coluna, no desenho do `meta` do `List`. */
function Coluna({ label, valor }: { label: string; valor: string }) {
  return (
    /* `hidden md:flex` copia o comportamento do `meta` do `List`: em tela estreita as
       colunas somem e sobra o essencial. Nada crítico mora só aqui — nome e e-mail
       ficam na primeira coluna, que nunca some. */
    <div className="hidden min-w-0 flex-col gap-gp-2xs md:flex">
      <span className="text-caption-sm font-semibold uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <span className="truncate text-body-sm text-fg-default" title={valor}>
        {valor}
      </span>
    </div>
  );
}

/** Botão de ação — o peso que o operador pediu: `soft`, 32px, cor por papel. */
function AcaoDeIcone({
  rotulo,
  icone: Icone,
  cor = "secondary",
  onClick,
}: {
  rotulo: string;
  icone: typeof Pencil;
  cor?: "secondary" | "primary" | "critical";
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="soft"
          color={cor}
          size="icon-sm"
          aria-label={rotulo}
          onClick={(e) => {
            /* Sem isto o clique sobe pro card e a ação dispara junto com a abertura do
               painel — dois efeitos por um clique. */
            e.stopPropagation();
            onClick();
          }}
        >
          <Icone />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{rotulo}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Ações de um nó — as MESMAS da tabela, na mesma ordem.
 *
 * Exportado porque a coluna de ações da tabela e o card da lista precisam concordar: se um
 * dia divergirem, a mesma linha passa a oferecer coisas diferentes dependendo da visão.
 */
export function AcoesDoNo({
  no,
  acoes,
}: {
  no: NoDaRede;
  acoes: AcoesDaEstrutura;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-gp-sm">
      {no.nivel === "rede" && (
        <AcaoDeIcone
          rotulo="Adicionar empresa"
          icone={Plus}
          cor="primary"
          onClick={() => acoes.onNovaEmpresa(no)}
        />
      )}
      {no.nivel === "empresa" && (
        <>
          <AcaoDeIcone
            rotulo="Ver locais da empresa"
            icone={ListIcon}
            onClick={() => acoes.onVerLocais(no)}
          />
          <AcaoDeIcone
            rotulo="Editar empresa"
            icone={Pencil}
            onClick={() => acoes.onEditar(no)}
          />
          <AcaoDeIcone
            rotulo="Adicionar local"
            icone={Plus}
            cor="primary"
            onClick={() => acoes.onNovoLocal(no)}
          />
        </>
      )}
      {no.nivel === "local" && (
        <>
          <AcaoDeIcone
            rotulo="Editar local"
            icone={Pencil}
            onClick={() => acoes.onEditar(no)}
          />
          <AcaoDeIcone
            rotulo="Excluir local"
            icone={Trash2}
            cor="critical"
            onClick={() => acoes.onExcluir(no)}
          />
        </>
      )}
    </div>
  );
}

export function CartaoDaEstrutura({
  no,
  acoes,
}: {
  no: NoDaRede;
  acoes: AcoesDaEstrutura;
}) {
  const Icone = ICONE_DO_NIVEL[no.nivel];
  const locais = no.nivel === "empresa" ? locaisDaEmpresa(no.id).length : 0;

  return (
    <div
      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-gp-lg md:grid-cols-[minmax(0,1fr)_150px_240px_150px_196px] md:gap-gp-3xl"
    >
      {/* 1 — identidade. A ÚNICA coluna elástica: é ela que absorve a indentação. */}
      <div className="flex min-w-0 items-center gap-gp-lg">
        <span
          className={`grid size-form-md shrink-0 place-items-center rounded-radius-md ${
            no.nivel === "rede"
              ? "bg-bg-brand-subtle text-fg-brand"
              : "bg-bg-muted text-fg-muted"
          }`}
        >
          <Icone className="size-icon-sm" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col gap-gp-2xs">
          <span className="flex min-w-0 items-center gap-gp-md">
            <span
              className="truncate text-body-md font-medium leading-[1.3] text-fg-default"
              title={no.nome}
            >
              {no.nome}
            </span>
            {locais > 0 && (
              <Chip color="neutral" variant="soft" size="sm" shape="pill">
                {locais} {locais === 1 ? "local" : "locais"}
              </Chip>
            )}
            {no.nivel === "local" && !no.ativo && (
              <Chip color="neutral" variant="soft" size="sm" shape="pill">
                Inativo
              </Chip>
            )}
          </span>
          <span className="truncate text-caption-sm text-fg-muted">
            {no.email}
          </span>
        </span>
      </div>

      <Coluna label="CNPJ" valor={no.cnpj} />
      <Coluna label="Endereço" valor={no.endereco} />
      <Coluna label="Responsável" valor={no.responsavel} />

      <AcoesDoNo no={no} acoes={acoes} />
    </div>
  );
}
