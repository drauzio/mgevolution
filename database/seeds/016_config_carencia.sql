-- ============================================================
-- Seed 016 - Configurações de Acesso e Carência
-- ============================================================

INSERT INTO dbo.configuracao (categoria, chave, label, descricao, valor, tipo, ordem) VALUES
('acesso', 'dias_carencia',          'Dias de carência',              'Período gratuito após o cadastro antes de exigir assinatura',   '7',  'numero',   1),
('acesso', 'carencia_ativa',         'Carência ativa',                'Se desativado, exige assinatura imediatamente após o cadastro', '1',  'booleano', 2),
('acesso', 'bloquear_sem_assinatura','Bloquear sem assinatura',       'Impede acesso ao app quando carência expira e sem assinatura ativa', '1', 'booleano', 3)
