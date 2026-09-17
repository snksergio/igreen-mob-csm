import type { ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  Avatar,
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
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  LOCAIS_DISPONIVEIS,
  MODULOS,
  PERFIL,
  PERMISSOES_TEXTOS,
  cobreTudo,
  dataCurta,
  locaisDoAcesso,
  modulosAlcancados,
  perfilMaisForte,
  perfilPredominante,
  perfisDoAcesso,
  type Acesso,
} from "./permissoes-mock";
import { ChipDePerfil, LegendaDasMarcas, MarcaDeNivel } from "./permissoes-ui";

/**
 * Painel de um acesso — a resposta inteira que a linha não cabe.
 *
 * ## É aqui que a grade granular da referência veio parar
 *
 * A origem desenha, DENTRO da célula da tabela, um card de empresa com N chips de local e
 * scroll próprio. Três consequências medidas no print dela: a linha do administrador ocupa
 * ~200px de altura contra ~90px das outras; a lista de locais fica atrás de um scroll
 * aninhado dentro de outro; e nenhum daqueles chips é ordenável, filtrável ou buscável,
 * porque não são dados de coluna — são markup.
 *
 * A grade é informação legítima; a célula é que era o lugar errado. Aqui ela é uma tabela
 * de verdade (`Local` × `Perfil`), com espaço para o nome inteiro.
 *
 * ## As três seções seguem o `dsgreen-paneldetail-1`
 *
 * Ficha de propriedades · checklist de progresso · linhas de entidade — os mesmos padrões
 * do painel de grupos de alertas, pelo mesmo motivo: o checklist mostra o que está **de
 * fora**, e "por que essa pessoa não vê o Financeiro?" é a pergunta que traz alguém a esta
 * tela.
 */

function Propriedade({
  icone: Icone,
  label,
  valor,
}: {
  icone: LucideIcon;
  label: string;
  valor: ReactNode;
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

export function AcessoDetailPanel({
  acesso,
  onClose,
  onEditar,
  onRevogar,
}: {
  acesso: Acesso | null;
  onClose: () => void;
  onEditar: (a: Acesso) => void;
  onRevogar: (a: Acesso) => void;
}) {
  if (!acesso) return null;
  const a = acesso;

  const locais = locaisDoAcesso(a);
  const perfis = perfisDoAcesso(a);
  const unico = perfilPredominante(a);
  const forte = perfilMaisForte(a);
  const tudo = cobreTudo(a);
  const alcance = modulosAlcancados(forte);

  const COL = { local: 320, perfil: 150 };

  return (
    <FloatingPanel
      open={!!a}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      size="xl"
      resizable
      maximizable
      resizableStorageKey="permissoes.detail-panel.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 items-center gap-gp-lg">
          <Avatar
            size="lg"
            colorHex={corDoAvatar(a.nome ?? a.email)}
            className="shrink-0"
            aria-hidden
          >
            {iniciais((a.nome ?? a.email.split("@")[0]).replace(/[._-]+/g, " "))}
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-md font-semibold text-fg-default">
              {a.nome ?? a.email}
            </span>
            <span className="mt-[2px] flex min-w-0 items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
              <span className="truncate">{a.email}</span>
              <span className="opacity-50">·</span>
              {unico ? (
                <ChipDePerfil perfil={unico} />
              ) : (
                <Chip color="neutral" variant="outline" size="sm" shape="pill">
                  {perfis.length} perfis
                </Chip>
              )}
            </span>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="outline"
            color="critical"
            size="sm"
            iconLeft={<Trash2 />}
            onClick={() => onRevogar(a)}
          >
            Revogar acesso
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Pencil />}
            onClick={() => onEditar(a)}
          >
            Editar acesso
          </Button>
        </>
      }
    >
      <FloatingPanelSection title="Acesso">
        <div className="grid grid-cols-[180px_1fr] items-center gap-x-gp-md">
          <Propriedade icone={Mail} label="E-mail" valor={a.email} />
          <Propriedade icone={Building2} label="Empresa" valor={a.empresa} />
          <Propriedade
            icone={ShieldCheck}
            label="Perfil mais forte"
            valor={
              <span className="flex items-center gap-gp-md">
                <ChipDePerfil perfil={forte} />
                {!unico && (
                  <span className="text-caption-md text-fg-muted">
                    em {
                      locais.filter((l) => a.porLocal[l] === forte).length
                    }{" "}
                    de {locais.length} locais
                  </span>
                )}
              </span>
            }
          />
          <Propriedade
            icone={MapPin}
            label="Onde vale"
            valor={
              tudo ? (
                <span className="flex items-center gap-gp-md">
                  <Chip color="primary" variant="soft" size="sm" shape="pill">
                    Todos os locais
                  </Chip>
                  <span className="text-caption-md text-fg-muted">
                    os {LOCAIS_DISPONIVEIS.length} cadastrados hoje
                  </span>
                </span>
              ) : (
                <span className="tabular-nums">
                  {locais.length} de {LOCAIS_DISPONIVEIS.length} locais
                </span>
              )
            }
          />
          <Propriedade
            icone={CalendarDays}
            label="Concedido em"
            valor={<span className="tabular-nums">{dataCurta(a.concedidoEm)}</span>}
          />
          <Propriedade
            icone={Clock}
            label="Último acesso"
            valor={
              a.ultimoAcesso ? (
                <span className="tabular-nums">{dataCurta(a.ultimoAcesso)}</span>
              ) : (
                /* Convite pendente não é "nunca acessou": é um estado com ação associada
                   (reenviar), e escrever "—" apagaria a diferença. */
                <Chip color="warning" variant="soft" size="sm" shape="pill">
                  Convite pendente
                </Chip>
              )
            }
          />
        </div>
      </FloatingPanelSection>

      {/* ⚠️ Lista os DOZE módulos, não só os liberados — mesmo princípio do painel de
          grupos de alertas: o traço é o que responde "por que não consigo abrir o
          Financeiro?". Um checklist só dos liberados obriga a pessoa a saber de cor quais
          módulos existem para notar a ausência. */}
      <FloatingPanelSection
        title={`O que o perfil ${PERFIL[forte].nome} permite`}
      >
        <div className="flex flex-col gap-gp-lg">
          <div
            className={`rounded-radius-full py-pad-md text-center text-body-sm font-semibold ${
              alcance === MODULOS.length
                ? "bg-bg-danger-muted text-fg-danger"
                : alcance === 0
                  ? "bg-bg-muted text-fg-muted"
                  : "bg-bg-success-muted text-fg-success"
            }`}
          >
            {alcance === MODULOS.length
              ? "Alcança os 12 módulos do CMS, sem restrição"
              : `Alcança ${alcance} dos ${MODULOS.length} módulos do CMS`}
          </div>

          <ul className="flex flex-col gap-gp-md">
            {MODULOS.map((m) => {
              const nivel = m.niveis[forte];
              return (
                <li key={m.id} className="flex items-start gap-gp-md text-body-sm">
                  <span className="mt-[2px]">
                    <MarcaDeNivel nivel={nivel} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={
                        nivel === "nenhum"
                          ? "text-fg-muted"
                          : "font-semibold text-fg-default"
                      }
                    >
                      {m.nome}
                      {/* O estado não vive só na forma do ícone: a palavra acompanha
                          (WCAG 1.4.1), e no caso mais restritivo ela é a informação. */}
                      {nivel !== "total" && (
                        <span className="ml-gp-sm font-normal text-caption-md text-fg-muted">
                          ({nivel === "leitura" ? "só leitura" : "sem acesso"})
                        </span>
                      )}
                    </span>
                    {/* ⚠️ `ressalvas[forte]` e não `ressalva`: a restrição é de um perfil
                        específico. Mostrar a do Colaborador no painel de um Administrador
                        anunciaria um limite que ele não tem. */}
                    {m.ressalvas?.[forte] && (
                      <span className="text-caption-sm text-fg-subtle">
                        {m.ressalvas[forte]}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <LegendaDasMarcas />

          {!unico && (
            <p className="rounded-radius-lg bg-bg-subtle p-pad-2xl text-caption-md text-fg-muted">
              Este acesso usa {perfis.length} perfis diferentes. O checklist acima
              mostra o mais forte deles — o perfil de cada local está na seção
              abaixo.
            </p>
          )}
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="Locais e perfis">
        <Table density="standard" ariaLabel={`Locais de ${a.email}`}>
          <TableHead>
            <TableHeadCell field="local" width={COL.local}>
              Local
            </TableHeadCell>
            <TableHeadCell field="perfil" width={COL.perfil}>
              Perfil
            </TableHeadCell>
          </TableHead>
          <TableBody>
            {locais.map((l) => (
              <TableRow key={l}>
                {/* ⚠️ Sem elipse: nome de local cortado é o que faz alguém achar que
                    revogou o acesso do ponto errado. Quebra em duas linhas. */}
                <TableCell field="local" width={COL.local}>
                  <span className="block whitespace-normal break-words leading-snug">
                    {l}
                  </span>
                </TableCell>
                <TableCell field="perfil" width={COL.perfil}>
                  <ChipDePerfil perfil={a.porLocal[l]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FloatingPanelSection>

      <FloatingPanelSection title="Sobre o convite">
        <p className="text-body-sm text-fg-muted">
          {PERMISSOES_TEXTOS.ajudaDoEmail}
        </p>
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
