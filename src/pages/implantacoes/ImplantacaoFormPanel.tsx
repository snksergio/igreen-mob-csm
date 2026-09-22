import { useEffect, useState } from "react";
import {
  Button,
  FloatingPanel,
  FloatingPanelSection,
  FormFieldInput,
  FormFieldSelect,
  FormFieldTextarea,
} from "@snksergio/design-system";
import { avisoDeCriado, avisoDeSalvo } from "~/components/feedback";
import {
  ETAPAS,
  IMPLANTACOES,
  LOCAIS_DA_REDE,
  RESPONSAVEIS,
  type EtapaId,
  type Implantacao,
} from "./implantacoes-mock";

/**
 * Cadastro de uma implantação — **os dados do ponto, não o andamento**.
 *
 * O que se faz aqui: quem é o cliente, onde fica, quantos pontos, quanto custa, quem
 * responde e para quando. O que NÃO se faz: marcar checklist ou mover etapa — isso é o
 * painel de detalhe, porque é trabalho de todo dia e não pode exigir modo de escrita.
 *
 * ⚠️ Uma implantação nova nasce sempre em **Proposta**, e o campo de etapa só aparece na
 * edição. Deixar escolher a etapa na criação convidaria a começar o registro no meio do
 * funil, com o checklist das etapas anteriores vazio — um "está em CONTRATO" que ninguém
 * consegue auditar. Quem já está adiantado avança pelo painel, cumprindo o checklist.
 */

const VAZIO = {
  cliente: "",
  local: "",
  cidade: "",
  uf: "MG",
  pontos: "2",
  potenciaKw: "22",
  investimento: "",
  responsavel: RESPONSAVEIS[0],
  previsaoDeInstalacao: "",
  etapa: "proposta" as EtapaId,
  observacao: "",
};

const UFS = ["MG", "SP", "RJ", "ES", "PR", "SC", "RS", "BA", "GO", "DF"];
const POTENCIAS = ["7.4", "11", "22", "40", "60", "120"];

/** `YYYY-MM-DD` de hoje + `dias`, para o placeholder da previsão. */
function emDias(dias: number): string {
  const d = new Date("2026-09-22T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function ImplantacaoFormPanel({
  implantacao,
  aberto,
  onClose,
  onSalvar,
}: {
  /** `null` = criação. */
  implantacao: Implantacao | null;
  aberto: boolean;
  onClose: () => void;
  onSalvar: (i: Implantacao) => void;
}) {
  const [form, setForm] = useState(VAZIO);
  const edicao = !!implantacao;

  useEffect(() => {
    if (!aberto) return;
    setForm(
      implantacao
        ? {
            cliente: implantacao.cliente,
            local: implantacao.local,
            cidade: implantacao.cidade,
            uf: implantacao.uf,
            pontos: String(implantacao.pontos),
            potenciaKw: String(implantacao.potenciaKw),
            investimento: String(implantacao.investimento),
            responsavel: implantacao.responsavel,
            previsaoDeInstalacao: implantacao.previsaoDeInstalacao,
            etapa: implantacao.etapa,
            observacao: implantacao.observacao ?? "",
          }
        : VAZIO,
    );
  }, [aberto, implantacao]);

  const campo = (k: keyof typeof VAZIO) => ({
    value: String(form[k]),
    onChange: (ev: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: ev.target.value })),
  });

  const seleto = (k: keyof typeof VAZIO) => ({
    value: String(form[k]),
    onValueChange: (v: string) => setForm((f) => ({ ...f, [k]: v })),
  });

  /* Cliente e local em branco bloqueiam: sem os dois o card do funil não tem o que
     mostrar. Valor e previsão não bloqueiam — uma proposta nasce sem número. */
  const faltaEssencial = !form.cliente.trim() || !form.local.trim();

  const salvar = () => {
    const base: Implantacao = implantacao ?? {
      id: `IMP-2026-${String(IMPLANTACOES.length + 1).padStart(3, "0")}`,
      etapa: "proposta",
      abertaEm: emDias(0),
      etapaDesde: emDias(0),
      feitos: [],
      cliente: "",
      local: "",
      cidade: "",
      uf: "MG",
      pontos: 1,
      potenciaKw: 22,
      investimento: 0,
      responsavel: RESPONSAVEIS[0],
      previsaoDeInstalacao: emDias(90),
    };

    onSalvar({
      ...base,
      cliente: form.cliente.trim(),
      local: form.local.trim(),
      cidade: form.cidade.trim(),
      uf: form.uf,
      pontos: Math.max(1, Number(form.pontos) || 1),
      potenciaKw: Number(form.potenciaKw) || 22,
      investimento: Math.max(0, Number(form.investimento) || 0),
      responsavel: form.responsavel,
      previsaoDeInstalacao: form.previsaoDeInstalacao || emDias(90),
      /* Etapa só muda pela edição; na criação o `base` já trouxe "proposta". */
      etapa: edicao ? form.etapa : base.etapa,
      observacao: form.observacao.trim() || undefined,
    });

    if (edicao) avisoDeSalvo({ o: "Implantação" });
    else
      avisoDeCriado({
        o: "Implantação",
        detalhe: "Entrou no funil em Proposta, com o checklist zerado.",
      });
    onClose();
  };

  return (
    <FloatingPanel
      open={aberto}
      onOpenChange={(v) => !v && onClose()}
      side="right"
      size={680}
      resizable
      resizableStorageKey="igreen-mob-cms.implantacao-form.width"
      title={edicao ? "Editar implantação" : "Nova implantação"}
      description={
        edicao
          ? "Dados do ponto. O andamento continua no painel de detalhe."
          : "Entra no funil em Proposta, com o checklist zerado."
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
            disabled={faltaEssencial}
            onClick={salvar}
          >
            {edicao ? "Salvar alterações" : "Criar implantação"}
          </Button>
        </>
      }
    >
      <FloatingPanelSection title="Quem e onde">
        <div className="flex flex-col gap-form-gap">
          <FormFieldInput
            label="Cliente"
            required
            placeholder="Empresa que hospeda o ponto"
            {...campo("cliente")}
          />
          {/* Texto livre COM sugestões, não select fechado: metade das implantações é de
              local que ainda não existe na rede — é justamente o que está sendo
              implantado. Um select só com os locais atuais impediria cadastrar o caso
              comum. */}
          <FormFieldInput
            label="Local"
            required
            placeholder="Nome do ponto"
            list="locais-da-rede"
            {...campo("local")}
          />
          <datalist id="locais-da-rede">
            {LOCAIS_DA_REDE.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
          <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-[1fr_120px]">
            <FormFieldInput label="Cidade" placeholder="Cidade" {...campo("cidade")} />
            <FormFieldSelect
              label="UF"
              options={UFS.map((u) => ({ value: u, label: u }))}
              {...seleto("uf")}
            />
          </div>
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="O que vai ser instalado">
        <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-3">
          <FormFieldInput
            label="Pontos"
            type="number"
            min={1}
            inputMode="numeric"
            {...campo("pontos")}
          />
          <FormFieldSelect
            label="Potência por ponto"
            options={POTENCIAS.map((p) => ({ value: p, label: `${p} kW` }))}
            {...seleto("potenciaKw")}
          />
          <FormFieldInput
            label="Investimento (R$)"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            {...campo("investimento")}
          />
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection title="Condução">
        <div className="flex flex-col gap-form-gap">
          <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
            <FormFieldSelect
              label="Responsável"
              options={RESPONSAVEIS.map((r) => ({ value: r, label: r }))}
              {...seleto("responsavel")}
            />
            <FormFieldInput
              label="Previsão de instalação"
              type="date"
              {...campo("previsaoDeInstalacao")}
            />
          </div>

          {edicao && (
            /* Só na edição — ver o JSDoc do topo. */
            <FormFieldSelect
              label="Etapa"
              helperText="Mover por aqui não confere o checklist. Prefira o botão de avançar no detalhe."
              options={ETAPAS.map((e) => ({ value: e.id, label: e.label }))}
              {...seleto("etapa")}
            />
          )}

          <FormFieldTextarea
            label="Observação"
            placeholder="O que está segurando, combinados com o cliente, restrições do local"
            rows={3}
            {...campo("observacao")}
          />
        </div>
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
