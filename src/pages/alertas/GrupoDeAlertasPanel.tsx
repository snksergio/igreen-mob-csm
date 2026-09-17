import type { ReactNode } from "react";
import {
  Bell,
  Building2,
  Check,
  Circle,
  MapPin,
  Mail,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  Avatar,
  Button,
  Chip,
  FloatingPanel,
  FloatingPanelSection,
} from "@snksergio/design-system";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  ALERTAS_TEXTOS,
  LOCAIS_DISPONIVEIS,
  TIPOS_DE_ALERTA,
  cobreTudo,
  locaisCobertos,
  type GrupoDeAlertas,
} from "./alertas-mock";

/**
 * Painel de um grupo de alertas — leitura, editar e excluir.
 *
 * ## O que ele responde que a linha não consegue
 *
 * A linha da tabela mostra os primeiros valores de cada campo multi-valor e conta o resto.
 * O painel é onde se vê a lista INTEIRA — e, no caso dos tipos, onde se vê o que está
 * **de fora**, que é a pergunta que ninguém consegue fazer a uma lista de chips.
 *
 * É por isso que a seção de tipos lista os nove com marca de ligado/desligado em vez de
 * listar só os ligados: "por que não recebi o alerta X" se responde vendo o X apagado.
 *
 * ## As duas seções seguem o `dsgreen-paneldetail-1`
 *
 * A pedido do operador (2026-09-16), e é melhor do que o que eu tinha:
 *
 * | seção | era | virou |
 * |---|---|---|
 * | Tipos de alerta | grade de cards com borda | `ListaDeProgresso` — faixa de situação + checklist com disco/anel |
 * | E-mails | linha com ícone de envelope | `LinhaDeEntidade` — avatar com iniciais + nome + domínio |
 *
 * O ganho do checklist é o contraste **cheio × vazio**: nove cards com borda diferente
 * pedem que você compare bordas; disco verde contra anel vazio se lê de relance. E o
 * avatar dá a cada e-mail uma identidade — numa lista de quatro endereços do mesmo
 * domínio, a cor é o que os distingue antes da leitura.
 */

/** Linha da ficha: ícone à esquerda, rótulo, valor à direita. */
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

function Ficha({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-x-gp-md">
      {children}
    </div>
  );
}

export function GrupoDeAlertasPanel({
  grupo,
  onClose,
  onEditar,
  onExcluir,
}: {
  grupo: GrupoDeAlertas | null;
  onClose: () => void;
  onEditar: (g: GrupoDeAlertas) => void;
  onExcluir: (g: GrupoDeAlertas) => void;
}) {
  if (!grupo) return null;
  const g = grupo;
  const tudo = cobreTudo(g);

  return (
    <FloatingPanel
      open={!!g}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      size="xl"
      resizable
      maximizable
      resizableStorageKey="alertas.detail-panel.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {g.nome}
          </span>
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="tabular-nums">
              {g.tipos.length} de {TIPOS_DE_ALERTA.length} tipos
            </span>
            <span className="opacity-50">·</span>
            {/* O chip do header é ATIVO/PAUSADO. Num grupo de notificação é a única coisa
                que muda se ele funciona ou não, e ela não aparece em nenhuma outra linha
                do painel. */}
            <Chip
              color={g.ativo ? "success" : "neutral"}
              variant="soft"
              size="sm"
              shape="pill"
            >
              {g.ativo ? "Ativo" : "Pausado"}
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
            variant="outline"
            color="critical"
            size="sm"
            iconLeft={<Trash2 />}
            onClick={() => onExcluir(g)}
          >
            Excluir
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Pencil />}
            onClick={() => onEditar(g)}
          >
            Editar grupo
          </Button>
        </>
      }
    >
      <FloatingPanelSection title="Grupo">
        <Ficha>
          <Propriedade icone={Bell} label="Nome" valor={g.nome} />
          <Propriedade icone={Building2} label="Empresa" valor={g.empresa} />
          <Propriedade
            icone={MapPin}
            label="Cobertura"
            valor={
              tudo ? (
                <span className="flex items-center gap-gp-md">
                  <Chip color="primary" variant="soft" size="sm" shape="pill">
                    Todos os locais
                  </Chip>
                  <span className="text-caption-md text-fg-muted">
                    inclusive os cadastrados depois
                  </span>
                </span>
              ) : (
                <span className="tabular-nums">
                  {locaisCobertos(g)} de {LOCAIS_DISPONIVEIS.length} locais
                </span>
              )
            }
          />
          <Propriedade
            icone={Mail}
            label="E-mails notificados"
            valor={<span className="tabular-nums">{g.emails.length}</span>}
          />
        </Ficha>
      </FloatingPanelSection>

      {/* ⚠️ Lista os NOVE, não só os ligados. Ver o JSDoc do topo: o desligado é o que
          responde "por que não recebi o alerta X". */}
      <FloatingPanelSection title="Tipos de alerta">
        <div className="flex flex-col gap-gp-lg">
          {/* Faixa de situação, no desenho do `dsgreen-paneldetail-1`. É FAIXA e não
              `Chip`: o Chip é rótulo inline, e aqui a situação é o cabeçalho do bloco —
              largura cheia, centralizada, `rounded-radius-full`. Forçar um Chip a
              `w-full` deformaria um componente pra fazer o trabalho de outro. */}
          <div
            className={`rounded-radius-full py-pad-md text-center text-body-sm font-semibold ${
              g.tipos.length === 0
                ? "bg-bg-danger-muted text-fg-danger"
                : g.tipos.length === TIPOS_DE_ALERTA.length
                  ? "bg-bg-success-muted text-fg-success"
                  : "bg-bg-warning-muted text-fg-warning"
            }`}
          >
            {g.tipos.length === 0
              ? "Nenhum tipo ligado — este grupo não envia e-mail"
              : g.tipos.length === TIPOS_DE_ALERTA.length
                ? "Escutando todos os tipos"
                : `Escutando ${g.tipos.length} de ${TIPOS_DE_ALERTA.length} tipos`}
          </div>

          <ul className="flex flex-col gap-gp-md">
            {TIPOS_DE_ALERTA.map((t) => {
              const ligado = g.tipos.includes(t);
              return (
                <li key={t} className="flex items-center gap-gp-md text-body-sm">
                  {/* ⚠️ Ligado = disco CHEIO, feito de `<span>` + `<Check>`, e NÃO o
                      `CircleCheck` do lucide. O bloco do DS documenta o porquê: o lucide
                      desenha o círculo com `stroke="currentColor"`, então o traço fica por
                      cima do preenchimento e come ~2px de verde de cada lado — o disco sai
                      visivelmente menor que o anel do pendente, e não há classe que tire só
                      aquele stroke.

                      `fg-on-success` é o par validado do `bg-success` (branco no light,
                      preto no dark) — `text-white` na unha não é dark-aware.

                      O desligado fica de ANEL VAZIO de propósito: é o contraste cheio ×
                      vazio que carrega o estado. Preencher os dois apagaria a distinção. */}
                  {ligado ? (
                    <span
                      className="grid size-icon-sm shrink-0 place-items-center rounded-radius-full bg-bg-success text-fg-on-success"
                      aria-hidden
                    >
                      <Check className="size-icon-2xs" strokeWidth={3} />
                    </span>
                  ) : (
                    <Circle
                      className="size-icon-sm shrink-0 text-fg-subtle"
                      aria-hidden
                    />
                  )}
                  {/* O estado NÃO vive só no ícone (WCAG 1.4.1): o texto muda de peso e de
                      cor, e o sufixo é palavra, não forma. */}
                  <span
                    className={
                      ligado ? "font-semibold text-fg-default" : "text-fg-muted"
                    }
                  >
                    {t}
                    {!ligado && (
                      <span className="ml-gp-sm text-caption-md">
                        (desligado)
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="Locais cobertos">
        {tudo ? (
          <p className="text-body-sm text-fg-muted">
            {ALERTAS_TEXTOS.ajudaDaCobertura}
          </p>
        ) : (
          <div className="flex flex-wrap gap-gp-sm">
            {g.locais.map((l) => (
              <Chip key={l} color="neutral" variant="soft" size="sm">
                {l}
              </Chip>
            ))}
          </div>
        )}
      </FloatingPanelSection>

      <FloatingPanelSection title="E-mails notificados">
        {/* `LinhaDeEntidade` do `dsgreen-paneldetail-1`: um e-mail não é `label: valor`,
            é uma coisa com identidade. Avatar + destinatário + domínio usam a largura toda,
            e a cor do avatar distingue quatro endereços do mesmo domínio antes da leitura.

            ⚠️ `corDoAvatar` deriva a cor do texto por contraste WCAG (L-027) — nunca
            `text-white` na unha, que em cor clara vira texto ilegível. */}
        <div className="flex flex-col gap-gp-xl">
          {g.emails.map((e) => {
            const [destinatario, dominio] = e.split("@");
            return (
              <div key={e} className="flex items-center gap-gp-lg">
                <Avatar
                  size="lg"
                  colorHex={corDoAvatar(e)}
                  className="shrink-0"
                  aria-label={e}
                >
                  {iniciais(destinatario.replace(/[._-]+/g, " "))}
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-body-sm font-semibold text-fg-default">
                    {destinatario}
                  </span>
                  <span className="truncate text-body-xs text-fg-muted">
                    @{dominio}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
