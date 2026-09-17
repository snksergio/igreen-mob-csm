import { useState } from "react";
import {
  BadgePercent,
  Eye,
  EyeOff,
  Hexagon,
  LifeBuoy,
  PlugZap,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  Button,
  FormFieldCheckbox,
  FormFieldInput,
  SidebarBrandIcon,
} from "@snksergio/design-system";

/**
 * Tela de login — o `example-login` do Design System (`?app=login`), transcrito na
 * combinação que o operador escolheu: **painel Texto + fundo Simples**.
 *
 * ## O que foi deixado de fora, e por quê
 *
 * O exemplo do DS é configurável por props: o painel direito faz `text` · `image` ·
 * `image-text`, e o fundo tem o modo `ambient` (a imagem borrada atrás do card). Aqui só
 * existe o caminho `text` sem ambiente.
 *
 * Não é simplificação por preguiça: os outros três dependem de um **asset de imagem** que
 * este projeto não tem, e o exemplo do DS trata isso caindo em `text` quando `image` vem
 * vazio. Carregar as três ramificações pra que duas nunca executem e a terceira só faça
 * fallback seria código morto com aparência de configuração. Se um dia entrar uma foto de
 * eletroposto, o caminho é voltar ao exemplo do DS e trazer o resto.
 *
 * ## O painel é 100% token, sem asset
 *
 * O `BrandPanel` do exemplo desenha o brilho e o degradê com `radial-gradient` sobre
 * `--color-fg-on-brand` — é por isso que ele funciona sem imagem e acompanha a marca.
 * Transcrito literal, incluindo o `opacity-[0.14]`.
 *
 * ## As três vantagens são nossas
 *
 * O exemplo traz duas, genéricas ("resultados em tempo real", "acesso seguro"). O
 * operador pediu três, do domínio. Cada uma cobre uma promessa **diferente** — operação,
 * dinheiro e recorrência — porque três frases sobre a mesma coisa não valem mais que uma.
 *
 * ⚠️ `onSubmit` não autentica nada: chama `onEntrar`, e o `App.tsx` troca de tela. É
 * mock, como o resto do projeto.
 */

interface Vantagem {
  icone: LucideIcon;
  texto: string;
}

const VANTAGENS: Vantagem[] = [
  {
    icone: PlugZap,
    texto: "Toda a rede de eletropostos num painel só",
  },
  {
    icone: TrendingUp,
    texto: "Receita, repasses e o retorno de cada ponto",
  },
  {
    icone: BadgePercent,
    texto: "Cupons e cashback que trazem o motorista de volta",
  },
];

const PAINEL = {
  titulo: "Energia que move o seu negócio.",
  subtitulo:
    "Gerencie seus eletropostos, acompanhe o faturamento de cada ponto e cresça com o iGreen MOB.",
};

export function LoginPage({ onEntrar }: { onEntrar: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manter, setManter] = useState(true);

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    onEntrar();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-gp-2xl overflow-hidden bg-bg-canvas p-pad-2xl">
      <div className="relative z-10 grid w-full max-w-[1000px] overflow-hidden rounded-radius-2xl border border-border-subtle shadow-sh-lg lg:min-h-[620px] lg:grid-cols-2">
        {/* ── Esquerda: formulário ── */}
        <div className="flex flex-col justify-center gap-gp-3xl bg-bg-surface p-pad-4xl lg:px-[40px] lg:py-pad-6xl">
          <div className="mb-gp-md flex flex-col items-center gap-gp-lg text-center">
            <span className="grid size-[48px] place-items-center rounded-radius-2xl bg-bg-brand text-fg-on-brand shadow-sh-sm">
              <SidebarBrandIcon size={24} />
            </span>
            <div className="flex flex-col gap-gp-2xs">
              <h1 className="text-heading-xs font-bold text-fg-default">
                Bem-vindo de volta
              </h1>
              <p className="mx-auto max-w-[300px] text-body-md text-fg-muted">
                Adicione suas credenciais abaixo para acessar sua conta.
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-form-gap" onSubmit={entrar}>
            <FormFieldInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              helperText="Use o email cadastrado na sua conta."
              className="min-h-form-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <FormFieldInput
              label="Senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              className="min-h-form-xl"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              endAddon={
                <button
                  type="button"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setMostrarSenha((s) => !s)}
                  className="grid place-items-center rounded-radius-sm text-fg-muted transition-colors hover:text-fg-default focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand [&>svg]:size-icon-sm"
                >
                  {mostrarSenha ? <EyeOff /> : <Eye />}
                </button>
              }
            />

            <div className="flex items-center justify-between gap-gp-md">
              <FormFieldCheckbox
                label="Manter conectado"
                checked={manter}
                onCheckedChange={(v) => setManter(v === true)}
              />
              <button
                type="button"
                className="shrink-0 whitespace-nowrap rounded-radius-sm text-body-sm font-medium text-fg-brand transition-colors hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
              >
                Esqueceu a senha?
              </button>
            </div>

            <Button
              type="submit"
              color="primary"
              variant="filled"
              size="lg"
              className="w-full min-h-form-xl"
            >
              Entrar
            </Button>
          </form>

          <p className="mt-gp-md flex flex-wrap items-center justify-center gap-gp-xs text-body-sm text-fg-muted [&>svg]:size-icon-sm [&>svg]:text-fg-subtle">
            <LifeBuoy />
            Precisa de ajuda para acessar?{" "}
            <a
              href="#"
              className="rounded-radius-sm font-medium text-fg-brand transition-colors hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring-brand"
            >
              Fale com o suporte
            </a>
          </p>
        </div>

        {/* ── Direita: painel de marca. Some abaixo de `lg`: numa tela estreita ele
             empurraria o formulário pra fora da dobra, e quem veio entrar veio entrar. ── */}
        <div className="relative hidden overflow-hidden bg-bg-brand lg:block">
          <PainelDeMarca />
        </div>
      </div>

      <p className="relative z-10 text-center text-caption-sm text-fg-subtle">
        Ao continuar, você concorda com os Termos de Uso e a Política de
        Privacidade.
      </p>
    </div>
  );
}

/** O `BrandPanel` do exemplo: brilho e degradê por `radial-gradient`, sem asset. */
function PainelDeMarca() {
  return (
    <div className="flex h-full flex-col justify-between">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14] [background:radial-gradient(circle_at_18%_18%,var(--color-fg-on-brand)_0,transparent_42%),radial-gradient(circle_at_88%_8%,var(--color-fg-on-brand)_0,transparent_32%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-fg-default/25"
      />

      <div className="relative z-10 flex flex-col gap-gp-lg p-pad-6xl text-fg-on-brand">
        <span className="grid size-[44px] place-items-center rounded-radius-xl bg-fg-on-brand/15 [&>svg]:size-icon-md">
          <Hexagon strokeWidth={1.8} />
        </span>
        <div className="flex flex-col gap-gp-md">
          <h2 className="text-heading-sm font-semibold leading-tight">
            {PAINEL.titulo}
          </h2>
          <p className="max-w-[340px] text-body-md text-fg-on-brand/80">
            {PAINEL.subtitulo}
          </p>
        </div>
      </div>

      <ul className="relative z-10 flex flex-col gap-gp-lg p-pad-6xl text-fg-on-brand">
        {VANTAGENS.map(({ icone: Icone, texto }) => (
          <li key={texto} className="flex items-center gap-gp-md">
            <span className="grid size-comp-lg shrink-0 place-items-center rounded-radius-full bg-fg-on-brand/15 [&>svg]:size-icon-sm">
              <Icone strokeWidth={1.8} />
            </span>
            <span className="text-body-md text-fg-on-brand/90">{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
