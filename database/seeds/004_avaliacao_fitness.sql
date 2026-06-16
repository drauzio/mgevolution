-- ============================================================
-- Seed 004 - Perguntas e opções do questionário de avaliação fitness
-- Depende: 003_avaliacao_fitness.sql
-- ============================================================

-- Perguntas
INSERT INTO dbo.avaliacao_fitness_pergunta (codigo, pergunta, tipo, exibir_detalhe_sim, descricao_detalhe_sim, ordem) VALUES
  ('objetivo',      'Qual é seu principal objetivo?',             'opcao',  0, NULL,               1),
  ('nivel',         'Qual é seu nível de treino?',                'opcao',  0, NULL,               2),
  ('dias_semana',   'Quantos dias por semana você pode treinar?', 'numero', 0, NULL,               3),
  ('tempo_treino',  'Quanto tempo você tem por treino?',          'opcao',  0, NULL,               4),
  ('local_treino',  'Onde você prefere treinar?',                 'opcao',  0, NULL,               5),
  ('lesao',         'Você possui alguma lesão ou limitação?',     'bool',   1, 'Descreva sua lesão.', 6),
  ('peso',          'Qual seu peso atual (kg)?',                  'numero', 0, NULL,               7),
  ('altura',        'Qual sua altura (cm)?',                      'numero', 0, NULL,               8);

-- ------------------------------------------------------------
-- Opções: objetivo
-- ------------------------------------------------------------
DECLARE @objetivo INT = (SELECT TOP 1 id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'objetivo');
INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem) VALUES
  (@objetivo, 'Ganhar massa muscular',       1),
  (@objetivo, 'Emagrecer',                   2),
  (@objetivo, 'Melhorar condicionamento',    3),
  (@objetivo, 'Saúde e qualidade de vida',   4);

-- ------------------------------------------------------------
-- Opções: nivel
-- ------------------------------------------------------------
DECLARE @nivel INT = (SELECT TOP 1 id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'nivel');
INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem) VALUES
  (@nivel, 'Iniciante — menos de 6 meses',      1),
  (@nivel, 'Intermediário — 6 meses a 2 anos',  2),
  (@nivel, 'Avançado — mais de 2 anos',          3);

-- ------------------------------------------------------------
-- Opções: tempo_treino
-- ------------------------------------------------------------
DECLARE @tempo INT = (SELECT TOP 1 id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'tempo_treino');
INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem) VALUES
  (@tempo, '30 minutos',        1),
  (@tempo, '45 minutos',        2),
  (@tempo, '60 minutos',        3),
  (@tempo, '90 minutos ou mais',4);

-- ------------------------------------------------------------
-- Opções: local_treino
-- ------------------------------------------------------------
DECLARE @local INT = (SELECT TOP 1 id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'local_treino');
INSERT INTO dbo.avaliacao_fitness_pergunta_opcao (id_avaliacao_fitness_pergunta, valor, ordem) VALUES
  (@local, 'Academia',     1),
  (@local, 'Em casa',      2),
  (@local, 'Ao ar livre',  3);
