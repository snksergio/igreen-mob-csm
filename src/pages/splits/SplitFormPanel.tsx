import { useEffect, useState } from "react";
import { Info, Plus, Trash2, UserRound } from "lucide-react";
import {
  Avatar,
  Button,
  FloatingPanel,
  FormField,
  FormFieldInput,
  FormFieldSelect,
} from "@snksergio/design-system";
import { Input } from "@snksergio/design-system/shadcn";
import { corDoAvatar, iniciais } from "~/pages/motoristas/motoristas-ui";
import { avisoDeSalvo } from "~/components/feedback";
import { SecaoDeFormulario } from "~/pages/estrutura-rede/estrutura-ui";
import {
  BANCOS,
  CODIGOS_DE_BANCO,
  SPLITS_TEXTOS,
  beneficiarioVazio,
  percentual,
  type Beneficiario,
  type Split,
} from "./splits-mock";
import { BarraDeDistribuicao, ChipDeNivel } from "./splits-ui";

/**
 * Edição de split — em painel, não em outra tela.
 *
 * ## Por que painel
 *
 * Na referência, `Editar` navega para uma rota própria e o caminho de volta é uma setinha
 * `<` no canto. Duas consequências: perde-se a lista de onde se veio (e com ela a
 * comparação entre os splits, que é o motivo de existir uma lista), e o título da tela
 * quebra — ela mostra literalmente **"Splits - undefined"**, porque o nome da empresa não
 * resolve na navegação.
 *
 * Em painel a lista fica ao lado, e o nome vem do registro que abriu o painel.
 *
 * ## Cards, e não linhas de "query builder"
 *
 * A origem empilha linhas de seis inputs na horizontal — `Beneficiário`, `Banco`,
 * `Agência`, `Conta`, `Chave PIX`, `Porcentagem` —, cada uma com uma lixeira no canto. A
 * pedido do operador, aqui cada beneficiário é um **card**:
 *
 * | linha horizontal | card |
 * |---|---|
 * | seis campos disputando a mesma largura; em 1440px cada um fica com ~230px | dois campos em destaque no topo, quatro de banco numa grade abaixo |
 * | o nome, que identifica a linha, tem o mesmo peso do código do banco | nome e percentual são o cabeçalho; o resto é detalhe de pagamento |
 * | com quatro beneficiários é uma grade de 24 inputs sem hierarquia | quatro cards, cada um legível sozinho |
 *
 * ## A conta é validada, e o estouro não bloqueia
 *
 * ⚠️ Acima de 100% o `Salvar` **continua habilitado**. Travar obrigaria a pessoa a
 * reduzir alguém antes de aumentar outro, o que num split de quatro sócios significa
 * editar três campos para corrigir um. O aviso é inline e a barra fica vermelha — o erro
 * é impossível de não ver, e a ordem de edição continua sendo dela.
 *
 * O que **bloqueia** é beneficiário sem nome: um split anônimo não diz para quem o
 * dinheiro vai, e isso não é recuperável depois.
 */

/* ────────────────────────────────────────────────────────────────────────────
   O card de um beneficiário
   ──────────────────────────────────────────────────────────────────────────── */

const OPCOES_DE_BANCO = [
  { value: "", label: "Recebe por PIX" },
  ...CODIGOS_DE_BANCO.map((c) => ({ value: c, label: `${c} · ${BANCOS[c]}` })),
];

function CartaoDeBeneficiario({
  beneficiario: b,
  indice,
  onChange,
  onRemover,
}: {
  beneficiario: Beneficiario;
  indice: number;
  onChange: (b: Beneficiario) => void;
  onRemover: () => void;
}) {
  const campo = <K extends keyof Beneficiario>(chave: K, valor: Beneficiario[K]) =>
    onChange({ ...b, [chave]: valor });

  const porPix = b.banco === "";

  return (
    <section className="flex flex-col gap-gp-2xl rounded-radius-xl border border-border-default bg-bg-surface p-pad-2xl">
      <header className="flex items-start gap-gp-lg">
        {/* O avatar deriva do nome: com quatro cards iguais, a cor é o que distingue um do
            outro antes da leitura. Sem nome ainda, cai num ícone neutro. */}
        {b.nome.trim() ? (
          <Avatar
            size="md"
            colorHex={corDoAvatar(b.nome)}
            className="shrink-0"
            aria-hidden
          >
            {iniciais(b.nome)}
          </Avatar>
        ) : (
          <span className="grid size-form-lg shrink-0 place-items-center rounded-radius-full bg-bg-muted text-fg-subtle">
            <UserRound className="size-icon-sm" aria-hidden />
          </span>
        )}

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-semibold text-fg-default">
            {b.nome.trim() || `Beneficiário ${indice + 1}`}
          </span>
          <span className="text-caption-md tabular-nums text-fg-muted">
            {percentual(b.percentual)} da receita
          </span>
        </span>

        {/* `critical` e ícone só: com quatro cards, quatro botões "Remover" escritos
            competiriam com os campos. O `aria-label` carrega o nome. */}
        <Button
          variant="ghost"
          color="critical"
          size="icon-sm"
          className="shrink-0"
          aria-label={`Remover ${b.nome.trim() || `beneficiário ${indice + 1}`}`}
          onClick={onRemover}
        >
          <Trash2 />
        </Button>
      </header>

      {/* Nome e percentual no topo, em destaque: são os dois campos obrigatórios e os
          únicos que mudam o significado do split. O resto é como o dinheiro sai. */}
      <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-[1fr_160px]">
        <FormFieldInput
          label="Beneficiário"
          required
          placeholder="Nome de quem recebe"
          value={b.nome}
          onChange={(e) => campo("nome", e.target.value)}
        />
        <FormField label="Porcentagem" required>
          {({ id }) => (
            <Input
              id={id}
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.01}
              placeholder="0,00"
              className="tabular-nums"
              value={b.percentual === 0 ? "" : String(b.percentual)}
              onChange={(e) =>
                /* `Number("")` é 0, e é o que se quer: campo limpo = fatia zero. O
                   `Math.max(0, …)` impede negativo colado do teclado. */
                campo("percentual", Math.max(0, Number(e.target.value) || 0))
              }
            />
          )}
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
        <FormFieldSelect
          label="Banco"
          options={OPCOES_DE_BANCO}
          value={b.banco}
          onValueChange={(v) => campo("banco", v)}
          helperText={
            porPix ? "Sem banco, o repasse sai pela chave PIX." : undefined
          }
        />
        {/* A chave PIX só aparece quando não há banco, e vice-versa. A referência mostra
            os cinco campos sempre, e aí não se sabe quais valem: quem preencheu conta E
            chave não descobre por qual dos dois o dinheiro vai sair. */}
        {porPix ? (
          <FormFieldInput
            label="Chave PIX"
            placeholder="E-mail, telefone, CNPJ ou aleatória"
            value={b.chavePix}
            onChange={(e) => campo("chavePix", e.target.value)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
            <FormFieldInput
              label="Agência"
              placeholder="0001"
              inputMode="numeric"
              value={b.agencia}
              onChange={(e) => campo("agencia", e.target.value)}
            />
            <FormFieldInput
              label="Conta"
              placeholder="00000-0"
              inputMode="numeric"
              value={b.conta}
              onChange={(e) => campo("conta", e.target.value)}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   O painel
   ──────────────────────────────────────────────────────────────────────────── */

export function SplitFormPanel({
  split,
  aberto,
  onClose,
}: {
  split: Split | null;
  aberto: boolean;
  onClose: () => void;
}) {
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([]);

  /* Recarrega ao abrir, e a partir do registro — sem isto, editar A, fechar e abrir B
     mostraria os beneficiários de A. */
  useEffect(() => {
    if (!aberto || !split) return;
    setBeneficiarios(split.beneficiarios.map((b) => ({ ...b })));
  }, [aberto, split]);

  if (!split) return null;

  /* O split em edição, para a barra e os totais lerem o estado ATUAL e não o salvo. */
  const emEdicao: Split = { ...split, beneficiarios };

  const semNome = beneficiarios.some((b) => !b.nome.trim());

  const salvar = () => {
    avisoDeSalvo({
      o: "Split",
      detalhe: `${beneficiarios.length} ${
        beneficiarios.length === 1 ? "beneficiário" : "beneficiários"
      } · ${percentual(
        beneficiarios.reduce((a, b) => a + b.percentual, 0),
      )} distribuídos.`,
    });
    onClose();
  };

  return (
    <FloatingPanel
      open={aberto}
      onOpenChange={(v) => !v && onClose()}
      side="right"
      /* 920: o card do beneficiário tem duas colunas de campo e, abaixo de ~880, a grade
         de banco/agência/conta cai para uma coluna e o card triplica de altura. */
      size={920}
      resizable
      maximizable
      resizableStorageKey="splits.form-panel.width"
      bodyPadded={false}
      titleSlot={
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-md font-semibold text-fg-default">
            {split.local ?? split.empresa}
          </span>
          <span className="mt-[2px] flex items-center gap-gp-sm text-body-xs font-normal text-fg-muted">
            <ChipDeNivel nivel={split.nivel} />
            <span className="truncate">Distribuição de receita</span>
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            /* Estouro NÃO bloqueia — ver o JSDoc. Nome em branco bloqueia. */
            disabled={semNome}
            onClick={salvar}
          >
            {SPLITS_TEXTOS.salvar}
          </Button>
        </>
      }
    >
      <SecaoDeFormulario
        titulo="Como a receita é dividida"
        descricao={
          split.nivel === "empresa"
            ? SPLITS_TEXTOS.ajudaDaEmpresa
            : SPLITS_TEXTOS.ajudaDoLocal
        }
      >
        <BarraDeDistribuicao split={emEdicao} />

        {semNome && (
          <p className="text-caption-md text-fg-danger">
            Há beneficiário sem nome. Um split anônimo não diz para quem o
            dinheiro vai.
          </p>
        )}
      </SecaoDeFormulario>

      <SecaoDeFormulario
        titulo="Beneficiários"
        descricao={`${beneficiarios.length} de quem recebe parte desta receita.`}
        ultima
      >
        {beneficiarios.length === 0 ? (
          <p className="flex items-start gap-gp-md rounded-radius-lg bg-bg-subtle p-pad-2xl text-body-sm text-fg-muted">
            <Info className="mt-[2px] size-icon-sm shrink-0" aria-hidden />
            {SPLITS_TEXTOS.vazio}
          </p>
        ) : (
          <div className="flex flex-col gap-gp-2xl">
            {beneficiarios.map((b, i) => (
              <CartaoDeBeneficiario
                key={b.id}
                beneficiario={b}
                indice={i}
                onChange={(atualizado) =>
                  setBeneficiarios((atual) =>
                    atual.map((x) => (x.id === b.id ? atualizado : x)),
                  )
                }
                onRemover={() =>
                  setBeneficiarios((atual) => atual.filter((x) => x.id !== b.id))
                }
              />
            ))}
          </div>
        )}

        {/* O botão fica ABAIXO da pilha, não no cabeçalho como na referência: ele empilha
            um card no fim, e um controle longe do efeito faz a pessoa procurar o que
            mudou. Largura própria (`w-fit`) pra não virar uma faixa de 900px. */}
        <Button
          variant="outline"
          color="secondary"
          size="md"
          iconLeft={<Plus />}
          className="w-fit"
          onClick={() =>
            setBeneficiarios((atual) => [
              ...atual,
              beneficiarioVazio(atual.length),
            ])
          }
        >
          {SPLITS_TEXTOS.adicionar}
        </Button>
      </SecaoDeFormulario>
    </FloatingPanel>
  );
}
