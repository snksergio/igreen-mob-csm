import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

/**
 * Dark como padrão do produto, SEM sequestrar a escolha do usuário.
 *
 * O `useTheme` do DS cai em `"system"` quando o localStorage está vazio — ou seja,
 * segue o `prefers-color-scheme` do sistema operacional, que na maioria das máquinas
 * é claro. Semear a chave só quando ela NÃO existe resolve as duas coisas: a primeira
 * visita abre escuro, e a partir do momento em que o usuário escolhe no menu de tema,
 * a escolha dele persiste e vence.
 *
 * Roda ANTES do render de propósito: o hook lê o localStorage no inicializador do
 * `useState`, então semear depois não teria efeito até o próximo reload.
 */
const CHAVE_TEMA = "igreen-ds-theme";
try {
  if (!window.localStorage.getItem(CHAVE_TEMA)) {
    window.localStorage.setItem(CHAVE_TEMA, "dark");
  }

  /**
   * ⚠️ Semear o localStorage NÃO pinta a tela — quem escreve a classe `dark` no
   * `<html>` é o `useTheme`, e ele só existe onde alguém o chama.
   *
   * Dois defeitos vinham daí, e o segundo passou despercebido por dias:
   *
   * 1. **Flash branco.** Entre o parse do HTML e o primeiro render do React não há
   *    classe nenhuma, e o `<html>` fica claro por alguns frames.
   * 2. **A tela de login abria CLARA.** Ela não monta o `AppShell`, que era o único
   *    lugar do projeto que chamava `useTheme` — sem shell, ninguém aplicava a classe,
   *    e o produto que "abre escuro por decisão" abria branco na primeira tela que o
   *    usuário vê. Corrigido também no `App.tsx`, que agora hospeda o hook.
   *
   * Esta linha resolve o (1) e dá rede ao (2): a classe já vai no documento antes de
   * qualquer componente existir.
   */
  const escolhido = window.localStorage.getItem(CHAVE_TEMA);
  const escuro =
    escolhido === "dark" ||
    (escolhido === "system" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", !!escuro);
} catch {
  /* modo privado ou site data bloqueado — o app abre claro, não quebra */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
