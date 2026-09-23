import { useRef, useState } from "react";
import {
  Bell,
  Camera,
  Home,
  KeyRound,
  Moon,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import {
  Avatar,
  Button,
  Chip,
  FormField,
  FormFieldInput,
  FormFieldSelect,
  FormFieldTextarea,
  PageHeader,
  useTheme,
  type Theme,
} from "@snksergio/design-system";
import { Input, Switch } from "@snksergio/design-system/shadcn";
import { avisoDeSalvo } from "~/components/feedback";
import { CartaoDeSecao, NavDeEtapas, type Etapa } from "./minha-conta-ui";

/**
 * Minha conta — dados pessoais, endereço, preferências e segurança.
 *
 * ## É EDIÇÃO, não visualização — e isso diverge da referência
 *
 * A origem (`/pt/profile`) mostra uma ficha só de leitura, com dois botões `Editar dados
 * pessoais` e `Editar dados de endereço` que abrem modais. Três cliques pra trocar um
 * telefone, e a informação aparece duas vezes: na ficha e no modal.
 *
 * Aqui a página **já é** o formulário, no padrão `edit-page` do Design System
 * (`?app=edit-page`): nav lateral pegajosa + `SectionCard` por assunto + rodapé de ações.
 * Ninguém precisa pedir permissão pra editar o próprio cadastro, e é o padrão que o DS já
 * resolveu — reusar é o que mantém a consistência que o operador pediu.
 *
 * ## O que veio da referência
 *
 * Os campos, literalmente: `Nome · Email · CPF · Data de Nascimento · Celular · Nome da
 * empresa · Observações` em Pessoal, e `CEP · Endereço · Número · Complemento · Cidade ·
 * Estado · País` em Endereço. Mais `Mudar Foto` e `Alterar senha`, que eram botões soltos.
 *
 * ## O que é acréscimo
 *
 * **Preferências** — idioma e as notificações por e-mail. A referência tem os seletores de
 * `E-mail` e `English` flutuando no canto superior direito, fora de qualquer seção, sem
 * rótulo que diga o que fazem. São preferências da conta; o lugar delas é aqui.
 *
 * ⚠️ Nenhum dado real: o CPF é inválido por construção e o telefone não existe.
 */

const ETAPAS: Etapa[] = [
  {
    id: "pessoal",
    icone: UserRound,
    titulo: "Dados pessoais",
    descricao: "Nome, documento e contato.",
  },
  {
    id: "endereco",
    icone: Home,
    titulo: "Endereço",
    descricao: "Onde você recebe correspondência.",
  },
  {
    id: "preferencias",
    icone: SlidersHorizontal,
    titulo: "Preferências",
    descricao: "Idioma e o que chega no seu e-mail.",
  },
  {
    id: "seguranca",
    icone: KeyRound,
    titulo: "Segurança",
    descricao: "Senha de acesso ao CMS.",
  },
];

const ESTADOS = [
  { value: "MG", label: "Minas Gerais" },
  { value: "SP", label: "São Paulo" },
  { value: "PR", label: "Paraná" },
  { value: "RJ", label: "Rio de Janeiro" },
];

const PAISES = [
  { value: "BR", label: "Brasil" },
  { value: "PT", label: "Portugal" },
];

const IDIOMAS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

/**
 * Avisos por e-mail — os mesmos assuntos de "Configurar alertas", e não por acaso.
 *
 * Lá se define o que o GRUPO recebe; aqui, o que ESTA pessoa quer ver na caixa de entrada.
 * Usar vocabulário diferente nos dois lugares faria parecer que são coisas sem relação.
 */
const AVISOS = [
  {
    id: "alertas",
    titulo: "Alertas de carregador",
    descricao: "Offline, falha e indisponibilidade nos locais que você acessa.",
    ligado: true,
  },
  {
    id: "resumo",
    titulo: "Resumo semanal",
    descricao: "Recargas, receita e disponibilidade da semana, toda segunda.",
    ligado: true,
  },
  {
    id: "repasses",
    titulo: "Repasses",
    descricao: "Quando um repasse é fechado ou pago.",
    ligado: false,
  },
];

/* ⚠️ CPF inválido por construção — falha no dígito verificador de propósito, como em
   todos os documentos deste projeto. Ver `cnpjFicticio()` em Estrutura da rede. */
const DADOS = {
  nome: "Matheus Pego",
  email: "matheus.pego@exemplo.com.br",
  cpf: "000.000.000-00",
  nascimento: "1993-05-24",
  celular: "(31) 90000-0000",
  empresa: "PV MOB",
  observacoes: "",
  cep: "31310-260",
  endereco: "Rua das Palmeiras",
  numero: "45",
  complemento: "",
  cidade: "Belo Horizonte",
  estado: "MG",
  pais: "BR",
};

export function MinhaContaPage() {
  /**
   * ⚠️ O tema é o ÚNICO controle desta tela que age de verdade — o resto é mock.
   *
   * E tem de ser: um switch de tema que não troca o tema é pior que switch nenhum, porque
   * o efeito é visível na mesma tela e a ausência dele se lê como defeito. `useTheme` é o
   * mesmo hook que o botão do header usa, então os dois ficam em sincronia sozinhos —
   * mexer aqui muda o ícone lá, e vice-versa.
   */
  const { theme, setTheme } = useTheme();
  const [etapa, setEtapa] = useState("pessoal");
  const [avisos, setAvisos] = useState(() =>
    Object.fromEntries(AVISOS.map((a) => [a.id, a.ligado])),
  );

  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const irPara = (id: string) => {
    setEtapa(id);
    refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const guardar = (id: string) => (el: HTMLDivElement | null) => {
    refs.current[id] = el;
  };

  return (
    /* `max-lg:pb-pad-4xl` pelo mesmo motivo de `RAIZ_DE_PAGINA` — ver o JSDoc dela. */
    <div className="flex flex-col gap-gp-2xl max-lg:pb-pad-4xl">
      <PageHeader
        title="Minha conta"
        description="Seus dados de cadastro, preferências e senha de acesso."
        badge={
          <Chip color="neutral" variant="soft" size="sm" shape="rounded">
            {DADOS.email}
          </Chip>
        }
      />

      <div className="grid grid-cols-1 items-start gap-gp-4xl pb-pad-6xl lg:grid-cols-[260px_1fr]">
        <NavDeEtapas
          etapas={ETAPAS}
          ativa={etapa}
          onSelecionar={irPara}
          className="lg:sticky lg:top-gp-2xl"
        />

        <div className="flex min-w-0 flex-col gap-gp-4xl">
          <div ref={guardar("pessoal")} className="scroll-mt-gp-2xl">
            <CartaoDeSecao
              titulo="Dados pessoais"
              icone={<UserRound className="size-icon-sm" />}
            >
              <div className="flex flex-col gap-form-gap">
                {/* A foto entra DENTRO da seção de dados pessoais, não centralizada no
                    topo da página como na referência. Lá ela ocupa uma faixa inteira
                    sozinha e empurra todo o resto pra baixo da dobra — e foto de perfil
                    não é o campo mais importante de um cadastro. */}
                <div className="flex items-center gap-gp-xl">
                  <Avatar size="xl" colorHex="#1f9d61" aria-hidden>
                    MP
                  </Avatar>
                  <div className="flex flex-col gap-gp-md">
                    <Button
                      variant="outline"
                      color="secondary"
                      size="sm"
                      iconLeft={<Camera />}
                    >
                      Mudar foto
                    </Button>
                    <span className="text-caption-md text-fg-muted">
                      PNG ou JPG, até 2 MB.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
                  <FormFieldInput
                    label="Nome"
                    required
                    defaultValue={DADOS.nome}
                  />
                  <FormFieldInput
                    label="E-mail"
                    type="email"
                    required
                    defaultValue={DADOS.email}
                    /* O e-mail é a identidade do acesso — trocá-lo é conceder acesso a
                       outra conta, não editar esta. É a mesma regra da tela de
                       Permissões. */
                    disabled
                    helperText="O e-mail identifica o seu acesso e é alterado pelo administrador."
                  />
                </div>

                <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-3">
                  <FormFieldInput
                    label="CPF"
                    defaultValue={DADOS.cpf}
                    inputMode="numeric"
                  />
                  <FormFieldInput
                    label="Data de nascimento"
                    type="date"
                    defaultValue={DADOS.nascimento}
                  />
                  <FormFieldInput
                    label="Celular"
                    type="tel"
                    defaultValue={DADOS.celular}
                  />
                </div>

                <FormFieldInput
                  label="Nome da empresa"
                  defaultValue={DADOS.empresa}
                />

                <FormFieldTextarea
                  label="Observações"
                  rows={3}
                  placeholder="Qualquer informação que ajude quem administra o seu acesso."
                />
              </div>
            </CartaoDeSecao>
          </div>

          <div ref={guardar("endereco")} className="scroll-mt-gp-2xl">
            <CartaoDeSecao
              titulo="Endereço"
              icone={<Home className="size-icon-sm" />}
            >
              <div className="flex flex-col gap-form-gap">
                {/* CEP sozinho na primeira linha, como na referência — é o campo que
                    preenche os outros, e pô-lo ao lado de um deles sugere a ordem
                    contrária. */}
                <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-[200px_1fr]">
                  <FormFieldInput
                    label="CEP"
                    defaultValue={DADOS.cep}
                    inputMode="numeric"
                  />
                  <FormFieldInput
                    label="Endereço"
                    defaultValue={DADOS.endereco}
                  />
                </div>

                <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
                  <FormFieldInput
                    label="Número"
                    defaultValue={DADOS.numero}
                    inputMode="numeric"
                  />
                  <FormFieldInput
                    label="Complemento"
                    placeholder="Apto, bloco, referência"
                  />
                </div>

                <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-3">
                  <FormFieldInput label="Cidade" defaultValue={DADOS.cidade} />
                  <FormFieldSelect
                    label="Estado"
                    options={ESTADOS}
                    defaultValue={DADOS.estado}
                  />
                  <FormFieldSelect
                    label="País"
                    options={PAISES}
                    defaultValue={DADOS.pais}
                  />
                </div>
              </div>
            </CartaoDeSecao>
          </div>

          <div ref={guardar("preferencias")} className="scroll-mt-gp-2xl">
            <CartaoDeSecao
              titulo="Preferências"
              icone={<SlidersHorizontal className="size-icon-sm" />}
            >
              <div className="flex flex-col gap-form-gap">
                <FormFieldSelect
                  label="Idioma da interface"
                  options={IDIOMAS}
                  defaultValue="pt-BR"
                  helperText="Vale só para você — não muda o idioma de quem mais usa o CMS."
                />

                {/* Switch e não um par de radios: são dois estados excludentes e o
                    produto abre escuro por decisão (ver `main.tsx`), então "ligado" tem
                    um significado claro — é o padrão. Um radio group de duas opções
                    pediria duas linhas pra dizer o mesmo, e a linha de switch é o
                    desenho que esta seção já usa logo abaixo.

                    ⚠️ Sem opção "Sistema", pelo mesmo motivo do seletor do header: o
                    produto abre escuro de propósito, e seguir o SO reintroduziria o claro
                    pela porta de trás. */}
                <FormField label="Aparência">
                  {() => (
                    <label
                      htmlFor="tema-escuro"
                      className="flex cursor-pointer items-center justify-between gap-gp-xl rounded-radius-lg border border-border-default px-pad-2xl py-pad-lg transition-colors hover:bg-bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-gp-lg">
                        <span className="grid size-8 shrink-0 place-items-center rounded-radius-md bg-bg-muted text-fg-muted">
                          <Moon className="size-icon-sm" aria-hidden />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="text-body-sm font-medium text-fg-default">
                            Tema escuro
                          </span>
                          <span className="text-caption-md text-fg-muted">
                            Padrão do CMS. Desligue para usar o tema claro.
                          </span>
                        </span>
                      </span>
                      <Switch
                        id="tema-escuro"
                        checked={theme === "dark"}
                        onCheckedChange={(v) =>
                          setTheme((v ? "dark" : "light") as Theme)
                        }
                        aria-label="Tema escuro"
                      />
                    </label>
                  )}
                </FormField>

                <FormField label="Avisos por e-mail">
                  {() => (
                    <div className="flex flex-col gap-gp-md">
                      {AVISOS.map((a) => {
                        const id = `aviso-${a.id}`;
                        return (
                          /* `<label htmlFor>` nativo embrulhando o `Switch` (L-025): a
                             linha inteira vira alvo e o leitor de tela anuncia switch,
                             não button. */
                          <label
                            key={a.id}
                            htmlFor={id}
                            className="flex cursor-pointer items-center justify-between gap-gp-xl rounded-radius-lg border border-border-default px-pad-2xl py-pad-lg transition-colors hover:bg-bg-muted"
                          >
                            <span className="flex min-w-0 flex-col">
                              <span className="text-body-sm font-medium text-fg-default">
                                {a.titulo}
                              </span>
                              <span className="text-caption-md text-fg-muted">
                                {a.descricao}
                              </span>
                            </span>
                            <Switch
                              id={id}
                              checked={avisos[a.id]}
                              onCheckedChange={(v) =>
                                setAvisos((s) => ({ ...s, [a.id]: v }))
                              }
                              aria-label={a.titulo}
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </FormField>

                <p className="flex items-start gap-gp-md rounded-radius-lg bg-bg-subtle p-pad-2xl text-caption-md text-fg-muted">
                  <Bell className="mt-[1px] size-icon-sm shrink-0" aria-hidden />
                  <span>
                    Isto controla o que chega no <strong>seu</strong> e-mail. O
                    que cada grupo de alertas dispara é definido em{" "}
                    <strong className="font-semibold">Configurar alertas</strong>
                    .
                  </span>
                </p>
              </div>
            </CartaoDeSecao>
          </div>

          <div ref={guardar("seguranca")} className="scroll-mt-gp-2xl">
            <CartaoDeSecao
              titulo="Segurança"
              icone={<KeyRound className="size-icon-sm" />}
            >
              <div className="flex flex-col gap-form-gap">
                <FormField
                  label="Senha atual"
                  helperText="Necessária para confirmar qualquer troca de senha."
                >
                  {({ id }) => (
                    <Input id={id} type="password" placeholder="••••••••" />
                  )}
                </FormField>

                <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
                  <FormField label="Nova senha">
                    {({ id }) => (
                      <Input id={id} type="password" placeholder="••••••••" />
                    )}
                  </FormField>
                  <FormField label="Repita a nova senha">
                    {({ id }) => (
                      <Input id={id} type="password" placeholder="••••••••" />
                    )}
                  </FormField>
                </div>

                <span className="text-caption-md text-fg-muted">
                  Use ao menos 8 caracteres, com letras e números.
                </span>
              </div>
            </CartaoDeSecao>
          </div>

          {/* Rodapé de ações — o mesmo do `edit-page`: par ancorado à direita, no fim do
              fluxo e não fixo. Barra fixa aqui roubaria altura das quatro seções sem que
              nenhuma delas exija salvar antes de rolar. */}
          <div className="flex items-center justify-end gap-gp-md">
            <Button variant="outline" color="secondary" size="md">
              Cancelar
            </Button>
            <Button
              variant="filled"
              color="primary"
              size="md"
              onClick={() =>
                avisoDeSalvo({
                  o: "Perfil",
                  detalhe: "Seus dados de cadastro foram atualizados.",
                })
              }
            >
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
