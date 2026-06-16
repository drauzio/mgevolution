-- ============================================================
-- Seed 003 - Menus, itens e vínculos com perfil
-- Depende: 002_menu.sql, 007_perfil_usuario.sql, 008_menu_item_perfil.sql
-- ============================================================

-- ------------------------------------------------------------
-- Grupos de menu
-- ------------------------------------------------------------
INSERT INTO dbo.menu (nome, icone, ordem) VALUES
  ('Aluno',    'Home',            1),
  ('Admin',    'LayoutDashboard', 2),
  ('Personal', 'UserCheck',       3);

-- ------------------------------------------------------------
-- Itens do menu ALUNO
-- ------------------------------------------------------------
DECLARE @m_aluno INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Aluno');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador) VALUES
  (@m_aluno, 'Início',          '/dashboard',    'Home',       1, 0),
  (@m_aluno, 'Shape Score',     '/shape-score',  'Flame',      2, 0),
  (@m_aluno, 'Shape Future IA', '/shape-future', 'Sparkles',   3, 0),
  (@m_aluno, 'IA Coach',        '/coach-ia',     'Bot',        4, 0),
  (@m_aluno, 'Treinos',         '/treinos',      'Dumbbell',   5, 0),
  (@m_aluno, 'Dieta',           '/dieta',        'Salad',      6, 0),
  (@m_aluno, 'Evolução',        '/evolucao',     'TrendingUp', 7, 0);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'aluno'
  WHERE mi.id_menu = @m_aluno;

-- ------------------------------------------------------------
-- Itens do menu ADMIN
-- ------------------------------------------------------------
DECLARE @m_admin INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Admin');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador) VALUES
  (@m_admin, 'Dashboard',   '/admin',           'LayoutDashboard', 1, 1),
  (@m_admin, 'Alunos',      '/admin/alunos',    'Users',           2, 1),
  (@m_admin, 'Treinos',     '/admin/treinos',   'Dumbbell',        3, 1),
  (@m_admin, 'Dieta',       '/admin/dieta',     'Salad',           4, 1),
  (@m_admin, 'Agendamento', '/admin/agenda',    'Calendar',        5, 1),
  (@m_admin, 'Personais',   '/admin/personais', 'UserCheck',       6, 1);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'admin'
  WHERE mi.id_menu = @m_admin;

-- ------------------------------------------------------------
-- Itens do menu PERSONAL
-- ------------------------------------------------------------
DECLARE @m_personal INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Personal');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador) VALUES
  (@m_personal, 'Dashboard',   '/personal',         'LayoutDashboard', 1, 0),
  (@m_personal, 'Meus Alunos', '/personal/alunos',  'Users',           2, 0),
  (@m_personal, 'Treinos',     '/personal/treinos', 'Dumbbell',        3, 0),
  (@m_personal, 'Agenda',      '/personal/agenda',  'Calendar',        4, 0);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'personal'
  WHERE mi.id_menu = @m_personal;
