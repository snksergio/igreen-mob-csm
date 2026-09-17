import { Chip } from "@snksergio/design-system";
import {
  ROTULO_CURTO_DO_NIVEL,
  ROTULO_DO_NIVEL,
  TEXTO_DA_SITUACAO,
  percentual,
  restante,
  situacao,
  totalDistribuido,
  type NivelDoSplit,
  type Split,
} from "./splits-mock";

/**
 * Chip do nível.
 *
 * `primary` no nível empresa e `neutral` no local — e a hierarquia é essa mesmo: o split
 * de empresa vale para todos os pontos, o de local vale para um. Dar a mesma cor aos dois
 * faria parecer que são alternativas equivalentes, quando na verdade um corta depois do
 * outro.
 *
 * `curto` para dentro da coluna `Nível` da tabela — ver o JSDoc de
 * `ROTULO_CURTO_DO_NIVEL`.
 */
export function ChipDeNivel({
  nivel,
  curto = false,
}: {
  nivel: NivelDoSplit;
  curto?: boolean;
}) {
  return (
    <Chip
      color={nivel === "empresa" ? "primary" : "neutral"}
      variant="soft"
      size="sm"
      shape="pill"
    >
      {(curto ? ROTULO_CURTO_DO_NIVEL : ROTULO_DO_NIVEL)[nivel]}
    </Chip>
  );
}

const COR_DA_SITUACAO = {
  vazio: "neutral",
  parcial: "primary",
  fechado: "success",
  estourado: "danger",
} as const;

export function ChipDeSituacao({ split }: { split: Split }) {
  const s = situacao(split);
  return (
    <Chip color={COR_DA_SITUACAO[s]} variant="soft" size="sm" shape="pill">
      {TEXTO_DA_SITUACAO[s]}
    </Chip>
  );
}

/**
 * Barra de distribuição — uma fatia por beneficiário e o restante em cinza.
 *
 * ## Por que barra e não só os dois números
 *
 * A referência mostra `Total distribuído 0.00%` e `Restante empresa 100.00%` em duas
 * caixinhas. Os números estão certos e não respondem a pergunta que se faz olhando: **como
 * isso está repartido?** Com quatro beneficiários, dois números dizem quanto saiu e nada
 * sobre para quem.
 *
 * ⚠️ As fatias saem da rampa da marca, não de cores categóricas: os beneficiários não são
 * categorias com significado próprio — são pedaços da mesma coisa. Cinco cores distintas
 * aqui sugeririam natureza diferente entre eles.
 *
 * O restante fica em `bg-bg-muted`, que é ausência de cor e não uma sexta fatia: ele não é
 * um beneficiário, é o que **não** foi distribuído.
 */
export function BarraDeDistribuicao({ split }: { split: Split }) {
  const total = totalDistribuido(split);
  const sobra = restante(split);
  const estourou = total > 100;

  /* Rampa descendente da marca — mesma regra do `chart-patterns.md`: nunca mais claro que
     a marca, para o texto `on-brand` manter contraste se um dia houver rótulo dentro. */
  const tom = (i: number) =>
    i === 0
      ? "var(--color-chart-1)"
      : `color-mix(in oklch, var(--color-chart-1) ${Math.max(34, 100 - i * 18)}%, black)`;

  return (
    <div className="flex flex-col gap-gp-lg">
      <div className="flex h-[10px] gap-[3px] overflow-hidden rounded-radius-full bg-bg-muted">
        {split.beneficiarios.map((b, i) => (
          <span
            key={b.id}
            style={{
              /* Quando estoura, a largura é proporcional ao TOTAL e não a 100: sem isso
                 as fatias somariam mais de 100% de largura e a última seria cortada em
                 silêncio — o estouro é justamente o que precisa ficar visível. */
              width: `${(b.percentual / Math.max(100, total)) * 100}%`,
              background: estourou ? "var(--color-fg-danger)" : tom(i),
            }}
            title={`${b.nome || "Sem nome"} · ${percentual(b.percentual)}`}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-gp-2xl">
        <span className="flex items-center gap-gp-sm text-caption-md text-fg-muted">
          <span
            className="size-[8px] shrink-0 rounded-[2px]"
            style={{ background: estourou ? "var(--color-fg-danger)" : tom(0) }}
            aria-hidden
          />
          <span
            className={`font-semibold tabular-nums ${
              estourou ? "text-fg-danger" : "text-fg-default"
            }`}
          >
            {percentual(total)}
          </span>
          distribuído
        </span>

        <span className="flex items-center gap-gp-sm text-caption-md text-fg-muted">
          <span
            className="size-[8px] shrink-0 rounded-[2px] bg-bg-muted"
            aria-hidden
          />
          <span className="font-semibold tabular-nums text-fg-default">
            {percentual(Math.max(0, sobra))}
          </span>
          {/* O rótulo muda com o nível — ver o JSDoc do mock: "restante" significa coisas
              diferentes em cada um, porque a cascata corta em ordem. */}
          {split.nivel === "empresa" ? "restante da empresa" : "restante do local"}
        </span>

        {estourou && (
          <span className="text-caption-md font-semibold text-fg-danger">
            Passou {percentual(total - 100)} do disponível.
          </span>
        )}
      </div>
    </div>
  );
}

/** Linha de ficha: rótulo à esquerda, valor à direita. */
export function Propriedade({
  label,
  valor,
}: {
  label: string;
  valor: React.ReactNode;
}) {
  return (
    <div className="flex min-h-form-md items-center justify-between gap-gp-xl border-b border-border-subtle py-pad-sm last:border-b-0">
      <span className="shrink-0 text-body-sm text-fg-muted">{label}</span>
      <span className="min-w-0 text-right text-body-sm text-fg-default">
        {valor}
      </span>
    </div>
  );
}
