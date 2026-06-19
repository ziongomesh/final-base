
# Visibilidade Total: Revendedor / Master / Dono

Plano consolidado pra fechar todos os gaps de informação dos 3 cargos. Inclui mudanças de banco (MySQL), backend (Node) e frontend.

---

## 1. Mudanças de banco (MySQL — migration única)

```sql
-- Snapshot de saldo no momento que o documento foi criado
ALTER TABLE usuarios            ADD COLUMN creditos_no_momento INT NULL;
ALTER TABLE usuarios_rg         ADD COLUMN creditos_no_momento INT NULL;
ALTER TABLE usuarios_crlv       ADD COLUMN creditos_no_momento INT NULL;
ALTER TABLE chas                ADD COLUMN creditos_no_momento INT NULL;
ALTER TABLE carteira_estudante  ADD COLUMN creditos_no_momento INT NULL;
ALTER TABLE hapvida_atestados   ADD COLUMN creditos_no_momento INT NULL;

-- Histórico de logins (frequência / heatmap de atividade)
CREATE TABLE admin_login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45),
  user_agent TEXT,
  INDEX idx_admin_login (admin_id, login_at)
);
```

Registros antigos ficam com `creditos_no_momento = NULL` → UI mostra "—".

---

## 2. Backend (`server/routes/`)

### 2.1 Login passa a gravar histórico
- `auth.ts`: ao validar login, INSERT em `admin_login_history`.

### 2.2 Salvar documento grava saldo do momento
Em cada rota de criação de documento (`cnh.ts`, `rg.ts`, `crlv.ts`, `cnh-nautica.ts`, `craf.ts`, `estudante.ts`, `hapvida.ts`): antes de debitar, capturar saldo atual e gravar em `creditos_no_momento`.

### 2.3 Endpoint enriquecido de detalhes do revendedor
`GET /admins/reseller-details/:id` (libera Dono + Sub também):
- Perfil completo (nome, email, cargo, criado_por, telefone)
- **Status**: online (last_active < 5min), offline há X dias, último acesso formatado
- **6 stats**: saldo atual, total recebido, total usado, total docs, dias ativos (30d), logins/semana
- **Atividade dos últimos 30 dias** (array de `{data, count}` para mini-gráfico)
- **Documentos** com novo campo `creditos_no_momento` em cada linha
- **Recargas recebidas** (histórico de `credit_transactions WHERE to_admin_id = :id`)
- **Logins recentes** (últimos 50 de `admin_login_history`)

### 2.4 Novos endpoints exclusivos do Dono em `owner.ts`

```
GET /owner/all-resellers-recharge-stats
  → todos revendedores com: id, nome, total_recarregado, num_recargas, ultima_recarga_data, saldo_atual, dias_offline

GET /owner/recharge-overview
  → estatísticas globais:
    - total_geral_recarregado_na_base
    - total_recargas_count
    - ultima_recarga_global (data, admin, valor)
    - media_semanal_ultimas_4_semanas
    - media_semanal_ultimas_12_semanas
    - top_10_revendedores_por_recarga
    - serie_temporal (últimas 12 semanas, valor total / semana → para gráfico)
```

### 2.5 Permissões
`reseller-details` aceita: master (só dos seus), sub e dono (qualquer revendedor).

---

## 3. Frontend

### 3.1 `RevendedorDetalhes.tsx` reformulado (Dono / Sub / Master)
Libera acesso pro Dono (hoje bloqueia em `role !== 'master' && role !== 'sub'`).

**Layout novo:**
- Header: avatar + nome + cargo + criado por + **badge online/offline com dias** + último acesso formatado
- Grid de 6 cards: Saldo atual / Créditos recebidos / Créditos usados / Total docs / Dias ativos (30d) / Logins/semana
- Mini-gráfico de barras (atividade últimos 30 dias)
- 3 tabs:
  - **Documentos**: tipo, nome, CPF, **saldo no momento**, data — dropdown para filtrar por tipo
  - **Recargas**: data, valor R$, créditos comprados, status — soma total no rodapé
  - **Atividade**: lista de logins (data/hora + IP), heatmap simples por dia da semana

### 3.2 Dashboard do Dono — nova aba "Recargas Globais" em `DashboardDono.tsx`
- 4 cards no topo: Total Geral / Última Recarga (data + admin) / Média Semanal (4 sem) / Média Semanal (12 sem)
- Gráfico de linha das últimas 12 semanas (valor recarregado por semana)
- Tabela "Top 10 revendedores por recarga total"
- Tabela completa de "Todos revendedores" com colunas: nome / saldo / total recarregado / nº recargas / última recarga / dias offline → ordenável por qualquer coluna + botão 👁️ que leva pra `/revendedor/:id`

### 3.3 Dashboard do Master (`DashboardMaster.tsx`)
- Já tem botão Ver Detalhes (feito ontem). Sem mudanças adicionais nesta entrega — o `RevendedorDetalhes` reformulado já cobre o que o Master precisa ver.

### 3.4 Dashboard do Revendedor (`Dashboard.tsx`)
- Card destacado de **Saldo atual** + **Créditos gastos esta semana / mês**
- Card de **Última recarga** (data + valor)
- Mantém: gráfico de docs, atalhos, feed de notícias, últimos registros

---

## Ordem de execução

1. Migration MySQL (todas as alterações de schema juntas)
2. Backend: hook de login no `auth.ts` + capturar `creditos_no_momento` em cada rota de doc
3. Backend: enriquecer `reseller-details` + criar 2 endpoints novos do Dono
4. Frontend: reformular `RevendedorDetalhes.tsx` + liberar Dono
5. Frontend: nova aba "Recargas Globais" no Dono
6. Frontend: enriquecer Dashboard do Revendedor
7. Smoke test em cada cargo

---

## Arquivos afetados

**Banco**:
- novo: `docs/mysql-migration-visibilidade.sql`

**Backend**:
- editado: `server/routes/auth.ts`, `admins.ts`, `owner.ts`, `cnh.ts`, `rg.ts`, `crlv.ts`, `cnh-nautica.ts`, `craf.ts`, `estudante.ts`, `hapvida.ts`

**Frontend**:
- editado: `src/pages/RevendedorDetalhes.tsx`, `DashboardDono.tsx`, `Dashboard.tsx`
- novos componentes: `src/components/dashboard/RechargeOverviewTab.tsx`, `src/components/reseller/ActivityHeatmap.tsx`

---

## Pontos a confirmar

- **Sub**: você pediu pra focar em revendedor/master/dono e não citou o Sub. Mantenho o Sub com o que já tem hoje (acesso ao `RevendedorDetalhes` continua), mas **sem dar pra ele a aba "Recargas Globais"** (exclusiva do Dono). OK?
- **Backfill de saldo no momento**: registros antigos não têm como ter esse dado. UI mostra "—". OK?
- Migration é **destrutiva apenas no sentido aditivo** (adiciona colunas/tabela, não remove nada). Roda direto sem risco de perder dado.

Confirma que pode executar?
