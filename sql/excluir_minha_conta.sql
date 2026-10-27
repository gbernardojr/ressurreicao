-- ============================================================
-- Script: Exclusao de conta pelo proprio usuario
-- Execute no SQL Editor do Supabase com o role "postgres"
-- https://supabase.com/dashboard/project/pfzulktbhivfkfzuvztd/sql/new
-- ============================================================
--
-- Cria a funcao usada pelo app (Dados Pessoais > Excluir minha conta).
-- A funcao roda com privilegios elevados (SECURITY DEFINER) porque
-- somente o Auth pode remover registros de auth.users. O alvo e sempre
-- auth.uid(), ou seja, o proprio usuario autenticado: nao e possivel
-- excluir a conta de outra pessoa.

CREATE OR REPLACE FUNCTION public.excluir_minha_conta()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- Remove o vinculo de administrador, se existir.
  IF v_email IS NOT NULL THEN
    DELETE FROM public.admin_usuarios WHERE email = v_email;
  END IF;

  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Apenas usuarios logados podem executar; anonimos nao.
REVOKE ALL ON FUNCTION public.excluir_minha_conta() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.excluir_minha_conta() TO authenticated;
