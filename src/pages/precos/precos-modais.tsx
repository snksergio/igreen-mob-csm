import { useMemo, useState } from "react";
import { Tag, X, Zap } from "lucide-react";
import {
  Chip,
  FormFieldInput,
  FormFieldSelect,
  Modal,
} from "@snksergio/design-system";
import {
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Switch,
} from "@snksergio/design-system/shadcn";
import {
  AJUDA_TAGS,
  DIAS_DA_SEMANA,
  PERFIS_DE_PRECO,
  resumoDaRegra,
  type DiaDaSemana,
  type Disponibilidade,
  type ModoDeCobranca,
  type PerfilDePreco,
  type UsoDeCupons,
} from "./precos-mock";
import { CampoDeTags } from "~/components/CampoDeTags";
import {
  AvisoInfo,
  PAR_COBRANCA,
  PAR_CUPONS,
  PAR_DISPONIBILIDADE,
  ParDeOpcoes,
} from "./precos-ui";

/**
 * Os dois modais de Preços — `Criar perfil de preço` e `Nova regra de cobrança`.
 *
 * Mesma decisão de Gestão de Carga: `Modal`, não um segundo `FloatingPanel`. Os dois
 * interrompem pra pedir input e voltam pro lugar de onde saíram, e painel sobre painel daria
 * dois `X` sem dizer qual fecha o quê.
 */

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Criar perfil de preço
 * ═══════════════════════════════════════════════════════════════════════════════════ */

/** Empresas e locais para os dois selects — derivados dos próprios perfis do mock. */
function opcoesDeEscopo() {
  const empresas = [...new Set(PERFIS_DE_PRECO.map((p) => p.empresa))];
  return {
    empresas: empresas.map((e) => ({ value: e, label: e })),
    locais: PERFIS_DE_PRECO.map((p) => ({ value: p.id, label: p.local })),
  };
}

export function ModalCriarPerfil({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { empresas, locais } = useMemo(opcoesDeEscopo, []);
  const [empresa, setEmpresa] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Criar perfil de preço"
      icon={<Tag className="size-icon-md" strokeWidth={1.7} />}
      description="Dados do perfil"
      size="lg"
      secondaryAction={{ label: "Cancelar" }}
      primaryAction={{ label: "Salvar", onClick: onClose }}
    >
      <FormFieldInput
        label="Nome"
        placeholder="Digite o nome do perfil de preço"
      />
      <FormFieldSelect
        label="Empresa vinculada"
        placeholder="Selecione a empresa"
        options={empresas}
        value={empresa || undefined}
        onValueChange={setEmpresa}
      />
      {/* ⚠️ **Desabilitado até haver empresa, e isso é da referência**: no print o campo de
          local aparece esmaecido enquanto o de empresa está vazio. Faz sentido de domínio —
          local pertence a uma empresa, e oferecer a lista inteira antes deixaria escolher um
          local de outra empresa. */}
      <FormFieldSelect
        label="Local vinculado"
        placeholder="Selecione o local"
        options={locais}
        disabled={!empresa}
        helperText={
          empresa ? undefined : "Selecione a empresa para liberar os locais."
        }
      />
      {/* O `CampoDeTags` compartilhado não traz rótulo nem ajuda — quem usa decide se
          precisa. Aqui precisa: é um campo entre quatro num formulário. */}
      <div className="flex flex-col gap-gp-md">
        <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
          Tags
        </span>
        <CampoDeTags tags={tags} onChange={setTags} />
        <AvisoInfo>{AJUDA_TAGS}</AvisoInfo>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Nova regra de cobrança
 * ═══════════════════════════════════════════════════════════════════════════════════ */

/** Linha de tipo de cobrança: switch + rótulo + o campo de valor à direita. */
function TipoDeCobranca({
  label,
  ligado,
  onToggle,
  children,
}: {
  label: string;
  ligado: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-gp-md">
      <label className="flex cursor-pointer items-center gap-gp-md text-body-sm text-fg-default">
        <Switch checked={ligado} onCheckedChange={onToggle} />
        {label}
      </label>
      {/* O campo de valor fica visível mesmo desligado, como na referência — esmaecido. Ele
          mostra a UNIDADE da cobrança (`/ kWh`, `/ hora`), que é o que diz o que aquele tipo
          cobra. Esconder deixaria o switch sem explicar o que ele liga. */}
      <div className="w-[164px]">{children}</div>
    </div>
  );
}

/**
 * Campo de valor com prefixo de moeda e sufixo de unidade.
 *
 * `InputGroup` do DS com os dois adornos, e não input na unha: o foco do DS anima o anel
 * E a cor da borda juntos, e a versão feita à mão só tinha o anel — a borda ficava cinza no
 * campo focado.
 *
 * É o `InputGroup` e não o `FormFieldInput` porque quem nomeia o campo é o rótulo do
 * switch, à esquerda, e o `FormFieldInput` sempre renderiza o próprio label (`hideLabel`
 * existe só no `FormField` base). O nome vai no `aria-label`.
 */
function ValorComUnidade({
  unidade,
  valor,
  onChange,
  disabled,
  rotulo,
}: {
  unidade: string;
  valor: string;
  onChange: (v: string) => void;
  disabled: boolean;
  rotulo: string;
}) {
  return (
    <InputGroup className={disabled ? "opacity-50" : undefined}>
      <InputGroupAddon align="inline-start">
        <InputGroupText>R$</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="text-right tabular-nums"
        aria-label={rotulo}
      />
      {unidade && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{unidade}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

export function ModalNovaRegra({
  perfil,
  open,
  onClose,
}: {
  perfil: PerfilDePreco;
  open: boolean;
  onClose: () => void;
}) {
  const [horaInicial, setHoraInicial] = useState("00:00");
  const [horaFinal, setHoraFinal] = useState("00:30");
  const [dias, setDias] = useState<DiaDaSemana[]>([]);
  const [disponibilidade, setDisponibilidade] =
    useState<Disponibilidade>("disponivel");
  const [modoDeCobranca, setModoDeCobranca] = useState<ModoDeCobranca>("normal");
  const [usoDeCupons, setUsoDeCupons] = useState<UsoDeCupons>("permitir");

  const [energiaLigada, setEnergiaLigada] = useState(true);
  const [energia, setEnergia] = useState("3");
  const [usoLigado, setUsoLigado] = useState(false);
  const [uso, setUso] = useState("");
  const [ativacaoLigada, setAtivacaoLigada] = useState(true);
  const [ativacao, setAtivacao] = useState("3");
  const [tolerancia, setTolerancia] = useState("15");
  const [isencao, setIsencao] = useState("0");
  const [ociosidadeLigada, setOciosidadeLigada] = useState(false);
  const [ociosidade, setOciosidade] = useState("");

  const numero = (v: string) => (v.trim() === "" ? 0 : Number(v));

  /* O resumo é DERIVADO do formulário inteiro, a cada tecla. É a única parte deste modal que
     não é enfeite: ela traduz sete controles numa frase, e é por ela que se confere a regra
     antes de salvar. A função mora no mock porque o texto é da referência. */
  const resumo = resumoDaRegra({
    dias,
    horaInicial,
    horaFinal,
    modoDeCobranca,
    usoDeCupons,
    precoEnergia: energiaLigada ? numero(energia) : null,
    usoDoCarregador: usoLigado ? numero(uso) : null,
    taxaDeAtivacao: ativacaoLigada ? numero(ativacao) : null,
    ociosidade: ociosidadeLigada ? numero(ociosidade) : null,
  });

  const alternarDia = (d: DiaDaSemana) =>
    setDias((atual) =>
      atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d],
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova regra de cobrança"
      icon={<Zap className="size-icon-md" strokeWidth={1.7} />}
      description={perfil.local}
      /* `xl` (1100px) seria largo demais pra um formulário de uma coluna; `lg` (720px) cabe
         as duas colunas de hora e os campos de tolerância/isenção lado a lado. */
      size="lg"
      secondaryAction={{ label: "Cancelar" }}
      primaryAction={{ label: "Salvar regra", onClick: onClose }}
    >
      {/* ── Período ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-form-gap rounded-radius-lg border border-border-default bg-bg-surface p-pad-2xl">
        <span className="text-body-sm font-semibold text-fg-default">
          Período
        </span>
        <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
          {/* `type="time"` nativo: o DS não tem TimePicker, e o controle do navegador já traz
              máscara, teclado numérico no mobile e o relógio que o print mostra. */}
          <FormFieldInput
            label="Hora inicial"
            type="time"
            value={horaInicial}
            onChange={(e) => setHoraInicial(e.target.value)}
          />
          <FormFieldInput
            label="Hora final"
            type="time"
            value={horaFinal}
            onChange={(e) => setHoraFinal(e.target.value)}
          />
        </div>
        {/* Dias como chips clicáveis, na ordem da origem (domingo primeiro). Não é
            `ToggleGroup`: aqui a escolha é MÚLTIPLA e independente, e cada dia é um
            checkbox com cara de chip — daí o `aria-pressed`. */}
        <div className="flex flex-wrap gap-gp-sm">
          {DIAS_DA_SEMANA.map((d) => {
            const ativo = dias.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => alternarDia(d)}
                aria-pressed={ativo}
                className={[
                  "min-h-form-sm rounded-radius-full border px-pad-xl text-body-xs font-medium",
                  "transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand",
                  ativo
                    ? "border-border-brand bg-bg-brand-subtle text-fg-brand"
                    : "border-border-default bg-bg-surface text-fg-muted hover:bg-bg-muted",
                ].join(" ")}
              >
                {d}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Os três pares, iguais aos do cabeçalho do painel ────────────────── */}
      <section className="flex flex-col gap-gp-lg rounded-radius-lg border border-border-default bg-bg-surface p-pad-2xl">
        <ParDeOpcoes
          label="Disponibilidade do carregador"
          valor={disponibilidade}
          opcoes={PAR_DISPONIBILIDADE}
          onChange={setDisponibilidade}
        />
        <ParDeOpcoes
          label="Modo de cobrança"
          valor={modoDeCobranca}
          opcoes={PAR_COBRANCA}
          onChange={setModoDeCobranca}
        />
        <ParDeOpcoes
          label="Uso de cupons"
          valor={usoDeCupons}
          opcoes={PAR_CUPONS}
          onChange={setUsoDeCupons}
        />
      </section>

      {/* ── Tipos de cobrança ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-gp-lg rounded-radius-lg border border-border-default bg-bg-surface p-pad-2xl">
        <span className="text-body-sm font-semibold text-fg-default">
          Tipos de cobrança
        </span>

        <TipoDeCobranca
          label="Preço da energia"
          ligado={energiaLigada}
          onToggle={setEnergiaLigada}
        >
          <ValorComUnidade
            rotulo="Preço da energia"
            unidade="/ kWh"
            valor={energia}
            onChange={setEnergia}
            disabled={!energiaLigada}
          />
        </TipoDeCobranca>

        <TipoDeCobranca
          label="Uso do carregador"
          ligado={usoLigado}
          onToggle={setUsoLigado}
        >
          <ValorComUnidade
            rotulo="Uso do carregador"
            unidade="/ hora"
            valor={uso}
            onChange={setUso}
            disabled={!usoLigado}
          />
        </TipoDeCobranca>

        <div className="flex flex-col gap-gp-lg">
          <TipoDeCobranca
            label="Taxa de ativação"
            ligado={ativacaoLigada}
            onToggle={setAtivacaoLigada}
          >
            <ValorComUnidade
              rotulo="Taxa de ativação"
              unidade=""
              valor={ativacao}
              onChange={setAtivacao}
              disabled={!ativacaoLigada}
            />
          </TipoDeCobranca>
          {/* ⚠️ Aqui tolerância e isenção são os DOIS campos, não um radio — diferente do
              painel, onde são escolha-um. É o que a referência mostra, e faz sentido: na
              regra de período os dois convivem (isenta por tempo OU por consumo, o que
              acontecer primeiro), enquanto no perfil a origem força escolher. */}
          {ativacaoLigada && (
            <div className="grid grid-cols-1 gap-form-gap pl-[52px] sm:grid-cols-2">
              <FormFieldInput
                label="Tolerância da 2ª recarga (min)"
                type="number"
                value={tolerancia}
                onChange={(e) => setTolerancia(e.target.value)}
              />
              <FormFieldInput
                label="Isenção mínima (kWh)"
                type="number"
                value={isencao}
                onChange={(e) => setIsencao(e.target.value)}
              />
            </div>
          )}
        </div>

        <TipoDeCobranca
          label="Taxa de ociosidade"
          ligado={ociosidadeLigada}
          onToggle={setOciosidadeLigada}
        >
          <ValorComUnidade
            rotulo="Taxa de ociosidade"
            unidade="/ hora"
            valor={ociosidade}
            onChange={setOciosidade}
            disabled={!ociosidadeLigada}
          />
        </TipoDeCobranca>
      </section>

      {/* ── Resumo ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-gp-md">
        <span className="text-body-sm font-semibold text-fg-default">
          Resumo da regra
        </span>
        {/* Verde de sucesso porque é confirmação do que se acabou de montar, não alerta —
            e é o único bloco verde deste modal, então não entra em briga de destaque. */}
        <p className="rounded-radius-lg border border-border-success-muted bg-bg-success-muted px-pad-2xl py-pad-xl text-caption-md text-fg-default">
          {resumo}
        </p>
      </section>
    </Modal>
  );
}
