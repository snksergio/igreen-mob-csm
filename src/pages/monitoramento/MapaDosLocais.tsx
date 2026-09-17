import { useLayoutEffect, useRef, useState } from "react";
import { ImageOff, MapPin } from "lucide-react";
import { EmptyState } from "@snksergio/design-system";
import {
  COR_DO_STATUS,
  MONITORAMENTO_TEXTOS,
  ROTULO_STATUS,
  type LocalNoMapa,
} from "./monitoramento-mock";

/**
 * A área do mapa.
 *
 * ## O fundo é a captura do Google Maps entregue pelo operador
 *
 * `public/map-preview.png`, 2559 × 1270. Enquanto o arquivo existir, ele é o mapa; se
 * sumir, o `onError` devolve o estado vazio e a tela continua de pé.
 *
 * ## A legenda não mora aqui
 *
 * Ela era um card flutuante sobre o mapa e virou o grupo `Estado` do `PainelDeFiltros`, ao
 * lado. A caixa colorida de cada opção É a legenda — mesma cor do pin —, e assim a mesma
 * informação deixou de existir em dois lugares que podiam discordar.
 *
 * ## Altura fixa, e não proporção
 *
 * ⚠️ Com `aspect-ratio`, abrir o painel de filtros tira ~304px da largura e **encolhe a
 * altura junto**; o card ao lado, que precisa ter a mesma altura, encolheria junto e o
 * conteúdo dele pularia a cada clique no botão. Com altura fixa, abrir e fechar só muda a
 * largura.
 */

/** O fundo. Caminho em `public/`, servido na raiz pelo Vite. */
const IMAGEM_DO_MAPA = "/map-preview.png";

/**
 * Altura da faixa.
 *
 * 474 = os 414 da rodada anterior mais os 60 que o operador pediu (2026-09-16). O que os
 * 60px compram, concretamente: o painel de filtros ao lado deixa de rolar para mostrar o
 * grupo `Potência` inteiro.
 *
 * ⚠️ **Exportado porque quem aplica é a LINHA, na página, não este componente.** O painel
 * de filtros é `h-full`, e `height: 100%` só resolve contra um pai de altura declarada.
 * Com a altura aqui dentro, o pai ficava com altura automática, o painel crescia com o
 * conteúdo e a linha ia junto — medido, card de **496px** ao lado de um mapa de 207.
 */
export const ALTURA_DO_MAPA = 474;

/** Tamanho do pin — único. A faixa de potência é COR na legenda, não tamanho aqui. */
const TAMANHO_DO_PIN = 26;

/**
 * O que a IMAGEM cobre, em graus.
 *
 * ⚠️ **Medido, não estimado.** Localizei quatro cidades na captura e ajustei um Mercator
 * por duas delas, conferindo nas outras duas:
 *
 * | cidade | x,y previstos | x,y observados |
 * |---|---|---|
 * | Lima (−12,05 / −77,04) | âncora | âncora |
 * | Buenos Aires (−34,60 / −58,38) | âncora | âncora |
 * | São Paulo (−23,55 / −46,63) | x 934 | x 935 |
 * | Brasília (−15,79 / −47,88) | y 529 | y 529 |
 *
 * (Coordenadas na imagem exibida a 2000px de largura.) A linha tracejada do Equador caiu em
 * y 387 previsto contra 385 observado — 2px em 993. A captura é Mercator de verdade: a
 * escala derivada da longitude (648,2 px/rad) e a derivada da latitude (649,9 px/rad) batem
 * com 0,26% de diferença, e é isso que autoriza tratar o zoom abaixo como uniforme.
 */
const IMAGEM = {
  larguraPx: 2559,
  alturaPx: 1270,
  oeste: -152.25,
  leste: 73.96,
  norte: 39.94,
  sul: -56.23,
};

/**
 * A janela geográfica que a faixa mostra.
 *
 * Só a LATITUDE é fixada: o Brasil continental, com folga. A longitude é calculada em
 * tempo de render a partir da largura real da faixa, e é isso que mantém o mapa sem
 * distorção enquanto o painel de filtros abre e fecha.
 *
 * ⚠️ Fixar as quatro pontas seria o caminho óbvio e o errado: a faixa muda de proporção
 * (≈2,3:1 com o painel aberto, ≈3:1 fechado), e uma janela de proporção fixa dentro dela
 * ou estica o mapa ou deixa tarja. Fixar a altura e deixar a largura respirar é o que
 * um mapa faz quando se redimensiona a janela do navegador.
 */
const FOCO = { norte: 7, sul: -34, lngCentro: -52 };

/** Projeção de Mercator no eixo Y — a única parte não-linear. */
const mercY = (graus: number) =>
  Math.log(Math.tan(Math.PI / 4 + (graus * Math.PI) / 360));

const rad = (graus: number) => (graus * Math.PI) / 180;

/**
 * Onde a imagem tem que ficar pra que a faixa mostre exatamente a janela — e onde cada pin
 * cai dentro dela.
 *
 * As duas coisas saem da MESMA função de propósito. Quando a posição da imagem e a dos
 * pins são calculadas em lugares diferentes, elas divergem no primeiro ajuste e o defeito
 * é o pior possível num mapa: tudo continua parecendo certo, só que São Paulo fica no mar.
 */
function enquadrar(larguraDaFaixa: number, alturaDaFaixa: number) {
  const mercNorte = mercY(FOCO.norte);
  const vaoMercDaJanela = mercNorte - mercY(FOCO.sul);

  /* A largura em longitude sai da proporção da faixa: em Mercator com pixel quadrado,
     radianos de longitude e unidades de mercY têm a mesma escala. */
  const vaoLngRad = (larguraDaFaixa / alturaDaFaixa) * vaoMercDaJanela;
  const vaoLngGraus = (vaoLngRad * 180) / Math.PI;
  const oeste = FOCO.lngCentro - vaoLngGraus / 2;

  const vaoLngDaImagem = IMAGEM.leste - IMAGEM.oeste;
  const imagemLargura = larguraDaFaixa * (vaoLngDaImagem / vaoLngGraus);
  /* Altura pela proporção NATURAL do arquivo — é o que garante zoom uniforme. */
  const imagemAltura = imagemLargura * (IMAGEM.alturaPx / IMAGEM.larguraPx);

  const vaoMercDaImagem = mercY(IMAGEM.norte) - mercY(IMAGEM.sul);

  return {
    imagem: {
      width: imagemLargura,
      height: imagemAltura,
      left: -((oeste - IMAGEM.oeste) / vaoLngDaImagem) * imagemLargura,
      top:
        -((mercY(IMAGEM.norte) - mercNorte) / vaoMercDaImagem) * imagemAltura,
    },
    /** Posição do pin em % da faixa. */
    pin: (lat: number, lng: number) => ({
      x: ((rad(lng) - rad(oeste)) / vaoLngRad) * 100,
      y: ((mercNorte - mercY(lat)) / vaoMercDaJanela) * 100,
    }),
  };
}

export function MapaDosLocais({
  locais,
  selecionado,
  onSelecionar,
  altura,
}: {
  locais: LocalNoMapa[];
  selecionado?: string | null;
  onSelecionar?: (l: LocalNoMapa) => void;
  /**
   * Altura em px. Sem ela, a altura vem do PAI (`h-full`) — que é como a tela de
   * Monitoramento a usa, pra casar com o painel de filtros ao lado.
   *
   * O formulário de local reaproveita este mesmo componente e não tem esse pai; por isso
   * a prop. Reaproveitar em vez de escrever um segundo mapa é o que garante que o pin do
   * formulário caia no MESMO lugar que o da tela de Monitoramento.
   */
  altura?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [caixa, setCaixa] = useState({ largura: 0, altura: 0 });
  /* `onError` em vez de uma constante editável: o arquivo é entregue de fora, e o 404
     devolve o estado vazio sozinho. */
  const [imagemFalhou, setImagemFalhou] = useState(false);

  /* `useLayoutEffect` + `ResizeObserver`: a largura da faixa muda quando o painel de
     filtros abre, e é ela que define o enquadramento. Medir no layout (e não no effect)
     evita o primeiro quadro com a imagem no lugar errado. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () =>
      setCaixa({ largura: el.clientWidth, altura: el.clientHeight });
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const enquadramento =
    caixa.largura > 0 ? enquadrar(caixa.largura, caixa.altura) : null;

  return (
    /* `h-full`: quem declara a altura é a LINHA, na página — ver o JSDoc do
       `ALTURA_DO_MAPA`. */
    <section
      ref={ref}
      /* ⚠️ `flex-1` SÓ sem altura declarada. Com altura, ele é veneno: o `FormField` do
         DS embrulha o filho num `flex flex-col`, e `flex: 1 1 0%` zera o `flex-basis` —
         medido, a altura de 260px virou **2px**, que é só a borda. Com altura o mapa vira
         `shrink-0`, que é o que ele é: um bloco de tamanho declarado. */
      className={`relative min-w-0 overflow-hidden rounded-radius-xl border border-border-default bg-bg-muted ${
        altura ? "w-full shrink-0" : "h-full flex-1"
      }`}
      style={altura ? { height: altura } : undefined}
      aria-label="Mapa dos locais"
    >
      {imagemFalhou ? (
        <div className="absolute inset-0 grid place-items-center p-pad-2xl">
          <EmptyState
            icon={ImageOff}
            title={MONITORAMENTO_TEXTOS.mapaPendente}
            description={MONITORAMENTO_TEXTOS.mapaPendenteAjuda}
            size="sm"
          />
        </div>
      ) : (
        <>
          {/* `position: absolute` com largura/altura/offset calculados — e NÃO
              `object-cover`. O cover centraliza e corta por conta própria, e aí o recorte
              vira uma variável que a projeção dos pins teria que adivinhar. Aqui o
              enquadramento é declarado, e os pins leem dele. */}
          <img
            src={IMAGEM_DO_MAPA}
            alt=""
            aria-hidden
            onError={() => setImagemFalhou(true)}
            className="absolute max-w-none"
            style={enquadramento?.imagem}
          />

          {enquadramento && (
            <div className="absolute inset-0">
              {locais.map((l) => {
                const { x, y } = enquadramento.pin(l.lat, l.lng);
                const ativo = selecionado === l.local;
                return (
                  <button
                    key={l.local}
                    type="button"
                    title={`${l.local} · ${l.cidade}/${l.uf} · ${l.plugues} ${
                      l.plugues === 1 ? "plugue" : "plugues"
                    } · ${ROTULO_STATUS[l.pior]}`}
                    onClick={() => onSelecionar?.(l)}
                    /* `-translate-x-1/2 -translate-y-full`: a PONTA do pin marca o lugar,
                       não o centro dele. Sem isso o alfinete aponta pra baixo e à direita
                       da coordenada. */
                    className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:z-10 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <MapPin
                      style={{
                        width: TAMANHO_DO_PIN,
                        height: TAMANHO_DO_PIN,
                        color: COR_DO_STATUS[l.pior],
                      }}
                      strokeWidth={ativo ? 2.6 : 1.8}
                      /* Miolo preenchido, não vazado: sobre o mapa claro do Google o pin
                         transparente deixa o relevo aparecer por dentro e perde a
                         silhueta. Branco literal porque o fundo É claro, sempre — a
                         imagem não tem versão dark. */
                      fill="#fff"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
