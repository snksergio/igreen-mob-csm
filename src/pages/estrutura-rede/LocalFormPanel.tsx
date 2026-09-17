import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Chip,
  FileUploadField,
  FloatingPanel,
  FormField,
  FormFieldInput,
  FormFieldSelect,
  FormFieldTextarea,
} from "@snksergio/design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@snksergio/design-system/shadcn";
import { CampoDeTags } from "~/components/CampoDeTags";
import { MapaDosLocais } from "~/pages/monitoramento/MapaDosLocais";
import {
  GEO_DOS_LOCAIS,
  type LocalNoMapa,
} from "~/pages/monitoramento/monitoramento-mock";
import {
  BANCOS,
  CORES_DE_FUNDO,
  DIAS_DA_SEMANA,
  ESTACIONAMENTO,
  ESTRUTURA_TEXTOS,
  PERFIS_DE_PRECO,
  REGIMES_DE_HORARIO,
  TIPOS_DE_CONTA,
  TIPOS_DE_LOCAL,
  TIPOS_DE_NEGOCIO,
  type NoDaRede,
} from "./estrutura-mock";
import { SecaoDeFormulario } from "./estrutura-ui";

/**
 * Formulário de local — o maior da aplicação, e todo aberto.
 *
 * ## Por que aberto, com trinta e poucos campos
 *
 * Decisão do operador (2026-09-16), e ela resiste ao argumento contrário. A aba parece
 * resolver o tamanho, e só o esconde: num CADASTRO, quem preenche precisa saber o que
 * falta antes de clicar em Salvar, e o erro de validação de uma aba fechada é invisível.
 * Aba serve pra consultar recortes de algo pronto.
 *
 * O que torna o tamanho administrável são as **oito seções** com heading e divisória. A
 * ordem delas é a da referência, e não é arbitrária — vai do que identifica pro que
 * detalha: status → endereço → negócio → horário → identidade → responsável → banco →
 * preço.
 *
 * ## Os campos são os da referência — nem um a mais
 *
 * ⚠️ A primeira versão inventou **Latitude** e **Longitude** e não existem na origem. Saíram.
 * No lugar veio o que ela realmente tem: o **mapa** de geolocalização, e os dois carimbos
 * de `Data de Criação` / `Última atualização`.
 *
 * O mapa é o MESMO `MapaDosLocais` da tela de Monitoramento, com a prop `altura`.
 * Reaproveitar em vez de escrever um segundo mapa é o que garante que o pin daqui caia no
 * mesmo lugar que o de lá — dois mapas com duas projeções divergiriam em silêncio, e a
 * divergência só apareceria como "o pin está no estado errado".
 *
 * ⚠️ Ele é de **leitura**, não de arrastar. A imagem de fundo é estática: um pin arrastável
 * sobre ela aceitaria o gesto e não teria onde guardar o resultado. Quando houver mapa
 * interativo, é aqui que ele entra, com a mesma caixa.
 *
 * ## Upload é upload
 *
 * Logo e imagem do local usam o `FileUploadField` do DS: abre o seletor de arquivo de
 * verdade, valida tipo e tamanho e mostra a miniatura. A versão anterior era um `Button`
 * que não abria nada — um controle que promete e não cumpre.
 */

const VAZIO = {
  ativo: true,
  listado: true,
  nome: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  cidade: "",
  estado: "",
  pais: "Brasil",
  razaoSocial: "",
  cnpj: "",
  tipoDeNegocio: TIPOS_DE_NEGOCIO[0],
  tipoDeLocal: TIPOS_DE_LOCAL[0],
  estacionamento: ESTACIONAMENTO[0],
  observacoes: "",
  corDeFundo: "",
  responsavel: "",
  cpf: "",
  email: "",
  telefone: "",
  pix: "",
  banco: "",
  agencia: "",
  conta: "",
  tipoDeConta: "",
  perfil: PERFIS_DE_PRECO[0],
};

/** Horário por dia. Começa 24h aberto, que é o default da referência (00:00–23:59). */
type Horario = { regime: string; abre: string; fecha: string };
const HORARIO_PADRAO: Horario = {
  regime: REGIMES_DE_HORARIO[0],
  abre: "00:00",
  fecha: "23:59",
};

/** Meias-horas do dia — as opções dos dois selects de hora. */
const HORAS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
}).concat("23:59");

/** Select sem rótulo visível — a linha do horário já se identifica pelo dia. */
function SeletorSimples({
  rotulo,
  valor,
  onChange,
  opcoes,
  largura = "w-full",
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  opcoes: string[];
  largura?: string;
}) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger aria-label={rotulo} className={largura}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LocalFormPanel({
  aberto,
  local,
  empresa,
  onClose,
}: {
  aberto: boolean;
  /** `null` = criar. Preenchido = editar. */
  local: NoDaRede | null;
  /** A empresa dona — aparece no subtítulo, pra não criar local órfão por engano. */
  empresa: NoDaRede | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState(VAZIO);
  const [pontos, setPontos] = useState<string[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [imagem, setImagem] = useState<File | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>(
    DIAS_DA_SEMANA.map(() => HORARIO_PADRAO),
  );

  useEffect(() => {
    if (!aberto) return;
    setForm(
      local
        ? {
            ...VAZIO,
            ativo: local.ativo,
            nome: local.nome,
            endereco: local.endereco,
            cidade: local.cidade ?? "",
            estado: local.uf ?? "",
            cnpj: local.cnpj,
            responsavel: local.responsavel,
            email: local.email,
          }
        : VAZIO,
    );
    setPontos([]);
    setLogo(null);
    setImagem(null);
    setHorarios(DIAS_DA_SEMANA.map(() => HORARIO_PADRAO));
  }, [aberto, local]);

  /**
   * O que o mapa mostra.
   *
   * Editando um local conhecido, o pin dele. Criando, mapa vazio — porque não há
   * coordenada ainda, e inventar um pin no centro do Brasil afirmaria uma localização que
   * ninguém informou.
   */
  const noMapa = useMemo<LocalNoMapa[]>(() => {
    const geo = local ? GEO_DOS_LOCAIS[local.nome] : undefined;
    if (!local || !geo) return [];
    return [
      {
        ...geo,
        local: local.nome,
        plugues: 0,
        pior: "disponivel",
        potenciaKw: 0,
      },
    ];
  }, [local]);

  const campo = (k: keyof typeof VAZIO) => ({
    value: String(form[k]),
    onChange: (ev: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [k]: ev.target.value })),
  });

  const seleto = (k: keyof typeof VAZIO) => ({
    value: String(form[k]),
    onValueChange: (v: string) => setForm((f) => ({ ...f, [k]: v })),
  });

  const mudarHorario = (i: number, parte: Partial<Horario>) =>
    setHorarios((hs) => hs.map((h, j) => (j === i ? { ...h, ...parte } : h)));

  return (
    <FloatingPanel
      open={aberto}
      onOpenChange={(v) => !v && onClose()}
      side="right"
      /* **1240px, número e não preset.** A escala do `FloatingPanel` para em `xl` (720),
         e o operador precisou alargar o painel na mão a 1040 (2026-09-16) — sinal de que o
         default estava curto. São oito seções, mais de trinta campos, grids de três colunas
         e um mapa: quanto mais largo, menos quebra. `size` aceita número justamente pra
         isto, e `resizable` deixa quem quiser encolher. */
      size={1240}
      resizable
      maximizable
      resizableStorageKey="estrutura.local-form.width"
      bodyPadded={false}
      title={local ? "Editar local" : "Adicionar novo local"}
      description={
        empresa
          ? `${empresa.nome} · informações do local e do responsável`
          : "Informações do local e do responsável"
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="filled" color="primary" size="sm" onClick={onClose}>
            Salvar
          </Button>
        </>
      }
    >
      {/* ── 1. Status ─────────────────────────────────────────────────── */}
      <SecaoDeFormulario
        titulo="Status do local"
        descricao="Um local inativo some do app do motorista; um local não listado continua funcionando, mas não aparece na busca."
      >
        {/* Os dois switches lado a lado, com o rótulo à esquerda: é decisão binária, e
            empilhados em duas linhas de formulário pareceriam dois campos a preencher. */}
        <div className="grid grid-cols-2 gap-form-gap">
          <label className="flex min-h-form-lg cursor-pointer items-center justify-between gap-gp-md rounded-radius-lg border border-border-default px-pad-2xl">
            <span className="text-body-sm font-semibold text-fg-default">
              Local ativo
            </span>
            <span className="flex items-center gap-gp-md">
              <Chip
                color={form.ativo ? "success" : "neutral"}
                variant="soft"
                size="sm"
                shape="pill"
              >
                {form.ativo ? "Ativo" : "Inativo"}
              </Chip>
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
                aria-label="Local ativo"
              />
            </span>
          </label>

          <label className="flex min-h-form-lg cursor-pointer items-center justify-between gap-gp-md rounded-radius-lg border border-border-default px-pad-2xl">
            <span className="text-body-sm font-semibold text-fg-default">
              Listado na busca
            </span>
            <span className="flex items-center gap-gp-md">
              <Chip
                color={form.listado ? "success" : "neutral"}
                variant="soft"
                size="sm"
                shape="pill"
              >
                {form.listado ? "Sim" : "Não"}
              </Chip>
              <Switch
                checked={form.listado}
                onCheckedChange={(v) => setForm((f) => ({ ...f, listado: v }))}
                aria-label="Listado na busca"
              />
            </span>
          </label>
        </div>

        {/* Os dois carimbos da referência. Read-only e "—" quando é criação: eles são
            registro do sistema, não campo — e um input editável de "Data de Criação"
            convidaria a mentir sobre quando o cadastro nasceu. */}
        <div className="grid grid-cols-2 gap-form-gap">
          <div className="flex items-center justify-between gap-gp-md text-body-sm">
            <span className="text-fg-muted">Data de criação</span>
            <span className="tabular-nums text-fg-default">
              {local ? "16/09/2026 09:12" : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-gp-md text-body-sm">
            <span className="text-fg-muted">Última atualização</span>
            <span className="tabular-nums text-fg-default">
              {local ? "16/09/2026 18:43" : "—"}
            </span>
          </div>
        </div>
      </SecaoDeFormulario>

      {/* ── 2. Endereço ───────────────────────────────────────────────── */}
      <SecaoDeFormulario titulo="Informações do local">
        <div className="grid grid-cols-[1fr_180px] gap-form-gap">
          <FormFieldInput
            label="Nome do local"
            required
            placeholder="Como o local é chamado"
            {...campo("nome")}
          />
          <FormFieldInput
            label="CEP"
            placeholder="00000-000"
            className="[&_input]:tabular-nums"
            {...campo("cep")}
          />
        </div>

        <div className="grid grid-cols-[1fr_140px_1fr] gap-form-gap">
          <FormFieldInput label="Endereço" placeholder="Digite o endereço" {...campo("endereco")} />
          <FormFieldInput label="Número" placeholder="Nº" {...campo("numero")} />
          <FormFieldInput
            label="Complemento"
            placeholder="Bloco, andar, referência"
            {...campo("complemento")}
          />
        </div>

        <div className="grid grid-cols-[1fr_180px_180px] gap-form-gap">
          <FormFieldInput label="Cidade" placeholder="Digite a cidade" {...campo("cidade")} />
          <FormFieldInput label="Estado" placeholder="UF" {...campo("estado")} />
          <FormFieldInput label="País" placeholder="País" {...campo("pais")} />
        </div>

        {/* O MESMO mapa do Monitoramento — ver o JSDoc do topo. */}
        <FormField
          label="Geolocalização"
          helperText={
            noMapa.length > 0
              ? "Posição atual do local. Para mover, atualize o endereço acima."
              : "O pin aparece depois que o endereço for preenchido e salvo."
          }
        >
          {() => <MapaDosLocais locais={noMapa} altura={260} />}
        </FormField>
      </SecaoDeFormulario>

      {/* ── 3. Negócio ────────────────────────────────────────────────── */}
      <SecaoDeFormulario titulo="Dados do negócio">
        <div className="grid grid-cols-[1fr_220px] gap-form-gap">
          <FormFieldInput
            label="Razão Social"
            placeholder="Deixe em branco para herdar da empresa"
            {...campo("razaoSocial")}
          />
          <FormFieldInput
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            className="[&_input]:tabular-nums"
            {...campo("cnpj")}
          />
        </div>

        <div className="grid grid-cols-3 gap-form-gap">
          <FormFieldSelect
            label="Tipo de negócio"
            options={TIPOS_DE_NEGOCIO.map((t) => ({ value: t, label: t }))}
            {...seleto("tipoDeNegocio")}
          />
          <FormFieldSelect
            label="Tipo de local"
            options={TIPOS_DE_LOCAL.map((t) => ({ value: t, label: t }))}
            {...seleto("tipoDeLocal")}
          />
          <FormFieldSelect
            label="Estacionamento"
            options={ESTACIONAMENTO.map((t) => ({ value: t, label: t }))}
            {...seleto("estacionamento")}
          />
        </div>

        {/* `CampoDeTags` é nosso — o DS não tem tag-input, e esta é a QUARTA tela a pedir
            um. 📋 Lacuna do DS mais repetida do projeto. */}
        <FormField
          label="Pontos de interesse"
          helperText={ESTRUTURA_TEXTOS.pontosDeInteresse}
        >
          {() => (
            <CampoDeTags
              tags={pontos}
              onChange={setPontos}
              placeholder="Digite e pressione Enter"
              sugestoes={["Mercado", "Praça de alimentação", "Banheiro", "Wi-Fi", "Café"]}
            />
          )}
        </FormField>
      </SecaoDeFormulario>

      {/* ── 4. Horário ────────────────────────────────────────────────── */}
      <SecaoDeFormulario
        titulo="Horário de funcionamento"
        descricao="Vale para o acesso ao local, não para o carregador — um carregador em estacionamento 24h pode ter horário mais curto que o prédio."
      >
        <div className="flex flex-col gap-gp-md">
          {DIAS_DA_SEMANA.map((dia, i) => {
            const h = horarios[i];
            /* Só o regime `Customizado` mostra as horas: em `24 horas` e `Fechado` os dois
               selects seriam controles que não mudam nada — e controle inerte ensina que
               os outros também podem ser. */
            const custom = h.regime === REGIMES_DE_HORARIO[0];
            return (
              <div
                key={dia}
                className="grid grid-cols-[150px_180px_1fr] items-center gap-gp-xl"
              >
                <span className="text-body-sm text-fg-default">{dia}</span>
                {/* `Select` cru do shadcn, não `FormFieldSelect`: a linha já tem o nome do
                    dia como rótulo visível, e o `FormFieldSelect` não expõe `hideLabel`
                    (só o `FormField` base tem). Repetir "Regime de Domingo" acima de cada
                    select daria sete rótulos redundantes. O `aria-label` mantém o leitor
                    de tela informado.
                    📋 Lacuna do DS: `hideLabel` existe no `FormField` e não desce pros
                    `FormField*` especializados. */}
                <SeletorSimples
                  rotulo={`Regime de ${dia}`}
                  valor={h.regime}
                  onChange={(v) => mudarHorario(i, { regime: v })}
                  opcoes={REGIMES_DE_HORARIO}
                />
                {custom ? (
                  <span className="flex items-center gap-gp-md">
                    <span className="text-caption-md text-fg-muted">Abre às</span>
                    <SeletorSimples
                      rotulo={`Abertura de ${dia}`}
                      valor={h.abre}
                      onChange={(v) => mudarHorario(i, { abre: v })}
                      opcoes={HORAS}
                      largura="w-[104px]"
                    />
                    <span className="text-caption-md text-fg-muted">Fecha às</span>
                    <SeletorSimples
                      rotulo={`Fechamento de ${dia}`}
                      valor={h.fecha}
                      onChange={(v) => mudarHorario(i, { fecha: v })}
                      opcoes={HORAS}
                      largura="w-[104px]"
                    />
                  </span>
                ) : (
                  <span className="text-caption-md text-fg-subtle">
                    {h.regime === "24 horas"
                      ? "Aberto o dia inteiro"
                      : "Sem funcionamento neste dia"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <FormFieldTextarea
          label="Observações gerais"
          placeholder="Instruções de acesso, portaria, restrições"
          rows={3}
          {...campo("observacoes")}
        />
      </SecaoDeFormulario>

      {/* ── 5. Identidade visual ──────────────────────────────────────── */}
      <SecaoDeFormulario
        titulo="Identidade visual"
        descricao="Aparece na tela do local dentro do app do motorista."
      >
        {/* ⚠️ **A cor de fundo vem PRIMEIRO, em linha própria, e os dois uploads ficam
            lado a lado.** Antes era logo + cor na mesma linha: um `FileUploadField`
            (dropzone alta, tracejada) ao lado de um `select` de 40px, e a diferença de
            altura entre os dois deixava o select boiando no topo da célula.

            Dois controles só dividem linha quando têm a MESMA altura. Logo e imagem do
            local são o mesmo componente, então emparelham perfeito; a cor de fundo é de
            outra espécie e ganha a linha dela. */}
        <FormFieldSelect
          label="Cor de fundo"
          placeholder="Selecione uma cor"
          options={CORES_DE_FUNDO.map((c) => ({ value: c, label: c }))}
          helperText="Cor da faixa atrás do logo, na tela do local."
          {...seleto("corDeFundo")}
        />

        <div className="grid grid-cols-2 gap-form-gap">
          {/* `FileUploadField` é dumb de propósito: captura o `File` e mostra a miniatura;
              quem sobe é o consumidor. Num mock ninguém sobe, e está certo — o que
              importa é que o seletor de arquivo ABRE. */}
          <FileUploadField
            label="Logo"
            value={logo}
            onChange={setLogo}
            accept="image/png,image/svg+xml"
            maxSizeMB={2}
            helperText="200 × 50 px, PNG com fundo transparente."
          />
          <FileUploadField
            label="Imagem do local"
            value={imagem}
            onChange={setImagem}
            accept="image/png,image/jpeg"
            maxSizeMB={5}
            helperText="375 × 300 px, PNG ou JPG."
          />
        </div>
      </SecaoDeFormulario>

      {/* ── 6. Responsável ────────────────────────────────────────────── */}
      <SecaoDeFormulario titulo="Responsável pelo local">
        <div className="grid grid-cols-2 gap-form-gap">
          <FormFieldInput
            label="Nome do responsável"
            placeholder="Nome completo"
            {...campo("responsavel")}
          />
          <FormFieldInput
            label="CPF do responsável"
            placeholder="000.000.000-00"
            className="[&_input]:tabular-nums"
            {...campo("cpf")}
          />
        </div>
        <div className="grid grid-cols-2 gap-form-gap">
          <FormFieldInput
            label="E-mail do responsável"
            type="email"
            placeholder="nome@empresa.com.br"
            {...campo("email")}
          />
          <FormFieldInput
            label="Telefone do responsável"
            placeholder="(00) 00000-0000"
            className="[&_input]:tabular-nums"
            {...campo("telefone")}
          />
        </div>
      </SecaoDeFormulario>

      {/* ── 7. Banco ──────────────────────────────────────────────────── */}
      <SecaoDeFormulario
        titulo="Dados bancários"
        descricao={ESTRUTURA_TEXTOS.semDadosBancarios}
      >
        <div className="grid grid-cols-2 gap-form-gap">
          <FormFieldInput
            label="Chave PIX"
            placeholder="CPF/CNPJ, celular, e-mail ou aleatória"
            {...campo("pix")}
          />
          <FormFieldSelect
            label="Banco"
            placeholder="Selecione um banco"
            options={BANCOS.map((b) => ({ value: b, label: b }))}
            {...seleto("banco")}
          />
        </div>
        <div className="grid grid-cols-[180px_1fr_200px] gap-form-gap">
          <FormFieldInput
            label="Agência"
            placeholder="0000"
            className="[&_input]:tabular-nums"
            {...campo("agencia")}
          />
          <FormFieldInput
            label="Conta"
            placeholder="Número da conta com dígito"
            className="[&_input]:tabular-nums"
            {...campo("conta")}
          />
          <FormFieldSelect
            label="Tipo de conta"
            placeholder="Selecione"
            options={TIPOS_DE_CONTA.map((c) => ({ value: c, label: c }))}
            {...seleto("tipoDeConta")}
          />
        </div>
      </SecaoDeFormulario>

      {/* ── 8. Preço ──────────────────────────────────────────────────── */}
      <SecaoDeFormulario titulo="Perfil de preço" ultima>
        <FormFieldSelect
          label="Perfil de preço"
          options={PERFIS_DE_PRECO.map((p) => ({ value: p, label: p }))}
          helperText="Herdando, o local segue o perfil da empresa."
          {...seleto("perfil")}
        />
      </SecaoDeFormulario>
    </FloatingPanel>
  );
}
