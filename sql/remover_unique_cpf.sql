-- Remover a constraint UNIQUE em cpf_cnpj na tabela clientes
-- Isso permite que um mesmo CPF/CNPJ tenha múltiplos jazigos
-- Cada jazigo vira um registro separado na tabela clientes

DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Encontrar o nome da constraint unique em cpf_cnpj
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'clientes'
    AND con.contype = 'u'
    AND con.conkey = ARRAY[
      (SELECT attnum FROM pg_attribute WHERE attrelid = rel.oid AND attname = 'cpf_cnpj')
    ];

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE clientes DROP CONSTRAINT ' || constraint_name;
    RAISE NOTICE 'Constraint % dropped', constraint_name;
  ELSE
    RAISE NOTICE 'No unique constraint on cpf_cnpj found';
  END IF;
END $$;
