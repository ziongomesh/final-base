# Refatoração minimalista do painel do Dono

## Objetivo
Painel mais simples, arejado e focado. Menos abas, menos ruído visual, sem sobreposição.

## Consolidação de abas (11 → 5)

| Nova aba       | Absorve                                         |
| -------------- | ----------------------------------------------- |
| **Geral**      | Geral (overview) + Atividade + Ranking          |
| **Equipe**     | Masters + Revendas (com sub-tabs internas)      |
| **Movimentações** | Transferências + Recargas Globais + Histórico (Audit) |
| **Comunicação** | Notícias + Anúncios                            |
| **Gerenciar**  | Gerenciar (planos do sub viram dialog interno)  |

A barra de abas deixa de ter scroll horizontal — cabem 5 numa linha em desktop.

## Densidade arejada

- Tipografia: `text-[10px]` → `text-sm` em conteúdo, `text-xs` só em metadados
- Padding de cards: `p-3` → `p-5`/`p-6`
- Espaçamento entre seções: `space-y-3` → `space-y-6`
- Altura de abas: `h-7` → `h-9`
- Limite de largura central: `max-w-7xl` para evitar linhas longas
- Hierarquia clara: título da seção (text-base font-medium) + descrição (text-xs muted) acima de cada bloco

## Glass mais sutil

- Reduzir `backdrop-blur(16px)` → `backdrop-blur(8px)`
- Bordas: usar `border border-white/[0.06]` consistente, sem múltiplas variações
- Remover sombras coloridas/glow; manter só `shadow-sm` discreto
- Accent sky-blue só em: aba ativa, botões primários, valores positivos. Resto em `text-foreground`/`text-muted-foreground`
- Remover gradientes em cards; fundo `bg-card/40` uniforme

## Arquivos a alterar

- `src/pages/DashboardDono.tsx`  
  - Reestruturar `TabsList` para 5 abas
  - Criar sub-tabs internas em "Equipe" (Masters/Revendas) e "Movimentações" (Transferências/Recargas/Histórico)
  - Remover scroll horizontal da `TabsList` em desktop (manter só em mobile)
  - Aplicar nova densidade em todos os `TabsContent`
  - Mover dialog de Planos do Sub pra dentro de "Gerenciar"
- `src/index.css`  
  - Ajustar `.glass-card` para blur mais sutil e borda única
  - Adicionar utilitário `.section-header` (título + descrição padronizados)
- `src/components/dashboard/RechargeOverviewTab.tsx`  
  - Aplicar nova densidade (padding, tipografia)
- `src/components/dashboard/LauncherTopBar.tsx`  
  - Pequenos ajustes para combinar com a densidade arejada

## Não muda
- Nenhuma lógica de negócio, query ou endpoint
- Nenhum dado é removido — só agrupado visualmente
- Painéis de Master e Revendedor (não solicitados nesta passagem)

## Detalhes técnicos

- Sub-tabs internas usam `Tabs` aninhado com `variant` visualmente mais leve (underline em vez de pill)
- Estado da aba ativa persiste em `localStorage` por chave (`dono-tab`, `dono-equipe-tab`, `dono-mov-tab`) para o usuário não perder contexto ao recarregar
- Mobile: `TabsList` volta a ter overflow-x-auto; desktop usa grid-cols-5
- Sem mudanças em rotas — tudo continua em `/dashboard`