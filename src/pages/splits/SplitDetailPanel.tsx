import {
  Building2,
  CalendarDays,
  Landmark,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import {
  Avatar,
  Button,
  FloatingPanel,
  FloatingPanelSection,
} from "@snksergio/design-system";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import {
  ROTULO_DO_NIVEL,
  comoRecebe,
  dataCurta,
  locaisAlcancados,
  percentual,
  restante,
  totalDistribuido,
  type Split,
} from "./splits-mock";
import {
  BarraDeDistribuicao,
  ChipDeNivel,
  ChipDeSituacao,
  Propriedade,
} from "./splits-ui";

/**
 * Painel de detalhe de um split — leitura.
 *
 * ## Esta tela não existe na referência, e é a que faltava
 *
 * Lá só há dois estados: a lista (três colunas, nenhuma informação) e o formulário de
 * edição. Para saber **como um split está dividido** é preciso abrir o editor — ou seja,
 * entrar em modo de escrita para responder uma pergunta de leitura. Quem só quer conferir
 * fica a um clique de alterar por engano.
 *
 * O painel responde as três perguntas que trazem alguém aqui — onde vale, quanto sai, para
 * quem vai — sem nenhum campo editável.
 *
 * ## A cascata aparece explicada, não presumida
 *
 * A última seção diz, em uma frase, sobre o que este split incide: receita bruta do local,
 * ou o que sobrou depois dos splits de local. Ver o JSDoc do mock: é a informação que faz
 * "100%" significar coisas diferentes em cada nível, e a referência a esconde num
 * subtítulo do formulário.
 */
export function SplitDetailPanel({
  split,
  onClose,
  onEditar,
  onExcluir,
}: {
  split: Split | null;
  onClose: () => void;
  onEditar: (s: Split) => void;
  onExcluir: (s: Split) => void;
}) {
  if (!split) return null;
  const s = split;

  const total = totalDistribuido(s);
  const sobra = restante(s);

  return (
    <FloatingPanel
      open={!!s}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      size="xl"
      resizable
      maximizable
      resizableStorageKey="splits.detail-panel.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {s.local ?? s.empresa}
          </span>
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <ChipDeNivel nivel={s.nivel} />
            <ChipDeSituacao split={s} />
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="outline"
            color="critical"
            size="sm"
            iconLeft={<Trash2 />}
            onClick={() => onExcluir(s)}
          >
            Excluir split
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Pencil />}
            onClick={() => onEditar(s)}
          >
            Editar split
          </Button>
        </>
      }
    >
      <FloatingPanelSection title="Distribuição">
        <BarraDeDistribuicao split={s} />
      </FloatingPanelSection>

      <FloatingPanelSection title="Onde vale">
        <div className="flex flex-col">
          <Propriedade label="Empresa" valor={s.empresa} />
          <Propriedade label="Nível" valor={ROTULO_DO_NIVEL[s.nivel]} />
          <Propriedade
            label="Local"
            valor={
              s.local ? (
                /* Sem elipse: nome de local cortado faz conferir a divisão do ponto
                   errado. Quebra em duas linhas. */
                <span className="block whitespace-normal break-words leading-snug">
                  {s.local}
                </span>
              ) : (
                <span className="text-fg-muted">
                  Todos os {locaisAlcancados(s)} locais
                </span>
              )
            }
          />
          <Propriedade
            label="Última alteração"
            valor={
              <span className="tabular-nums">{dataCurta(s.atualizadoEm)}</span>
            }
          />
        </div>
      </FloatingPanelSection>

      <FloatingPanelSection
        title={`Beneficiários (${s.beneficiarios.length})`}
      >
        {s.beneficiarios.length === 0 ? (
          <p className="text-body-sm text-fg-muted">
            Nenhum beneficiário configurado — a receita fica inteira com o
            titular.
          </p>
        ) : (
          <ul className="flex flex-col">
            {/* Ordenado pela FATIA, do maior pro menor, e não pela ordem de cadastro: a
                pergunta desta lista é "quem fica com mais". A ordem de cadastro é
                histórico de quem digitou, não informação sobre o dinheiro. */}
            {[...s.beneficiarios]
              .sort((a, b) => b.percentual - a.percentual)
              .map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-gp-lg border-b border-border-subtle py-pad-lg last:border-b-0"
                >
                  <Avatar
                    size="md"
                    colorHex={corDoAvatar(b.nome)}
                    className="shrink-0"
                    aria-hidden
                  >
                    {iniciais(b.nome)}
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <span className="truncate text-body-sm font-semibold text-fg-default">
                      {b.nome}
                    </span>
                    {/* ⚠️ Agência, conta e chave são fictícias — ver o JSDoc do mock. */}
                    <span className="truncate text-caption-sm text-fg-muted">
                      {comoRecebe(b)}
                    </span>
                  </span>
                  <span className="shrink-0 text-body-sm font-semibold tabular-nums text-fg-default">
                    {percentual(b.percentual)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </FloatingPanelSection>

      <FloatingPanelSection title="Sobre o que este split incide">
        {/* A cascata dita — ver o JSDoc do topo. Sem esta frase, alguém soma os dois
            níveis e conclui que a distribuição passou de 100%. */}
        <div className="flex flex-col gap-gp-lg">
          <p className="text-body-sm text-fg-muted">
            {s.nivel === "local" ? (
              <>
                Corta <strong className="font-semibold text-fg-default">
                  primeiro
                </strong>
                , sobre a receita bruta deste local. O que sobrar ({percentual(
                  Math.max(0, sobra),
                )}) segue para a distribuição de nível empresa.
              </>
            ) : (
              <>
                Corta <strong className="font-semibold text-fg-default">
                  depois
                </strong>{" "}
                dos splits de local, sobre o saldo que sobrou deles. Os{" "}
                {percentual(Math.max(0, sobra))} restantes ficam com a empresa.
              </>
            )}
          </p>

          <div className="flex flex-col">
            <Propriedade
              label="Beneficiários"
              valor={
                <span className="flex items-center justify-end gap-gp-sm">
                  <Users className="size-icon-sm text-fg-subtle" aria-hidden />
                  <span className="tabular-nums">{s.beneficiarios.length}</span>
                </span>
              }
            />
            <Propriedade
              label="Total distribuído"
              valor={
                <span
                  className={`tabular-nums font-semibold ${
                    total > 100 ? "text-fg-danger" : "text-fg-default"
                  }`}
                >
                  {percentual(total)}
                </span>
              }
            />
            <Propriedade
              label={
                s.nivel === "empresa" ? "Restante da empresa" : "Segue adiante"
              }
              valor={
                <span className="tabular-nums">
                  {percentual(Math.max(0, sobra))}
                </span>
              }
            />
          </div>
        </div>
      </FloatingPanelSection>
    </FloatingPanel>
  );
}

/** Reexportados para o JSDoc do painel não precisar repetir os imports. */
export type { Split };
export { Building2, Landmark, MapPin, CalendarDays };
