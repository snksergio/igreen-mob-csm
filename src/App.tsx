import { useState } from "react";
import { AppShell } from "~/layout/AppShell";
import type { Escopo } from "~/layout/EscopoGlobal";
import { PlaceholderPage } from "~/layout/PlaceholderPage";
import { DashboardPage } from "~/pages/dashboard/DashboardPage";
import { ResumoPage } from "~/pages/resumo/ResumoPage";
import { TransacoesPage } from "~/pages/transacoes/TransacoesPage";
import { PerformancePage } from "~/pages/performance/PerformancePage";
import { RepassesPage } from "~/pages/repasses/RepassesPage";
import { GestaoDeCargaPage } from "~/pages/gestao-carga/GestaoDeCargaPage";
import { PrecosPage } from "~/pages/precos/PrecosPage";
import { CarregadoresPage } from "~/pages/carregadores/CarregadoresPage";
import { MonitoramentoPage } from "~/pages/monitoramento/MonitoramentoPage";
import { EstruturaDaRedePage } from "~/pages/estrutura-rede/EstruturaDaRedePage";
import { LocaisPage } from "~/pages/locais/LocaisPage";
import { UsuariosPage } from "~/pages/usuarios/UsuariosPage";
import { PermissoesPage } from "~/pages/permissoes/PermissoesPage";
import { AlertasListaPage } from "~/pages/alertas-lista/AlertasListaPage";
import { MinhaContaPage } from "~/pages/minha-conta/MinhaContaPage";
import { AlertasPage } from "~/pages/alertas/AlertasPage";
import { CuponsPage } from "~/pages/cupons/CuponsPage";
import { MotoristasPage } from "~/pages/motoristas/MotoristasPage";
import { LoginPage } from "~/pages/login/LoginPage";
import { Toaster } from "@snksergio/design-system/shadcn";
import { useTheme, type Theme } from "@snksergio/design-system";
import { EMPRESAS, LOCAIS } from "~/pages/transacoes/transacoes-mock";
import type { PageId } from "~/nav/nav-data";

export function App() {
  /**
   * ⚠️ O tema mora AQUI, e não mais só dentro do `AppShell`.
   *
   * `useTheme` é quem escreve a classe `dark` no `<html>`; enquanto ele vivia só no
   * shell, a tela de login — que não monta shell nenhum — abria clara. O produto abre
   * escuro por decisão, e a primeira tela que alguém vê é justamente a que estava
   * desobedecendo.
   *
   * Uma instância só, na raiz, e o par desce por prop pro shell. Duas chamadas do mesmo
   * hook funcionariam, mas seriam dois donos do mesmo estado — o tipo de coisa que
   * diverge no primeiro caminho que esquecer de sincronizar.
   */
  const { theme, setTheme } = useTheme();
  /**
   * Autenticado ou não — o único estado do projeto que decide qual CASCA renderiza.
   *
   * Mora aqui, e não num contexto, pelo mesmo motivo do escopo global: há um consumidor
   * só. E é booleano de verdade em vez de sempre-`true`: com o login preso num estado
   * morto, "Sair" não teria pra onde ir e a tela de login viraria página órfã, que
   * ninguém alcança sem editar código. Assim os dois extremos do fluxo se fecham —
   * `Entrar` entra, `Sair` sai.
   *
   * ⚠️ Abre em `false`: o login é a porta de entrada do produto, e o protótipo tem de
   * começar onde o usuário começa. Até 2026-09-16 abria autenticado — era conveniente
   * para quem estava construindo e mentia sobre o fluxo para quem estava avaliando.
   */
  const [autenticado, setAutenticado] = useState(false);
  /**
   * Depois de entrar, o destino é o **Dashboard** — não Transações.
   *
   * Transações era o padrão porque foi a primeira tela construída, o que é história do
   * projeto e não decisão de produto. Quem acaba de entrar quer o panorama.
   */
  const [page, setPage] = useState<PageId>("dashboard");

  /**
   * Escopo global: empresa + locais, controlado pelo header.
   *
   * Mora AQUI e não num contexto porque hoje tem um consumidor só — o próprio header.
   * Contexto com zero leitores seria estrutura especulativa; quando a primeira página
   * for obedecer ao recorte, a troca é neste arquivo.
   *
   * Abre com TODOS os locais marcados, como o sistema de referência ("38 de 39
   * selecionados" no print): o padrão é ver tudo, e o usuário restringe.
   */
  const [escopo, setEscopo] = useState<Escopo>({
    empresa: EMPRESAS[0],
    locais: [...LOCAIS],
  });

  if (!autenticado) {
    return (
      <>
        <LoginPage
          onEntrar={() => {
            setAutenticado(true);
            /* Volta ao Dashboard a cada entrada: sair de Cupons e entrar de novo caindo
               em Cupons daria a impressão de que a sessão nunca terminou. */
            setPage("dashboard");
          }}
        />
        <Toaster />
      </>
    );
  }

  return (
    <AppShell
      activePage={page}
      onNavigate={setPage}
      escopo={escopo}
      onEscopoChange={setEscopo}
      onSair={() => setAutenticado(false)}
      tema={theme}
      onTemaChange={setTheme}
    >
      {/* Switch explícito, não mapa de componentes: com 2 telas construídas de 16, um
          `Record<PageId, ComponentType>` exigiria entrada pras 14 que ainda são
          placeholder — estrutura antes de conteúdo. Quando a metade estiver de pé, vira
          mapa. */}
      {page === "dashboard" ? (
        <DashboardPage />
      ) : page === "resumo" ? (
        <ResumoPage />
      ) : page === "transacoes" ? (
        <TransacoesPage />
      ) : page === "performance" ? (
        <PerformancePage />
      ) : page === "repasses" ? (
        <RepassesPage />
      ) : page === "gestao-carga" ? (
        <GestaoDeCargaPage />
      ) : page === "precos" ? (
        <PrecosPage />
      ) : page === "carregadores" ? (
        <CarregadoresPage />
      ) : page === "monitoramento" ? (
        <MonitoramentoPage />
      ) : page === "estrutura-rede" ? (
        <EstruturaDaRedePage />
      ) : page === "locais" ? (
        <LocaisPage />
      ) : page === "usuarios" ? (
        <UsuariosPage />
      ) : page === "alertas" ? (
        <AlertasListaPage />
      ) : page === "minha-conta" ? (
        <MinhaContaPage />
      ) : page === "permissoes" ? (
        <PermissoesPage />
      ) : page === "configurar-alertas" ? (
        <AlertasPage />
      ) : page === "cupons" ? (
        <CuponsPage />
      ) : page === "motoristas" ? (
        <MotoristasPage />
      ) : (
        <PlaceholderPage page={page} />
      )}

      {/* ⚠️ Um `<Toaster />` por árvore, montado UMA vez — é requisito do componente:
          sem ele, `toast(...)` não erra, só não aparece nada. Mora dentro do
          `AppShell` (e não acima dele) porque o portal do Sonner segue o tema, e o
          tema é aplicado na raiz do shell. */}
      <Toaster />
    </AppShell>
  );
}
