-- ============================================================
-- Seed 006 - Adiciona perguntas de sexo e idade ao questionário
-- Depende: 004_avaliacao_fitness.sql e migration 010
-- ============================================================

INSERT INTO dbo.avaliacao_fitness_pergunta (codigo, pergunta, tipo, obrigatorio, exibir_detalhe_sim, descricao_detalhe_sim, ordem) VALUES
  ('sexo',  'Qual é o seu sexo biológico?', 'opcao',  1, 0, NULL, 0),
  ('idade', 'Qual é a sua idade?',           'numero', 1, 0, NULL, 0);

-- Opções para sexo
DECLARE @sexo INT = (SELECT TOP 1 id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'sexo');
INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem) VALUES
  (@sexo, 'Masculino', 1),
  (@sexo, 'Feminino',  2);

-- Reordena: sexo e idade ficam antes das demais
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 1 WHERE codigo = 'sexo';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 2 WHERE codigo = 'idade';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 3 WHERE codigo = 'objetivo';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 4 WHERE codigo = 'nivel';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 5 WHERE codigo = 'dias_semana';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 6 WHERE codigo = 'tempo_treino';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 7 WHERE codigo = 'local_treino';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 8 WHERE codigo = 'lesao';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 9 WHERE codigo = 'peso';
UPDATE dbo.avaliacao_fitness_pergunta SET ordem = 10 WHERE codigo = 'altura';
