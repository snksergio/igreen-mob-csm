import type { ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Hash,
  MapPin,
  Plug,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  Chip,
  FloatingPanel,
  FloatingPanelSection,
} from "@snksergio/design-system";
import {
  ALERTAS_LISTA_TEXTOS,
  COR_DO_TIPO,
  ROTULO_DA_SITUACAO,
  carimbo,
  duracaoLegivel,
  type Alerta,
} from "./alertas-lista-mock";

/**
 * Painel de uma ocorrência — o destino do "Detalhes do alerta" da referência.
 *
 * ## Painel, e não modal como na origem
 *
 * O modal dela é uma folha branca com oito campos em duas colunas e um vazio enorme
 * embaixo — ocupa a tela inteira pra entregar oito linhas, e esconde a lista atrás. Aqui é
 * painel lateral pelo mesmo motivo do resto do projeto: **quem abre um alerta costuma
 * abrir o próximo**, e com a lista visível ao lado isso é um clique em vez de dois.
 *
 * ## O que este painel tem que a linha não tem
 *
 * A linha funde `Empresa` em `Local` e `ID` em `Carregador` pra caber em 1100px; aqui os
 * quatro são campos próprios. E `Término` só existe aqui: na lista ele é redundante com a
 * duração, que é a forma em que a pergunta costuma vir ("ficou fora quanto tempo?").
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

function Carimbo({ iso }: { iso: string }) {
  const c = carimbo(iso);
  return (
    <span className="tabular-nums">
      {c.data} <span className="text-fg-muted">às</span> {c.hora}
    </span>
  );
}

export function AlertaDetailPanel({
  alerta,
  onClose,
}: {
  alerta: Alerta | null;
  onClose: () => void;
}) {
  if (!alerta) return null;
  const a = alerta;
  const ativo = a.situacao === "ativo";

  return (
    <FloatingPanel
      open={!!a}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      size="xl"
      resizable
      maximizable
      resizableStorageKey="alertas-lista.detail-panel.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {ALERTAS_LISTA_TEXTOS.detalhe}
          </span>
          {/* Os dois chips do topo são os MESMOS da referência, na mesma ordem: o tipo
              (o que houve) antes da situação (se já passou). A ordem inversa faria ler
              "Resolvido" antes de saber o que foi resolvido. */}
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal">
            <Chip
              color={COR_DO_TIPO[a.tipo] ?? "neutral"}
              variant="soft"
              size="sm"
              shape="pill"
            >
              {a.tipo}
            </Chip>
            <Chip
              color={ativo ? "danger" : "success"}
              variant="soft"
              size="sm"
              shape="pill"
            >
              {ROTULO_DA_SITUACAO[a.situacao]}
            </Chip>
          </span>
        </div>
      }
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <FloatingPanelSection title="Onde">
        <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[180px_1fr] sm:items-center">
          <Propriedade icone={Building2} label="Empresa" valor={a.empresa} />
          {/* Sem elipse: nome de local cortado é o que faz alguém despachar equipe pro
              ponto errado. Quebra em duas linhas. */}
          <Propriedade
            icone={MapPin}
            label="Local"
            valor={
              <span className="block whitespace-normal break-words leading-snug">
                {a.local}
              </span>
            }
          />
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="Equipamento">
        <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[180px_1fr] sm:items-center">
          <Propriedade icone={Zap} label="Carregador" valor={a.carregador} />
          <Propriedade
            icone={Hash}
            label="ID do carregador"
            valor={<span className="tabular-nums">{a.idCarregador}</span>}
          />
          <Propriedade
            icone={Plug}
            label="Plugue"
            valor={<span className="tabular-nums">{a.plugue}</span>}
          />
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="Quando">
        <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[180px_1fr] sm:items-center">
          <Propriedade
            icone={CalendarClock}
            label="Início do alerta"
            valor={<Carimbo iso={a.inicio} />}
          />
          <Propriedade
            icone={CheckCircle2}
            label="Fim do alerta"
            valor={
              a.fim ? (
                <Carimbo iso={a.fim} />
              ) : (
                /* `—` diria "não tem fim"; o que é verdade é que ele ainda não chegou, e
                   essa diferença é a que decide se alguém precisa ir até o local. */
                <span className="text-fg-danger">Ainda em curso</span>
              )
            }
          />
          <Propriedade
            icone={Timer}
            label="Duração"
            valor={
              <span
                className={`tabular-nums font-semibold ${
                  ativo ? "text-fg-danger" : "text-fg-default"
                }`}
              >
                {duracaoLegivel(a)}
              </span>
            }
          />
        </div>
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
