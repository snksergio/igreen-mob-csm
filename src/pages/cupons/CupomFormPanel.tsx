import { useEffect, useState } from "react";
import { Percent, Plug, Save } from "lucide-react";
import {
  Button,
  CardOption,
  CardOptionGroup,
  DatePicker,
  FloatingPanel,
  FormFieldInput,
  FormFieldSelect,
} from "@snksergio/design-system";
import { Checkbox } from "@snksergio/design-system/shadcn";
import {
  CUPOM_FORM,
  LOCAIS_DO_CUPOM,
  gerarCodigo,
  type Cupom,
  type TipoDeCupom,
} from "./cupons-mock";
import { LinkDeAcao } from "~/components/LinkDeAcao";
import { SeletorDeLocais } from "./cupons-ui";

/**
 * Painel de criação e edição de cupom.
 *
 * ## Formulário corrido, sem cards
 *
 * A referência empacota cada grupo de campo num card cinza — `Tipo`, `Nome`, `Desconto`,
 * `Código`, `Validade`, cinco molduras para cinco coisas que são o MESMO formulário. Aqui é
 * uma coluna só: rótulo e campo, com o espaçamento do DS (`gap-form-gap`) separando os
 * blocos. Card serve pra agrupar o que se lê em conjunto; num formulário linear ele só
 * acrescenta borda.
 *
 * Duas exceções ficaram com moldura, e por motivos diferentes:
 *
 * - **Locais** é uma lista rolável com busca — precisa de um limite visível, senão não se
 *   sabe onde ela termina;
 * - **Validade** agrupa dois campos de data MAIS cinco modificadores que mudam quais campos
 *   existem. A moldura é o que diz que os cinco pertencem às datas, e não ao formulário
 *   inteiro.
 *
 * ## Os modificadores vêm ANTES das datas
 *
 * `Nunca expira` some com o campo `Término`. Na origem ele fica à direita das datas, então
 * marcar um checkbox faz um campo desaparecer à esquerda, acima dele — o olho perde o que
 * mudou. Com os checkboxes em cima, o campo some ABAIXO do controle que o removeu.
 */

interface Props {
  /** `null` fecha; um cupom abre em edição; `"novo"` abre o formulário vazio. */
  cupom: Cupom | "novo" | null;
  onClose: () => void;
}

/** Estado inicial de um cupom novo — 30 dias a partir de hoje, como a referência. */
function vazio() {
  const inicio = new Date();
  const termino = new Date(inicio.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { inicio, termino };
}

/** `17:47` — a parte de hora, que o `DatePicker` não cobre. */
function paraHora(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/**
 * Uma ponta da validade: **`DatePicker` do DS para a data, campo de hora ao lado**.
 *
 * ⚠️ O `DatePicker` do DS não tem modo com hora — `single`, `range` e `multiple` devolvem
 * `Date` sem componente de tempo (`DatePicker/USAGE.md`). E a hora importa aqui: cupom de
 * madrugada começa às 22:00, não à meia-noite do dia seguinte.
 *
 * Então são dois controles para um valor, com o calendário do DS na data (que é onde um
 * `input` nativo destoaria do resto do produto) e `type="time"` na hora, que é onde o
 * controle do navegador já faz o certo: máscara, setas e teclado numérico no mobile.
 *
 * Um gap do DS anotado: falta um `mode` com hora, ou um `DateTimePicker`.
 */
function CampoDeDataHora({
  label,
  data,
  onData,
  hora,
  onHora,
}: {
  label: string;
  data: Date | undefined;
  onData: (d: Date | undefined) => void;
  hora: string;
  onHora: (h: string) => void;
}) {
  return (
    <div className="flex flex-col gap-gp-md">
      <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
        {label}
      </span>
      <div className="flex items-start gap-gp-md">
        <DatePicker
          mode="single"
          value={data}
          onValueChange={onData}
          placeholder="Selecione a data"
          className="min-w-0 flex-1"
        />
        {/* `w-[116px]`: cabe `00:00` mais o stepper que o Chrome desenha no `type="time"`.
            Sem largura fixa ele ficaria do mesmo tamanho do calendário e os dois pareceriam
            campos independentes, não duas partes do mesmo instante. */}
        <div className="w-[116px] shrink-0">
          <FormFieldInput
            label={`Hora de ${label.toLowerCase()}`}
            className="[&>label]:sr-only"
            type="time"
            value={hora}
            onChange={(e) => onHora(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Linha de modificador: checkbox + rótulo, e o campo que ele revela.
 *
 * O campo aparece INDENTADO sob o checkbox, não ao lado: alinhado à esquerda com o rótulo
 * ele pareceria um campo independente que por acaso está perto de um checkbox.
 */
function Modificador({
  id,
  label,
  marcado,
  onMarcar,
  children,
}: {
  id: string;
  label: string;
  marcado: boolean;
  onMarcar: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-gp-md">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-gp-md text-body-sm text-fg-default"
      >
        <Checkbox
          id={id}
          checked={marcado}
          onCheckedChange={(v) => onMarcar(v === true)}
        />
        {label}
      </label>
      {marcado && children && (
        <div className="pl-[30px]">{children}</div>
      )}
    </div>
  );
}

export function CupomFormPanel({ cupom, onClose }: Props) {
  const editando = cupom !== null && cupom !== "novo";

  const [locais, setLocais] = useState<string[]>([]);
  const [tipo, setTipo] = useState<TipoDeCupom>("desconto");
  const [nome, setNome] = useState("");
  const [percentual, setPercentual] = useState("");
  const [codigo, setCodigo] = useState("");
  const [inicio, setInicio] = useState<Date | undefined>();
  const [horaInicio, setHoraInicio] = useState("00:00");
  const [termino, setTermino] = useState<Date | undefined>();
  const [horaTermino, setHoraTermino] = useState("23:59");
  const [nuncaExpira, setNuncaExpira] = useState(false);
  const [limiteUsos, setLimiteUsos] = useState<string | null>(null);
  const [limitePorMotorista, setLimitePorMotorista] = useState<string | null>(
    null,
  );
  const [faixa, setFaixa] = useState<{ de: string; ate: string } | null>(null);
  const [valorMinimo, setValorMinimo] = useState<string | null>(null);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  useEffect(() => {
    if (!cupom) return;
    setTentouSalvar(false);
    if (cupom === "novo") {
      const { inicio: i, termino: t } = vazio();
      setLocais([]);
      setTipo("desconto");
      setNome("");
      setPercentual("");
      setCodigo("");
      setInicio(i);
      setHoraInicio(paraHora(i));
      setTermino(t);
      setHoraTermino(paraHora(t));
      setNuncaExpira(false);
      setLimiteUsos(null);
      setLimitePorMotorista(null);
      setFaixa(null);
      setValorMinimo(null);
      return;
    }
    setLocais(cupom.locais);
    setTipo(cupom.tipo);
    setNome(cupom.nome);
    setPercentual(cupom.percentual === null ? "" : String(cupom.percentual));
    setCodigo(cupom.codigo);
    setInicio(cupom.inicio);
    setHoraInicio(paraHora(cupom.inicio));
    setTermino(cupom.termino ?? undefined);
    setHoraTermino(cupom.termino ? paraHora(cupom.termino) : "23:59");
    setNuncaExpira(cupom.regras.nuncaExpira);
    setLimiteUsos(
      cupom.regras.limiteDeUsos === null
        ? null
        : String(cupom.regras.limiteDeUsos),
    );
    setLimitePorMotorista(
      cupom.regras.limitePorMotorista === null
        ? null
        : String(cupom.regras.limitePorMotorista),
    );
    setFaixa(cupom.regras.faixaHoraria);
    setValorMinimo(
      cupom.regras.valorMinimo === null ? null : String(cupom.regras.valorMinimo),
    );
  }, [cupom]);

  if (!cupom) return null;

  const semLocal = locais.length === 0;

  return (
    <FloatingPanel
      open={!!cupom}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      /* 680px: o formulário é de coluna única, mas os pares de data e a lista de locais
         ficam apertados abaixo disso — nome de local aqui chega a 52 caracteres. */
      size={680}
      resizable
      maximizable
      resizableMinWidth={560}
      resizableMaxWidth={1100}
      resizableStorageKey="igreen-mob-cms.cupom-form.width"
      titleSlot={
        <div className="flex min-w-0 items-center gap-gp-sm text-body-sm text-fg-muted">
          <span className="truncate">Cupons</span>
          <span className="opacity-50">/</span>
          <span className="truncate font-medium text-fg-default">
            {editando ? cupom.codigo : "Novo"}
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            {CUPOM_FORM.cancelar}
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Save />}
            onClick={() => {
              setTentouSalvar(true);
              if (!semLocal) onClose();
            }}
          >
            {CUPOM_FORM.salvar}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-form-gap">
        <h2 className="text-balance text-title-lg text-fg-default">
          {editando ? CUPOM_FORM.tituloEdicao : CUPOM_FORM.titulo}
        </h2>

        {/* ── Escopo ─────────────────────────────────────────────────────── */}
        <FormFieldSelect
          label={CUPOM_FORM.empresa}
          options={[{ value: "PV MOB", label: "PV MOB" }]}
          value="PV MOB"
          disabled
          helperText={CUPOM_FORM.locaisAjuda}
        />

        <SeletorDeLocais
          disponiveis={LOCAIS_DO_CUPOM}
          selecionados={locais}
          onChange={setLocais}
          /* O erro só aparece DEPOIS de tentar salvar: mostrar "é necessário selecionar" num
             formulário recém-aberto acusa o usuário de um erro que ele ainda não cometeu. */
          erro={tentouSalvar && semLocal ? CUPOM_FORM.erroSemLocal : undefined}
        />

        {/* ── Tipo ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-gp-md">
          <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
            {CUPOM_FORM.tipo}
          </span>
          {/* `CardOption` do DS — é exatamente o desenho da referência (card com ícone,
              título e seleção destacada), e é raro o componente cair pronto assim. */}
          <CardOptionGroup
            type="radio"
            layout="spaced"
            value={tipo}
            onValueChange={(v) => setTipo(v as TipoDeCupom)}
            className="sm:grid-cols-2"
          >
            <CardOption
              value="desconto"
              label="Cupom de desconto"
              description="Aplica um percentual sobre o valor da recarga."
              icon={<Percent />}
            />
            <CardOption
              value="primeira-recarga"
              label="Cupom de primeira recarga"
              description="Libera a primeira recarga do motorista no app."
              icon={<Plug />}
            />
          </CardOptionGroup>
        </div>

        {/* ── Identificação ──────────────────────────────────────────────── */}
        <FormFieldInput
          label={CUPOM_FORM.nome}
          placeholder={CUPOM_FORM.nomeExemplo}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          helperText={CUPOM_FORM.nomeAjuda}
        />

        {/* ⚠️ Só no cupom de DESCONTO: o de primeira recarga libera a recarga inteira, não
            um percentual dela. Mostrar o campo vazio nos dois casos faria parecer que
            alguém esqueceu de preencher. */}
        {tipo === "desconto" && (
          <FormFieldInput
            label={CUPOM_FORM.desconto}
            type="number"
            placeholder={CUPOM_FORM.descontoExemplo}
            value={percentual}
            onChange={(e) => setPercentual(e.target.value)}
            helperText={CUPOM_FORM.descontoAjuda}
            endAddon="%"
          />
        )}

        <div className="flex flex-col gap-gp-md">
          <div className="flex items-baseline justify-between gap-gp-md">
            <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
              {CUPOM_FORM.codigo}
            </span>
            {/* Mesmo tratamento do `Marcar todos`: é atalho, e na referência ele também
                é um link ao lado do rótulo. */}
            <LinkDeAcao onClick={() => setCodigo(gerarCodigo())}>
              {CUPOM_FORM.gerarCodigo}
            </LinkDeAcao>
          </div>
          <FormFieldInput
            label={CUPOM_FORM.codigo}
            className="[&>label]:sr-only"
            placeholder={CUPOM_FORM.codigoExemplo}
            value={codigo}
            /* Caixa alta na digitação: o código é case-insensitive na aplicação, e deixar
               minúsculas aqui faria o operador achar que existem dois códigos diferentes. */
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            helperText={CUPOM_FORM.codigoAjuda}
            inputMode="text"
          />
        </div>

        {/* ── Validade ───────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-form-gap rounded-radius-xl border border-border-default bg-bg-surface p-pad-2xl">
          <span className="text-body-md font-semibold text-fg-default">
            {CUPOM_FORM.validade}
          </span>

          {/* Os cinco modificadores ANTES das datas — ver o JSDoc. */}
          <div className="flex flex-col gap-gp-lg">
            <Modificador
              id="nunca-expira"
              label={CUPOM_FORM.nuncaExpira}
              marcado={nuncaExpira}
              onMarcar={setNuncaExpira}
            />
            <Modificador
              id="limite-usos"
              label={CUPOM_FORM.limiteDeUsos}
              marcado={limiteUsos !== null}
              onMarcar={(v) => setLimiteUsos(v ? "100" : null)}
            >
              <FormFieldInput
                label="Total de utilizações"
                type="number"
                value={limiteUsos ?? ""}
                onChange={(e) => setLimiteUsos(e.target.value)}
                className="max-w-[240px]"
              />
            </Modificador>
            <Modificador
              id="limite-motorista"
              label={CUPOM_FORM.limitePorMotorista}
              marcado={limitePorMotorista !== null}
              onMarcar={(v) => setLimitePorMotorista(v ? "1" : null)}
            >
              <FormFieldInput
                label="Utilizações por motorista"
                type="number"
                value={limitePorMotorista ?? ""}
                onChange={(e) => setLimitePorMotorista(e.target.value)}
                className="max-w-[240px]"
              />
            </Modificador>
            <Modificador
              id="faixa-horaria"
              label={CUPOM_FORM.faixaHoraria}
              marcado={faixa !== null}
              onMarcar={(v) => setFaixa(v ? { de: "22:00", ate: "06:00" } : null)}
            >
              <div className="grid max-w-[360px] grid-cols-2 gap-form-gap">
                <FormFieldInput
                  label="Das"
                  type="time"
                  value={faixa?.de ?? ""}
                  onChange={(e) =>
                    setFaixa((f) => ({ de: e.target.value, ate: f?.ate ?? "" }))
                  }
                />
                <FormFieldInput
                  label="Até"
                  type="time"
                  value={faixa?.ate ?? ""}
                  onChange={(e) =>
                    setFaixa((f) => ({ de: f?.de ?? "", ate: e.target.value }))
                  }
                />
              </div>
            </Modificador>
            <Modificador
              id="valor-minimo"
              label={CUPOM_FORM.valorMinimo}
              marcado={valorMinimo !== null}
              onMarcar={(v) => setValorMinimo(v ? "20" : null)}
            >
              <FormFieldInput
                label="Valor mínimo da recarga"
                type="number"
                value={valorMinimo ?? ""}
                onChange={(e) => setValorMinimo(e.target.value)}
                startAddon="R$"
                className="max-w-[240px]"
              />
            </Modificador>
          </div>

          <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
            <CampoDeDataHora
              label={CUPOM_FORM.inicio}
              data={inicio}
              onData={setInicio}
              hora={horaInicio}
              onHora={setHoraInicio}
            />
            {/* Some com `Nunca expira` — e some ABAIXO do checkbox que o removeu. */}
            {!nuncaExpira && (
              <CampoDeDataHora
                label={CUPOM_FORM.termino}
                data={termino}
                onData={setTermino}
                hora={horaTermino}
                onHora={setHoraTermino}
              />
            )}
          </div>
          <span className="text-caption-md text-fg-muted">
            {CUPOM_FORM.validadeAjuda}
          </span>
        </section>
      </div>
    </FloatingPanel>
  );
}
