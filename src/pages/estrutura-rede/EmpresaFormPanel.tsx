import { useEffect, useState } from "react";
import {
  Button,
  FloatingPanel,
  FormFieldInput,
  FormFieldSelect,
} from "@snksergio/design-system";
import {
  BANCOS,
  PERFIS_DE_PRECO,
  TIPOS_DE_CONTA,
  type NoDaRede,
} from "./estrutura-mock";
import { SecaoDeFormulario } from "./estrutura-ui";

/**
 * Formulário de empresa — criar e editar, tudo aberto.
 *
 * ## Sem abas, e o motivo vale pros dois formulários desta tela
 *
 * Decisão do operador (2026-09-16). Aba num formulário de CADASTRO é a pior aplicação
 * dela: quem preenche não sabe o que falta até abrir cada uma, o botão Salvar valida
 * campos que estão fora da tela, e o erro aparece numa aba que não é a que está aberta.
 * Aba serve pra CONSULTAR recortes de algo pronto, não pra preencher.
 *
 * O que substitui a aba é o `SecaoDeFormulario`: os mesmos grupos, empilhados, com heading
 * e divisória. A rolagem passa a ser o índice — e ela mostra quanto falta, que é
 * justamente o que a aba esconde.
 *
 * ## Os três grupos são os da referência, na ordem dela
 *
 * `Informações da empresa` · `Dados bancários` · `Perfil de preço padrão`.
 */

const VAZIO = {
  nome: "",
  exibicao: "",
  cnpj: "",
  cep: "",
  endereco: "",
  numero: "",
  cidade: "",
  estado: "",
  pais: "Brasil",
  complemento: "",
  responsavel: "",
  email: "",
  pix: "",
  banco: "",
  agencia: "",
  conta: "",
  tipoDeConta: "",
  perfil: PERFIS_DE_PRECO[0],
};

export function EmpresaFormPanel({
  aberto,
  empresa,
  onClose,
}: {
  aberto: boolean;
  /** `null` = criar. Preenchido = editar. */
  empresa: NoDaRede | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState(VAZIO);

  /* Recarrega ao trocar de empresa (ou ao abrir pra criar). Sem isto, abrir a edição de A,
     fechar e abrir a de B mostraria os dados de A — o `useState` só lê o inicial uma vez. */
  useEffect(() => {
    if (!aberto) return;
    setForm(
      empresa
        ? {
            ...VAZIO,
            nome: empresa.nome,
            exibicao: empresa.nome,
            cnpj: empresa.cnpj,
            endereco: empresa.endereco,
            responsavel: empresa.responsavel,
            email: empresa.email,
          }
        : VAZIO,
    );
  }, [aberto, empresa]);

  const campo = (k: keyof typeof VAZIO) => ({
    value: form[k],
    onChange: (ev: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: ev.target.value })),
  });

  const seleto = (k: keyof typeof VAZIO) => ({
    value: form[k],
    onValueChange: (v: string) => setForm((f) => ({ ...f, [k]: v })),
  });

  return (
    <FloatingPanel
      open={aberto}
      onOpenChange={(v) => !v && onClose()}
      side="right"
      /* 880 e não `xl` (720): o operador alargou os dois painéis na mão (2026-09-16). Os
         grids de três colunas — CEP/Endereço/Número e Cidade/Estado/País — respiram aqui e
         apertavam lá. `resizable` continua deixando encolher. */
      size={880}
      resizable
      maximizable
      resizableStorageKey="estrutura.empresa-form.width"
      bodyPadded={false}
      title={empresa ? "Editar empresa" : "Adicionar empresa"}
      description={
        empresa ? empresa.nome : "Informações da empresa e do responsável"
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="filled" color="primary" size="sm" onClick={onClose}>
            Salvar
          </Button>
        </>
      }
    >
      <SecaoDeFormulario titulo="Informações da empresa">
        {/* `gap-form-gap` (20px) e não `gap-gp-*`: é o token dedicado a espaço entre
            campos de formulário (L-024). Vale também nos grids internos. */}
        <div className="grid grid-cols-2 gap-form-gap">
          <FormFieldInput
            label="Nome da empresa"
            required
            placeholder="Razão social"
            {...campo("nome")}
          />
          <FormFieldInput
            label="Nome de exibição"
            required
            placeholder="Como aparece no app"
            helperText="É este nome que o motorista vê."
            {...campo("exibicao")}
          />
        </div>

        <FormFieldInput
          label="CNPJ"
          required
          placeholder="00.000.000/0000-00"
          className="[&_input]:tabular-nums"
          {...campo("cnpj")}
        />

        {/* CEP · Endereço · Número: o CEP vem PRIMEIRO porque é ele que, num sistema real,
            preenche os outros. A ordem do formulário ensina a ordem de digitar. */}
        <div className="grid grid-cols-[180px_1fr_140px] gap-form-gap">
          <FormFieldInput
            label="CEP"
            placeholder="00000-000"
            className="[&_input]:tabular-nums"
            {...campo("cep")}
          />
          <FormFieldInput
            label="Endereço"
            placeholder="Digite o endereço"
            {...campo("endereco")}
          />
          <FormFieldInput
            label="Número"
            placeholder="Nº"
            {...campo("numero")}
          />
        </div>

        <div className="grid grid-cols-[1fr_180px_180px] gap-form-gap">
          <FormFieldInput label="Cidade" placeholder="Digite a cidade" {...campo("cidade")} />
          <FormFieldInput label="Estado" placeholder="UF" {...campo("estado")} />
          <FormFieldInput label="País" placeholder="País" {...campo("pais")} />
        </div>

        <FormFieldInput
          label="Complemento"
          placeholder="Sala, andar, bloco"
          {...campo("complemento")}
        />

        <div className="grid grid-cols-2 gap-form-gap">
          <FormFieldInput
            label="Nome do responsável"
            required
            placeholder="Nome completo"
            {...campo("responsavel")}
          />
          <FormFieldInput
            label="E-mail do responsável"
            required
            type="email"
            placeholder="nome@empresa.com.br"
            {...campo("email")}
          />
        </div>
      </SecaoDeFormulario>

      <SecaoDeFormulario titulo="Dados bancários">
        <div className="grid grid-cols-2 gap-form-gap">
          <FormFieldInput
            label="Chave PIX"
            placeholder="CPF/CNPJ, celular, e-mail ou aleatória"
            {...campo("pix")}
          />
          <FormFieldSelect
            label="Banco"
            placeholder="Selecione um banco"
            options={BANCOS.map((b) => ({ value: b, label: b }))}
            {...seleto("banco")}
          />
        </div>

        <div className="grid grid-cols-[180px_1fr_200px] gap-form-gap">
          <FormFieldInput
            label="Agência"
            placeholder="0000"
            className="[&_input]:tabular-nums"
            {...campo("agencia")}
          />
          <FormFieldInput
            label="Conta"
            placeholder="Número da conta com dígito"
            className="[&_input]:tabular-nums"
            {...campo("conta")}
          />
          <FormFieldSelect
            label="Tipo de conta"
            placeholder="Selecione"
            options={TIPOS_DE_CONTA.map((c) => ({ value: c, label: c }))}
            {...seleto("tipoDeConta")}
          />
        </div>
      </SecaoDeFormulario>

      <SecaoDeFormulario titulo="Perfil de preço padrão" ultima>
        <FormFieldSelect
          label="Perfil de preço"
          /* "Herdar perfil da rede" é a primeira OPÇÃO, não a ausência de escolha: herdar
             é uma decisão, e um select vazio diria que ninguém decidiu. */
          options={PERFIS_DE_PRECO.map((p) => ({ value: p, label: p }))}
          helperText="Vale para os locais que não tiverem perfil próprio."
          {...seleto("perfil")}
        />
      </SecaoDeFormulario>
    </FloatingPanel>
  );
}
