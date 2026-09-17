import type { ReactNode } from "react";
import {
  Building2,
  Car,
  CreditCard,
  Gauge,
  IdCard,
  Mail,
  Phone,
  Star,
  Trash2,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Chip,
  FloatingPanel,
  FloatingPanelSection,
} from "@snksergio/design-system";
import { formatarDuracao } from "~/pages/motoristas/motoristas-mock";
import { Tags } from "~/pages/motoristas/motoristas-ui";
import {
  ROTULO_DO_SALDO,
  saldoDoUsuario,
  type Usuario,
} from "./usuarios-mock";

/**
 * Painel de um usuário — leitura e uma ação destrutiva.
 *
 * ## Só ver e excluir, e isso é a referência
 *
 * A tela da origem não tem botão de adicionar nem de editar: o cadastro nasce no app do
 * motorista, e o back-office só consulta e remove. Inventar um "Editar" aqui prometeria
 * escrita num registro que não é nosso.
 *
 * ## A anatomia é a que o projeto já usa
 *
 * Título com nome e chip de status no header; as informações em linhas de **ícone à
 * esquerda, rótulo, valor à direita** — o `Propriedade` que nasceu na Gestão de Carga e já
 * está em Monitoramento e Estrutura da rede. Quatro seções, do que identifica pro que
 * mede.
 */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Linha da ficha.
 *
 * ⚠️ `min-h-form-md` nas DUAS células: sem isso a linha de texto puro mede 30px contra 36
 * na que tem `Chip`, e a ficha fica com ritmo irregular.
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

/** Grade de duas colunas — rótulo fixo à esquerda, valor elástico à direita. */
function Ficha({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center gap-x-gp-md">
      {children}
    </div>
  );
}

/** Saldo com cor por sinal — e `–` só quando é exatamente zero. */
function Carteira({ valor }: { valor: number }) {
  return (
    <span
      className={`font-semibold tabular-nums ${
        valor < 0
          ? "text-fg-danger"
          : valor > 0
            ? "text-fg-success"
            : "text-fg-muted"
      }`}
    >
      {brl.format(valor)}
    </span>
  );
}

export function UsuarioDetailPanel({
  usuario,
  onClose,
  onExcluir,
}: {
  usuario: Usuario | null;
  onClose: () => void;
  onExcluir: (u: Usuario) => void;
}) {
  if (!usuario) return null;
  const u = usuario;
  const saldo = saldoDoUsuario(u);

  return (
    <FloatingPanel
      open={!!u}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      size="xl"
      resizable
      maximizable
      resizableStorageKey="usuarios.detail-panel.width"
      /* Obrigatório com `FloatingPanelSection`: a seção cuida do próprio padding e desenha
         a divisória de ponta a ponta. */
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {u.nome}
          </span>
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="truncate">{u.email}</span>
            <span className="opacity-50">·</span>
            {/* O chip do header é o SALDO, não "ativo/inativo": todo usuário desta lista
                está ativo, e o que distingue um do outro — o que traz alguém a abrir o
                painel — é a carteira. */}
            <Chip
              color={
                saldo === "negativo"
                  ? "danger"
                  : saldo === "positivo"
                    ? "success"
                    : "neutral"
              }
              variant="soft"
              size="sm"
              shape="pill"
            >
              {ROTULO_DO_SALDO[saldo]}
            </Chip>
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          {/* A ÚNICA ação de escrita da tela. `critical` + confirmação por `AlertModal`,
              que é o guardrail do DS pra destrutivo. */}
          <Button
            variant="filled"
            color="critical"
            size="sm"
            iconLeft={<Trash2 />}
            onClick={() => onExcluir(u)}
          >
            Excluir usuário
          </Button>
        </>
      }
    >
      <FloatingPanelSection title="Identificação">
        <Ficha>
          <Propriedade icone={IdCard} label="Nome" valor={u.nome} />
          <Propriedade
            icone={Mail}
            label="E-mail"
            valor={<span className="truncate">{u.email}</span>}
          />
          <Propriedade
            icone={IdCard}
            label="CPF"
            valor={<span className="tabular-nums">{u.cpf}</span>}
          />
          <Propriedade
            icone={Phone}
            label="Telefone"
            valor={<span className="tabular-nums">{u.telefone}</span>}
          />
          <Propriedade icone={Building2} label="Empresa" valor={u.empresa} />
          <Propriedade
            icone={Car}
            label="Veículo favorito"
            valor={
              u.veiculoFavorito ?? (
                <span className="text-fg-subtle">Ainda não recarregou</span>
              )
            }
          />
        </Ficha>
      </FloatingPanelSection>

      <FloatingPanelSection title="Carteira">
        <Ficha>
          <Propriedade
            icone={Wallet}
            label="Saldo atual"
            valor={<Carteira valor={u.carteira} />}
          />
          <Propriedade
            icone={CreditCard}
            label="Total gasto"
            valor={
              <span className="tabular-nums">{brl.format(u.totalGasto)}</span>
            }
          />
          <Propriedade
            icone={CreditCard}
            label="Gasto médio por recarga"
            valor={
              <span className="tabular-nums">
                {u.transacoes > 0
                  ? brl.format(u.totalGasto / u.transacoes)
                  : "—"}
              </span>
            }
          />
        </Ficha>
      </FloatingPanelSection>

      <FloatingPanelSection title="Uso">
        <Ficha>
          <Propriedade
            icone={Zap}
            label="Recargas"
            valor={<span className="tabular-nums">{u.transacoes}</span>}
          />
          <Propriedade
            icone={Zap}
            label="Energia consumida"
            valor={
              <span className="tabular-nums">
                {u.energiaKwh.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}{" "}
                kWh
              </span>
            }
          />
          <Propriedade
            icone={Gauge}
            label="Tempo total plugado"
            valor={
              <span className="tabular-nums">
                {formatarDuracao(u.duracaoMin)}
              </span>
            }
          />
          <Propriedade
            icone={Gauge}
            label="Carregadores distintos"
            valor={<span className="tabular-nums">{u.carregadores}</span>}
          />
          <Propriedade
            icone={Star}
            label="Satisfação média"
            valor={
              u.satisfacao !== null ? (
                <span className="flex items-center gap-gp-sm">
                  <Star
                    className="size-icon-sm text-fg-warning"
                    fill="currentColor"
                    aria-hidden
                  />
                  <span className="tabular-nums">
                    {u.satisfacao.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                    })}
                  </span>
                </span>
              ) : (
                <span className="text-fg-subtle">Sem avaliações</span>
              )
            }
          />
        </Ficha>
      </FloatingPanelSection>

      <FloatingPanelSection title="Tags">
        {u.tags.length > 0 ? (
          <Tags tags={u.tags} />
        ) : (
          <span className="text-body-sm text-fg-subtle">
            Nenhuma tag atribuída.
          </span>
        )}
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
