import { useEffect, useState } from "react";
import {
  Check,
  ClipboardClock,
  Copy,
  Info,
  Plug,
  Radio,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  FormField,
  FormFieldInput,
  Modal,
} from "@snksergio/design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@snksergio/design-system/shadcn";
import { avisoDeCriado } from "~/components/feedback";
import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";
import {
  ADICIONAR,
  CONECTAR,
  FINALIZAR,
  PASSOS_DO_CADASTRO,
  URL_OCPP,
  gerarIdDeCarregador,
  type PassoDoCadastro,
} from "./carregadores-mock";

/**
 * Cadastro de carregador — três passos num modal só.
 *
 * ## Por que virou fluxo
 *
 * A versão anterior era um modal de campo único: gerava o ID e o `Continuar` fechava —
 * continuava para lugar nenhum. A referência encadeia **três** telas, e o motivo é do
 * mundo e não da interface: ver `PASSOS_DO_CADASTRO` no mock.
 *
 * ## Um `Modal`, três conteúdos
 *
 * Ícone, título, corpo e rótulo dos botões trocam por passo; o `Modal` permanece montado.
 * Três modais encadeados dariam três animações de abertura e fechamento para o que o
 * usuário entende como uma tarefa — e ele perderia a noção de onde está.
 *
 * ⚠️ O estado NÃO é resetado ao fechar por acidente. É resetado ao **abrir** (ver o
 * `useEffect`): quem fechou sem querer reabre onde estava, e quem terminou começa limpo.
 * O contrário — limpar no fechamento — perde o ID gerado, que é a única coisa da tela que
 * não se recupera digitando de novo.
 *
 * ## A trilha em cima é orientação, não navegação
 *
 * Os passos mostram onde se está e quantos faltam, mas **não são clicáveis**: pular para
 * "Configurações" sem ID produz um cadastro sem equipamento. O caminho de volta existe
 * pelo botão `Voltar`, que é o gesto que a pessoa procura.
 */

/* ────────────────────────────────────────────────────────────────────────────
   A trilha
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Trilha de passos — quadrado numerado, rótulo e descrição ABAIXO, fio de ponta a ponta.
 *
 * ## Três correções sobre a 1ª versão, todas apontadas na tela
 *
 * | era | virou | por quê |
 * |---|---|---|
 * | círculo de 24px, número em `caption-sm` | quadrado de 36px, número em `body-md bold` | o número é o que identifica o passo; em 12px ele era decoração |
 * | rótulo AO LADO, em `caption-md text-fg-subtle` | **abaixo**, em `body-sm` com `fg-default`/`fg-muted` | ao lado disputava largura com o fio; e `subtle` sobre `surface` era fraco demais para ler de passagem |
 * | fio entre rótulo e próximo número | fio **de ponta a ponta**, na linha dos quadrados | ele parava no meio do caminho porque dividia a linha com o texto |
 *
 * ## O truque que faz o fio ir "de fora a fora"
 *
 * Cada passo é uma coluna de largura igual (`grid-cols-3`), e **dentro** dela há sempre
 * TRÊS peças na linha do número: fio à esquerda, quadrado, fio à direita. No primeiro
 * passo o fio da esquerda e no último o da direita ficam `invisible` — não `hidden`,
 * nem ausentes.
 *
 * ⚠️ A diferença importa: `invisible` mantém o elemento ocupando espaço, então o quadrado
 * continua no CENTRO da coluna. Removendo o fio, o primeiro quadrado encostaria na
 * esquerda e o último na direita, e os três deixariam de se alinhar com os rótulos
 * centralizados embaixo.
 *
 * ## Mobile
 *
 * As três colunas continuam lado a lado — empilhar mataria a metáfora de progresso, que é
 * horizontal. O que cede é o texto: a descrição some abaixo de `sm`, porque em ~110px de
 * coluna ela quebraria em três linhas e empurraria o formulário para fora da dobra. O
 * rótulo sozinho já responde "onde estou", que é a função da trilha.
 */
function TrilhaDePassos({ atual }: { atual: PassoDoCadastro }) {
  const indiceAtual = PASSOS_DO_CADASTRO.findIndex((p) => p.id === atual);
  const ultimo = PASSOS_DO_CADASTRO.length - 1;

  return (
    <ol
      className="grid w-full grid-cols-3"
      aria-label="Passos do cadastro"
    >
      {PASSOS_DO_CADASTRO.map((passo, i) => {
        const feito = i < indiceAtual;
        const ativo = i === indiceAtual;

        const fio = (visivel: boolean, concluido: boolean) => (
          <span
            aria-hidden
            className={`h-px flex-1 ${visivel ? "" : "invisible"} ${
              concluido ? "bg-bg-success" : "bg-border-default"
            }`}
          />
        );

        return (
          <li key={passo.id} className="flex min-w-0 flex-col items-center gap-gp-lg">
            <div className="flex w-full items-center">
              {fio(i > 0, feito || ativo)}
              <span
                aria-current={ativo ? "step" : undefined}
                className={`grid size-[36px] shrink-0 place-items-center rounded-radius-md text-body-md font-bold tabular-nums ${
                  feito
                    ? "bg-bg-success text-fg-on-success"
                    : ativo
                      ? /* Anel com `offset` na cor da superfície: é o destaque do print,
                           e o offset é o que abre o respiro entre o anel e o quadrado. */
                        "bg-bg-brand text-fg-on-brand ring-2 ring-ring-brand ring-offset-2 ring-offset-bg-surface"
                      : "bg-bg-muted text-fg-muted"
                }`}
              >
                {feito ? (
                  <Check className="size-icon-sm" strokeWidth={3} aria-hidden />
                ) : (
                  i + 1
                )}
              </span>
              {fio(i < ultimo, feito)}
            </div>

            <div className="flex min-w-0 flex-col items-center gap-[2px] px-gp-sm text-center">
              <span
                /* ⚠️ `caption-md` no mobile, `body-sm` a partir de `sm`. "Configurações"
                   é palavra única de 13 letras: a 14px ela mede 99px e a coluna do
                   mobile tem 97px — transbordava 2px, medido, e palavra única não
                   quebra. `break-words` é a rede para um rótulo futuro mais longo. */
                className={`break-words text-caption-md font-semibold leading-tight sm:text-body-sm ${
                  ativo ? "text-fg-default" : "text-fg-muted"
                }`}
              >
                {passo.rotulo}
              </span>
              {/* Some no mobile — ver o JSDoc. */}
              <span className="hidden text-caption-sm leading-snug text-fg-subtle sm:block">
                {passo.descricao}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Campo de leitura com "Copiar"
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Campo somente-leitura com botão de copiar.
 *
 * O rótulo do botão confirma no PRÓPRIO botão por ~1,6s em vez de disparar um toast: o
 * gesto é "copiei este campo", e a confirmação precisa estar onde o olho já está. Um toast
 * no canto da tela obrigaria a desviar o olhar para saber se o clique pegou.
 *
 * ⚠️ `navigator.clipboard` exige contexto seguro (HTTPS ou localhost) e pode ser negado
 * pela permissão. O `catch` mantém o botão inerte em vez de deixar o app estourar — e o
 * valor segue visível e selecionável à mão, que é o caminho de saída.
 */
function CampoCopiavel({
  label,
  valor,
  ajuda,
}: {
  label: string;
  valor: string;
  ajuda?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 1600);
    return () => clearTimeout(t);
  }, [copiado]);

  return (
    <FormField label={label} helperText={ajuda}>
      {({ id }) => (
        <div className="flex items-start gap-gp-md">
          <input
            id={id}
            readOnly
            value={valor}
            className="min-h-form-lg min-w-0 flex-1 cursor-text select-all rounded-radius-lg border border-border-input bg-bg-muted px-pad-xl text-body-sm text-fg-default outline-none"
          />
          <Button
            variant="outline"
            color="secondary"
            size="lg"
            className="shrink-0"
            iconLeft={copiado ? <Check /> : <Copy />}
            onClick={() => {
              navigator.clipboard
                ?.writeText(valor)
                .then(() => setCopiado(true))
                .catch(() => {
                  /* Sem permissão de clipboard: o valor continua selecionável. */
                });
            }}
          >
            {copiado ? CONECTAR.copiado : CONECTAR.copiar}
          </Button>
        </div>
      )}
    </FormField>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   O modal
   ──────────────────────────────────────────────────────────────────────────── */

const LOCAIS = Object.keys(GEO_DOS_LOCAIS);

const CABECALHO: Record<PassoDoCadastro, { titulo: string; icone: LucideIcon }> =
  {
    identificar: { titulo: ADICIONAR.titulo, icone: Plug },
    conectar: { titulo: CONECTAR.titulo, icone: Radio },
    finalizar: { titulo: FINALIZAR.titulo, icone: ClipboardClock },
  };

export function ModalAdicionarCarregador({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [passo, setPasso] = useState<PassoDoCadastro>("identificar");
  const [id, setId] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");

  /* Limpa ao ABRIR, não ao fechar — ver o JSDoc do topo. */
  useEffect(() => {
    if (!open) return;
    setPasso("identificar");
    setId("");
    setNome("");
    setDescricao("");
    setLocal("");
  }, [open]);

  const idCurto = id.trim().length > 0 && id.trim().length < 6;
  const idValido = id.trim().length >= 6;

  const cabecalho = CABECALHO[passo];
  const Icone = cabecalho.icone;

  const concluir = () => {
    avisoDeCriado({
      o: "Carregador",
      detalhe: `${nome.trim() || id} · ${local || "sem local vinculado"}.`,
    });
    onClose();
  };

  /**
   * O par de botões por passo.
   *
   * ⚠️ O secundário do primeiro passo é `Cancelar` (fecha), e dos outros dois é `Voltar`
   * (retrocede). É a mesma posição com dois significados, e trocar um pelo outro no lugar
   * errado é o que faz alguém perder o ID gerado achando que voltava uma tela.
   */
  const acoes =
    passo === "identificar"
      ? {
          secundaria: { label: "Cancelar" },
          primaria: {
            label: ADICIONAR.continuar,
            onClick: () => setPasso("conectar"),
            disabled: !idValido,
          },
        }
      : passo === "conectar"
        ? {
            secundaria: {
              label: FINALIZAR.voltar,
              onClick: () => setPasso("identificar"),
            },
            primaria: {
              label: ADICIONAR.continuar,
              onClick: () => setPasso("finalizar"),
            },
          }
        : {
            secundaria: {
              label: FINALIZAR.voltar,
              onClick: () => setPasso("conectar"),
            },
            primaria: {
              label: FINALIZAR.concluir,
              onClick: concluir,
              /* Nome é o mínimo: um carregador sem nome aparece na lista como um ID, e a
                 lista é onde alguém procura por ele. O local pode vir depois. */
              disabled: nome.trim().length === 0,
            },
          };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cabecalho.titulo}
      icon={<Icone className="size-icon-md" strokeWidth={1.7} />}
      size="lg"
      secondaryAction={acoes.secundaria}
      primaryAction={acoes.primaria}
    >
      <TrilhaDePassos atual={passo} />

      {passo === "identificar" && (
        <div className="flex flex-col gap-gp-md">
          <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
            {ADICIONAR.label}
          </span>
          {/* Campo e botão na mesma linha, como na referência — `Gerar` preenche o campo
              ao lado, e separá-los faria parecer duas ações independentes. */}
          <div className="flex flex-wrap items-start gap-gp-md">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={ADICIONAR.placeholder}
              aria-label={ADICIONAR.label}
              className="min-h-form-lg min-w-0 flex-1 rounded-radius-lg border border-border-input bg-bg-input px-pad-xl text-body-sm tabular-nums text-fg-default outline-none transition-[border-color,box-shadow] placeholder:text-fg-subtle focus-visible:border-border-brand focus-visible:shadow-sh-ring dark:bg-bg-muted"
            />
            <Button
              variant="outline"
              color="secondary"
              size="lg"
              onClick={() => setId(gerarIdDeCarregador())}
            >
              {ADICIONAR.gerar}
            </Button>
          </div>
          <span
            className={`text-caption-md ${idCurto ? "text-fg-danger" : "text-fg-muted"}`}
          >
            {idCurto
              ? `O ID precisa ter 6 caracteres ou mais — ${ADICIONAR.placeholder.toLowerCase()}.`
              : "O ID identifica o equipamento no protocolo OCPP e não pode repetir."}
          </span>
        </div>
      )}

      {passo === "conectar" && (
        <div className="flex flex-col gap-form-gap">
          <p className="text-body-sm text-fg-muted">{CONECTAR.intro}</p>
          <CampoCopiavel label={CONECTAR.labelUrl} valor={URL_OCPP} />
          <CampoCopiavel
            label={CONECTAR.labelId}
            valor={id.trim()}
            ajuda={CONECTAR.ajuda}
          />
        </div>
      )}

      {passo === "finalizar" && (
        <div className="flex flex-col gap-form-gap">
          <FormFieldInput
            label={FINALIZAR.labelNome}
            required
            placeholder={FINALIZAR.placeholderNome}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <FormFieldInput
            label={FINALIZAR.labelDescricao}
            placeholder={FINALIZAR.placeholderDescricao}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          {/* `Select` cru: o `hideLabel` não desce pros `FormField*` especializados, e
              aqui o rótulo é visível mesmo — o wrapper genérico basta. */}
          <FormField label={FINALIZAR.labelLocal}>
            {({ id: idDoCampo }) => (
              <Select value={local} onValueChange={setLocal}>
                <SelectTrigger id={idDoCampo} className="w-full">
                  <SelectValue placeholder={FINALIZAR.placeholderLocal} />
                </SelectTrigger>
                <SelectContent>
                  {LOCAIS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <p className="flex items-start gap-gp-md rounded-radius-lg border border-border-brand bg-bg-brand-subtle px-pad-2xl py-pad-xl text-caption-md text-fg-brand">
            <Info className="mt-[1px] size-icon-sm shrink-0" aria-hidden />
            {FINALIZAR.aviso}
          </p>
        </div>
      )}
    </Modal>
  );
}
