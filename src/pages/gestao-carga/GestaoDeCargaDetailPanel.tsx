import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Battery,
  Gauge,
  Lock,
  Pencil,
  Plug,
  Plus,
  Zap,
} from "lucide-react";
import { Button, Chip, FloatingPanel } from "@snksergio/design-system";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@snksergio/design-system/shadcn";
import {
  AVISO_NIVEL_DE_ENTRADA,
  VAZIO_CARREGADORES,
  VAZIO_GRUPOS_DE_CARGA,
  carregadoresDoLocal,
  nivelDeEntrada,
  potenciaEmUso,
  type LocalDeCarga,
} from "./gestao-carga-mock";
import { Corrente, Potencia, StatusChip } from "./gestao-carga-ui";
import {
  ModalAdicionarCarregadores,
  ModalAlterarParametros,
  ModalNovoGrupoDeCarga,
} from "./gestao-carga-modais";

/**
 * Painel de detalhe de um local — adaptação do bloco **`dsgreen-paneldetail-2`**.
 *
 * ## Por que o `-2` e não o `-1`
 *
 * A primeira versão desta tela usava o `-1` (seções empilhadas), e estava errada pelo
 * critério que o próprio catálogo declara: **aba serve pra tipo de conteúdo, não pra mais
 * campos**. Aqui tem as duas coisas, e elas são de naturezas diferentes:
 *
 * | | o que é | onde vai |
 * |---|---|---|
 * | os 4 parâmetros de rede | propriedades do local, fixas, nunca mais que isso | lista plana de ficha |
 * | grupos de carga · carregadores | coleções que **crescem sem limite** | abas |
 *
 * Com o `-1`, quatro carregadores empurravam os grupos de carga pra fora da dobra e vinte
 * empurrariam o resto da tela. É exatamente o caso que o `-2` existe pra resolver.
 *
 * ## O aviso ocupa o lugar da descrição
 *
 * No bloco, o card entre a ficha e as abas é a descrição da tarefa. Aqui é a advertência
 * elétrica — mesma posição, e é a posição certa: ela vem depois dos valores que descreve e
 * antes do botão que os altera. Aviso que aparece depois do campo é aviso que se lê depois
 * do erro.
 *
 * O card mantém os tokens de warning em vez do `bg-bg-surface` do bloco. ⚠️ Não é enfeite: o
 * `Alert` do DS **não tem variante `warning`** (`shadcn/alert.tsx:10`, só `default` e
 * `destructive`), e `destructive` seria mentira — nada falhou, e vermelho permanente numa
 * tela de configuração vira ruído que se aprende a ignorar.
 *
 * ## O que este arquivo carrega do bloco, e que copiar sem quebra
 *
 * - **O wrapper de gap é obrigatório.** O body do `FloatingPanel` não tem gap entre filhos —
 *   sem o `flex flex-col gap-gp-2xl` o título, a ficha e o aviso ficam colados.
 * - **`bodyPadded` fica no default (`true`).** Era `false` na versão com `-1`, porque lá as
 *   `FloatingPanelSection` traziam gutter próprio. Não há Section nenhuma aqui; ligar `false`
 *   colaria tudo na borda.
 * - **Aba dentro de painel vem `fullWidth`.** Regra do `USAGE.md` do `FloatingPanel`: em
 *   560px a variante `line` vira um trilho curto que lê como fragmento.
 * - **A ficha é grid, não `justify-between`.** É o que alinha os valores numa coluna só e dá
 *   leitura de ficha; com `justify-between` cada valor pararia numa distância diferente da
 *   borda, conforme o tamanho do rótulo.
 */

interface Props {
  local: LocalDeCarga | null;
  onClose: () => void;
}

/** Linha da ficha: ícone à esquerda, rótulo, e o valor na coluna da direita. */
function Propriedade({
  icone: Icone,
  label,
  valor,
}: {
  icone: typeof Gauge;
  label: string;
  valor: React.ReactNode;
}) {
  return (
    <>
      {/* `min-h-form-md` nas DUAS células: sem isso a linha de texto puro mede 30px contra
          36px na que tem `Chip`, e a ficha fica com ritmo irregular. */}
      <div className="flex min-h-form-md items-center gap-gp-md text-body-sm text-fg-muted">
        <Icone className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
        <span className="truncate">{label}</span>
      </div>
      <div className="flex min-h-form-md min-w-0 items-center text-body-sm text-fg-default">
        {valor}
      </div>
    </>
  );
}

export function GestaoDeCargaDetailPanel({ local, onClose }: Props) {
  const [aba, setAba] = useState("grupos");
  const [modal, setModal] = useState<
    "parametros" | "grupo" | "carregadores" | null
  >(null);

  if (!local) return null;

  const entrada = nivelDeEntrada(local);
  const carregadores = carregadoresDoLocal(local);

  const amperes = (v: number) => <span className="tabular-nums">{v}A</span>;

  return (
    <FloatingPanel
      open={!!local}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      /* `lg` = 560px. Nada aqui é tabela — a ficha é de duas colunas e as abas são listas.
         Painel mais largo do que o conteúdo pede deixa as propriedades nadando na linha. */
      size="lg"
      resizable
      maximizable
      resizableStorageKey="igreen-mob-cms.gestao-carga-detalhe.width"
      /* Header leva o CONTEXTO, não a identidade: nome de local é uma frase de até 60
         caracteres e não cabe numa linha de header. Quem identifica vai no corpo, grande. */
      titleSlot={
        <div className="flex min-w-0 items-center gap-gp-sm text-body-sm text-fg-muted">
          <span className="truncate">Gestão de Carga</span>
          <span className="opacity-50">/</span>
          <span className="truncate font-medium text-fg-default">
            {local.empresa}
          </span>
        </div>
      }
      footer={
        <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {/* ⚠️ Wrapper de gap obrigatório — ver o JSDoc. */}
      <div className="flex flex-col gap-gp-2xl">
        <h2 className="text-balance text-title-lg text-fg-default">
          {local.local}
        </h2>

        {/* Ficha. `200px` na coluna de rótulo, não os `132px` do bloco — e o valor é
            MEDIDO, não estimado: "Reserva dinâmica (Amperes)" pede 171px de texto, mais
            16 de ícone e 8 de gap. Em 184 (o meu primeiro palpite) ela truncava pra
            "Reserva dinâmica (Ampe…", e rótulo de parâmetro elétrico cortado é justamente
            o que faz alguém confundir reserva com limite. */}
        <div className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[200px_1fr] sm:items-center">
          <Propriedade
            icone={Gauge}
            label="Corrente máxima disponível"
            valor={amperes(entrada.correnteMaximaA)}
          />
          <Propriedade
            icone={Zap}
            label="Tensão do local"
            valor={<span className="tabular-nums">{entrada.tensaoV}V</span>}
          />
          <Propriedade
            icone={Lock}
            label="Limite fixo (Amperes)"
            valor={amperes(entrada.limiteFixoA)}
          />
          <Propriedade
            icone={Battery}
            label="Reserva dinâmica (Amperes)"
            valor={amperes(entrada.reservaDinamicaA)}
          />
          <Propriedade
            icone={Activity}
            label="Medidor"
            valor={
              /* `neutral` no desativado: é um FATO de configuração, não um defeito — e o
                 `Chip` não tem `caution`, que seria a família certa. */
              <Chip
                color={entrada.medidorAtivo ? "success" : "neutral"}
                variant="soft"
                size="sm"
              >
                {entrada.medidorAtivo ? "Ativado" : "Desativado"}
              </Chip>
            }
          />
          <Propriedade
            icone={Plug}
            label="Potência em uso"
            valor={<Potencia kw={potenciaEmUso(local)} />}
          />
        </div>

        {/* A advertência, no lugar do card de descrição do bloco. */}
        <div className="flex items-start gap-gp-md rounded-radius-lg border border-border-warning-muted bg-bg-warning-muted p-pad-2xl">
          <AlertTriangle
            className="size-icon-sm shrink-0 text-fg-warning"
            aria-hidden
          />
          <div className="flex flex-col gap-gp-2xs">
            <span className="text-body-xs font-semibold text-fg-default">
              Atenção!
            </span>
            <p className="text-body-sm text-fg-muted">
              {AVISO_NIVEL_DE_ENTRADA}
            </p>
          </div>
        </div>

        {/* De ponta a ponta, logo abaixo do aviso: é a ação sobre os parâmetros que a ficha
            acabou de listar, e a largura inteira a liga ao bloco acima em vez de fazê-la
            competir com os botões `Adicionar` das abas. */}
        <Button
          variant="outline"
          color="secondary"
          size="sm"
          iconLeft={<Pencil />}
          className="w-full"
          onClick={() => setModal("parametros")}
        >
          Alterar parâmetros
        </Button>
      </div>

      {/* Abas: cada uma é uma COLEÇÃO que cresce. Os parâmetros ficaram de fora porque são
          campos — a distinção que o `dsgreen-paneldetail-2` documenta. */}
      <Tabs value={aba} onValueChange={setAba} fullWidth className="mt-gp-2xl">
        <TabsList>
          <TabsTrigger value="grupos">Grupos de carga</TabsTrigger>
          {/* Contagem só onde ela informa: "Carregadores 3" ajuda a decidir se clica, e
              "Grupos de carga 0" só repetiria o vazio que a aba já mostra. */}
          <TabsTrigger value="carregadores">
            Carregadores {carregadores.length}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="flex flex-col gap-gp-md pt-pad-xl">
          {/* Vazio com o texto LITERAL da origem. Um vazio genérico ("Nenhum item") perderia
              a informação de que o que falta é um SUBGRUPO — que é o que o botão adiciona. */}
          <div className="flex flex-col items-center gap-gp-md rounded-radius-lg border border-dashed border-border-default px-pad-2xl py-pad-4xl">
            <Gauge className="size-icon-lg text-fg-subtle" aria-hidden />
            <span className="text-body-sm text-fg-muted">
              {VAZIO_GRUPOS_DE_CARGA}
            </span>
          </div>
          {/* O `Adicionar` vem NO FIM da lista, não no header da aba: ele é o próximo item
              que ainda não existe, e é onde a mão já está depois de ler o que tem.

              `soft` + `primary`: fundo verde sutil, sem borda. Era `secondary` (cinza) e
              sumia ao lado do `Fechar` do rodapé; o `outline` verde que tentei no meio
              competia com os botões dos modais. O `soft` marca a ação como da marca sem
              disputar com a primária de cada modal. */}
          <Button
            variant="soft"
            color="primary"
            size="sm"
            iconLeft={<Plus />}
            onClick={() => setModal("grupo")}
          >
            Adicionar grupo de carga
          </Button>
        </TabsContent>

        <TabsContent
          value="carregadores"
          className="flex flex-col gap-gp-md pt-pad-xl"
        >
          {carregadores.length === 0 ? (
            <div className="flex flex-col items-center gap-gp-md rounded-radius-lg border border-dashed border-border-default px-pad-2xl py-pad-4xl">
              <Plug className="size-icon-lg text-fg-subtle" aria-hidden />
              <span className="text-body-sm text-fg-muted">
                {VAZIO_CARREGADORES}
              </span>
            </div>
          ) : (
            /* ⚠️ **Lista de cards, não `Table`.** São de 1 a 4 carregadores com três valores
               cada — uma tabela gasta um cabeçalho pra nada, e num painel de 560px as colunas
               ficariam apertadas. A referência também lista, não tabula.
               O código vira o título da linha porque é por ele que se identifica o
               equipamento num chamado. */
            carregadores.map((c) => (
              /* ⚠️ **Grid de colunas fixas, não `flex justify-between`.** Com flex cada
                 valor começa onde o vizinho terminou, então `16,7 A` e `0,0 A` empurram
                 a potência pra x diferentes e nada alinha de uma linha pra outra — era
                 isso que deixava as três informações grudadas. Larguras fixas dão colunas
                 de verdade; `minmax(0,1fr)` no código é o que permite ele truncar em vez
                 de estourar a linha. */
              <div
                key={c.id}
                className="grid grid-cols-[minmax(0,1fr)_72px_84px_84px] items-center gap-gp-xl rounded-radius-lg border border-border-default bg-bg-surface px-pad-2xl py-pad-xl"
              >
                <div className="flex min-w-0 items-center gap-gp-md">
                  <Plug
                    className="size-icon-sm shrink-0 text-fg-subtle"
                    aria-hidden
                  />
                  <span className="truncate text-body-sm font-semibold tabular-nums text-fg-default">
                    {c.codigo}
                  </span>
                </div>
                {/* Números à DIREITA da própria coluna: é o que faz a vírgula decimal cair
                    na mesma vertical em todas as linhas, junto do `tabular-nums`. */}
                <div className="text-right text-body-sm">
                  <Corrente a={c.correnteA} />
                </div>
                <div className="text-right text-body-sm">
                  <Potencia kw={c.potenciaKw} />
                </div>
                {/* Chip encostado no FIM da linha (`justify-self-end`), com a coluna dele
                    ainda em largura FIXA. As duas coisas juntas não são redundância:
                    - `justify-self-end` alinha o chip à direita, então "Falha" e
                      "Indisponível" terminam no mesmo x, junto da borda do card;
                    - a largura fixa é o que mantém as colunas de número paradas. Com
                      `auto` na última coluna o `1fr` do código absorveria a diferença de
                      tamanho de cada chip, e `0,0 A` cairia num x por linha.

                    Os `84px` da coluna são MEDIDOS no chip mais largo dos SETE status, e o
                    mais largo é **"Aguardando" (81px)** — não "Indisponível" (80px), que era
                    o meu palpite por ser a palavra mais comprida: o chip mede o desenho do
                    texto, não a contagem de letras.

                    A largura importa justamente por causa do `justify-self-end`: sobra na
                    coluna vira buraco ENTRE o número e o chip, porque o chip foi pra direita
                    e a sobra ficou à esquerda dele. Com os 112px que eu tinha posto, o vão
                    passava de 50px. */}
                <div className="justify-self-end text-body-sm">
                  <StatusChip status={c.status} />
                </div>
              </div>
            ))
          )}
          <Button
            variant="soft"
            color="primary"
            size="sm"
            iconLeft={<Plus />}
            onClick={() => setModal("carregadores")}
          >
            Adicionar carregadores
          </Button>
        </TabsContent>
      </Tabs>

      {/* Os três modais montam só quando abertos: cada um tem estado próprio de formulário, e
          montado-e-escondido guardaria o que o usuário digitou e desistiu. */}
      {modal === "parametros" && (
        <ModalAlterarParametros
          local={local}
          open
          onClose={() => setModal(null)}
        />
      )}
      {modal === "grupo" && (
        <ModalNovoGrupoDeCarga local={local} open onClose={() => setModal(null)} />
      )}
      {modal === "carregadores" && (
        <ModalAdicionarCarregadores
          local={local}
          open
          onClose={() => setModal(null)}
        />
      )}
    </FloatingPanel>
  );
}
