import {
  Button,
  FloatingPanel,
  FloatingPanelSection,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "@snksergio/design-system";
import { Info } from "lucide-react";
import {
  MODULOS,
  PERFIL,
  PERFIS,
  modulosAlcancados,
  type PerfilId,
} from "./permissoes-mock";
import { ChipDePerfil, LegendaDasMarcas, MarcaDeNivel } from "./permissoes-ui";

/**
 * Painel de referência dos perfis — o destino da "Legenda do Perfil de Acesso".
 *
 * ## Por que a legenda saiu da tela e virou isto
 *
 * Na referência ela é um banner permanente de quatro parágrafos, repetido **duas vezes**:
 * no topo da lista e de novo dentro do modal de edição. Custa ~120px acima da tabela em
 * toda visita, e ainda assim não responde a pergunta que se faz dela — *"o Técnico enxerga
 * o Financeiro?"* — porque prosa exige que o leitor reconstrua a regra de cabeça.
 *
 * É o padrão que GitHub, Supabase e Vercel convergiram: o papel aparece como **chip na
 * linha**, e a documentação dele fica **a um clique**, numa matriz. Quem já sabe não paga
 * nada; quem não sabe recebe mais do que o banner dava.
 *
 * ## A matriz é o formato, e não é decoração
 *
 * Doze módulos × cinco perfis = 60 respostas numa tela. Os mesmos quatro parágrafos da
 * origem cobrem, no melhor caso, as ~15 que eles citam nominalmente; as outras 45 o leitor
 * inferia — ou errava. Ver `MODULOS` no mock pra origem de cada célula.
 */
export function PerfisDeAcessoPanel({
  aberto,
  onClose,
}: {
  aberto: boolean;
  onClose: () => void;
}) {
  const COL = { modulo: 216, perfil: 116 };

  return (
    <FloatingPanel
      open={aberto}
      onOpenChange={(v) => !v && onClose()}
      side="right"
      /* Número, não "xl": medido, o xl entrega 720px e a matriz pede 216 + 5×116 = 796
         só de colunas. Com xl a coluna Padrão ficava atrás do scroll horizontal — e uma
         matriz de referência com a última coluna escondida não é referência. */
      size={1000}
      resizable
      maximizable
      resizableStorageKey="permissoes.perfis-panel.width"
      bodyPadded={false}
      title="Perfis de acesso"
      description="O que cada perfil alcança em cada módulo do CMS"
      footer={
        <Button variant="filled" color="primary" size="sm" onClick={onClose}>
          Entendi
        </Button>
      }
    >
      <FloatingPanelSection title="Os cinco perfis">
        {/* Uma linha por perfil, com o chip à esquerda e o texto da legenda da referência à
            direita. É a MESMA informação do banner que foi removido — o que mudou é que ela
            só ocupa espaço para quem veio buscá-la. */}
        <ul className="flex flex-col gap-gp-xl">
          {PERFIS.map((id) => {
            const p = PERFIL[id];
            const alcance = modulosAlcancados(id);
            return (
              <li key={id} className="flex gap-gp-lg">
                <span className="w-[136px] shrink-0 pt-[2px]">
                  <ChipDePerfil perfil={id} />
                </span>
                <span className="flex min-w-0 flex-col gap-[2px]">
                  <span className="text-body-sm text-fg-default">
                    {p.descricao}
                  </span>
                  <span className="text-caption-md text-fg-muted">
                    {p.paraQuem}
                    <span className="mx-gp-sm opacity-50">·</span>
                    <span className="tabular-nums">
                      {alcance} de {MODULOS.length} módulos
                    </span>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </FloatingPanelSection>

      <FloatingPanelSection title="Matriz de acesso">
        <div className="flex flex-col gap-gp-xl">
          {/* `Table` primitivo, não `DataTable`: aqui não há ordenação, filtro, busca nem
              paginação a oferecer — é uma tabela de referência, e a toolbar do DataTable
              prometeria interações que não existem. */}
          <div className="overflow-x-auto scrollbar-thin">
            <Table density="standard" ariaLabel="Matriz de perfis por módulo">
              <TableHead>
                <TableHeadCell field="modulo" width={COL.modulo}>
                  Módulo
                </TableHeadCell>
                {PERFIS.map((id) => (
                  <TableHeadCell
                    key={id}
                    field={id}
                    width={COL.perfil}
                    align="center"
                  >
                    {PERFIL[id].nome}
                  </TableHeadCell>
                ))}
              </TableHead>
              <TableBody>
                {MODULOS.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell field="modulo" width={COL.modulo}>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-body-sm text-fg-default">
                          {m.nome}
                        </span>
                        {/* A ressalva é a parte da legenda que a matriz sozinha não
                            carrega: "sem estornos" e "sem editar preços" são recortes
                            DENTRO de um nível, não um nível novo. Aqui vai nomeada pelo
                            perfil, porque a matriz mostra os cinco lado a lado — sem o
                            nome, a ressalva pareceria valer para a linha inteira. */}
                        {m.ressalvas &&
                          Object.entries(m.ressalvas).map(([p, texto]) => (
                            <span
                              key={p}
                              className="text-caption-sm text-fg-muted"
                            >
                              {PERFIL[p as PerfilId].nome}: {texto.toLowerCase()}
                            </span>
                          ))}
                      </span>
                    </TableCell>
                    {PERFIS.map((id) => (
                      <TableCell
                        key={id}
                        field={id}
                        width={COL.perfil}
                        align="center"
                      >
                        <span className="flex justify-center">
                          <MarcaDeNivel nivel={m.niveis[id]} />
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <LegendaDasMarcas />

          <p className="flex items-start gap-gp-md rounded-radius-lg bg-bg-subtle p-pad-2xl text-caption-md text-fg-muted">
            <Info className="mt-[1px] size-icon-sm shrink-0" aria-hidden />
            <span>
              O perfil vale <strong className="font-semibold">por local</strong>
              . A mesma pessoa pode ser Administrador num ponto e Parceiro em
              outro — é o que a coluna <em>Misto</em> da lista indica.
            </span>
          </p>
        </div>
      </FloatingPanelSection>
    </FloatingPanel>
  );
}
