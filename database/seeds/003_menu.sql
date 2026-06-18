-- ============================================================
-- Seed 003 - Menus, itens e vínculos com perfil
-- Depende: 002_menu.sql, 007_perfil_usuario.sql, 008_menu_item_perfil.sql
-- ============================================================

-- ------------------------------------------------------------
-- Grupos de menu
-- ------------------------------------------------------------
delete menu
DBCC CHECKIDENT ('dbo.menu', RESEED, 0);

INSERT INTO dbo.menu (nome, icone, ordem, ativo)
VALUES
('Minha Jornada', 'Road', 1, 1),
('Meu Plano', 'Dumbbell', 2, 1),
('Comunidade', 'Users', 3, 1),
('Gestão', 'LayoutDashboard', 4, 1),
('Conteúdo', 'BookOpen', 5, 1),
('Equipe', 'UserCheck', 6, 1),
('Administração', 'Settings', 7, 1);

DBCC CHECKIDENT ('dbo.menu_item', RESEED, 0);
INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES
(1, 'Início', '/dashboard', 'Home', 1, 0, 1),
(1, 'Shape Score', '/shape-score', 'Flame', 2, 0, 1),
(1, 'Minha Evolução', '/evolucao', 'TrendingUp', 3, 0, 1),
(1, 'Shape Future IA', '/shape-future', 'Sparkles', 4, 0, 1),
(1, 'IA Coach', '/coach-ia', 'Bot', 5, 0, 1);

-- MEU PLANO
INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES
(2, 'Treinos', '/treinos', 'Dumbbell', 1, 0, 1),
(2, 'Dieta', '/dieta', 'Salad', 2, 0, 1),
(2, 'Minha Avaliação', '/minha-avaliacao', 'ClipboardList', 3, 0, 1);

-- COMUNIDADE
INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES
(3, 'Feed', '/comunidade', 'MessagesSquare', 1, 0, 1),
(3, 'Ranking', '/comunidade/ranking', 'Trophy', 2, 0, 1),
(3, 'Desafios', '/comunidade/desafios', 'Target', 3, 0, 1),
(3, 'Conquistas', '/comunidade/conquistas', 'Medal', 4, 0, 1);

-- GESTÃO
INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES
(4, 'Dashboard', '/gestao', 'LayoutDashboard', 1, 1, 1),
(4, 'Alunos', '/gestao/alunos', 'Users', 2, 1, 1),
(4, 'Avaliações', '/gestao/avaliacoes', 'ClipboardList', 3, 1, 1),
(4, 'Evolução dos Alunos', '/gestao/evolucao-alunos', 'TrendingUp', 4, 1, 1);

-- CONTEÚDO
INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES
(5, 'Treinos', '/conteudo/treinos', 'Dumbbell', 1, 1, 1),
(5, 'Dieta', '/conteudo/dietas', 'Salad', 2, 1, 1),
(5, 'Exercícios', '/conteudo/exercicios', 'Activity', 3, 1, 1),
(5, 'Protocolos', '/conteudo/protocolos', 'BookOpen', 4, 1, 1),
(5, 'Questionários', '/conteudo/questionarios', 'FileQuestion', 5, 1, 1);

-- EQUIPE
INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES
(6, 'Personais', '/equipe/personais', 'UserCheck', 1, 1, 1),
(6, 'Nutricionistas', '/equipe/nutricionistas', 'Salad', 2, 1, 1);

-- ADMINISTRAÇÃO
INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES
(7, 'Usuários', '/admin/usuarios', 'Users', 1, 1, 1),
(7, 'Planos', '/admin/planos', 'CreditCard', 2, 1, 1),
(7, 'Assinaturas', '/admin/assinaturas', 'Receipt', 3, 1, 1),
(7, 'Configurações', '/admin/configuracoes', 'Settings', 4, 1, 1),
(7, 'Integrações', '/admin/integracoes', 'Plug', 5, 1, 1),
(7, 'Logs', '/admin/logs', 'FileText', 6, 1, 1),
(7, 'Menu', '/admin/menu', 'Settings2', 99, 1, 1);


DELETE FROM dbo.usuario_perfil;
DELETE FROM dbo.perfil;

DBCC CHECKIDENT ('dbo.usuario_perfil', RESEED, 0);
DBCC CHECKIDENT ('dbo.perfil', RESEED, 0);

INSERT INTO dbo.perfil
(
    nome,
    descricao,
    ativo
)
VALUES
(
    'aluno',
    'Aluno da plataforma — acessa treinos, dieta, evolução e comunidade.',
    1
),
(
    'personal',
    'Personal trainer — gerencia alunos, avaliações, treinos e protocolos.',
    1
),
(
    'nutricionista',
    'Nutricionista — gerencia alunos, avaliações e planos alimentares.',
    1
),
(
    'admin',
    'Administrador — acesso total ao sistema e configurações.',
    1
);


INSERT INTO dbo.usuario_perfil
(
    id_usuario,
    id_perfil
)
VALUES
(
    1,
    4 -- admin
);


INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
SELECT mi.id_menu_item, p.id_perfil
FROM dbo.menu_item mi
JOIN dbo.perfil p ON p.nome = 'admin'
WHERE mi.ativo = 1;