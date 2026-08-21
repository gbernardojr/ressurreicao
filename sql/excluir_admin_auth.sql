-- ============================================================
-- Script: Criar função para exclusão de administrador no Auth
-- Execute este script no SQL Editor do Supabase
-- IMPORTANTE: certifique-se de que o role selecionado é "postgres"
-- ============================================================

-- Função com permissão elevada (SECURITY DEFINER) para excluir
-- o usuário do sistema de autenticação do Supabase (auth.users)
CREATE OR REPLACE FUNCTION public.excluir_admin_auth(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar o ID do usuário pelo e-mail
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- Se encontrado, excluir
  IF v_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;
END;
$$;

-- Liberar execução para as roles utilizadas pelo app (anon e authenticated)
GRANT EXECUTE ON FUNCTION public.excluir_admin_auth(text) TO anon, authenticated;
