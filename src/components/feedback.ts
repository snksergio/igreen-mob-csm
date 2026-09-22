import { toast } from "@snksergio/design-system";

/**
 * Os avisos de ação do projeto, num lugar só.
 *
 * ## Por que existe, em vez de cada tela chamar `toast` direto
 *
 * Tudo aqui é mock: nenhum `Salvar` grava e nenhum `Excluir` apaga. Sem retorno visível,
 * a pessoa clica, o painel fecha e **nada indica que a ação aconteceu** — o que, num
 * protótipo de validação, lê como defeito do produto e não como limite do mock.
 *
 * Centralizar dá três coisas que quinze chamadas espalhadas não dariam:
 *
 * 1. **Mesma voz.** "Grupo excluído" e "Excluído com sucesso!" na mesma sessão parecem
 *    dois sistemas. Aqui o formato é um: verbo no particípio + o nome do registro.
 * 2. **O `status` certo por tipo de ação**, e não por gosto de quem escreveu a tela.
 * 3. **Um lugar para desligar.** Quando a API real entrar, o toast passa a depender da
 *    resposta — e a mudança é aqui, não em quinze arquivos.
 *
 * ⚠️ O `<Toaster />` precisa estar montado uma vez no root (fica no `App.tsx`). Sem ele
 * nada aparece, e sem erro nenhum.
 */

type Disparo = typeof toast.success;

/**
 * Dispara um toast. **Sem X de fechar** — e isso foi decidido medindo, não por omissão.
 *
 * O operador pediu "o X para fechar, ou o toast na esquerda para não tapar o painel".
 * Entregamos a esquerda (`App.tsx`). O X ficou de fora porque as duas formas de
 * conseguí-lo **não funcionam** nesta versão do DS:
 *
 * 1. `<Toaster closeButton />` é do toast ESTILIZADO do Sonner. O DS renderiza card
 *    próprio via `toast.custom`, o nó sai com `data-styled="false"` e a prop passa em
 *    branco. Medido no DOM.
 * 2. `onClose` no `ToastCard` **desenha** o botão, e o `handleClose` dele chama
 *    `toast.dismiss(toastId)`. Só que o card não some: testado com um toast único na
 *    tela, clicar no X manteve `[data-sonner-toast]` no DOM. Passar o id à mão
 *    (`onClose: () => toast.dismiss(id)`, com o id devolvido pelo disparo) deu o mesmo
 *    resultado — ou seja, `dismiss` não alcança toast criado por `toast.custom`.
 *
 * Botão que não fecha é pior que botão nenhum: ensina que a tela está quebrada. Fica só
 * a expiração automática, mais o canto que não disputa espaço com ação nenhuma.
 *
 * 📋 Lacuna do DS: não há como dispensar um toast do helper antes do tempo.
 */
function fechavel(
  disparar: Disparo,
  opts: { title: string; description?: string },
) {
  return disparar(opts);
}

/**
 * Salvou / criou / atualizou.
 *
 * `success` e não `default`: o verde é o que diz "terminou", e é a única diferença entre
 * "salvei" e "estou avisando de algo".
 */
export function avisoDeSalvo(o: { o: string; detalhe?: string }) {
  fechavel(toast.success, {
    title: `${o.o} salvo`,
    description: o.detalhe ?? "As alterações já aparecem na lista.",
  });
}

/** Criou um registro novo — distinto de salvar, porque a lista ganhou uma linha. */
export function avisoDeCriado(o: { o: string; detalhe?: string }) {
  fechavel(toast.success, {
    title: `${o.o} criado`,
    description: o.detalhe ?? "O registro já aparece na lista.",
  });
}

/**
 * Excluiu / revogou.
 *
 * ⚠️ `danger`, e não `success`. Excluir dá certo com frequência e mesmo assim é o tipo de
 * ação em que a pessoa quer conferir o que acabou de fazer — um toast verde some da
 * atenção exatamente quando ela precisaria dele. O status muda só o chip do ícone; a
 * superfície do card é neutra nos dois casos.
 */
export function avisoDeExcluido(o: { o: string; detalhe?: string }) {
  /* ⚠️ `toast.error`, não `toast.danger`: a API do DS expõe success/error/warning/info.
     `danger` é o nome do TOKEN de cor, não do método — confundir os dois compila como
     `any` em consumidor npm e falha em runtime. */
  fechavel(toast.error, {
    title: `${o.o} excluído`,
    description: o.detalhe ?? "O registro saiu da lista.",
  });
}

/** Aviso avulso que também fecha no X — para telas com texto próprio. */
export function avisoFechavel(o: {
  titulo: string;
  detalhe?: string;
  tipo?: "info" | "success" | "warning" | "error";
}) {
  const disparar =
    o.tipo === "warning"
      ? toast.warning
      : o.tipo === "error"
        ? toast.error
        : o.tipo === "success"
          ? toast.success
          : toast.info;
  fechavel(disparar, { title: o.titulo, description: o.detalhe });
}

/** Ação que não é nem salvar nem excluir — estorno, reenvio, comando. */
export function avisoDeAcao(o: {
  titulo: string;
  detalhe?: string;
  tipo?: "info" | "success" | "warning";
}) {
  const disparar =
    o.tipo === "warning"
      ? toast.warning
      : o.tipo === "success"
        ? toast.success
        : toast.info;
  fechavel(disparar, { title: o.titulo, description: o.detalhe });
}
