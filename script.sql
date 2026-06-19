-- ============================================================
-- Políticas de RLS (Row Level Security) para o App Ressurreição
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/pfzulktbhivfkfzuvztd/sql/new
-- ============================================================

-- 1. Permitir consulta pública de clientes pelo CPF (login e cadastro)
CREATE POLICY "anon_select_clientes" ON clientes
  FOR SELECT TO anon
  USING (true);

-- 2. Permitir cliente logado ver seus próprios dados (pelo email)
CREATE POLICY "auth_select_own_cliente" ON clientes
  FOR SELECT TO authenticated
  USING (email = auth.email());

-- 3. Permitir cliente logado atualizar seu próprio email (cadastro)
CREATE POLICY "auth_update_own_cliente" ON clientes
  FOR UPDATE TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- 4. Permitir cliente logado ver mensalidades
CREATE POLICY "auth_select_mensalidades" ON mensalidades
  FOR SELECT TO authenticated
  USING (true);

-- 5. Permitir consulta pública da config do banco (usado no boleto)
CREATE POLICY "anon_select_config_banco" ON config_banco
  FOR SELECT TO anon
  USING (true);
