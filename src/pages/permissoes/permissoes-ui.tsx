import { Check, Eye, Minus } from "lucide-react";
import { Chip } from "@snksergio/design-system";
import {
  PERFIL,
  ROTULO_DO_NIVEL,
  type Nivel,
  type PerfilId,
} from "./permissoes-mock";

/**
 * Chip de perfil — a peça que aparece em cinco lugares desta tela.
 *
 * A cor vem do próprio perfil (`PERFIL[id].cor`) e não do call-site: a referência pinta o
 * Administrador de roxo na legenda e de roxo no badge da linha, e essa é a única coisa do
 * desenho dela que funciona — a cor é a identidade do perfil. Se cada tela escolhesse a
 * sua, o roxo da legenda não ensinaria nada sobre o badge.
 */
export function ChipDePerfil({
  perfil,
  size = "sm",
}: {
  perfil: PerfilId;
  size?: "sm" | "md";
}) {
  const p = PERFIL[perfil];
  return (
    <Chip color={p.cor} variant="soft" size={size} shape="pill">
      {p.nome}
    </Chip>
  );
}

/**
 * O chip da coluna "Perfil de acesso" — trata o caso MISTO, que é o motivo da coluna.
 *
 * ⚠️ `null` chega de `perfilPredominante` e significa "mais de um perfil", nunca "nenhum".
 * Renderizar `Padrão` aqui seria mentir sobre um acesso que tem um administrador dentro.
 */
export function ChipDePerfilOuMisto({
  perfil,
  quantos,
}: {
  perfil: PerfilId | null;
  quantos: number;
}) {
  if (perfil) return <ChipDePerfil perfil={perfil} />;
  return (
    <span className="flex min-w-0 items-center gap-gp-sm">
      <Chip color="neutral" variant="outline" size="sm" shape="pill">
        Misto
      </Chip>
      <span className="truncate text-caption-md tabular-nums text-fg-muted">
        {quantos} perfis
      </span>
    </span>
  );
}

/**
 * A marca de nível na matriz e no checklist do painel.
 *
 * ## Três formas, não três cores (WCAG 1.4.1)
 *
 * `total` é disco cheio com ✓, `leitura` é um olho contornado, `nenhum` é um traço. Quem
 * não distingue verde de cinza continua lendo a diferença pela silhueta — e o `aria-label`
 * entrega a palavra a quem usa leitor de tela.
 *
 * ⚠️ O disco cheio é `<span>` + `<Check>`, não o `CircleCheck` do lucide: o lucide desenha o
 * círculo com `stroke="currentColor"`, o traço fica por cima do preenchimento e come ~2px
 * de cada lado — o disco sai menor que as outras duas marcas e a coluna desalinha. Mesma
 * lição do painel de grupos de alertas.
 */
export function MarcaDeNivel({ nivel }: { nivel: Nivel }) {
  const rotulo = ROTULO_DO_NIVEL[nivel];

  if (nivel === "total") {
    return (
      <span
        role="img"
        aria-label={rotulo}
        title={rotulo}
        className="grid size-icon-sm shrink-0 place-items-center rounded-radius-full bg-bg-success text-fg-on-success"
      >
        <Check className="size-icon-2xs" strokeWidth={3} />
      </span>
    );
  }

  if (nivel === "leitura") {
    return (
      <span
        role="img"
        aria-label={rotulo}
        title={rotulo}
        className="grid size-icon-sm shrink-0 place-items-center rounded-radius-full border border-border-default text-fg-muted"
      >
        <Eye className="size-icon-2xs" />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={rotulo}
      title={rotulo}
      className="grid size-icon-sm shrink-0 place-items-center text-fg-subtle"
    >
      <Minus className="size-icon-xs" />
    </span>
  );
}

/**
 * A legenda das três marcas — três itens, em linha, abaixo da matriz.
 *
 * Isto é o que sobrou do banner de quatro parágrafos da referência, e a diferença não é de
 * tamanho: aquele explicava os PERFIS (a informação que a tabela já dá, linha a linha),
 * este explica os SÍMBOLOS (a informação que a tabela não consegue dar de si mesma).
 * Legenda que repete a tabela é ruído; legenda que decodifica a tabela é necessária.
 */
export function LegendaDasMarcas() {
  const niveis: Nivel[] = ["total", "leitura", "nenhum"];
  return (
    <div className="flex flex-wrap items-center gap-gp-2xl">
      {niveis.map((n) => (
        <span
          key={n}
          className="flex items-center gap-gp-md text-caption-md text-fg-muted"
        >
          <MarcaDeNivel nivel={n} />
          {ROTULO_DO_NIVEL[n]}
        </span>
      ))}
    </div>
  );
}
