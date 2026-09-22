import { useEffect, useState } from "react";
import {
  Button,
  Chip,
  FloatingPanel,
  FormField,
  FormFieldInput,
  FormFieldSelect,
} from "@snksergio/design-system";
import { Switch } from "@snksergio/design-system/shadcn";
import { avisoDeCriado, avisoDeSalvo } from "~/components/feedback";
import { CampoDeTags } from "~/components/CampoDeTags";
import { SeletorDeLocais } from "~/pages/cupons/cupons-ui";
import { SecaoDeFormulario } from "~/pages/estrutura-rede/estrutura-ui";
import {
  ALERTAS_TEXTOS,
  LOCAIS_DISPONIVEIS,
  TIPOS_DE_ALERTA,
  type GrupoDeAlertas,
  type TipoDeAlerta,
} from "./alertas-mock";

/**
 * Formulário de grupo de alertas — criar e editar, tudo aberto.
 *
 * ## Os quatro blocos, na ordem da referência
 *
 * `Nome` → `Tipos de alertas` → `Empresa e locais` → `E-mails`. Não é arbitrária: é a
 * ordem das três perguntas que definem um grupo — **o quê**, **onde** e **pra quem** —, e
 * inverter qualquer par faz o usuário escolher destinatário antes de saber o que vai
 * mandar.
 *
 * ## Os interruptores nascem LIGADOS, como na referência
 *
 * ⚠️ E isso é decisão, não cópia: num grupo de alerta, esquecer de ligar um tipo é um
 * silêncio que ninguém percebe até o carregador ficar dias fora. O padrão seguro é receber
 * tudo e desligar o que incomoda — o inverso de um formulário de cadastro, onde o padrão
 * seguro é não presumir nada.
 *
 * ## Reaproveitamentos
 *
 * - `SeletorDeLocais` é o de Cupons: lista com busca, scroll e marcar/desmarcar todos.
 *   O comportamento é idêntico e escrever um segundo garantiria divergência.
 * - `CampoDeTags` é o dos e-mails, com o `Enter` que a referência pede literalmente
 *   ("aperte ENTER para adicionar na lista").
 */

const VAZIO = {
  nome: "",
  empresa: "PV MOB",
};

export function GrupoDeAlertasFormPanel({
  aberto,
  grupo,
  onClose,
}: {
  aberto: boolean;
  /** `null` = criar. Preenchido = editar. */
  grupo: GrupoDeAlertas | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState(VAZIO);
  const [tipos, setTipos] = useState<TipoDeAlerta[]>([...TIPOS_DE_ALERTA]);
  const [locais, setLocais] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);

  /* Recarrega ao trocar de grupo (ou ao abrir pra criar). Sem isto, abrir a edição de A,
     fechar e abrir a de B mostraria os dados de A. */
  useEffect(() => {
    if (!aberto) return;
    setForm(grupo ? { nome: grupo.nome, empresa: grupo.empresa } : VAZIO);
    setTipos(grupo ? [...grupo.tipos] : [...TIPOS_DE_ALERTA]);
    setLocais(grupo ? [...grupo.locais] : []);
    setEmails(grupo ? [...grupo.emails] : []);
  }, [aberto, grupo]);

  const alternarTipo = (t: TipoDeAlerta) =>
    setTipos((atual) =>
      atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t],
    );

  return (
    <FloatingPanel
      open={aberto}
      onOpenChange={(v) => !v && onClose()}
      side="right"
      /* 880: a grade de interruptores é de duas colunas e o rótulo mais longo é
         "Potência acima do cadastro"; em 720 ele quebra ao lado do switch. */
      size={880}
      resizable
      maximizable
      resizableStorageKey="alertas.form-panel.width"
      bodyPadded={false}
      title={grupo ? "Editar grupo de alertas" : ALERTAS_TEXTOS.novoGrupo}
      description={
        grupo ? grupo.nome : "O que vigiar, onde vigiar e quem é avisado"
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            onClick={() => {
              const detalhe = `${tipos.length} de ${TIPOS_DE_ALERTA.length} tipos · ${emails.length} e-mail(s).`;
              if (grupo) avisoDeSalvo({ o: "Grupo", detalhe });
              else avisoDeCriado({ o: "Grupo", detalhe });
              onClose();
            }}
          >
            Salvar
          </Button>
        </>
      }
    >
      <SecaoDeFormulario titulo="Identificação">
        <FormFieldInput
          label="Nome do grupo"
          required
          placeholder="Plantão de operação"
          helperText={ALERTAS_TEXTOS.ajudaDoNome}
          value={form.nome}
          onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
        />
      </SecaoDeFormulario>

      <SecaoDeFormulario
        titulo="Tipos de alertas"
        descricao={ALERTAS_TEXTOS.ajudaDosTipos}
      >
        {/* Contador no topo: com nove interruptores, saber quantos estão ligados sem
            varrer a grade é o que diz "este grupo escuta tudo" ou "este é específico". */}
        <div className="flex items-center justify-between gap-gp-md">
          <Chip
            color={tipos.length === 0 ? "danger" : "primary"}
            variant="soft"
            size="sm"
            shape="pill"
          >
            {tipos.length} de {TIPOS_DE_ALERTA.length} ligados
          </Chip>
          {/* ⚠️ Zero tipos = grupo mudo. O aviso é inline e não bloqueia o Salvar: pode
              haver motivo pra criar um grupo pausado, e travar aqui obrigaria a inventar
              um tipo só pra conseguir salvar. */}
          {tipos.length === 0 && (
            <span className="text-caption-md text-fg-danger">
              Sem nenhum tipo ligado, este grupo não envia e-mail.
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-gp-md sm:grid-cols-2">
          {TIPOS_DE_ALERTA.map((t) => {
            const ligado = tipos.includes(t);
            const id = `tipo-${t}`;
            return (
              /* `<label htmlFor>` nativo embrulhando o `Switch`, não `<div onClick>`: o
                 label propaga o clique, mantém a semântica no leitor de tela e faz a linha
                 inteira virar alvo — é a L-025 do DS. */
              <label
                key={t}
                htmlFor={id}
                className={`flex min-h-form-lg cursor-pointer items-center justify-between gap-gp-md rounded-radius-lg border px-pad-2xl transition-colors ${
                  ligado
                    ? "border-border-brand bg-bg-brand-subtle"
                    : "border-border-default hover:bg-bg-muted"
                }`}
              >
                <span
                  className={`text-body-sm ${
                    ligado ? "font-medium text-fg-default" : "text-fg-muted"
                  }`}
                >
                  {t}
                </span>
                <Switch
                  id={id}
                  checked={ligado}
                  onCheckedChange={() => alternarTipo(t)}
                  aria-label={t}
                />
              </label>
            );
          })}
        </div>
      </SecaoDeFormulario>

      <SecaoDeFormulario
        titulo="Onde vigiar"
        descricao={ALERTAS_TEXTOS.ajudaDaCobertura}
      >
        <FormFieldSelect
          label="Empresa"
          options={[{ value: "PV MOB", label: "PV MOB" }]}
          value={form.empresa}
          onValueChange={(v) => setForm((f) => ({ ...f, empresa: v }))}
        />

        <FormField label="Locais">
          {() => (
            <div className="flex flex-col gap-gp-md">
              {/* O estado "nenhum marcado" é COBERTURA TOTAL, e isso precisa estar escrito:
                  uma lista toda desmarcada normalmente significa "nada", e aqui significa
                  o oposto. Sem este chip, o usuário marcaria os 17 à mão — e aí o grupo
                  deixaria de cobrir o 18º quando ele fosse cadastrado. */}
              {locais.length === 0 && (
                <Chip color="primary" variant="soft" size="sm" shape="pill">
                  Todos os locais, inclusive os futuros
                </Chip>
              )}
              <SeletorDeLocais
                disponiveis={LOCAIS_DISPONIVEIS}
                selecionados={locais}
                onChange={setLocais}
              />
            </div>
          )}
        </FormField>
      </SecaoDeFormulario>

      <SecaoDeFormulario titulo="Quem é avisado" ultima>
        <FormField
          label="Listagem de e-mails notificados"
          helperText={
            emails.length === 0
              ? "Sem e-mail na lista, o grupo não avisa ninguém."
              : undefined
          }
          state={emails.length === 0 ? "warning" : "default"}
        >
          {() => (
            <CampoDeTags
              tags={emails}
              onChange={setEmails}
              placeholder={ALERTAS_TEXTOS.dicaDeEmail}
              ariaLabel="E-mails notificados"
            />
          )}
        </FormField>
      </SecaoDeFormulario>
    </FloatingPanel>
  );
}
