import { useMemo, useState } from "react";
import {
  Copy,
  Info,
  Play,
  RotateCw,
  ScrollText,
  Search,
  Terminal,
  UserPlus,
} from "lucide-react";
import {
  Button,
  Chip,
  DataTable,
  DatePicker,
  FormFieldSelect,
  Modal,
  type DataTableColumnDef,
  type DateRange,
} from "@snksergio/design-system";
/* `Tooltip` vem do subpath shadcn, não do barrel principal — é primitivo Radix. */
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@snksergio/design-system/shadcn";
import { PERFIS_DE_PRECO } from "~/pages/precos/precos-mock";
import {
  COMANDOS_MODAL,
  COMANDOS_OCPP,
  EMAILS_DE_MOTORISTA,
  INICIAR_RECARGA,
  LOGS,
  PERSONALIZAR,
  REINICIAR,
  logsDoCarregador,
  type Carregador,
  type LinhaDeLog,
} from "./carregadores-mock";

/**
 * Os cinco modais de comando de um carregador — `Iniciar recarga`, `Reiniciar`, `Comandos`,
 * `Logs` e `Personalizar`.
 *
 * ## Todos são `Modal`, e todos voltam pro painel
 *
 * Na referência eles são telas empilhadas dentro do mesmo modal, com um `<` pra voltar. Aqui
 * o detalhe do carregador é um `FloatingPanel`, então cada comando é um `Modal` por cima
 * dele: fechar já devolve ao painel, e some a necessidade do botão de voltar — que na origem
 * existe só porque não há pra onde voltar sem ele.
 */

/** Ícone de ajuda ao lado de um rótulo — o `(i)` que a referência põe nos três modais. */
function Ajuda({ texto }: { texto: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          /* Mesma receita do `-m-pad-md p-pad-md` usada no ícone de ajuda da
             Performance: área de toque maior sem deslocar o rótulo ao lado. */
          className="-m-pad-md rounded-radius-full p-pad-md text-fg-subtle transition-colors hover:text-fg-default focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
          aria-label="Ajuda"
        >
          <Info className="size-icon-sm" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-tooltip-lg">{texto}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Campo com rótulo, `(i)` na mesma linha e um `Select` do shadcn abaixo.
 *
 * ⚠️ **`Select` cru, não `FormFieldSelect`.** A primeira versão punha o rótulo à mão (pra
 * caber o `(i)`) E usava o `FormFieldSelect`, que renderiza o próprio label — o rótulo
 * aparecia DUAS vezes. Tentei esconder o do componente com `sr-only` por `className`, e o
 * `className` do `FormField` vai no container, não no label.
 *
 * Como o rótulo aqui não é só texto (tem o ícone de ajuda à direita), ele não cabe na prop
 * `label` de jeito nenhum. Então o campo é montado com o primitivo, e o `<label htmlFor>`
 * liga o texto ao select de verdade.
 */
function SelectComAjuda({
  id,
  rotulo,
  ajuda,
  obrigatorio,
  valor,
  onChange,
  placeholder,
  opcoes,
}: {
  id: string;
  rotulo: string;
  ajuda: string;
  obrigatorio?: boolean;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  opcoes: string[];
}) {
  return (
    <div className="flex flex-col gap-gp-md">
      <div className="flex items-start justify-between gap-gp-md">
        <label
          htmlFor={id}
          className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted"
        >
          {rotulo}
          {/* `fg-danger` é o que o `FormField` do DS usa no asterisco de `required`. */}
          {obrigatorio && <span className="text-fg-danger"> *</span>}
        </label>
        <Ajuda texto={ajuda} />
      </div>
      <Select value={valor || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Console de resposta do comando.
 *
 * ## Cor de campo, não de terminal
 *
 * A referência pinta esta área de azul-ardósia escuro, e copiar isso trouxe um bloco que não
 * existe em nenhum outro lugar do produto — num painel de formulário, ele lia como se fosse
 * de outro sistema. Agora é o mesmo par de um input desabilitado (`bg-bg-muted` +
 * `border-border-input` + `fg-muted`), que é o que a área é: um campo que se lê e se copia,
 * mas não se edita.
 *
 * A fonte continua monoespaçada — é JSON, e proporcional embaralha chave e valor.
 */
function ConsoleDeResposta({ conteudo }: { conteudo: string }) {
  return (
    <div className="flex flex-col gap-gp-md">
      <div className="flex items-center justify-between gap-gp-md">
        <span className="text-body-xs font-semibold text-fg-muted">
          {INICIAR_RECARGA.respostaLabel}
        </span>
        <Button
          variant="ghost"
          color="secondary"
          size="xs"
          iconLeft={<Copy />}
          disabled={!conteudo}
          onClick={() => navigator.clipboard?.writeText(conteudo)}
        >
          {INICIAR_RECARGA.copiar}
        </Button>
      </div>
      <pre className="min-h-[220px] overflow-auto rounded-radius-lg border border-border-input bg-bg-muted p-pad-2xl font-mono text-caption-md text-fg-muted">
        {conteudo || (
          <span className="text-fg-subtle">{INICIAR_RECARGA.respostaVazia}</span>
        )}
      </pre>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Iniciar recarga
 * ═══════════════════════════════════════════════════════════════════════════════════ */

export function ModalIniciarRecarga({
  carregador,
  open,
  onClose,
}: {
  carregador: Carregador;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [plugue, setPlugue] = useState(carregador.plugues[0]?.id ?? "");
  const [resposta, setResposta] = useState("");

  const enviar = () => {
    /* Mockup: a "resposta" é o payload OCPP que o servidor devolveria. É o formato real do
       `RemoteStartTransaction`, porque é ele que alguém copiaria pra abrir um chamado. */
    setResposta(
      JSON.stringify(
        {
          command: "RemoteStartTransaction",
          chargePointId: carregador.cpcode,
          connectorId: Number(plugue.split("-")[1] ?? 1),
          idTag: email,
          status: "Accepted",
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={INICIAR_RECARGA.titulo}
      icon={<Play className="size-icon-md" strokeWidth={1.7} />}
      description={carregador.nome}
      size="lg"
      secondaryAction={{ label: "Fechar" }}
      /* Sem ação primária no rodapé: o botão que faz a coisa é o `Enviar comando`, dentro do
         corpo, e ele precisa ficar acima da resposta — que é o resultado dele. Um segundo
         botão no rodapé disputaria o mesmo gesto. */
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-col gap-form-gap">
        <SelectComAjuda
          id="recarga-email"
          rotulo={INICIAR_RECARGA.labelEmail}
          ajuda={INICIAR_RECARGA.ajuda}
          obrigatorio
          valor={email}
          onChange={setEmail}
          placeholder={INICIAR_RECARGA.placeholderEmail}
          opcoes={[...EMAILS_DE_MOTORISTA]}
        />

        {/* Este não tem `(i)`, então o `FormFieldSelect` serve — e é preferível quando
            serve, porque traz label, id e estados de validação de graça. */}
        <FormFieldSelect
          label={INICIAR_RECARGA.labelPlugue}
          required
          options={carregador.plugues.map((p) => ({
            value: p.id,
            label: p.id,
          }))}
          value={plugue}
          onValueChange={setPlugue}
        />

        {/* Desabilitado sem e-mail: a recarga é ATRELADA a um motorista, e disparar sem ele
            criaria uma sessão sem dono — que é o que a origem impede deixando o botão
            apagado. */}
        <Button
          variant="filled"
          color="primary"
          size="md"
          className="w-fit"
          disabled={!email}
          onClick={enviar}
        >
          {INICIAR_RECARGA.enviar}
        </Button>

        <ConsoleDeResposta conteudo={resposta} />
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Reiniciar
 * ═══════════════════════════════════════════════════════════════════════════════════ */

export function ModalReiniciar({
  carregador,
  open,
  onClose,
}: {
  carregador: Carregador;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={REINICIAR.titulo}
      icon={<RotateCw className="size-icon-md" strokeWidth={1.7} />}
      size="md"
      secondaryAction={{ label: REINICIAR.cancelar }}
      /* ⚠️ **Não é `danger`.** Reiniciar derruba o equipamento por alguns segundos e ele
         volta sozinho — é reversível por definição, ao contrário do `Excluir`. Vermelho nos
         dois ensinaria que a cor não distingue nada. */
      primaryAction={{ label: REINICIAR.confirmar, onClick: onClose }}
    >
      <div className="flex flex-col gap-gp-xs">
        <span className="text-body-sm font-semibold text-fg-default">
          {REINICIAR.pergunta}
        </span>
        <span className="text-body-sm text-fg-muted">{REINICIAR.descricao}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-gp-sm rounded-radius-lg bg-bg-muted px-pad-2xl py-pad-xl text-body-sm">
        <span className="text-fg-muted">Carregador</span>
        <span className="font-semibold text-fg-default">{carregador.nome}</span>
        <span className="tabular-nums text-fg-muted">
          · CPCODE {carregador.cpcode}
        </span>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Comandos
 * ═══════════════════════════════════════════════════════════════════════════════════ */

export function ModalComandos({
  carregador,
  open,
  onClose,
}: {
  carregador: Carregador;
  open: boolean;
  onClose: () => void;
}) {
  const [comando, setComando] = useState<string>(COMANDOS_OCPP[1]);
  const [resposta, setResposta] = useState("");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={COMANDOS_MODAL.titulo}
      icon={<Terminal className="size-icon-md" strokeWidth={1.7} />}
      description={carregador.nome}
      size="lg"
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="flex flex-col gap-form-gap">
        <SelectComAjuda
          id="comando-ocpp"
          rotulo={COMANDOS_MODAL.label}
          ajuda={COMANDOS_MODAL.ajuda}
          valor={comando}
          onChange={setComando}
          opcoes={[...COMANDOS_OCPP]}
        />

        <Button
          variant="filled"
          color="primary"
          size="md"
          className="w-fit"
          onClick={() =>
            setResposta(
              JSON.stringify(
                {
                  command: comando,
                  chargePointId: carregador.cpcode,
                  status: "Accepted",
                  timestamp: new Date().toISOString(),
                },
                null,
                2,
              ),
            )
          }
        >
          {INICIAR_RECARGA.enviar}
        </Button>

        <ConsoleDeResposta conteudo={resposta} />
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Logs
 * ═══════════════════════════════════════════════════════════════════════════════════ */

function colunasDeLog(): DataTableColumnDef<LinhaDeLog>[] {
  return [
    {
      field: "dataHora",
      headerName: "Data/Hora",
      type: "text",
      width: 168,
      render: ({ row }) => (
        <span className="tabular-nums">{row.dataHora}</span>
      ),
    },
    {
      field: "idDoPlugue",
      headerName: "ID do Plugue",
      type: "text",
      width: 124,
      enableColumnFilter: true,
      render: ({ row }) =>
        row.idDoPlugue ? (
          <span className="tabular-nums">{row.idDoPlugue}</span>
        ) : (
          <span className="text-fg-subtle">–</span>
        ),
    },
    {
      field: "tipo",
      headerName: "Tipo",
      width: 88,
      enableColumnFilter: true,
      filterType: "select",
      filterOptions: [
        { label: "2 — requisição", value: 2 },
        { label: "3 — resposta", value: 3 },
      ],
      /* O número cru não diz nada; o chip separa o que o equipamento MANDOU do que o
         servidor RESPONDEU, que é a leitura que se faz ao depurar. */
      render: ({ row }) => (
        <Chip
          color={row.tipo === 2 ? "info" : "neutral"}
          variant="soft"
          size="sm"
        >
          {row.tipo}
        </Chip>
      ),
    },
    {
      field: "comando",
      headerName: "Comando",
      type: "text",
      width: 168,
      enableColumnFilter: true,
      filterType: "select",
      isPrimary: true,
    },
    {
      field: "payload",
      headerName: "Payload",
      type: "text",
      ellipsis: true,
      copyable: true,
      width: 320,
      /* Monoespaçado: é JSON, e fonte proporcional embaralha a leitura de chave/valor. */
      render: ({ row }) => (
        <span className="font-mono text-caption-md">{row.payload}</span>
      ),
    },
    {
      field: "acao",
      headerName: "Ação",
      type: "actions",
      sortable: false,
      hideable: false,
      /* Mockup: `Ver detalhes` abriria o payload formatado. Sem handler o `DataTable`
         recusa o item — a assinatura exige `onClick`. */
      getActions: () => [
        { id: "detalhes", label: LOGS.verDetalhes, icon: <Search />, onClick: () => {} },
      ],
    },
  ];
}

export function ModalLogs({
  carregador,
  open,
  onClose,
}: {
  carregador: Carregador;
  open: boolean;
  onClose: () => void;
}) {
  const linhas = useMemo(() => logsDoCarregador(carregador), [carregador]);
  const colunas = useMemo(colunasDeLog, []);
  /* O dia inteiro do último log — é o recorte que a referência abre por padrão. */
  const [periodo, setPeriodo] = useState<DateRange | undefined>({
    from: new Date("2026-09-16T00:00:00"),
    to: new Date("2026-09-16T23:59:00"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={LOGS.titulo}
      icon={<ScrollText className="size-icon-md" strokeWidth={1.7} />}
      description={carregador.nome}
      /* `xl` (1100px): são seis colunas e uma delas é JSON. Em `lg` o payload ficaria com
         ~200px e a coluna viraria reticências. */
      size="xl"
      /* Sem rodapé: o `X` do header já fecha, e um `Fechar` embaixo de uma tabela rolável
         só rouba altura de quem veio ler log. O `Modal` não renderiza o footer quando não
         há `footer` nem actions (`modal.tsx:142`). */
    >
      {/* Só o seletor de período aqui em cima — o título `Logs` e o `(i)` saíram: o header
          do modal já diz que isto é Logs, e repetir a palavra dois centímetros abaixo dela
          gastava uma linha da área útil. */}
      <div className="flex flex-wrap items-end justify-end gap-gp-md">
        <DatePicker
          mode="range"
          value={periodo}
          onValueChange={setPeriodo}
          placeholder="Período"
          className="w-[300px]"
        />
      </div>

      {/* ⚠️ Altura FIXA, não `flex-1 min-h-0`: o body do `Modal` não impõe altura aos
          filhos como o do `FloatingPanel` faz, então o idiom das telas de tabela não arma
          aqui — sem a altura, a tabela cresce e empurra o conteúdo pra fora do modal. */}
      <div className="h-[520px]">
        <DataTable<LinhaDeLog>
          rows={linhas}
          columns={colunas}
          getRowId={(r) => r.id}
          autoFit
          /* `[&>div:first-child]:hidden` esconde o toolbar. ⚠️ Desligar todos os `enable*`
             NÃO o remove — o `DataTable` ainda renderiza a barra de 40px com dois botões
             (`data-table.tsx:1540`). É o mesmo contorno do painel de Repasses, e continua
             sendo um gap do DS: falta um `showToolbar={false}`. */
          className="h-full [&>div:first-child]:hidden"
          density="compact"
          /* Sem paginação: log se lê rolando, e paginar 60 heartbeats em páginas de 25 faria
             procurar um horário em três lugares. O scroll é da tabela, não do modal. */
          paginationConfig={{ enabled: false }}
        />
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Personalizar motoristas
 * ═══════════════════════════════════════════════════════════════════════════════════ */

export function ModalPersonalizar({
  carregador,
  open,
  onClose,
}: {
  carregador: Carregador;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("");
  const [busca, setBusca] = useState("");
  const [usuarios, setUsuarios] = useState<
    { email: string; perfil: string }[]
  >([]);

  const filtrados = usuarios.filter((u) =>
    u.email.toLowerCase().includes(busca.toLowerCase()),
  );

  const perfis = [...new Set(PERFIS_DE_PRECO.map((p) => p.nome))].map((n) => ({
    value: n,
    label: n,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={PERSONALIZAR.titulo}
      icon={<UserPlus className="size-icon-md" strokeWidth={1.7} />}
      description={carregador.nome}
      size="lg"
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <span className="text-body-sm text-fg-muted">
        {PERSONALIZAR.descricao}
      </span>

      <div className="flex flex-col gap-form-gap">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={PERSONALIZAR.email}
          type="email"
          aria-label={PERSONALIZAR.email}
        />
        <FormFieldSelect
          label={PERSONALIZAR.perfil}
          className="[&>span:first-child]:sr-only"
          placeholder={PERSONALIZAR.perfil}
          options={perfis}
          value={perfil || undefined}
          onValueChange={setPerfil}
        />
        {/* Precisa dos DOIS: conceder acesso sem perfil não personaliza preço nenhum, e sem
            e-mail não há a quem conceder. */}
        <Button
          variant="filled"
          color="primary"
          size="md"
          disabled={!email || !perfil}
          onClick={() => {
            setUsuarios((u) => [...u, { email, perfil }]);
            setEmail("");
            setPerfil("");
          }}
        >
          {PERSONALIZAR.conceder}
        </Button>
      </div>

      <div className="flex flex-col gap-gp-lg rounded-radius-xl border border-border-default bg-bg-surface p-pad-2xl">
        <div className="flex flex-wrap items-center justify-between gap-gp-md">
          <span className="flex items-center gap-gp-sm text-body-sm font-semibold text-fg-default">
            {PERSONALIZAR.adicionados}
            <Chip color="neutral" variant="soft" size="sm">
              {usuarios.length}
            </Chip>
          </span>
          <div className="flex min-h-form-md w-[220px] items-center gap-gp-sm rounded-radius-lg border border-border-input bg-bg-surface px-pad-lg">
            <Search className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={PERSONALIZAR.pesquisar}
              aria-label={PERSONALIZAR.pesquisar}
              className="min-w-0 flex-1 bg-transparent text-body-sm text-fg-default outline-none placeholder:text-fg-subtle"
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="rounded-radius-lg border border-dashed border-border-default py-pad-4xl text-center text-body-sm text-fg-muted">
            {PERSONALIZAR.vazio}
          </div>
        ) : (
          <ul className="flex flex-col gap-gp-md">
            {filtrados.map((u) => (
              <li
                key={u.email}
                className="flex flex-wrap items-center justify-between gap-gp-md rounded-radius-lg border border-border-default bg-bg-canvas px-pad-2xl py-pad-xl"
              >
                <span className="truncate text-body-sm text-fg-default">
                  {u.email}
                </span>
                <Chip color="primary" variant="soft" size="sm">
                  {u.perfil}
                </Chip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
