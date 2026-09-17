import { useEffect, useState } from "react";
import { Info, Pencil, Plus, Plug, RotateCcw, Save, Search } from "lucide-react";
import { AlertModal, Button, Chip, FloatingPanel } from "@snksergio/design-system";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@snksergio/design-system/shadcn";
import {
  CONFIRMACOES,
  DIAS_DA_SEMANA,
  NOTA_REVERSIVEL,
  SUB_PERIODOS,
  SUB_VISUALIZACAO,
  VAZIO_REGRAS,
  VAZIO_TAGS,
  type Disponibilidade,
  type ModoDeCobranca,
  type PerfilDePreco,
  type RegraDeCobranca,
  type UsoDeCupons,
} from "./precos-mock";
import {
  DESCRICOES_DOS_PARES,
  PAR_COBRANCA,
  PAR_CUPONS,
  PAR_DISPONIBILIDADE,
  ParDeOpcoes,
} from "./precos-ui";
import { ModalNovaRegra } from "./precos-modais";
import {
  CampoDeValor,
  CardDeTaxa,
  GrupoDeIsencao,
  TaxaNaoConfigurada,
} from "./precos-taxas";

/**
 * Painel de edição de um perfil de preço — **`dsgreen-paneldetail-2`**, como Gestão de Carga.
 *
 * ## A diferença que este painel tem dos outros três
 *
 * Nos outros, o cabeçalho acima das abas é uma FICHA — propriedades que se leem. Aqui ele é
 * um conjunto de CONTROLES: os três pares (`Disponível/Desativado`, `Cobrança normal/Recarga
 * grátis`, `Permitir/Bloquear cupom`) valem pro perfil inteiro, e por isso ficam fora das
 * abas: trocar de aba não pode esconder o interruptor que decide se o carregador cobra.
 *
 * ## Cada card de taxa salva sozinho — e isso é da origem
 *
 * Três botões `Salvar alterações`, um por card, cada um com o mesmo aviso de sincronização
 * acima. Não é repetição por desleixo: o aviso pertence ao botão que está embaixo dele, não à
 * tela. Um `Salvar` único no rodapé prometeria que uma ação sincroniza as três coisas.
 *
 * ⚠️ Eles nascem **desabilitados** e só habilitam quando algo muda (`sujo`). É o que o print
 * mostra, e é o que impede o gesto mais comum de errar aqui: clicar em salvar sem ter mexido
 * em nada e mandar uma sincronização para todos os carregadores do perfil.
 *
 * ## O que este arquivo carrega do bloco
 *
 * - wrapper de gap obrigatório (o body do `FloatingPanel` não tem gap entre filhos);
 * - `bodyPadded` no default (não há `FloatingPanelSection` aqui);
 * - abas `fullWidth` — três, ~186px cada no painel de 560px... **e é por isso que este
 *   painel é mais largo**: ver o `size` abaixo.
 */

interface Props {
  perfil: PerfilDePreco | null;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Cards de taxa
 * ═══════════════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Visualização semanal
 * ═══════════════════════════════════════════════════════════════════════════════════ */

const HORAS_MARCADAS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

/**
 * As três séries da grade semanal, em UM lugar.
 *
 * A legenda e os blocos pintados têm que usar a mesma cor — uma legenda que mente sobre a
 * grade é pior que nenhuma legenda. Declarar aqui é o que garante isso.
 */
const LEGENDA = [
  { cor: "bg-chart-1", label: "Recarga grátis" },
  { cor: "bg-chart-3", label: "Cobrança configurada" },
  /* `fg-subtle` como FUNDO é atípico e deliberado: é o único cinza que aparece nos dois
     modos. Os `bg-*` neutros são translúcidos (1–3% de branco no dark) e somem. */
  { cor: "bg-fg-subtle", label: "Carregador desativado" },
] as const;

/** Minutos desde a meia-noite — `"14:30"` → `870`. */
function minutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Grade de 7 colunas × 24 horas com as regras pintadas.
 *
 * ## Posicionamento por PORCENTAGEM, não por pixel
 *
 * Cada bloco é `absolute` com `top`/`height` em `%` do dia — assim a grade responde a
 * qualquer altura sem recalcular nada em JS. Com pixels, redimensionar o painel
 * desalinharia os blocos das linhas-guia, e este painel é redimensionável.
 *
 * ## As três cores vêm da rampa de GRÁFICO, e isso foi medido
 *
 * Esta grade é um gráfico, e cor de gráfico no DS vem de `chart-1..5` — a rampa desenhada
 * justamente pra distinguir categorias. A primeira versão usou `bg-bg-success` /
 * `bg-bg-info` / `bg-bg-subtle`, e medido no dark deu:
 *
 * | classe | valor | problema |
 * |---|---|---|
 * | `bg-bg-info` | `oklch(0.62 0.21 280)` | **roxo**, não azul — e o comentário dizia azul |
 * | `bg-bg-subtle` | `oklch(1 0 0 / 0.01)` | 1% de branco: invisível |
 *
 * O roxo é a cor de `info` neste tema, não um defeito dele; o que estava errado era usar
 * `info` pra uma série de gráfico. E o `bg-subtle` invisível no dark é a armadilha que o
 * próprio bloco `dsgreen-paneldetail-2` documenta — eu li e usei de todo jeito.
 *
 * Cinza vence verde e azul: um carregador desativado não cobra de jeito nenhum, então o
 * estado dele é a informação que importa naquele intervalo. A ordem dos `if` é a regra de
 * precedência — não é arbitrária.
 */
function VisualizacaoSemanal({ regras }: { regras: RegraDeCobranca[] }) {
  return (
    <div className="flex flex-col gap-gp-lg">
      <div className="flex flex-wrap items-center justify-between gap-gp-md">
        <div className="flex flex-col">
          <span className="text-body-md font-semibold text-fg-default">
            Visualização semanal
          </span>
          <span className="text-caption-md text-fg-muted">
            {SUB_VISUALIZACAO}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-gp-lg text-caption-sm text-fg-muted">
          {LEGENDA.map((l) => (
            <span key={l.label} className="flex items-center gap-gp-sm">
              {/* ⚠️ `size-icon-2xs` (8px). Era `size-comp-2xs`, e a família `comp` **não
                  existe no tema** — a classe não emitia CSS nenhum e a bolinha ficava com
                  20px, o tamanho que o layout deu por acidente. Falha silenciosa da L-057:
                  não quebra build, não quebra `tsc`, não quebra teste. */}
              <span
                className={`size-icon-2xs shrink-0 rounded-radius-full ${l.cor}`}
                aria-hidden
              />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-gp-sm">
        {/* Régua de horas. `justify-between` com 5 marcas dá exatamente 00/06/12/18/24, e o
            `-translate-y-1/2` centra cada rótulo na linha que ele nomeia. */}
        <div className="flex h-[260px] w-[44px] shrink-0 flex-col justify-between py-0 text-caption-sm tabular-nums text-fg-muted">
          {HORAS_MARCADAS.map((h) => (
            <span key={h} className="leading-none">
              {h}
            </span>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-7 overflow-hidden rounded-radius-lg border border-border-default">
          {DIAS_DA_SEMANA.map((dia) => (
            <div
              key={dia}
              className="flex min-w-0 flex-col border-r border-border-subtle last:border-r-0"
            >
              <span className="truncate border-b border-border-subtle bg-bg-subtle px-pad-sm py-pad-sm text-center text-caption-sm text-fg-muted">
                {dia}
              </span>
              <div className="relative h-[232px]">
                {/* Linhas-guia a cada 6h — as mesmas 3 divisões internas que a régua marca. */}
                {[25, 50, 75].map((p) => (
                  <span
                    key={p}
                    className="absolute inset-x-0 border-t border-dashed border-border-subtle"
                    style={{ top: `${p}%` }}
                    aria-hidden
                  />
                ))}
                {regras
                  .filter((r) => r.dias.includes(dia))
                  .map((r) => {
                    const ini = minutos(r.horaInicial);
                    const fim = Math.max(minutos(r.horaFinal), ini + 15);
                    /* Índices da `LEGENDA`, não classes repetidas: é o que impede o bloco
                       de divergir da bolinha que o explica. */
                    const cor =
                      r.disponibilidade === "desativado"
                        ? LEGENDA[2].cor
                        : r.modoDeCobranca === "gratis"
                          ? LEGENDA[0].cor
                          : LEGENDA[1].cor;
                    return (
                      <span
                        key={r.id}
                        className={`absolute inset-x-[2px] rounded-radius-sm ${cor} opacity-80`}
                        style={{
                          top: `${(ini / 1440) * 100}%`,
                          height: `${((fim - ini) / 1440) * 100}%`,
                        }}
                        title={`${r.horaInicial}–${r.horaFinal}`}
                      />
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Painel
 * ═══════════════════════════════════════════════════════════════════════════════════ */

export function PrecoDetailPanel({ perfil, onClose }: Props) {
  const [aba, setAba] = useState("taxas");
  const [modalRegra, setModalRegra] = useState(false);

  /* Estado local do formulário. Reinicia quando o perfil muda — sem isso, abrir o perfil B
     depois de mexer no A mostraria os valores do A com o nome do B. */
  const [disponibilidade, setDisponibilidade] =
    useState<Disponibilidade>("disponivel");
  const [modoDeCobranca, setModoDeCobranca] = useState<ModoDeCobranca>("normal");
  const [usoDeCupons, setUsoDeCupons] = useState<UsoDeCupons>("permitir");
  const [energia, setEnergia] = useState<number | null>(null);
  const [usoCarregador, setUsoCarregador] = useState<number | null>(null);
  const [ativacaoLigada, setAtivacaoLigada] = useState(false);
  const [ativacao, setAtivacao] = useState(0);
  const [modoIsencao, setModoIsencao] = useState<"tolerancia" | "isencao">(
    "tolerancia",
  );
  const [tolerancia, setTolerancia] = useState(15);
  const [isencao, setIsencao] = useState(0);
  const [ociosidadeLigada, setOciosidadeLigada] = useState(false);
  const [ociosidade, setOciosidade] = useState(0);
  /* ⚠️ **Um `sujo` só, não três.** Antes cada card tinha o próprio botão de salvar e o
     próprio flag. Com o salvar único no rodapé, três flags não teriam como se traduzir em um
     botão — e "salvar" passou a significar "gravar o perfil", não "gravar esta seção". */
  const [sujo, setSujo] = useState(false);
  /** Guarda de saída: só aparece quando há alteração pendente. */
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  /**
   * Guarda dos três pares de opção.
   *
   * Um estado só, e não um por par: os três fazem a mesma coisa — seguram a troca, mostram o
   * efeito, e aplicam no confirmar. Três booleanos e três modais seriam a mesma lógica escrita
   * três vezes, e a quarta opção que aparecer repetiria de novo.
   */
  const [confirmacao, setConfirmacao] = useState<{
    titulo: string;
    descricao: string;
    aplicar: () => void;
  } | null>(null);

  const [buscaHorario, setBuscaHorario] = useState("");

  useEffect(() => {
    if (!perfil) return;
    setAba("taxas");
    setDisponibilidade(perfil.disponibilidade);
    setModoDeCobranca(perfil.modoDeCobranca);
    setUsoDeCupons(perfil.usoDeCupons);
    setEnergia(perfil.precoEnergia);
    setUsoCarregador(perfil.usoDoCarregador);
    setAtivacaoLigada(perfil.taxaDeAtivacao.ativa);
    setAtivacao(perfil.taxaDeAtivacao.valor);
    setModoIsencao(perfil.taxaDeAtivacao.modo);
    setTolerancia(perfil.taxaDeAtivacao.toleranciaMin);
    setIsencao(perfil.taxaDeAtivacao.isencaoKwh);
    setOciosidadeLigada(perfil.ociosidade !== null);
    setOciosidade(perfil.ociosidade ?? 0);
    setSujo(false);
    setConfirmandoDescarte(false);
    setConfirmacao(null);
    setBuscaHorario("");
  }, [perfil]);

  if (!perfil) return null;

  /**
   * Fechar com alteração pendente pede confirmação.
   *
   * ⚠️ Vale pros QUATRO caminhos de saída — o `Fechar` do rodapé, o `X` do header, o ESC e
   * o clique fora — porque os quatro passam pelo `onOpenChange` do `FloatingPanel`. Guardar
   * só o botão deixaria o caminho mais fácil de acionar por acidente (ESC) sem proteção
   * nenhuma, que é o pior dos dois mundos: o usuário confia no aviso e perde o trabalho pelo
   * atalho.
   */
  const tentarFechar = () => {
    if (sujo) setConfirmandoDescarte(true);
    else onClose();
  };

  /**
   * Segura uma troca de opção até o usuário confirmar.
   *
   * O `aplicar` só roda no confirmar — é o que garante que o botão NÃO muda de estado
   * enquanto o diálogo está aberto. Aplicar antes e desfazer no cancelar daria um piscar do
   * controle, e o piscar ensina que o diálogo é decorativo.
   */
  const pedirConfirmacao = (
    texto: { titulo: string; descricao: string },
    aplicar: () => void,
  ) =>
    setConfirmacao({
      ...texto,
      aplicar: () => {
        aplicar();
        setSujo(true);
        setConfirmacao(null);
      },
    });

  const regrasFiltradas = perfil.regras.filter(
    (r) =>
      !buscaHorario ||
      r.horaInicial.includes(buscaHorario) ||
      r.horaFinal.includes(buscaHorario),
  );

  return (
    <FloatingPanel
      open={!!perfil}
      onOpenChange={(aberto) => !aberto && tentarFechar()}
      side="right"
      /* ⚠️ **760px, não o `lg` (560) dos outros painéis.** Medido no conteúdo, não escolhido:
         a visualização semanal tem 7 colunas de dia mais a régua de horas — abaixo de ~700px
         de corpo as colunas caem para menos de 80px e os rótulos (`Dom.`, `Seg.`) truncam. E
         os cards de taxa são dois lado a lado, como na origem. */
      size={760}
      resizable
      maximizable
      resizableMinWidth={640}
      resizableMaxWidth={1200}
      resizableStorageKey="igreen-mob-cms.precos-detalhe.width"
      titleSlot={
        <div className="flex min-w-0 items-center gap-gp-sm text-body-sm text-fg-muted">
          <span className="truncate">Preços</span>
          <span className="opacity-50">/</span>
          <span className="truncate font-medium text-fg-default">
            {perfil.empresa}
          </span>
        </div>
      }
      /* O lápis mora AQUI, na fileira de ações do header, não ao lado do título no corpo.
         Duas razões: ele fica na mesma linha do maximizar e do fechar, que são as outras
         ações sobre o painel inteiro; e ao lado do título ele competia com o `h2`, puxando
         o olho pro botão antes do nome do perfil.

         `variant="soft"` + `color="secondary"`, como o próprio `FloatingPanel` desenha o
         maximizar e o fechar — `ghost` no meio da fileira fica sem container e lê como
         desabilitado (regra do `dsgreen-paneldetail-2`). */
      headerActions={
        <Button
          variant="soft"
          color="secondary"
          size="icon-sm"
          aria-label={`Renomear ${perfil.nome}`}
        >
          <Pencil />
        </Button>
      }
      /* O salvar é ÚNICO e mora aqui. Antes eram três botões, um por card, cada um com a
         mesma nota de sincronização acima — a referência faz assim, mas com três seções
         curtas isso virou três vezes o mesmo par de elementos disputando a mesma tela, e
         nada dizia qual salvava o quê.

         Nasce desabilitado e habilita na primeira alteração: é o que impede disparar uma
         sincronização pra todos os carregadores do perfil sem ter mexido em nada. */
      footer={
        <>
          <Button
            variant="outline"
            color="secondary"
            size="sm"
            onClick={tentarFechar}
          >
            Fechar
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Save />}
            disabled={!sujo}
            onClick={() => setSujo(false)}
          >
            Salvar alterações
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-gp-2xl">
{/* Identidade do perfil: nome, tags na MESMA linha, local abaixo.
            As tags saíram do card de controles porque não são um ajuste — são parte de como o
            perfil se chama. E saíram sem o rótulo `Tags:`: um chip já se anuncia como tag, e
            o rótulo só ocupava a largura que os chips usam.

            ⚠️ Quando não há nenhuma, o texto `Sem tags vinculadas` ENTRA no lugar dos chips.
            Sem ele a linha ficaria só com o título e ninguém saberia que existe tag pra
            vincular — vazio silencioso não é o mesmo que campo inexistente. */}
        <div className="flex flex-col gap-gp-sm">
          <div className="flex flex-wrap items-center gap-gp-md">
            <h2 className="text-balance text-title-lg text-fg-default">
              {perfil.nome}
            </h2>
            {perfil.tags.length === 0 ? (
              <span className="text-body-xs text-fg-subtle">{VAZIO_TAGS}</span>
            ) : (
              <span className="flex flex-wrap items-center gap-gp-sm">
                {perfil.tags.map((t) => (
                  <Chip key={t} color="neutral" variant="soft" size="sm">
                    {t}
                  </Chip>
                ))}
              </span>
            )}
          </div>
          <span className="truncate text-body-xs text-fg-muted">
            {perfil.local}
          </span>
        </div>

        {/* Cabeçalho de controles: fora das abas de propósito — ver o JSDoc.

            **Sem padding nenhum aqui** — o padding é de cada linha (`p-pad-2xl` no
            `ParDeOpcoes`). É o que faz a divisória ir de ponta a ponta: com `px` no
            container, o fio parava 18px antes de cada borda. Mesma estrutura do
            `CardOptionGroup layout="list"` do DS, que também guarda só borda e radius.

            O fio vem da borda de BAIXO de cada linha, com a última suprimida — não de
            `divide-y`. Medido: o `divide-y` saiu com `border-top-width: 0px` nas três
            linhas, e `border-subtle` no dark é `oklch(1 0 0 / 0.04)`, 4% de branco que não
            se vê sobre o card. É a mesma armadilha que o `CardOption` documenta
            (`card-option.styles.ts:123`), e o `overflow-hidden` é o que recorta a borda da
            última linha nos cantos. */}
        <section className="overflow-hidden rounded-radius-xl border border-border-default">
          {/* ⚠️ **Os três pares confirmam nos DOIS sentidos.** Nenhum lado é inofensivo:
              ligar recarga grátis para de cobrar de todo mundo, e voltar a cobrar surpreende
              quem estava carregando de graça. O que muda entre os seis casos é só o texto. */}
          <ParDeOpcoes
            label="Disponibilidade do carregador"
            descricao={DESCRICOES_DOS_PARES.disponibilidade}
            valor={disponibilidade}
            opcoes={PAR_DISPONIBILIDADE}
            onChange={(v) =>
              pedirConfirmacao(CONFIRMACOES.disponibilidade[v], () =>
                setDisponibilidade(v),
              )
            }
          />
          <ParDeOpcoes
            label="Modo de cobrança"
            descricao={DESCRICOES_DOS_PARES.cobranca}
            valor={modoDeCobranca}
            opcoes={PAR_COBRANCA}
            onChange={(v) =>
              pedirConfirmacao(CONFIRMACOES.cobranca[v], () =>
                setModoDeCobranca(v),
              )
            }
          />
          <ParDeOpcoes
            label="Uso de cupons"
            descricao={DESCRICOES_DOS_PARES.cupons}
            valor={usoDeCupons}
            opcoes={PAR_CUPONS}
            onChange={(v) =>
              pedirConfirmacao(CONFIRMACOES.cupons[v], () => setUsoDeCupons(v))
            }
          />
        </section>
      </div>

      <Tabs value={aba} onValueChange={setAba} fullWidth className="mt-gp-2xl">
        <TabsList>
          <TabsTrigger value="taxas">Taxas</TabsTrigger>
          <TabsTrigger value="periodos">Períodos</TabsTrigger>
          <TabsTrigger value="carregadores">
            Carregadores {perfil.carregadores.length}
          </TabsTrigger>
        </TabsList>

        {/* ── Taxas ─────────────────────────────────────────────────────────── */}
        <TabsContent value="taxas" className="flex flex-col gap-gp-xl pt-pad-xl">
          <CardDeTaxa titulo="Taxas">
            {/* Dois campos lado a lado, sem card em volta de cada um. A referência embrulha
                cada taxa num cartão verde; aqui isso somava três molduras pro mesmo dado — a
                do card da seção, a do cartão e a do input. */}
            <div className="grid grid-cols-1 gap-gp-2xl sm:grid-cols-2">
              {energia === null ? (
                <TaxaNaoConfigurada
                  titulo="Preço da energia"
                  onAdicionar={() => {
                    setEnergia(0);
                    setSujo(true);
                  }}
                />
              ) : (
                <CampoDeValor
                  label="Preço da energia"
                  unidade="/ kWh"
                  valor={energia}
                  onChange={(v) => {
                    setEnergia(v);
                    setSujo(true);
                  }}
                />
              )}
              {usoCarregador === null ? (
                <TaxaNaoConfigurada
                  titulo="Cobrança por uso do carregador"
                  onAdicionar={() => {
                    setUsoCarregador(0);
                    setSujo(true);
                  }}
                />
              ) : (
                <CampoDeValor
                  label="Cobrança por uso do carregador"
                  unidade="/ hora"
                  valor={usoCarregador}
                  onChange={(v) => {
                    setUsoCarregador(v);
                    setSujo(true);
                  }}
                />
              )}
            </div>

            {/* `soft`, não `filled`: a ação é destrutiva e o vermelho precisa estar lá, mas
                um botão vermelho sólido no meio de um formulário de configuração grita mais
                que o salvar — e ele não é o caminho principal de ninguém. O `soft` mantém a
                cor de perigo com o peso de ação secundária. */}
            <Button
              variant="soft"
              color="critical"
              size="sm"
              className="w-fit"
              iconLeft={<RotateCcw />}
              onClick={() => {
                setEnergia(null);
                setUsoCarregador(null);
                setSujo(true);
              }}
            >
              Redefinir todas as taxas desse perfil
            </Button>
          </CardDeTaxa>

          <CardDeTaxa
            titulo="Taxa de ativação (uso)"
            switchLigado={ativacaoLigada}
            onSwitch={(v) => {
              setAtivacaoLigada(v);
              setSujo(true);
            }}
          >
            {ativacaoLigada ? (
              <>
                <CampoDeValor
                  label="Taxa de ativação"
                  unidade="/ USO"
                  valor={ativacao}
                  onChange={(v) => {
                    setAtivacao(v);
                    setSujo(true);
                  }}
                  className="sm:max-w-[320px]"
                />
                <GrupoDeIsencao
                  modo={modoIsencao}
                  onModo={(v) => {
                    setModoIsencao(v);
                    setSujo(true);
                  }}
                  tolerancia={tolerancia}
                  onTolerancia={(v) => {
                    setTolerancia(v);
                    setSujo(true);
                  }}
                  isencao={isencao}
                  onIsencao={(v) => {
                    setIsencao(v);
                    setSujo(true);
                  }}
                />
              </>
            ) : undefined}
          </CardDeTaxa>

          <CardDeTaxa
            titulo="Taxa de ociosidade (overstay)"
            switchLigado={ociosidadeLigada}
            onSwitch={(v) => {
              setOciosidadeLigada(v);
              setSujo(true);
            }}
          >
            {ociosidadeLigada ? (
              <CampoDeValor
                label="Taxa de ociosidade"
                unidade="/ hora"
                valor={ociosidade}
                onChange={(v) => {
                  setOciosidade(v);
                  setSujo(true);
                }}
                className="sm:max-w-[320px]"
              />
            ) : undefined}
          </CardDeTaxa>
        </TabsContent>

        {/* ── Períodos ──────────────────────────────────────────────────────── */}
        <TabsContent
          value="periodos"
          className="flex flex-col gap-gp-xl pt-pad-xl"
        >
          <div className="flex flex-col gap-gp-md">
            <span className="text-body-md font-semibold text-fg-default">
              Configure cobrança das taxas para dias e horários específicos
            </span>
            <span className="text-caption-md text-fg-muted">
              {SUB_PERIODOS}
            </span>
          </div>

          <section className="flex flex-col gap-gp-xl rounded-radius-2xl border border-border-default bg-bg-surface p-pad-2xl">
            <VisualizacaoSemanal regras={perfil.regras} />
          </section>

          <section className="flex flex-col gap-gp-lg rounded-radius-2xl border border-border-default bg-bg-surface p-pad-2xl">
            <div className="flex min-h-form-lg items-center gap-gp-sm rounded-radius-lg border border-border-input bg-bg-surface px-pad-lg">
              <Search className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
              <input
                value={buscaHorario}
                onChange={(e) => setBuscaHorario(e.target.value)}
                placeholder="Buscar horário"
                aria-label="Buscar horário"
                className="min-w-0 flex-1 bg-transparent text-body-sm text-fg-default outline-none placeholder:text-fg-subtle"
              />
            </div>

            {regrasFiltradas.length === 0 ? (
              <p className="py-pad-4xl text-center text-body-sm text-fg-muted">
                {VAZIO_REGRAS}
              </p>
            ) : (
              <ul className="flex flex-col gap-gp-md">
                {regrasFiltradas.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-gp-lg rounded-radius-lg border border-border-default bg-bg-canvas px-pad-2xl py-pad-xl"
                  >
                    <span className="text-body-sm font-semibold tabular-nums text-fg-default">
                      {r.horaInicial}–{r.horaFinal}
                    </span>
                    <span className="truncate text-caption-md text-fg-muted">
                      {r.dias.join(", ")}
                    </span>
                    <Chip
                      color={
                        r.disponibilidade === "desativado"
                          ? "neutral"
                          : r.modoDeCobranca === "gratis"
                            ? "success"
                            : "info"
                      }
                      variant="soft"
                      size="sm"
                      shape="pill"
                    >
                      {r.disponibilidade === "desativado"
                        ? "Desativado"
                        : r.modoDeCobranca === "gratis"
                          ? "Recarga grátis"
                          : "Cobrança normal"}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}

            {/* `Adicionar regra` no FIM da lista, como os `Adicionar` de Gestão de Carga —
                padrão deste projeto: a ação de criar vem depois do que já existe. */}
            <Button
              variant="soft"
              color="primary"
              size="sm"
              iconLeft={<Plus />}
              onClick={() => setModalRegra(true)}
            >
              Adicionar regra
            </Button>
          </section>
        </TabsContent>

        {/* ── Carregadores ──────────────────────────────────────────────────── */}
        <TabsContent
          value="carregadores"
          className="flex flex-col gap-gp-md pt-pad-xl"
        >
          <div className="flex flex-col gap-gp-md">
            <span className="text-body-md font-semibold text-fg-default">
              Carregadores utilizando este perfil
            </span>
            <span className="text-caption-md text-fg-muted">
              {SUB_PERIODOS}
            </span>
          </div>
          {perfil.carregadores.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-gp-lg rounded-radius-lg border border-border-default bg-bg-surface px-pad-2xl py-pad-xl"
            >
              <div className="flex min-w-0 items-center gap-gp-md">
                <Plug className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-body-sm font-semibold text-fg-default">
                    {c.nome}
                  </span>
                  <span className="truncate text-caption-sm tabular-nums text-fg-muted">
                    Cpcode: {c.cpcode}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-caption-sm text-fg-muted">Status</span>
                <span
                  className={`text-body-sm font-semibold ${
                    c.status === "Online" ? "text-fg-success" : "text-fg-muted"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {modalRegra && (
        <ModalNovaRegra
          perfil={perfil}
          open
          onClose={() => setModalRegra(false)}
        />
      )}

      {/* Guarda das opções. A nota de reversibilidade vai DENTRO da `description`
          porque o `AlertModal` não tem slot de corpo — e ela é parte do que se lê pra
          decidir, não um detalhe de rodapé.

          `tone="warning"`, não `danger`: nenhuma das seis trocas destrói nada, e todas
          voltam atrás. Vermelho aqui ensinaria a clicar sem ler. */}
      <AlertModal
        open={!!confirmacao}
        onOpenChange={(aberto) => !aberto && setConfirmacao(null)}
        tone="warning"
        title={confirmacao?.titulo ?? ""}
        description={
          <span className="flex flex-col gap-gp-lg">
            <span>{confirmacao?.descricao}</span>
            <span className="flex items-start gap-gp-md rounded-radius-lg border border-border-warning-muted bg-bg-warning-muted px-pad-xl py-pad-lg text-caption-md text-fg-warning">
              <Info className="mt-[1px] size-icon-sm shrink-0" aria-hidden />
              {NOTA_REVERSIVEL}
            </span>
          </span>
        }
        cancelLabel="Cancelar"
        confirmLabel="Confirmar"
        onConfirm={() => confirmacao?.aplicar()}
      />

      {/* Guarda de saída. `tone="warning"`, não `danger`: nada foi destruído ainda, e o
          caminho de escape (`Continuar editando`) é o seguro. Vermelho aqui ensinaria a
          clicar no botão de fechar sem ler. */}
      <AlertModal
        open={confirmandoDescarte}
        onOpenChange={setConfirmandoDescarte}
        tone="warning"
        title="Descartar alterações?"
        description="Você alterou as taxas deste perfil e ainda não salvou. Fechar agora descarta as alterações."
        cancelLabel="Continuar editando"
        confirmLabel="Descartar"
        onConfirm={() => {
          setConfirmandoDescarte(false);
          onClose();
        }}
      />
    </FloatingPanel>
  );
}
