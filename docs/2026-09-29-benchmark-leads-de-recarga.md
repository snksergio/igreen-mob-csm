---
type: benchmark
title: Leads de recarga no iGreen MOB CMS — como o mercado faz trabalhar um lead com prazo
produto: igreen-mob-cms
escopo: fluxo + mecânica
data: 2026-09-29
autor: Sergio Vieira (com Claude)
status: pesquisa — não é regra da iGreen
tags: [igreen, mob-cms, leads, crm, eletroposto, licenciado, benchmark]
---

# Benchmark — trabalhar um lead de recarga dentro do CMS

> ⚠️ **Nada aqui é regra da iGreen.** É observação de mercado, tipada e com fonte,
> para provocar decisão. O `CONTEXT.md` do Conexão Mobi está em `pre-definicao`:
> qualquer número, prazo ou percentual que apareça numa tela derivada deste
> documento é placeholder até alguém da iGreen decidir.

---

## 1. Resumo executivo

Cinco coisas que a pesquisa mudou em relação à ideia original:

1. **A intuição está certa e já estava escrita.** O `CONTEXT.md` do Conexão Mobi
   afirma, com marcador ✅, que *"o licenciado não recarrega carro nenhum. A unidade
   de informação da tela dele não é o eletroposto nem a recarga — é o motorista que
   ele cadastrou e o quanto aquele motorista rendeu. O parente mais próximo é um
   painel de comissões / carteira de indicações, não um app de mobilidade."* A tela
   de leads não é uma adição ao CMS: é a tela que faltava.

2. **Não é um funil. É uma fila com relógio.** O que o licenciado faz quando um lead
   chega é uma coisa só: falar com a pessoa, rápido. Kanban convida a arrumar cards;
   fila diz quem é o próximo. O kanban entra como *segunda* visão, não como a
   primeira. [1][2][5]

3. **Existem dois relógios diferentes e o mercado só implementa um.** O Pipedrive
   mede **inatividade** — o card apodrece se ninguém mexe, e qualquer atividade
   zera o contador [5]. A regra da iGreen é um **prazo absoluto**: 7 dias a partir
   do pré-cadastro, e contato nenhum estende. Copiar o rótulo do Pipedrive
   ("parado há 4 dias") diria a coisa errada. O certo é "expira em 3 dias".

4. **O botão de WhatsApp não pode marcar "contatado".** O `wa.me` apenas
   **pré-preenche** a mensagem; quem toca em enviar é a pessoa, em outro
   aplicativo, e o CMS não fica sabendo [10]. Status inferido do clique seria uma
   tela que mente. Registrar o contato tem que ser ato explícito.

5. **"Temperatura" mistura duas perguntas diferentes.** Um cliente que já tem três
   produtos iGreen é fácil de abordar e é uma oportunidade *pequena*. Um cliente com
   zero produtos é difícil e é a maior oportunidade. Um número só não carrega as
   duas. Proposta: mostrar o **motivo**, não a chama.

---

## 2. Escopo e premissas

| | |
|---|---|
| **Objeto** | O fluxo de trabalhar um lead de recarga dentro de um console de gestão, e a mecânica de prazo, atribuição e estado por trás dele |
| **Decisão que apoia** | Desenhar 1 ou 2 telas no iGreen MOB CMS, para proposta interna |
| **Usuário** | Um licenciado dono de eletroposto. **Sem equipe abaixo** — por decisão do operador, roteamento, fila compartilhada e redistribuição estão fora |
| **Dimensões cobertas** | Jornada · regras de negócio · UI e padrões de tela |
| **Fora, com motivo** | **LGPD** (decisão do operador nesta rodada — segue como dúvida em §12, porque é o maior risco não endereçado) · **técnico/API** (a integração é da Go Nansen) · **roteamento** (usuário único) |
| **Não refeito** | Atribuição, janela de retenção e recorrência já estão em `06-sandbox/2026-09-02-conexao-mobi/bench/A-regras-negocio.md` §3.3 e §3.5. Este documento parte de lá |

---

## 3. Players analisados

| Player | Por que está aqui | O que analisei | Mercado |
|---|---|---|---|
| **HubSpot CRM** | Define o vocabulário de `lead status` que quase todo mundo copia | Blog oficial de produto | Global |
| **Pipedrive** | Referência de pipeline como tela principal, e o único com mecânica de prazo madura | Knowledge base oficial | Global |
| **Kommo** (ex-amoCRM) | É literalmente o "hoje é por WhatsApp" já virado pipeline — o estado que a iGreen quer sair | Docs oficiais + material de parceiros | Global, forte no Brasil |
| **RD Station CRM** | Brasileiro, público PME e representante comercial — o perfil mais próximo do licenciado | Material de parceiros (não achei doc primária dos estágios) | Brasil |
| **GetNinjas** | Adjacente, e o mais parecido com a **mecânica**: lead com prazo, que morre se ninguém pegar | Blog oficial | Brasil |

Fora de propósito: Salesforce (peso de configuração incompatível com um usuário só) e
CRMs de recarga de VE — **não existem**. A pesquisa anterior já tinha achado que
ninguém no segmento paga recorrência sobre o motorista indicado; por consequência,
ninguém tem tela de lead de motorista.

---

## 4. Como funciona, em geral

O padrão comum aos cinco:

```
entrada do lead → fica visível para quem tem direito a ele
                → alguém "pega" (claim) ou já nasce atribuído
                → contato, com registro do que aconteceu
                → estado avança por ato humano explícito
                → ganho, perdido, ou morre de prazo
```

A diferença relevante entre eles não é o desenho do funil. É **o que acontece quando
ninguém faz nada** — e é aí que os cinco divergem, porque é aí que cada um escolheu
seu modelo de escassez.

---

## 5. Matriz comparativa

| Dimensão | HubSpot | Pipedrive | Kommo | RD Station | GetNinjas | Maturidade |
|---|---|---|---|---|---|---|
| **Tela principal** | Lista de contatos com coluna de status | **Pipeline kanban** | **Pipeline kanban** por canal | Funil | **Lista de pedidos** ordenada por recência | consolidado (os dois modelos coexistem) |
| **Estado do lead** | Campo `Lead Status`, 8 valores padrão [3] | Etapa do pipeline, livre | Etapa do pipeline, livre | Etapa do funil, livre | Não há estado: ou você liberou o contato, ou não | consolidado |
| **Quem muda o estado** | Manual, importação ou workflow (planos pagos) [3] | Manual (arrastar) ou automação | Manual ou gatilho | Manual ou automação | — | consolidado |
| **Prazo / escassez** | Não nativo | **Rotting por etapa, em dias** [5] | Não documentado na doc primária ⚠️ [9] | Não verificado | **Pedido morre ao chegar a 4 profissionais** [6] | emergente |
| **Sinal visual do prazo** | — | **Tile vermelho** no kanban [5] | — | — | Pedido some da lista | consolidado onde existe |
| **O que reseta o relógio** | — | Atividade concluída, nota, arquivo, e-mail. **Atividade futura agendada NÃO conta** [5] | — | — | Nada: é contagem de concorrentes, não de tempo | — |
| **Contato pelo canal, na linha** | E-mail e ligação nativos | E-mail e ligação nativos | **WhatsApp nativo, inbox unificada** [8] | WhatsApp via ponte paga (Whatstation) [11] | Libera o telefone, contato fora da plataforma | consolidado |
| **Registro do contato** | Automático para e-mail/ligação | Automático para e-mail/ligação | **Automático — a conversa inteira fica no card** [8] | Automático com a ponte [11] | Nenhum | consolidado |
| **Distinção jornada × atividade** | **Sim** — `Lifecycle Stage` (onde está na jornada) ≠ `Lead Status` (o que vendas fez) [4] | Não | Não | Não | — | emergente |

---

## 6. Regras de negócio

### 6.1 Velocidade de resposta — o número que justifica a tela

| Achado | Valor | Tipo | Confiança |
|---|---|---|---|
| Contatar em **5 min** vs **30 min** | **100×** mais chance de alcançar, **21×** mais chance de qualificar [1] | Fato (estudo Oldroyd / Lead Response Management, 2007; ~15.000 leads, +100.000 tentativas, 6 empresas, 3 anos) | **média** — só acessei via fontes secundárias; o PDF original não abriu |
| Média real de resposta das empresas | **42 horas**; **23% nunca respondem** [2] | Fato (auditoria HBR 2011, 2.241 empresas) | média (secundária) |
| Responder na 1ª hora vs depois de 24h | **60×** mais chance de qualificar [2] | Fato | média (secundária) |

**Implicação direta:** hoje o aviso chega por WhatsApp no meio das conversas pessoais
do licenciado. A tela só ganha dele se responder "quem é o próximo?" em um olhar. Se
a primeira coisa que ela mostrar for um gráfico, ela perdeu para a notificação.

### 6.2 Prazo — os dois relógios

| Modelo | Como funciona | Quem usa |
|---|---|---|
| **Inatividade** | Conta desde a última atividade. Qualquer ato zera. Configurável **por etapa**, em dias. Sinal: tile vermelho [5] | Pipedrive |
| **Escassez por concorrência** | O pedido fica visível até **4 profissionais** liberarem o contato; depois some para os demais [6] | GetNinjas |
| **Validade absoluta de crédito** | Moeda vale **3 meses**, é debitada automaticamente ao expirar, com **e-mail de aviso antes do vencimento** [7] | GetNinjas |
| **Prazo absoluto do lead** | *Não achei em nenhum dos cinco.* A regra dos 7 dias da iGreen não tem precedente direto entre os players analisados | — |

⚠️ **A regra da iGreen é do quarto tipo, e é o único sem referência de mercado.** Os 7
dias não são inatividade (contato não estende) nem concorrência (não há outro
licenciado disputando, se a atribuição for por cadastro). É um prazo de validade,
como a moeda do GetNinjas — e daí vem a única prática copiável: **avisar antes de
expirar**, não só marcar como expirado depois.

### 6.3 Estados — 8 é demais para uma pessoa

Os 8 padrão do HubSpot [3]: `New`, `Attempted to Contact`, `Connected`, `Open Deal`,
`In Progress`, `Open`, `Unqualified`, `Bad Timing`.

`In Progress` e `Open` são genéricos a ponto de o próprio material do HubSpot não
distinguir bem um do outro — sintoma de um campo que cresceu por acréscimo. Para um
usuário só, cada estado a mais é uma decisão a mais na hora errada.

A distinção que **vale** importar é outra, e é do HubSpot [4]: **`Lifecycle Stage`
(onde a pessoa está na jornada) é diferente de `Lead Status` (o que vendas fez com
ela)**. Traduzindo para o MOB: *"recarregou e pagou"* é fato da jornada; *"liguei e
não atendeu"* é fato do trabalho. Misturar os dois numa coluna só produz a pergunta
sem resposta "ele está em 'Aguardando' porque eu estou esperando ele, ou porque ele
está esperando a recarga terminar?".

---

## 7. Jornada, por onde o padrão diverge

### 7.1 Kommo — o estado de onde a iGreen quer sair, já organizado

Cada mensagem recebida vira um card de lead automaticamente, com o histórico inteiro
da conversa anexado, numa inbox unificada [8]. É a resposta direta à sua dor: o
WhatsApp continua sendo o canal, mas deixa de ser o *registro*.

⚠️ **Divergência registrada:** material de parceiros afirma que o Kommo dispara
automação quando "o lead fica mais de 3 dias numa etapa sem interação". Abri a
documentação oficial de gatilhos do Digital Pipeline e **esse gatilho não está
listado** — os 12 documentados são Salesbot, adicionar tarefa, criar lead, enviar
e-mail, webhook, alterar etapa, tags, completar tarefas, formulário, alterar usuário,
alterar campo, excluir arquivos [9]. Trato o gatilho por tempo como **não
verificado**, e não construo recomendação em cima dele.

### 7.2 GetNinjas — a mecânica de prazo mais parecida, e o que ela custa

O lead é escasso por construção: no máximo 4 profissionais liberam o mesmo pedido
[6], e o crédito para liberar expira em 3 meses com aviso por e-mail [7].

O custo aparece no Reclame Aqui: "leads ruins", "moedas expiradas novamente" são
títulos recorrentes. **A lição para o MOB não é copiar a escassez — é o oposto.** Lá
a escassez existe para monetizar o lead; aqui o lead é do licenciado por direito. Se
a tela do MOB fizer o licenciado *sentir* que perdeu algo ao deixar os 7 dias
passarem, ela reproduz a frustração sem ter o modelo de negócio que a justifica.

### 7.3 Pipedrive — o único com o relógio na tela

Rotting configurável por etapa, em dias; o card fica **vermelho** quando estoura.
Zeram o contador: concluir atividade, adicionar nota ou arquivo, e-mail enviado ou
recebido. **Não** zera: ter uma atividade agendada para o futuro [5].

Essa última cláusula é a parte inteligente e é a que eu importaria literalmente:
*prometer que vai fazer não conta como ter feito.*

---

## 8. Problemas e anti-padrões observados

| ID | Onde | Heurística de Nielsen | Evidência | Impacto | Recomendação |
|---|---|---|---|---|---|
| P1 | Estado atual da iGreen | Visibilidade do status do sistema | O WhatsApp não guarda lista, não filtra, não mostra prazo. Relato do operador | Alto | É o motivo da tela existir |
| P2 | HubSpot | Reconhecimento em vez de memorização | 8 estados padrão, dois deles (`Open`, `In Progress`) sem fronteira clara [3] | Médio | Nascer com 5 |
| P3 | GetNinjas | Prevenção de erro | Moeda expira e é debitada; mitigado por e-mail de aviso [7], ainda assim é reclamação recorrente | Médio | Avisar **antes**, e o aviso ir para dentro do CMS, não só para fora |
| P4 | Pipedrive | Correspondência com o mundo real | "Rotting" mede inatividade; um prazo contratual não é inatividade | Alto **se copiado** | Rotular como prazo ("expira em"), nunca como abandono ("parado há") |
| P5 | Qualquer CRM com WhatsApp por link | Visibilidade do status | `wa.me` só pré-preenche; o envio acontece fora e não volta [10] | Alto | Nunca inferir "contatado" do clique |

---

## 9. Síntese

**Convergências** — pode adotar sem medo:

- Estado do lead é campo **explícito**, mudado por ato humano; automação é exceção [3][5][8]
- Ação de contato mora **na linha**, não dentro de um detalhe a dois cliques [5][8][11]
- Quem tem prazo, **mostra o prazo na própria célula** — e sinaliza por cor **e** por texto [5][7]
- Quem tem canal integrado, **registra a conversa sozinho**; quem não tem, precisa de registro manual [8][10]

**Divergências** — decisão, não padrão:

- **Kanban ou lista como tela principal.** Pipedrive e Kommo dizem kanban; HubSpot e GetNinjas dizem lista. A variável que decide é **volume por dia** e se o trabalho é *arranjar* ou *despachar*.
- **Estado é do lead ou da pessoa.** Só o HubSpot separa jornada de atividade comercial [4].

**Lacunas** — ninguém resolveu:

- Prazo absoluto de lead, com aviso de expiração, dentro de um console de gestão
- Cross-sell a partir de um evento de consumo (a recarga), com o catálogo de outro produto (seguros, energia, telecom)

---

## 10. Proposta para o iGreen MOB CMS

### 10.1 Uma tela, não duas

**`Leads` — item novo no rail, imediatamente acima de `Motoristas`.**

A razão de ser vizinho é semântica: é **a mesma pessoa em dois momentos**. Em `Leads`
ela tem prazo correndo; em `Motoristas` ela já é carteira. A fronteira entre as duas
telas é o fim da janela — o que dá um critério claro para "o que sai da lista", que é
exatamente o que você pediu para a tabela não virar histórico infinito.

⚠️ **Decisão em aberto:** pode ser melhor `Leads` ser uma **visão salva dentro de
Motoristas** em vez de item próprio, já que o `DataTable` do DS faz isso nativamente.
Recomendo item próprio no começo — um lead com relógio correndo tem urgência que uma
aba escondida não comunica —, e fundir depois se o volume for baixo.

### 10.2 A tela, em três faixas

```
┌─ PageHeader: Leads ····································· [Baixar dados] ─┐
│                                                                           │
├─ KPIs (4) ────────────────────────────────────────────────────────────────┤
│  Novos hoje │ Expiram em 48h │ Em conversa │ Convertidos no mês           │
│                    ▲ o único com tom de alerta                            │
├─ DataTable ───────────────────────────────────────────────────────────────┤
│  Visões: [Precisa de ação] [Em conversa] [Expirando] [Convertidos] [Todos]│
│  Toolbar: recorte de tempo · busca · filtros                              │
│                                                                           │
│  Cliente │ Posto │ Recarga │ Prazo │ Estado │ Produtos │ Última ação │ ⋯  │
└───────────────────────────────────────────────────────────────────────────┘
```

Reaproveita, sem componente novo: `PageHeader`, `KpiGroup divided`, `DataTable` com
`defaultViews` + `persistId`, toggle Tabela↔Kanban nativo, `FloatingPanel` para o
detalhe. É o mesmo arranjo de **Implantações**, que você já validou.

**A visão padrão é `Precisa de ação`**, ordenada por prazo crescente — não "Todos".
Essa é a tradução da regra das 5 tentativas: a tela abre já respondendo "quem é o
próximo?" [1][2].

### 10.3 As colunas, e por que cada uma

| Coluna | O que mostra | Por quê |
|---|---|---|
| **Cliente** | Nome + telefone `copyable` | O DS já tem `copyable`; telefone é o que se copia |
| **Posto / Recarga** | Onde e quanto | É o gancho da conversa: "vi que você recarregou no Posto X" |
| **Prazo** | **"expira em 3 dias"**, com tom por faixa | P4: prazo, não abandono. Cor **e** texto, nunca só cor |
| **Estado** | Chip com 1 dos 5 | §10.4 |
| **Produtos** | Chips dos produtos iGreen que a pessoa já tem | §10.5 |
| **Última ação** | "Você ligou · há 2 dias" ou "—" | O que o WhatsApp não guarda, e a razão de a tela existir |
| **Ações** | WhatsApp · Registrar contato | §10.6 |

### 10.4 Cinco estados, não oito

| Estado | Quando | Quem muda |
|---|---|---|
| **Novo** | Ninguém tocou | Sistema |
| **Tentei contato** | Mandou ou ligou, sem resposta | Licenciado, explícito |
| **Em conversa** | A pessoa respondeu | Licenciado, explícito |
| **Convertido** | Ativou produto ou concluiu recarga | Sistema, pelo fato |
| **Perdido / Expirado** | Recusou, ou a janela fechou | Licenciado ou sistema |

Importando a separação do HubSpot [4]: **`Convertido` é da jornada** (vem do fato:
pagamento concluído, produto ativado) e os outros são **do trabalho** (vêm do
licenciado). Por isso `Convertido` não é arrastável — ninguém "declara" uma
conversão.

### 10.5 Em vez de temperatura, o motivo

`Quente/Morno/Frio` mistura *facilidade de abordagem* com *tamanho da oportunidade*
— e as duas andam em direções opostas: quem já tem três produtos é fácil de abordar
e sobrou pouco para vender; quem tem zero é o contrário.

Proposta: a coluna **Produtos** mostra o que a pessoa já tem, e o painel abre com uma
linha em prosa — *"Já é cliente de Energia e Telecom. Não tem Seguros."* Isso é
**fato verificável**, enquanto uma chama é um palpite que ninguém mantém.

Se ainda assim quiserem ordenar por prioridade, a ordenação defensável usa só o que
sabemos: **prazo restante** → **concluiu a recarga** (a regra diz que a atribuição só
se formaliza no pagamento) → **valor da recarga**. Sem inventar peso.

### 10.6 As duas ações da linha

**`WhatsApp`** abre `wa.me/<telefone>?text=<mensagem>` com a mensagem já escrita,
puxando posto e data da recarga. Nada mais: o envio acontece no WhatsApp e **não
volta** [10].

**`Registrar contato`** é uma ação separada e explícita — um item de menu, ou o botão
primário do painel — que grava o que aconteceu e muda o estado.

⚠️ **Os dois não podem ser o mesmo botão.** Se clicar em WhatsApp já marcasse
"Tentei contato", a tela registraria intenção como se fosse ato, e em uma semana a
lista estaria mentindo (P5).

Mitigação honesta, se a fricção incomodar: depois de abrir o WhatsApp, oferecer a
pergunta *"Conseguiu falar?"* com `Sim` / `Não atendeu` na volta à aba. É pergunta,
não inferência.

### 10.7 O relógio, e o aviso antes

- **Cálculo:** dias corridos desde o pré-cadastro, teto de 7 (placeholder até a
  iGreen decidir). **Contato não estende** — é prazo, não inatividade [5].
- **Faixas:** `> 3 dias` neutro · `≤ 3 dias` atenção · `≤ 1 dia` perigo · `expirado`
  esmaecido.
- **Aviso antes de expirar** é a única prática do GetNinjas que vale copiar [7], e
  ela **vive na tela** (o KPI "Expiram em 48h"), não só num disparo externo.
- **Expirado sai da visão padrão** e continua em `Todos` e nos filtros por data. A
  tabela não vira cemitério, e o histórico não some (P3).

---

## 11. CSD

### Certezas — fato ou observação, com fonte

- A unidade de informação do licenciado é o motorista e o quanto ele rendeu, não o eletroposto. `CONTEXT.md` ✅
- Responder em 5 min em vez de 30 multiplica por 21 a chance de qualificar [1]
- O padrão de estado de lead é campo explícito mudado por humano; 8 valores é o default do HubSpot e dois deles se confundem [3]
- Pipedrive mede inatividade por etapa, em dias, sinaliza em vermelho, e atividade agendada no futuro não conta [5]
- GetNinjas limita o pedido a 4 profissionais [6] e avisa por e-mail antes de a moeda expirar [7]
- `wa.me` pré-preenche e nunca envia sozinho [10]
- Nenhum CRM de recarga de VE tem tela de lead de motorista, porque ninguém no segmento remunera assim (pesquisa anterior, `bench/A`)

### Suposições — testáveis

| # | Suposição | Porque | Como valida |
|---|---|---|---|
| S1 | A visão padrão ordenada por prazo resolve "quem é o próximo" melhor que o WhatsApp | O ganho da tela é priorização, e o estudo de tempo de resposta mostra que é aí que o dinheiro está [1][2] | Um licenciado usa por duas semanas; medir tempo entre pré-cadastro e 1º contato registrado |
| S2 | Cinco estados bastam | Oito existem para times com papéis separados; aqui é uma pessoa [3] | Se aparecer "Outro" como nota recorrente, faltou estado |
| S3 | Mostrar produtos vale mais que temperatura | Fato verificável vence palpite não mantido | Perguntar ao licenciado o que ele olha antes de ligar |
| S4 | Item de rail próprio bate visão dentro de Motoristas | Urgência não sobrevive escondida numa aba | Testar as duas com o mesmo licenciado |
| S5 | Pedir "conseguiu falar?" na volta tem adesão | É mais barato que preencher formulário | Medir % de leads com contato registrado |

### Dúvidas — e como descobrir

| # | Dúvida | Como descobrir | Prioridade |
|---|---|---|---|
| **D1** | **Quem fica com o lead: quem cadastrou o motorista (`CONTEXT.md` ✅) ou quem comercializou o eletroposto (regra recebida)?** São pessoas diferentes, e decide quem aparece na tabela — e se o mesmo motorista gera lead para vários licenciados | Pergunta direta ao dono do produto na iGreen | **P0 — bloqueia o desenho** |
| **D2** | **LGPD.** Usar o telefone coletado para pagar a recarga e oferecer seguro é finalidade diferente da coleta. Isso define se o botão de WhatsApp pode existir, se precisa de opt-in no app e se o telefone pode ser exibido | Abrir a Lei 13.709/2018 e os guias da ANPD; consultar o jurídico. **Ficou fora desta rodada por decisão** | **P0 — risco jurídico** |
| D3 | Quantos leads por dia, por licenciado? | Dado da Nansen / PV MOB | P1 — decide tabela × kanban |
| D4 | O prazo é mesmo 7 dias corridos, e a partir de qual evento exatamente? | Dono do produto | P1 |
| D5 | O CMS sabe quais produtos iGreen o cliente tem, ou isso é outra base? | Time de dados | P1 — a coluna Produtos depende disso |
| D6 | "Ativar outra conexão" conta como conversão do lead, ou só a recarga? | Dono do produto | P2 |
| D7 | O disparo de WhatsApp atual continua existindo junto com a tela, ou é substituído? | Dono do produto | P2 |

---

## 12. Oportunidades priorizadas

| ID | Oportunidade | Evidência | Impacto | Esforço | Confiança | Prioridade |
|---|---|---|---|---|---|---|
| O1 | Tela `Leads` com visão padrão por prazo | [1][2] + `CONTEXT.md` ✅ | Alto | Médio | Alta | **P0** |
| O2 | Coluna de prazo com faixas, texto e cor | [5][7] | Alto | Baixo | Alta | **P0** |
| O3 | Registrar contato como ação explícita | [10] | Alto | Baixo | Alta | **P0** |
| O4 | KPI "Expiram em 48h" como aviso dentro da tela | [7] | Médio | Baixo | Alta | P1 |
| O5 | Coluna Produtos no lugar de temperatura | §10.5 | Médio | Médio | Média | P1 |
| O6 | Botão WhatsApp com mensagem pré-escrita | [10] | Médio | Baixo | Alta | P1 — **depende de D2** |
| O7 | Kanban como segunda visão | [5][8] | Baixo | Baixo (nativo do DS) | Alta | P2 |

---

## 13. Impacto no design system

| Categoria | Achado | Ação |
|---|---|---|
| Componentes | Nada novo. `DataTable` (visões, kanban, `copyable`), `KpiGroup`, `FloatingPanel`, `Chip` cobrem tudo | Nenhuma |
| Padrão | "Contagem regressiva numa célula" não existe no catálogo | Se repetir em outra tela, vira candidato a receita em `dashboard-patterns.md` — não a componente |
| Conteúdo | "expira em" × "parado há" é distinção de copy que muda o significado | Registrar como nota de escrita |

---

## 14. Limitações

- O PDF do estudo de tempo de resposta **não abriu**; os números de §6.1 vêm de fontes secundárias consistentes entre si, e estão marcados como confiança **média**, não alta.
- Não achei documentação primária dos estágios padrão do RD Station CRM — a linha dele na matriz vem de material de parceiros, confiança **baixa**.
- O gatilho por tempo do Kommo **não foi confirmado** na doc oficial e está marcado como divergência.
- Nenhuma tela foi observada ao vivo: a análise de UI vem de documentação e descrição, não de produto em uso.
- **LGPD não foi pesquisada.** É o maior buraco deste documento e está declarado como D2.

---

## 15. Próximos passos

1. Levar **D1** e **D2** ao dono do produto na iGreen. As duas travam o desenho, e a segunda trava o botão de WhatsApp inteiro.
2. Com D1 respondida, desenhar a tela em `src/preview/pages/` — ou, se for fazer entrevista guiada, `/ds-create-crud`.
3. Se quiser aprofundar as suposições S1–S5, `ws-matriz-csd`.
4. Quando alguma regra for decidida pela iGreen, ela sobe para `01-contexts/igreen/conexao-mobi/CONTEXT.md` com marcador ✅ — e só aí passa a valer.

---

## 16. Registro de evidências

| ID | Player | Dimensão | Tipo | Evidência | Confiança |
|---|---|---|---|---|---|
| 1 | — | Regra | Fato | Estudo Oldroyd / Lead Response Management: 5 min vs 30 min = 100× contato, 21× qualificação; ~15.000 leads, +100.000 tentativas | média (secundária) |
| 2 | — | Regra | Fato | HBR 2011, 2.241 empresas: média 42h, 23% nunca respondem, 60× menos chance após 24h | média (secundária) |
| 3 | HubSpot | Regra | Fato | 8 valores padrão de `Lead Status`; customizável | alta (blog oficial) |
| 4 | HubSpot | Regra | Fato | `Lifecycle Stage` ≠ `Lead Status`: jornada vs atividade de vendas | alta (blog oficial) |
| 5 | Pipedrive | Regra + UI | Fato | Rotting por etapa em dias; tile vermelho; reseta com atividade/nota/arquivo/e-mail; atividade futura não conta | alta (KB oficial) |
| 6 | GetNinjas | Regra | Fato | "permitimos que os pedidos sejam visualizados por até 4 profissionais" | alta (blog oficial) |
| 7 | GetNinjas | Regra | Fato | Moeda vale 3 meses, debitada ao expirar, e-mail de aviso antes | alta (blog oficial) |
| 8 | Kommo | Jornada + UI | Fato | Inbox unificada; card de lead criado por mensagem recebida com histórico anexado | média (blog oficial + parceiros) |
| 9 | Kommo | Regra | Fato | 12 gatilhos do Digital Pipeline documentados; **gatilho por tempo ausente** | alta (doc oficial) — a ausência é o achado |
| 10 | WhatsApp | Técnico | Fato | `wa.me/<número>?text=<texto>`; número só dígitos com DDI; texto url-encoded; **pré-preenche, não envia** | média (fontes secundárias consistentes) |
| 11 | RD Station | Jornada | Interpretação | Funil `Novo → Qualificando → Proposta → Fechado`; WhatsApp por ponte paga | baixa (material de parceiros) |

---

## 17. Fontes

Acesso em 29/09/2026.

1. Lead Response Management / MIT study (Oldroyd) — https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf (PDF não legível; números via secundárias abaixo)
2. AInora — Lead Response Time: Every Study (MIT, HBR, Drift) — https://ainora.lt/blog/lead-response-time-statistics-every-study-2026
3. Kixie — Speed to Lead Response Time Statistics — https://www.kixie.com/sales-blog/speed-to-lead-response-time-statistics-that-drive-conversions/
4. HubSpot — How to Manage Your Sales Process in HubSpot With Lead Status — https://blog.hubspot.com/customers/manage-sales-process-hubspot-lead-status
5. HubSpot — Use contact and company lifecycle stages — https://knowledge.hubspot.com/records/use-lifecycle-stages
6. Pipedrive — The Rotting feature — https://support.pipedrive.com/en/article/the-rotting-feature
7. GetNinjas — Como escolher os melhores pedidos — https://blog.getninjas.com.br/como-escolher-pedidos/
8. GetNinjas — Expiração de moedas — https://blog.getninjas.com.br/expiracao-de-moedas-getninjas/
9. Kommo — Automatize ações do pipeline — https://support.kommo.com/docs/pt-br/automate-pipeline-actions
10. Kommo — Configurar gatilhos do pipeline digital — https://support.kommo.com/v1/docs/pt-br/set-up-digital-pipeline-triggers
11. Kommo — Guide to WhatsApp CRM — https://www.kommo.com/blog/whatsapp-crm/
12. RD Station — CRM de vendas — https://www.rdstation.com/produtos/crm/
13. BusinessChat — How to build a WhatsApp click-to-chat URL — https://help.businesschat.io/en/articles/6517838-how-to-build-a-whatsapp-click-to-chat-url-wa-me

**Internas:** `01-contexts/igreen/conexao-mobi/CONTEXT.md` · `06-sandbox/2026-09-02-conexao-mobi/bench/A-regras-negocio.md` §3.3 e §3.5 · `02-projects/igreen/mob-cms/src/nav/nav-data.tsx`
