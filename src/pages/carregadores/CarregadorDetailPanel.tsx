import { useEffect, useState } from "react";
import {
  Activity,
  Barcode,
  Building2,
  ChevronRight,
  Cpu,
  Gauge,
  Hash,
  MapPin,
  Play,
  Printer,
  RadioTower,
  RotateCw,
  Save,
  ScrollText,
  Signal,
  Tag,
  Terminal,
  Trash2,
  Users,
  Wifi,
  XCircle,
  Zap,
} from "lucide-react";
import {
  Button,
  Chip,
  FloatingPanel,
  FormFieldInput,
  FormFieldSelect,
} from "@snksergio/design-system";
import {
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@snksergio/design-system/shadcn";
import {
  NOME_DO_PERFIL_PADRAO,
  PERFIS_DE_PRECO,
} from "~/pages/precos/precos-mock";
import {
  PERSONALIZAR_MOTORISTAS,
  SEM_LIMITE,
  urlDoPlugue,
  type Carregador,
} from "./carregadores-mock";
import { CampoCopiavel, LinhaDeDispositivo } from "./carregadores-ui";
import {
  ModalComandos,
  ModalIniciarRecarga,
  ModalLogs,
  ModalPersonalizar,
  ModalReiniciar,
} from "./carregadores-comandos";

/**
 * Painel de edição de um carregador — **`dsgreen-paneldetail-2`**, como as outras telas.
 *
 * ## A reorganização pedida, e por que ela é melhor que a referência
 *
 * Na origem isto é um modal com duas abas, `Detalhes` e `Plugues`, e a aba `Detalhes` carrega
 * DUAS coisas de naturezas diferentes: os campos que se editam e uma ficha de dez linhas
 * somente-leitura. Quem abre pra conferir o firmware precisa passar por um formulário; quem
 * abre pra trocar o preço rola por dez linhas que não muda.
 *
 * Aqui a ficha sobe pro corpo do painel, **fora das abas** — é a identidade do equipamento,
 * o equivalente às propriedades do bloco — e restam duas abas do mesmo tipo de conteúdo:
 * `Edição` (o formulário) e `Plugues` (a lista de conectores).
 *
 * ## Onde cada coisa ficou, e por quê
 *
 * | | onde | por quê |
 * |---|---|---|
 * | ficha do dispositivo | corpo, fora das abas | é a identidade do equipamento, não algo que se preenche |
 * | comandos (`Iniciar recarga`…) | card **Ações**, fora das abas | valem pro equipamento, não pra aba aberta |
 * | `Excluir` | header **e** card de Ações | age sobre o registro inteiro; é o que mais se faz num carregador desligado |
 * | switch ativado | ficha **e** aba Edição | mesmo estado, dois caminhos — ver os comentários |
 * | campos | aba Edição | é o que se preenche |
 * | plugues | aba Plugues | coleção que cresce |
 */

interface Props {
  carregador: Carregador | null;
  onClose: () => void;
  /** Abre o painel de PREÇO do perfil vinculado — a mesma tela de Preços. */
  onAbrirPerfil: (nomeDoPerfil: string) => void;
  /** Abre a confirmação de exclusão, que é modal e mora na página. */
  onExcluir: (c: Carregador) => void;
}

/**
 * Comandos de operação, na ordem da referência **menos o `Excluir`**.
 *
 * Os quatro daqui só fazem sentido com o carregador ligado, então moram no corpo do card do
 * switch e somem junto com ele. `Excluir` não: apagar um carregador desativado é
 * justamente o caso comum, e escondê-lo obrigaria a religar o equipamento pra poder
 * removê-lo. Ele fica fora do card.
 */
const COMANDOS = [
  { id: "iniciar", label: "Iniciar recarga", icone: Play },
  { id: "reiniciar", label: "Reiniciar", icone: RotateCw },
  { id: "comandos", label: "Comandos", icone: Terminal },
  { id: "logs", label: "Logs", icone: ScrollText },
] as const;

type IdDeComando = (typeof COMANDOS)[number]["id"];

export function CarregadorDetailPanel({
  carregador,
  onClose,
  onAbrirPerfil,
  onExcluir,
}: Props) {
  const [aba, setAba] = useState("edicao");
  const [ativo, setAtivo] = useState(true);
  const [perfil, setPerfil] = useState<string>("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [qrAlternativo, setQrAlternativo] = useState("");
  const [modelo, setModelo] = useState("");
  const [limite, setLimite] = useState("");
  const [sujo, setSujo] = useState(false);
  /**
   * Qual comando está aberto por cima do painel.
   *
   * Um estado só pros cinco: são cinco modais mutuamente exclusivos sobre o mesmo
   * carregador, e cinco booleanos deixariam possível abrir dois ao mesmo tempo — um estado
   * que a tela não sabe desenhar.
   */
  const [comando, setComando] = useState<
    "iniciar" | "reiniciar" | "comandos" | "logs" | "personalizar" | null
  >(null);

  useEffect(() => {
    if (!carregador) return;
    setAba("edicao");
    setAtivo(carregador.ativo);
    setPerfil(carregador.perfilDePreco ?? "nenhum");
    setNome(carregador.nome);
    setDescricao(carregador.identificador);
    setQrAlternativo(carregador.qrCodeAlternativo);
    setModelo(carregador.modelo);
    setLimite(carregador.limiteKw === null ? "" : String(carregador.limiteKw));
    setSujo(false);
    setComando(null);
  }, [carregador]);

  if (!carregador) return null;

  /* `Nenhum` é opção de verdade, não ausência: desvincular o perfil é uma escolha, e um
     select sem ela obrigaria a inventar um perfil pra "tirar" o preço. */
  const opcoesDePerfil = [
    { value: "nenhum", label: "Nenhum" },
    ...[...new Set(PERFIS_DE_PRECO.map((p) => p.nome))].map((n) => ({
      value: n,
      label: n,
    })),
  ];

  const opcoesDeModelo = [
    ...new Set([carregador.modelo, "PEVC2108E", "NDC60-W2b", "ACCharger", "ANACE1"]),
  ].map((m) => ({ value: m, label: m }));

  const marcar = () => setSujo(true);

  return (
    <FloatingPanel
      open={!!carregador}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      /* 760px, como o painel de Preços: a ficha de dispositivo é de duas colunas e o
         formulário tem pares de campos lado a lado. */
      size={760}
      resizable
      maximizable
      resizableMinWidth={640}
      resizableMaxWidth={1200}
      resizableStorageKey="igreen-mob-cms.carregador-detalhe.width"
      /* Excluir mora na fileira do header, junto do maximizar e do fechar: as três agem
         sobre o PAINEL/registro inteiro, não sobre o conteúdo de uma aba. `soft` +
         `critical` porque é o mesmo container dos vizinhos (`ghost` no meio da fileira
         fica sem fundo e lê como desabilitado — regra do `dsgreen-paneldetail-2`), mas com
         a cor de perigo que a ação pede. */
      headerActions={
        <Button
          variant="soft"
          color="critical"
          size="icon-sm"
          aria-label={`Excluir ${carregador.nome}`}
          onClick={() => onExcluir(carregador)}
        >
          <Trash2 />
        </Button>
      }
      titleSlot={
        <div className="flex min-w-0 items-center gap-gp-sm text-body-sm text-fg-muted">
          <span className="truncate">Carregadores</span>
          <span className="opacity-50">/</span>
          <span className="truncate font-medium text-fg-default">
            {carregador.cpcode}
          </span>
        </div>
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
            iconLeft={<Save />}
            disabled={!sujo}
            onClick={() => setSujo(false)}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-gp-2xl">
        {/* ── Ficha do dispositivo — fora das abas ──────────────────────────
            Mesmo desenho do painel de Gestão de Carga: lista plana, ícone à esquerda, sem
            card em volta. Ela é a IDENTIDADE do equipamento, não algo que se preenche.

            ⚠️ **Não há título nem subtítulo acima dela.** Tinha um `h2` com o nome do
            carregador, o chip de conexão e o local — e os três repetiam, palavra por
            palavra, o que as linhas `Local`, `Potência` e `Estado` já dizem logo abaixo.
            Quem identifica o registro no topo é o breadcrumb do header (`Carregadores /
            CPCODE`).

            `184px` na coluna de rótulo: o maior é "Versão de firmware". */}
        <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[184px_1fr] sm:items-center">
          <LinhaDeDispositivo
            icone={Building2}
            label="Empresa"
            valor={carregador.empresa}
          />
          <LinhaDeDispositivo
            icone={MapPin}
            label="Local"
            valor={<span className="truncate">{carregador.local}</span>}
          />
          <LinhaDeDispositivo
            icone={Zap}
            label="Potência"
            valor={
              <span className="tabular-nums">
                {carregador.potenciaKw.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}{" "}
                kW
              </span>
            }
          />
          <LinhaDeDispositivo
            icone={Wifi}
            label="Conexão"
            valor={
              <Chip
                color={carregador.status === "Online" ? "success" : "neutral"}
                variant="soft"
                size="sm"
              >
                {carregador.status}
              </Chip>
            }
          />
          <LinhaDeDispositivo
            icone={Hash}
            label="ID"
            valor={
              <span className="tabular-nums">{carregador.identificador}</span>
            }
          />
          <LinhaDeDispositivo icone={Tag} label="Marca" valor={carregador.marca} />
          <LinhaDeDispositivo
            icone={Barcode}
            label="Número de série"
            valor={
              <span className="tabular-nums">{carregador.numeroDeSerie}</span>
            }
          />
          <LinhaDeDispositivo
            icone={Cpu}
            label="Versão de firmware"
            valor={carregador.versaoDeFirmware}
          />
          <LinhaDeDispositivo
            icone={Signal}
            label="Iccid"
            valor={carregador.iccid}
          />
          <LinhaDeDispositivo
            icone={RadioTower}
            label="Imsi"
            valor={carregador.imsi}
          />
          <LinhaDeDispositivo
            icone={Gauge}
            label="Tipo de medidor"
            valor={carregador.tipoDeMedidor}
          />
          {/* ⚠️ A ÚNICA linha da ficha com controle, e é de propósito: `Estado` é o único
              valor daqui que se muda, e quem está lendo a ficha e percebe que o equipamento
              está ligado por engano não deveria ter que procurar a aba certa pra desligar.

              O mesmo switch aparece na aba Edição — os dois leem e escrevem o MESMO estado,
              então não podem divergir. Dois caminhos pro mesmo interruptor não é duplicação
              quando o interruptor é um só. */}
          <LinhaDeDispositivo
            icone={Activity}
            label="Estado"
            valor={
              <label className="flex cursor-pointer items-center gap-gp-md">
                <Switch
                  checked={ativo}
                  onCheckedChange={(v) => {
                    setAtivo(v);
                    marcar();
                  }}
                  aria-label="Carregador ativado"
                />
                <span className={ativo ? "text-fg-success" : "text-fg-muted"}>
                  {ativo ? "Ativado" : "Desativado"}
                </span>
              </label>
            }
          />
        </div>

        {/* ── Ações ─────────────────────────────────────────────────────────
            Card no formato do bloco de descrição do `dsgreen-paneldetail-2`: rótulo pequeno
            em cima, conteúdo abaixo, superfície própria. Lá o conteúdo é texto; aqui são os
            comandos do equipamento.

            Elas saíram do card com switch: ficavam escondidas quando o carregador estava
            desativado, e `Excluir` é justamente o que mais se faz num carregador desligado.
            Como card próprio, estão sempre alcançáveis e não competem com o formulário. */}
        <div className="flex flex-col gap-gp-md rounded-radius-lg border border-border-default bg-bg-surface p-pad-2xl">
          <span className="text-body-xs font-semibold text-fg-muted">Ações</span>
          <div className="flex flex-wrap gap-gp-md">
            {COMANDOS.map((c) => {
              const Icone = c.icone;
              return (
                <Button
                  key={c.id}
                  variant="outline"
                  color="secondary"
                  size="sm"
                  iconLeft={<Icone />}
                  /* Os comandos de operação só fazem sentido com o equipamento ligado —
                     oferecer "Iniciar recarga" num carregador desativado é oferecer um
                     clique sem efeito. `Excluir` fica de fora dessa regra.

                     ⚠️ `Logs` é a exceção da exceção: ler o histórico de um carregador
                     desligado é justamente o que se faz pra descobrir POR QUE ele caiu. */
                  disabled={!ativo && c.id !== "logs"}
                  onClick={() => setComando(c.id as IdDeComando)}
                >
                  {c.label}
                </Button>
              );
            })}
            <Button
              variant="soft"
              color="critical"
              size="sm"
              iconLeft={<Trash2 />}
              onClick={() => onExcluir(carregador)}
            >
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* Duas abas, e as duas são FORMULÁRIO ou LISTA — nenhuma é ficha. É a separação que
          o modal da origem não fazia. */}
      <Tabs value={aba} onValueChange={setAba} fullWidth className="mt-gp-2xl">
        <TabsList>
          <TabsTrigger value="edicao">Edição</TabsTrigger>
          <TabsTrigger value="plugues">
            Plugues {carregador.plugues.length}
          </TabsTrigger>
        </TabsList>

        {/* ── Edição ────────────────────────────────────────────────────────── */}
        <TabsContent
          value="edicao"
          className="flex flex-col gap-gp-xl pt-pad-xl"
        >
          {/* Linha de ajuste com switch — o mesmo desenho das três do painel de Preços
              (título em negrito, descrição embaixo, controle à direita). É o primeiro item
              da edição porque desativar o carregador é a alteração de maior consequência
              desta aba: ela tira o equipamento de operação.

              Escreve o MESMO estado do switch da ficha — ver o comentário lá. */}
          <div className="flex items-center justify-between gap-gp-lg rounded-radius-xl border border-border-default bg-bg-surface p-pad-2xl">
            <div className="flex min-w-0 flex-1 flex-col gap-gp-2xs">
              <span className="text-body-sm font-semibold text-fg-default">
                Carregador ativado
              </span>
              <span className="text-caption-md text-fg-muted">
                Desativado, o carregador não aceita novas recargas.
              </span>
            </div>
            <Switch
              checked={ativo}
              onCheckedChange={(v) => {
                setAtivo(v);
                marcar();
              }}
              aria-label="Carregador ativado"
              className="shrink-0"
            />
          </div>

          <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
            <FormFieldSelect
              label="Preço"
              options={opcoesDePerfil}
              value={perfil}
              onValueChange={(v) => {
                setPerfil(v);
                marcar();
              }}
            />
            {/* Atalho pra outra tela, não um campo — daí o botão com chevron, que é como a
                referência o desenha. */}
            <div className="flex flex-col gap-gp-md">
              <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
                Personalizar
              </span>
              <Button
                variant="outline"
                color="secondary"
                size="md"
                className="w-full justify-between"
                iconLeft={<Users />}
                iconRight={<ChevronRight />}
                onClick={() => setComando("personalizar")}
              >
                {PERSONALIZAR_MOTORISTAS}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
            {/* CPCODE é identificador do equipamento no sistema: aparece pra ser copiado,
                não pra ser trocado. Editá-lo quebraria a URL pública do QR já impresso. */}
            <FormFieldInput
              label="CPCODE"
              value={carregador.cpcode}
              readOnly
              helperText="Gerado no cadastro — é o código do QR já impresso."
            />
            <FormFieldInput
              label="Nome"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                marcar();
              }}
            />
            <FormFieldInput
              label="Descrição"
              value={descricao}
              onChange={(e) => {
                setDescricao(e.target.value);
                marcar();
              }}
            />
            <FormFieldInput
              label="QR Code alternativo"
              value={qrAlternativo}
              onChange={(e) => {
                setQrAlternativo(e.target.value);
                marcar();
              }}
            />
            <FormFieldSelect
              label="Modelo"
              options={opcoesDeModelo}
              value={modelo}
              onValueChange={(v) => {
                setModelo(v);
                marcar();
              }}
            />
            {/* O helper diz o TETO do modelo — sem ele, "sem limite diferenciado" não conta
                de quanto é o limite que já existe. */}
            <FormFieldInput
              label="Limite de potência (kW)"
              type="number"
              value={limite}
              placeholder={SEM_LIMITE}
              onChange={(e) => {
                setLimite(e.target.value);
                marcar();
              }}
              helperText={`Máximo do modelo: ${carregador.potenciaKw.toLocaleString("pt-BR")} kW`}
            />
          </div>

          {carregador.perfilDePreco && (
            <Button
              variant="soft"
              color="primary"
              size="sm"
              className="w-fit"
              iconLeft={<Zap />}
              onClick={() => onAbrirPerfil(carregador.perfilDePreco!)}
            >
              Abrir {carregador.perfilDePreco}
            </Button>
          )}
        </TabsContent>

        {/* ── Plugues ───────────────────────────────────────────────────────── */}
        <TabsContent
          value="plugues"
          className="flex flex-col gap-gp-lg pt-pad-xl"
        >
          {carregador.plugues.map((p) => (
            <section
              key={p.id}
              className="flex flex-col gap-gp-lg rounded-radius-xl border border-border-default bg-bg-surface p-pad-2xl"
            >
              {/* O chip vai pra DIREITA, não acima do título: empilhado ele gastava uma
                  linha inteira do card pra uma palavra, e empurrava o ID pra baixo do ícone
                  em vez de ao lado dele. À direita ele ocupa espaço que já estava vazio, e o
                  ícone volta a alinhar com o par ID + tipo de conector. */}
              <div className="flex items-start justify-between gap-gp-md">
                <div className="flex min-w-0 items-center gap-gp-md">
                  <span className="grid size-form-lg shrink-0 place-items-center rounded-radius-full bg-bg-info-muted text-fg-info">
                    <Zap className="size-icon-sm" aria-hidden />
                  </span>
                  <div className="flex min-w-0 flex-col gap-gp-2xs">
                    <span className="truncate text-body-sm font-semibold tabular-nums text-fg-default">
                      ID: {p.id}
                    </span>
                    <span className="truncate text-caption-md text-fg-muted">
                      {p.tipo}
                    </span>
                  </div>
                </div>
                <Chip
                  color={p.ativo ? "success" : "neutral"}
                  variant="soft"
                  size="sm"
                  className="shrink-0"
                >
                  {p.ativo ? "ATIVO" : "INATIVO"}
                </Chip>
              </div>

              {/* A URL pública é o que o QR aponta — fica copiável porque é o que se manda
                  pro motorista quando o adesivo do carregador está ilegível. */}
              <CampoCopiavel valor={urlDoPlugue(p)} />

              <div className="grid grid-cols-1 gap-gp-md sm:grid-cols-2">
                <Button
                  variant="outline"
                  color="secondary"
                  size="sm"
                  iconLeft={<Printer />}
                >
                  Imprimir Etiqueta QR
                </Button>
                <Button
                  variant="outline"
                  color="critical"
                  size="sm"
                  iconLeft={<XCircle />}
                >
                  {p.ativo ? "Desativar plugue" : "Ativar plugue"}
                </Button>
              </div>
            </section>
          ))}
        </TabsContent>
      </Tabs>

      {/* Os cinco comandos montam só quando abertos: cada um tem formulário e resposta
          próprios, e montado-e-escondido guardaria o que o operador digitou e desistiu. */}
      {comando === "iniciar" && (
        <ModalIniciarRecarga
          carregador={carregador}
          open
          onClose={() => setComando(null)}
        />
      )}
      {comando === "reiniciar" && (
        <ModalReiniciar
          carregador={carregador}
          open
          onClose={() => setComando(null)}
        />
      )}
      {comando === "comandos" && (
        <ModalComandos
          carregador={carregador}
          open
          onClose={() => setComando(null)}
        />
      )}
      {comando === "logs" && (
        <ModalLogs
          carregador={carregador}
          open
          onClose={() => setComando(null)}
        />
      )}
      {comando === "personalizar" && (
        <ModalPersonalizar
          carregador={carregador}
          open
          onClose={() => setComando(null)}
        />
      )}
    </FloatingPanel>
  );
}

/** Nome do perfil padrão, reexportado pra página não importar de duas telas. */
export { NOME_DO_PERFIL_PADRAO };
