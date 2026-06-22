-- Seeds: conquistas padrão do sistema
INSERT INTO dbo.conquista (codigo, nome, descricao, icone, criterio_tipo, criterio_valor) VALUES
('primeiro_treino',  'Primeira Vez!',       'Concluiu o primeiro treino',                  '🎯', 'primeiro_treino', 1),
('treinos_10',       'Em Ritmo',            'Concluiu 10 treinos',                         '🔥', 'treinos_total',   10),
('treinos_30',       'Consistente',         'Concluiu 30 treinos',                         '💪', 'treinos_total',   30),
('treinos_100',      'Centenário',          'Concluiu 100 treinos',                        '🏅', 'treinos_total',   100),
('streak_7',         'Uma Semana Seguida',  'Treinou 7 dias seguidos',                     '📅', 'streak_dias',     7),
('streak_30',        'Mês Perfeito',        'Treinou 30 dias seguidos',                    '🌟', 'streak_dias',     30),
('primeira_medida',  'Me Conhecendo',       'Registrou a primeira medida corporal',        '📏', 'medida',          1),
('primeiro_desafio', 'Aceitei o Desafio',   'Completou o primeiro desafio',               '🎖️', 'desafio',         1)
