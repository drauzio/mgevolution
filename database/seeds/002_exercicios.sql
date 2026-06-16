-- ============================================================
-- Seed 002 - Catálogo de exercícios base
-- ============================================================

INSERT INTO dbo.exercicio (nome, grupo_muscular, equipamento) VALUES

-- PEITO
('Supino Reto com Barra',       'Peito', 'Barra'),
('Supino Inclinado com Barra',  'Peito', 'Barra'),
('Supino Reto com Halteres',    'Peito', 'Halteres'),
('Supino Inclinado Halteres',   'Peito', 'Halteres'),
('Crucifixo com Halteres',      'Peito', 'Halteres'),
('Crossover no Cabo',            'Peito', 'Cabo'),
('Peck Deck (Voador)',           'Peito', 'Máquina'),
('Flexão de Braço',              'Peito', 'Peso corporal'),

-- COSTAS
('Puxada Frontal',              'Costas', 'Cabo'),
('Puxada Atrás',                'Costas', 'Cabo'),
('Remada Curvada com Barra',    'Costas', 'Barra'),
('Remada Unilateral Halter',    'Costas', 'Halteres'),
('Remada Cavalinho',            'Costas', 'Máquina'),
('Pulldown no Cabo',            'Costas', 'Cabo'),
('Levantamento Terra',          'Costas', 'Barra'),
('Barra Fixa',                  'Costas', 'Peso corporal'),

-- PERNAS
('Agachamento Livre',           'Pernas', 'Barra'),
('Agachamento no Smith',        'Pernas', 'Máquina'),
('Leg Press 45°',               'Pernas', 'Máquina'),
('Cadeira Extensora',           'Pernas', 'Máquina'),
('Mesa Flexora',                'Pernas', 'Máquina'),
('Stiff com Barra',             'Pernas', 'Barra'),
('Avanço com Halteres',         'Pernas', 'Halteres'),
('Panturrilha em Pé',           'Pernas', 'Máquina'),
('Panturrilha Sentado',         'Pernas', 'Máquina'),
('Abdução de Quadril',          'Pernas', 'Máquina'),
('Adução de Quadril',           'Pernas', 'Máquina'),

-- OMBRO
('Desenvolvimento com Barra',   'Ombro', 'Barra'),
('Desenvolvimento Halteres',    'Ombro', 'Halteres'),
('Elevação Lateral',            'Ombro', 'Halteres'),
('Elevação Frontal',            'Ombro', 'Halteres'),
('Elevação Lateral no Cabo',    'Ombro', 'Cabo'),
('Encolhimento de Ombros',      'Ombro', 'Halteres'),
('Remada Alta',                 'Ombro', 'Barra'),
('Crucifixo Inverso',           'Ombro', 'Halteres'),

-- BÍCEPS
('Rosca Direta com Barra',      'Bíceps', 'Barra'),
('Rosca Alternada Halteres',    'Bíceps', 'Halteres'),
('Rosca Martelo',               'Bíceps', 'Halteres'),
('Rosca Scott',                  'Bíceps', 'Máquina'),
('Rosca Concentrada',           'Bíceps', 'Halteres'),
('Rosca no Cabo',               'Bíceps', 'Cabo'),

-- TRÍCEPS
('Tríceps Testa com Barra',     'Tríceps', 'Barra'),
('Tríceps Francês Halteres',    'Tríceps', 'Halteres'),
('Tríceps Pulley',              'Tríceps', 'Cabo'),
('Tríceps Corda',               'Tríceps', 'Cabo'),
('Mergulho no Banco',           'Tríceps', 'Peso corporal'),
('Tríceps Coice',               'Tríceps', 'Halteres'),

-- ABDÔMEN
('Abdominal Crunch',            'Abdômen', 'Peso corporal'),
('Prancha',                     'Abdômen', 'Peso corporal'),
('Abdominal Infra',             'Abdômen', 'Peso corporal'),
('Abdominal Oblíquo',          'Abdômen', 'Peso corporal'),
('Abdominal na Polia',          'Abdômen', 'Cabo'),
('Elevação de Pernas',          'Abdômen', 'Peso corporal'),

-- CARDIO
('Esteira',                     'Cardio', 'Máquina'),
('Bicicleta Ergométrica',       'Cardio', 'Máquina'),
('Elíptico',                    'Cardio', 'Máquina'),
('Corda de Pular',              'Cardio', 'Peso corporal'),
('HIIT na Esteira',             'Cardio', 'Máquina');
