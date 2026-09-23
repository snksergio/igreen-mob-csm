import { useEffect, useState } from "react";

/**
 * O `md` do Tailwind, em número.
 *
 * Abaixo dele o projeto trata a tela como celular: a sidebar vira drawer, as ações do
 * cabeçalho empilham, o recorte do toolbar ganha a linha inteira. Está aqui como constante
 * porque o mesmo limite precisa existir em CSS (`max-md:`) e em JS, e dois números soltos
 * divergem no dia em que um dos dois mudar.
 */
export const LARGURA_DE_CELULAR = 768;

/**
 * `true` enquanto a janela for mais estreita que `md`.
 *
 * ## Quando usar — e quando NÃO usar
 *
 * Só quando a diferença entre celular e desktop é de **árvore**, não de estilo: renderizar
 * o mesmo painel dentro de um `Sheet` em vez de uma coluna, por exemplo. Para tudo que é
 * largura, direção de flex, visibilidade ou espaçamento existe `max-md:` no className — que
 * não custa render, não tem estado e não erra na primeira pintura.
 *
 * ## Por que `matchMedia` e não `resize`
 *
 * `matchMedia` dispara uma vez na travessia do limite; `resize` dispara a cada pixel
 * arrastado. São dezenas de renders para responder a mesma pergunta booleana.
 *
 * ⚠️ O valor inicial é lido no primeiro render (não em `useEffect`), então não existe um
 * quadro em que o celular renderiza a árvore de desktop e troca em seguida — o que, com um
 * `Sheet`, seria um painel piscando montado e desmontado.
 */
export function useEhCelular() {
  const consulta = `(max-width: ${LARGURA_DE_CELULAR - 1}px)`;
  const [ehCelular, setEhCelular] = useState(
    () => typeof window !== "undefined" && window.matchMedia(consulta).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const ouvir = (e: MediaQueryListEvent) => setEhCelular(e.matches);
    /* Reconfere no mount: entre o primeiro render e este efeito a janela pode ter mudado
       (rotação de tela, abertura do teclado), e o estado inicial ficaria velho. */
    setEhCelular(mq.matches);
    mq.addEventListener("change", ouvir);
    return () => mq.removeEventListener("change", ouvir);
  }, [consulta]);

  return ehCelular;
}
