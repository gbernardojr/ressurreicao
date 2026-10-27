-- Corrige clientes que não enxergam os próprios dados após o login.
-- Sintoma: a autenticação funciona, mas a tela fica carregando ou mostra
-- "Cadastro não encontrado".
--
-- Causa: o Supabase Auth converte o e-mail para minúsculas, enquanto o
-- cadastro em clientes pode ter maiúsculas (ex.: ..._0123-A@...). As políticas
-- de RLS comparam email = auth.email() e acabam bloqueando a leitura.
--
-- Execute no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/pfzulktbhivfkfzuvztd/sql/new

BEGIN;

-- 1. Normalizar os e-mails já cadastrados
UPDATE clientes
SET email = lower(trim(email))
WHERE email IS NOT NULL
  AND email <> lower(trim(email));

UPDATE admin_usuarios
SET email = lower(trim(email))
WHERE email IS NOT NULL
  AND email <> lower(trim(email));

-- 2. Políticas do cliente logado ignorando maiúsculas/minúsculas
DROP POLICY IF EXISTS "auth_select_own_cliente" ON clientes;
CREATE POLICY "auth_select_own_cliente" ON clientes
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.email()));

DROP POLICY IF EXISTS "auth_update_own_cliente" ON clientes;
CREATE POLICY "auth_update_own_cliente" ON clientes
  FOR UPDATE TO authenticated
  USING (email IS NULL OR lower(email) = lower(auth.email()))
  WITH CHECK (lower(email) = lower(auth.email()));

DROP POLICY IF EXISTS "auth_select_mensalidades" ON mensalidades;
CREATE POLICY "auth_select_mensalidades" ON mensalidades
  FOR SELECT TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE lower(email) = lower(auth.email())
    )
  );

-- 3. Falecidos e locais de sepultamento do cliente logado
DROP POLICY IF EXISTS "auth_select_own_falecidos" ON falecidos;
CREATE POLICY "auth_select_own_falecidos" ON falecidos
  FOR SELECT TO authenticated
  USING (
    cliente_id IN (
      SELECT id FROM clientes WHERE lower(email) = lower(auth.email())
    )
  );

DROP POLICY IF EXISTS "auth_select_own_falecido_locais" ON falecido_locais;
CREATE POLICY "auth_select_own_falecido_locais" ON falecido_locais
  FOR SELECT TO authenticated
  USING (
    falecido_id IN (
      SELECT f.id
      FROM falecidos f
      JOIN clientes c ON c.id = f.cliente_id
      WHERE lower(c.email) = lower(auth.email())
    )
  );

COMMIT;

-- Conferência: deve retornar o registro com o e-mail em minúsculas
SELECT id, codigo_propri, nome, email, cpf_cnpj
FROM clientes
WHERE cpf_cnpj = '07566745000128';
