-- ============================================================
-- Seed 007 - Insere opções faltando nas perguntas de avaliação
-- Seguro para rodar múltiplas vezes (só insere se não existir)
-- ============================================================

INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem)
SELECT p.id_avaliacao_fitness_pergunta, src.val, src.ord
FROM (VALUES
  -- objetivo
  ('objetivo', 'Ganhar massa muscular',       1),
  ('objetivo', 'Emagrecer',                   2),
  ('objetivo', 'Melhorar condicionamento',    3),
  ('objetivo', 'Saúde e qualidade de vida',   4),
  -- nivel
  ('nivel',    'Iniciante — menos de 6 meses',      1),
  ('nivel',    'Intermediário — 6 meses a 2 anos',  2),
  ('nivel',    'Avançado — mais de 2 anos',          3),
  -- tempo_treino
  ('tempo_treino', '30 minutos',         1),
  ('tempo_treino', '45 minutos',         2),
  ('tempo_treino', '60 minutos',         3),
  ('tempo_treino', '90 minutos ou mais', 4),
  -- local_treino
  ('local_treino', 'Academia',    1),
  ('local_treino', 'Em casa',     2),
  ('local_treino', 'Ao ar livre', 3)
) AS src(codigo, val, ord)
JOIN dbo.avaliacao_fitness_pergunta p ON p.codigo = src.codigo
WHERE NOT EXISTS (
  SELECT 1
  FROM dbo.avaliacao_fitness_pergunta_opcao o
  WHERE o.id_avaliacao_fitness_pergunta = p.id_avaliacao_fitness_pergunta
    AND o.valor = src.val
);
