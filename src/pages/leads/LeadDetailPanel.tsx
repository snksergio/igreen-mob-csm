import { useState } from "react";
import { Ban, Check, MessageCircle, Phone, Store } from "lucide-react";
import {
  Button,
  Chip,
  FloatingPanel,
  FloatingPanelSection,
  FormField,
} from "@snksergio/design-system";
import { Textarea } from "@snksergio/design-system/shadcn";
import {
  LEADS_TEXTOS,
  PRODUTO_LABEL,
  dataCurta,
  estadoEfetivo,
  linkDoWhatsApp,
  moeda,
  telefoneLegivel,
  type Contato,
  type Lead,
  type ResultadoDoContato,
} from "./leads-mock";
import {
  ChipDeEstado,
  ChipsDeProdutos,
  HistoricoDeContatos,
  PrazoDaJanela,
  Propriedade,
  ResumoDaOportunidade,
  TrilhaDoLead,
} from "./leads-ui";

/**
 * Painel do lead — ficha, histórico e as duas ações.
 *
 * ## A decisão que estrutura este painel
 *
 * **Abrir o WhatsApp e registrar o contato são coisas separadas, e é de propósito.**
 *
 * O `wa.me` apenas pré-preenche a mensagem: quem toca em enviar é a pessoa, dentro do
 * WhatsApp, e nada disso volta para o CMS. Se o botão verde já marcasse "Tentei contato",
 * a tela registraria intenção como se fosse ato — e em uma semana a lista estaria
 * mentindo sobre quem foi abordado. Numa tela cujo propósito é justamente ser o registro
 * que o WhatsApp não dá, isso seria destruir o produto pela conveniência de um clique.
 *
 * A mitigação da fricção é uma PERGUNTA, não uma inferência: ao voltar do WhatsApp, o
 * painel oferece "Conseguiu falar?" com as três respostas possíveis.
 *
 * ## Por que o resultado do contato muda o estado, e não o contrário
 *
 * O licenciado não escolhe um estado numa lista — ele diz o que aconteceu, e o estado
 * cai por consequência. "Não atendeu" → `Tentei contato`; "Respondeu" → `Em conversa`;
 * "Recusou" → `Perdido`. Um campo de estado editável convida a escolher o que soa melhor.
 */
export function LeadDetailPanel({
  lead,
  onClose,
  onRegistrarContato,
  onConverter,
}: {
  lead: Lead | null;
  onClose: () => void;
  onRegistrarContato: (
    leadId: string,
    dados: { canal: Contato["canal"]; resultado: ResultadoDoContato; nota: string },
  ) => void;
  onConverter: (lead: Lead) => void;
}) {
  const [canal, setCanal] = useState<Contato["canal"]>("whatsapp");
  const [nota, setNota] = useState("");
  const [abriuWhatsApp, setAbriuWhatsApp] = useState(false);

  if (!lead) return null;

  const estado = estadoEfetivo(lead);
  const encerrado =
    estado === "convertido" || estado === "perdido" || estado === "expirado";

  function registrar(resultado: ResultadoDoContato) {
    if (!lead) return;
    onRegistrarContato(lead.id, { canal, resultado, nota: nota.trim() });
    setNota("");
    setAbriuWhatsApp(false);
  }

  const CANAIS: { id: Contato["canal"]; label: string; icone: typeof Phone }[] = [
    { id: "whatsapp", label: "WhatsApp", icone: MessageCircle },
    { id: "ligacao", label: "Ligação", icone: Phone },
    { id: "presencial", label: "Presencial", icone: Store },
  ];

  return (
    <FloatingPanel
      open
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={620}
      resizable
      maximizable
      resizableMinWidth={480}
      resizableStorageKey="igreen-mob-cms.lead.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {lead.cliente}
          </span>
          <span className="flex min-w-0 flex-wrap items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <span className="shrink-0 tabular-nums">{lead.id}</span>
            <span className="shrink-0 opacity-50">·</span>
            <span className="truncate">{lead.local}</span>
            <ChipDeEstado lead={lead} />
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          {!encerrado && (
            <Button
              variant="filled"
              color="primary"
              size="sm"
              iconLeft={<Check />}
              onClick={() => onConverter(lead)}
            >
              Marcar como convertido
            </Button>
          )}
        </>
      }
    >
      {/* ── Andamento ──────────────────────────────────────────────────────
          Duas perguntas, nesta ordem: **onde esta pessoa está** (a trilha) e **quanto
          tempo resta** (o prazo). A segunda só significa alguma coisa depois da
          primeira — "expira em 2 dias" é urgente se ninguém falou com ela, e é quase
          irrelevante se ela já respondeu ontem.

          Mesma posição e mesmo nome do painel de Implantações, de propósito: quem
          conhece um painel do produto já sabe onde olhar neste. */}
      <FloatingPanelSection title="Andamento" collapsible={false}>
        <div className="flex flex-col gap-gp-2xl">
          <TrilhaDoLead lead={lead} />

          <div className="flex flex-col gap-gp-sm border-t border-border-subtle pt-pad-2xl">
            <PrazoDaJanela lead={lead} />
            <p className="text-body-sm leading-relaxed text-fg-muted">
              Janela aberta em {dataCurta(lead.criadoEm)}. São 7 dias corridos a partir
              do pré-cadastro, e{" "}
              <strong className="font-semibold text-fg-default">
                contato não estende
              </strong>{" "}
              o prazo — só concluir uma recarga ou ativar outra conexão encerra a
              janela.
            </p>
          </div>
        </div>
      </FloatingPanelSection>

      {/* ── Ações ──────────────────────────────────────────────────────────
          Antes da ficha, porque é o que a pessoa veio fazer. */}
      {!encerrado && (
        <FloatingPanelSection title="Falar com o cliente" collapsible={false}>
          <div className="flex flex-col gap-gp-xl">
            <div className="flex flex-col gap-gp-md">
              <Button
                variant="filled"
                color="primary"
                size="md"
                iconLeft={<MessageCircle />}
                onClick={() => {
                  window.open(linkDoWhatsApp(lead), "_blank", "noopener");
                  setAbriuWhatsApp(true);
                  setCanal("whatsapp");
                }}
              >
                Abrir WhatsApp com a mensagem pronta
              </Button>
              <p className="text-caption-md leading-relaxed text-fg-subtle">
                {LEADS_TEXTOS.registrarDescricao}
              </p>
            </div>

            {/* A pergunta que substitui a inferência. Só aparece depois de abrir o
                WhatsApp — antes disso ela não teria a que se referir. */}
            {abriuWhatsApp && (
              <div className="flex flex-col gap-gp-md rounded-radius-lg border border-border-brand bg-bg-brand-subtle p-pad-3xl">
                <span className="text-body-sm font-semibold text-fg-default">
                  Conseguiu falar?
                </span>
                <div className="flex flex-wrap gap-gp-md">
                  <Button
                    variant="filled"
                    color="primary"
                    size="sm"
                    onClick={() => registrar("respondeu")}
                  >
                    Sim, respondeu
                  </Button>
                  <Button
                    variant="outline"
                    color="secondary"
                    size="sm"
                    onClick={() => registrar("sem-resposta")}
                  >
                    Não atendeu
                  </Button>
                  <Button
                    variant="ghost"
                    color="secondary"
                    size="sm"
                    onClick={() => setAbriuWhatsApp(false)}
                  >
                    Depois
                  </Button>
                </div>
              </div>
            )}

            {/* Registro manual — para ligação, visita, ou WhatsApp aberto no celular. */}
            <div className="flex flex-col gap-form-gap">
              <FormField label="Canal">
                {() => (
                  <div className="flex flex-wrap gap-gp-sm">
                    {CANAIS.map((c) => {
                      const Icone = c.icone;
                      return (
                        <Button
                          key={c.id}
                          variant={canal === c.id ? "soft" : "outline"}
                          color={canal === c.id ? "primary" : "secondary"}
                          size="sm"
                          iconLeft={<Icone />}
                          onClick={() => setCanal(c.id)}
                        >
                          {c.label}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </FormField>

              <FormField
                label="O que aconteceu"
                helperText="Fica no histórico. É o que o WhatsApp não guarda."
              >
                {() => (
                  <Textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ex.: pediu para retomar depois do dia 30"
                    rows={2}
                  />
                )}
              </FormField>

              <div className="flex flex-wrap gap-gp-md">
                <Button
                  variant="outline"
                  color="secondary"
                  size="sm"
                  iconLeft={<Check />}
                  onClick={() => registrar("respondeu")}
                >
                  Respondeu
                </Button>
                <Button
                  variant="outline"
                  color="secondary"
                  size="sm"
                  onClick={() => registrar("sem-resposta")}
                >
                  Sem resposta
                </Button>
                <Button
                  variant="outline"
                  color="critical"
                  size="sm"
                  iconLeft={<Ban />}
                  onClick={() => registrar("recusou")}
                >
                  Recusou
                </Button>
              </div>
            </div>
          </div>
        </FloatingPanelSection>
      )}

      <FloatingPanelSection title="Oportunidade">
        <div className="flex flex-col gap-gp-lg">
          <ResumoDaOportunidade lead={lead} />
          <ChipsDeProdutos lead={lead} />
          {lead.converteuEm && (
            <p className="text-body-sm text-fg-success">
              Converteu em{" "}
              <strong className="font-semibold">{PRODUTO_LABEL[lead.converteuEm]}</strong>.
            </p>
          )}
          {lead.motivoDaPerda && (
            <p className="text-body-sm text-fg-muted">
              Motivo da perda: {lead.motivoDaPerda}
            </p>
          )}
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="A recarga que gerou o lead">
        <div className="flex flex-col">
          <Propriedade rotulo="Posto">
            {/* Sem elipse: nome de posto cortado faz conferir o lugar errado. */}
            <span className="block whitespace-normal break-words leading-snug">
              {lead.local}
            </span>
          </Propriedade>
          <Propriedade rotulo="Recarga concluída">
            {lead.recarga.concluida ? (
              <span className="font-medium text-fg-success">Sim</span>
            ) : (
              <span className="font-medium text-fg-warning">Não</span>
            )}
          </Propriedade>
          <Propriedade rotulo="Valor">
            {lead.recarga.concluida ? (
              <span className="font-semibold tabular-nums">
                {moeda(lead.recarga.valor)}
              </span>
            ) : (
              <span className="text-fg-subtle">—</span>
            )}
          </Propriedade>
          <Propriedade rotulo="Energia">
            {lead.recarga.concluida ? (
              <span className="tabular-nums">
                {lead.recarga.kwh.toLocaleString("pt-BR")} kWh
              </span>
            ) : (
              <span className="text-fg-subtle">—</span>
            )}
          </Propriedade>
        </div>

        {/* ⚠️ Pela regra recebida, a atribuição só se formaliza com o pagamento. Um lead
            de recarga não concluída existe, mas é mais frágil — e a tela precisa dizer
            isso, senão o licenciado gasta o mesmo esforço nos dois. */}
        {!lead.recarga.concluida && (
          <p className="mt-gp-lg flex items-start gap-gp-sm rounded-radius-lg bg-bg-warning-muted p-pad-xl text-body-sm leading-relaxed text-fg-warning">
            <Ban className="mt-[2px] size-icon-sm shrink-0" aria-hidden />
            <span>
              A recarga não foi concluída. Pela regra atual a atribuição só se formaliza
              com o pagamento — este lead ainda não está garantido.
            </span>
          </p>
        )}
      </FloatingPanelSection>

      <FloatingPanelSection title="Dados do cliente">
        <div className="flex flex-col">
          <Propriedade rotulo="Nome">{lead.cliente}</Propriedade>
          <Propriedade rotulo="Telefone">
            <span className="tabular-nums">{telefoneLegivel(lead.telefone)}</span>
          </Propriedade>
          <Propriedade rotulo="Pré-cadastro">{dataCurta(lead.criadoEm)}</Propriedade>
          <Propriedade rotulo="Contatos registrados">
            <span className="tabular-nums">{lead.contatos.length}</span>
          </Propriedade>
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection
        title={`Histórico${lead.contatos.length > 0 ? ` (${lead.contatos.length})` : ""}`}
        defaultOpen
      >
        <HistoricoDeContatos contatos={lead.contatos} />
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
