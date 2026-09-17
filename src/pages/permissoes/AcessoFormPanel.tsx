import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import {
  Button,
  CardOption,
  CardOptionGroup,
  Chip,
  FloatingPanel,
  FormField,
  FormFieldInput,
  FormFieldSelect,
} from "@snksergio/design-system";
import {
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@snksergio/design-system/shadcn";
import { LinkDeAcao } from "~/components/LinkDeAcao";
import { SecaoDeFormulario } from "~/pages/estrutura-rede/estrutura-ui";
import {
  LOCAIS_DISPONIVEIS,
  PERFIL,
  PERFIS,
  PERMISSOES_TEXTOS,
  type Acesso,
  type PerfilId,
} from "./permissoes-mock";
import { avisoDeCriado, avisoDeSalvo } from "~/components/feedback";
import { ChipDePerfil } from "./permissoes-ui";

/**
 * Formulário de acesso — conceder e editar.
 *
 * ## O que o modal da referência fazia e por que isto é diferente
 *
 * Ele repetia o banner de legenda (o mesmo do topo da lista), mostrava o e-mail desabilitado
 * e listava os 17 locais com um `Selecionar perfil` vazio em cada linha. O defeito não é
 * estético: **o perfil só existe dentro da linha**, então conceder "Colaborador em tudo"
 * custava 17 escolhas idênticas, e a legenda que explicava o que é Colaborador ficava
 * 700px acima, fora de vista assim que a lista rolava.
 *
 * Aqui a ordem é a da decisão real, que tem dois passos e não um:
 *
 * | passo | pergunta |
 * |---|---|
 * | **Perfil de acesso** | que papel essa pessoa tem, em geral? |
 * | **Onde vale** | e onde isso se aplica — com exceção, se houver |
 *
 * O primeiro passo usa `CardOption type="radio"`, e é ele que **substitui a legenda**: a
 * descrição de cada perfil fica dentro do card que o escolhe. Ninguém precisa lembrar o que
 * é "Parceiro" — está escrito no lugar onde se marca Parceiro. A exceção por local continua
 * possível, porque ela é real; só deixou de ser o único caminho.
 */

const VAZIO = { email: "", empresa: "PV MOB" };

/** Perfil aplicado a um local recém-marcado quando nenhum outro foi escolhido. */
const PERFIL_INICIAL: PerfilId = "colaborador";

/* ────────────────────────────────────────────────────────────────────────────
   O seletor de locais com perfil por linha
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Como o `SeletorDeLocais` de Cupons, mais uma coluna: o perfil daquele local.
 *
 * ⚠️ Não dá pra reaproveitar o de Cupons. Lá um local está dentro ou fora — booleano. Aqui
 * ele carrega um valor, e enfiar um `Select` num seletor booleano por prop opcional
 * produziria um componente com dois modos e nenhum deles claro. São listas parecidas com
 * contratos diferentes.
 *
 * O `Select` fica **desabilitado** enquanto o local não está marcado, em vez de sumir: a
 * coluna some junto e a lista dança a cada clique. Desabilitado mantém o layout e ainda
 * informa que a escolha existe assim que marcar.
 */
function SeletorDeLocaisComPerfil({
  valor,
  onChange,
  perfilPadrao,
}: {
  valor: Record<string, PerfilId>;
  onChange: (v: Record<string, PerfilId>) => void;
  perfilPadrao: PerfilId;
}) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(
    () =>
      LOCAIS_DISPONIVEIS.filter((l) =>
        l.toLowerCase().includes(busca.trim().toLowerCase()),
      ),
    [busca],
  );

  const marcados = Object.keys(valor);
  const todosFiltradosMarcados =
    filtrados.length > 0 && filtrados.every((l) => l in valor);

  const alternar = (local: string) => {
    const proximo = { ...valor };
    if (local in proximo) delete proximo[local];
    else proximo[local] = perfilPadrao;
    onChange(proximo);
  };

  const trocarPerfil = (local: string, perfil: PerfilId) =>
    onChange({ ...valor, [local]: perfil });

  const alternarTodos = () => {
    if (todosFiltradosMarcados) {
      const proximo = { ...valor };
      filtrados.forEach((l) => delete proximo[l]);
      onChange(proximo);
    } else {
      const proximo = { ...valor };
      filtrados.forEach((l) => {
        if (!(l in proximo)) proximo[l] = perfilPadrao;
      });
      onChange(proximo);
    }
  };

  /* Aplica o perfil escolhido acima a TUDO que já está marcado — o atalho que torna
     "Colaborador em tudo" uma escolha e não dezessete. */
  const uniformizar = () =>
    onChange(Object.fromEntries(marcados.map((l) => [l, perfilPadrao])));

  const jaUniforme =
    marcados.length > 0 && marcados.every((l) => valor[l] === perfilPadrao);

  return (
    <div className="flex flex-col gap-gp-md">
      <div className="flex flex-wrap items-center justify-between gap-gp-md">
        <span className="flex items-center gap-gp-sm text-body-sm font-semibold text-fg-default">
          Locais
          <Chip
            color={marcados.length === 0 ? "danger" : "primary"}
            variant="soft"
            size="sm"
          >
            {marcados.length} de {LOCAIS_DISPONIVEIS.length}
          </Chip>
        </span>
        <span className="flex items-center gap-gp-xl">
          {!jaUniforme && marcados.length > 0 && (
            <LinkDeAcao onClick={uniformizar}>
              Aplicar {PERFIL[perfilPadrao].nome} a todos
            </LinkDeAcao>
          )}
          <LinkDeAcao onClick={alternarTodos} disabled={filtrados.length === 0}>
            {todosFiltradosMarcados
              ? "Desmarcar"
              : busca
                ? `Marcar os ${filtrados.length}`
                : "Marcar todos"}
          </LinkDeAcao>
        </span>
      </div>

      <div className="flex min-h-form-lg items-center gap-gp-sm rounded-radius-lg border border-border-input bg-bg-surface px-pad-lg transition-[border-color,box-shadow] focus-within:border-border-brand focus-within:shadow-sh-ring">
        <Search className="size-icon-sm shrink-0 text-fg-subtle" aria-hidden />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar local"
          aria-label="Buscar local"
          className="min-w-0 flex-1 bg-transparent text-body-sm text-fg-default outline-none placeholder:text-fg-subtle"
        />
      </div>

      <div className="max-h-[320px] overflow-y-auto rounded-radius-lg border border-border-default bg-bg-surface p-pad-md scrollbar-thin">
        {filtrados.length === 0 ? (
          <p className="py-pad-2xl text-center text-body-sm text-fg-muted">
            Nenhum local encontrado.
          </p>
        ) : (
          /* ⚠️ `gap-gp-xs` (4px) e não `flex-col` seco.

             Sem gap, as 17 linhas ficavam encostadas — e o que encosta não é o texto, são
             os `SelectTrigger`, que têm 40px de altura e borda visível: dois deles colados
             leem como um controle partido ao meio.

             4px porque o pedido era "no mínimo 2px, sem separar muito": a 2px a borda de
             um select ainda quase toca a do vizinho, e acima de 8px a lista de 17 itens
             cresce ~136px e o scroll interno perde metade do que mostrava.

             📋 **Lacuna do DS**: `SelectTrigger` crava `min-h-form-lg` e não expõe `size`
             (`shadcn/select.tsx:24`). A saída natural — um select menor em linha densa —
             não existe, e sobrescrever `min-h-form-*` por `className` é a armadilha da
             L-072: com prefixo DS o `tailwind-merge` não reconhece o conflito, as duas
             classes sobrevivem e a ordem do CSS decide. */
          <ul className="flex flex-col gap-gp-xs">
            {filtrados.map((local) => {
              const id = `perm-local-${local.replace(/\W+/g, "-")}`;
              const marcado = local in valor;
              return (
                <li
                  key={local}
                  className="flex items-center gap-gp-md rounded-radius-sm pr-pad-md transition-colors hover:bg-bg-muted"
                >
                  {/* `<label htmlFor>` nativo cobre só o nome, não a linha inteira: o
                      `Select` mora na mesma linha, e um label que o embrulhasse roubaria o
                      clique dele pro checkbox (L-025 vale pro alvo certo, não pro maior). */}
                  <label
                    htmlFor={id}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-gp-md px-pad-lg py-pad-md text-body-sm text-fg-default"
                  >
                    <Checkbox
                      id={id}
                      checked={marcado}
                      onCheckedChange={() => alternar(local)}
                    />
                    <span className="min-w-0 flex-1 truncate">{local}</span>
                  </label>
                  <SeletorDePerfilDaLinha
                    local={local}
                    valor={marcado ? valor[local] : undefined}
                    onChange={(p) => trocarPerfil(local, p)}
                    desabilitado={!marcado}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {marcados.length === 0 && (
        <span className="text-caption-md text-fg-danger">
          Sem nenhum local marcado, o acesso não vale em lugar nenhum.
        </span>
      )}
    </div>
  );
}

/**
 * O select de perfil de uma linha.
 *
 * ⚠️ `Select` cru do shadcn, não `FormFieldSelect`: o `hideLabel` existe no `FormField`
 * genérico mas **não desce** pros especializados (lacuna do DS já anotada em Estrutura da
 * rede), e aqui um rótulo visível seria repetição — a linha já se identifica pelo nome do
 * local. O `aria-label` mantém o leitor de tela informado.
 */
function SeletorDePerfilDaLinha({
  local,
  valor,
  onChange,
  desabilitado,
}: {
  local: string;
  valor: PerfilId | undefined;
  onChange: (p: PerfilId) => void;
  desabilitado: boolean;
}) {
  return (
    <Select
      value={valor ?? ""}
      onValueChange={(v) => onChange(v as PerfilId)}
      disabled={desabilitado}
    >
      <SelectTrigger
        aria-label={`Perfil em ${local}`}
        className="w-[168px] shrink-0"
      >
        <SelectValue placeholder="Selecionar perfil" />
      </SelectTrigger>
      <SelectContent>
        {PERFIS.map((p) => (
          <SelectItem key={p} value={p}>
            {PERFIL[p].nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   O painel
   ──────────────────────────────────────────────────────────────────────────── */

export function AcessoFormPanel({
  aberto,
  acesso,
  onClose,
}: {
  aberto: boolean;
  /** `null` = conceder. Preenchido = editar. */
  acesso: Acesso | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState(VAZIO);
  const [perfil, setPerfil] = useState<PerfilId>(PERFIL_INICIAL);
  const [porLocal, setPorLocal] = useState<Record<string, PerfilId>>({});

  useEffect(() => {
    if (!aberto) return;
    setForm(
      acesso ? { email: acesso.email, empresa: acesso.empresa } : VAZIO,
    );
    setPorLocal(acesso ? { ...acesso.porLocal } : {});
    /* Ao editar, o radio abre no perfil que a pessoa mais usa — não num default fixo. Abrir
       em "Colaborador" um acesso que é todo Técnico convidaria a uniformizar por engano. */
    setPerfil(
      acesso
        ? (PERFIS.find((p) =>
            Object.values(acesso.porLocal).includes(p),
          ) ?? PERFIL_INICIAL)
        : PERFIL_INICIAL,
    );
  }, [aberto, acesso]);

  const marcados = Object.keys(porLocal);
  const perfisEmUso = PERFIS.filter((p) =>
    Object.values(porLocal).includes(p),
  );

  return (
    <FloatingPanel
      open={aberto}
      onOpenChange={(v) => !v && onClose()}
      side="right"
      /* 980: a linha do seletor é nome-do-local + select de 168px, e o nome mais longo
         ("Supermercado Pejoal Super Varejista") já ocupa ~330px. Em 880 ele truncava. */
      size={980}
      resizable
      maximizable
      resizableStorageKey="permissoes.form-panel.width"
      bodyPadded={false}
      title={acesso ? "Editar acesso" : PERMISSOES_TEXTOS.conceder}
      description={
        acesso ? acesso.email : "Quem entra, com qual perfil e em quais locais"
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
            disabled={marcados.length === 0}
            onClick={() => {
              const quantos = `${marcados.length} ${marcados.length === 1 ? "local" : "locais"}`;
              if (acesso) {
                avisoDeSalvo({ o: "Acesso", detalhe: `${acesso.email} · ${quantos}.` });
              } else {
                avisoDeCriado({
                  o: "Acesso",
                  detalhe: `${form.email || "Convite enviado"} · ${quantos}.`,
                });
              }
              onClose();
            }}
          >
            {acesso ? "Salvar" : "Conceder acesso"}
          </Button>
        </>
      }
    >
      <SecaoDeFormulario titulo="Usuário">
        <FormFieldInput
          label="E-mail do usuário"
          required
          type="email"
          placeholder="nome@empresa.com.br"
          helperText={PERMISSOES_TEXTOS.ajudaDoEmail}
          /* Ao editar, o e-mail é a identidade do registro — trocá-lo seria conceder acesso
             a outra pessoa, não editar esta. A referência também o bloqueia. */
          disabled={!!acesso}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <FormFieldSelect
          label="Empresa"
          options={[{ value: "PV MOB", label: "PV MOB" }]}
          value={form.empresa}
          onValueChange={(v) => setForm((f) => ({ ...f, empresa: v }))}
        />
      </SecaoDeFormulario>

      <SecaoDeFormulario
        titulo="Perfil de acesso"
        descricao={PERMISSOES_TEXTOS.ajudaDoPerfil}
      >
        {/* ⚠️ Esta lista É a legenda da referência. `CardOption type="radio"` põe a
            descrição de cada perfil dentro do card que o escolhe, e o banner de quatro
            parágrafos deixa de ter função: ninguém precisa decorar o que é "Parceiro" se
            está escrito onde se marca Parceiro.

            `layout="list"` porque são cinco opções mutuamente exclusivas lidas de cima pra
            baixo — cards soltos dariam a cada uma o peso de um cartão de produto. */}
        <CardOptionGroup
          type="radio"
          layout="list"
          size="md"
          name="perfil-de-acesso"
          value={perfil}
          onValueChange={(v) => setPerfil(v as PerfilId)}
        >
          {PERFIS.map((p) => (
            <CardOption
              key={p}
              value={p}
              /* O rótulo é o PRÓPRIO chip, não "nome + chip": a 1ª versão escrevia
                 "Administrador" e logo ao lado um chip escrito "Administrador". A palavra
                 repetida não acrescentava nada, e o chip sozinho ainda ensina o par
                 cor↔perfil que a tabela usa — que é a razão de ele estar aqui. */
              label={<ChipDePerfil perfil={p} size="md" />}
              description={PERFIL[p].descricao}
            />
          ))}
        </CardOptionGroup>

        <p className="flex items-start gap-gp-md text-caption-md text-fg-muted">
          <ShieldCheck className="mt-[1px] size-icon-sm shrink-0" aria-hidden />
          <span>
            Este perfil é aplicado aos locais que você marcar a seguir. Locais já
            marcados mantêm o perfil atual até você usar{" "}
            <strong className="font-semibold">
              Aplicar {PERFIL[perfil].nome} a todos
            </strong>
            .
          </span>
        </p>
      </SecaoDeFormulario>

      <SecaoDeFormulario
        titulo="Onde vale"
        descricao={PERMISSOES_TEXTOS.ajudaDosLocais}
        ultima
      >
        <FormField label="Locais e perfis" hideLabel>
          {() => (
            <SeletorDeLocaisComPerfil
              valor={porLocal}
              onChange={setPorLocal}
              perfilPadrao={perfil}
            />
          )}
        </FormField>

        {/* Resumo do que será salvo. Com 17 linhas e um select em cada, a pessoa perde a
            conta do que compôs — e essa é justamente a informação que a lista da tela vai
            mostrar depois. Mostrá-la antes de salvar fecha o ciclo. */}
        {marcados.length > 0 && (
          <div className="flex flex-wrap items-center gap-gp-md rounded-radius-lg bg-bg-subtle p-pad-2xl">
            <span className="text-caption-md text-fg-muted">
              Vai ficar assim:
            </span>
            {perfisEmUso.map((p) => (
              <span key={p} className="flex items-center gap-gp-sm">
                <ChipDePerfil perfil={p} />
                <span className="text-caption-md tabular-nums text-fg-muted">
                  ×{" "}
                  {
                    marcados.filter((l) => porLocal[l] === p).length
                  }
                </span>
              </span>
            ))}
          </div>
        )}
      </SecaoDeFormulario>
    </FloatingPanel>
  );
}
