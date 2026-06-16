-- ============================================================
-- Seed 003 - Menus, itens e vínculos com perfil
-- Depende: 002_menu.sql, 007_perfil_usuario.sql, 008_menu_item_perfil.sql
-- ============================================================

-- ------------------------------------------------------------
-- Grupos de menu
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.menu WHERE nome = 'Aluno')
  INSERT INTO dbo.menu (nome, icone, ordem) VALUES ('Aluno', 'Home', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.menu WHERE nome = 'Admin')
  INSERT INTO dbo.menu (nome, icone, ordem) VALUES ('Admin', 'LayoutDashboard', 2);

IF NOT EXISTS (SELECT 1 FROM dbo.menu WHERE nome = 'Personal')
  INSERT INTO dbo.menu (nome, icone, ordem) VALUES ('Personal', 'UserCheck', 3);

-- ------------------------------------------------------------
-- Itens do menu ALUNO
-- ------------------------------------------------------------
DECLARE @m_aluno INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Aluno');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
SELECT v.id_menu, v.nome, v.caminho, v.icone, v.ordem, v.administrador
FROM (VALUES
  (@m_aluno, 'Início',          '/dashboard',    'Home',       1, 0),
  (@m_aluno, 'Shape Score',     '/shape-score',  'Flame',      2, 0),
  (@m_aluno, 'Shape Future IA', '/shape-future', 'Sparkles',   3, 0),
  (@m_aluno, 'IA Coach',        '/coach-ia',     'Bot',        4, 0),
  (@m_aluno, 'Treinos',         '/treinos',      'Dumbbell',   5, 0),
  (@m_aluno, 'Dieta',           '/dieta',        'Salad',      6, 0),
  (@m_aluno, 'Evolução',        '/evolucao',     'TrendingUp', 7, 0)
) AS v(id_menu, nome, caminho, icone, ordem, administrador)
WHERE NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = v.caminho);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'aluno'
  WHERE mi.id_menu = @m_aluno
    AND NOT EXISTS (
      SELECT 1 FROM dbo.menu_item_perfil mip
      WHERE mip.id_menu_item = mi.id_menu_item AND mip.id_perfil = p.id_perfil
    );

-- ------------------------------------------------------------
-- Itens do menu ADMIN
-- ------------------------------------------------------------
DECLARE @m_admin INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Admin');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
SELECT v.id_menu, v.nome, v.caminho, v.icone, v.ordem, v.administrador
FROM (VALUES
  (@m_admin, 'Dashboard',   '/admin',           'LayoutDashboard', 1, 1),
  (@m_admin, 'Alunos',      '/admin/alunos',    'Users',           2, 1),
  (@m_admin, 'Treinos',     '/admin/treinos',   'Dumbbell',        3, 1),
  (@m_admin, 'Dieta',       '/admin/dieta',     'Salad',           4, 1),
  (@m_admin, 'Personais',   '/admin/personais', 'UserCheck',       5, 1)
) AS v(id_menu, nome, caminho, icone, ordem, administrador)
WHERE NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = v.caminho);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'admin'
  WHERE mi.id_menu = @m_admin
    AND NOT EXISTS (
      SELECT 1 FROM dbo.menu_item_perfil mip
      WHERE mip.id_menu_item = mi.id_menu_item AND mip.id_perfil = p.id_perfil
    );

-- ------------------------------------------------------------
-- Itens do menu PERSONAL
-- ------------------------------------------------------------
DECLARE @m_personal INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Personal');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
SELECT v.id_menu, v.nome, v.caminho, v.icone, v.ordem, v.administrador
FROM (VALUES
  (@m_personal, 'Dashboard',   '/personal',         'LayoutDashboard', 1, 0),
  (@m_personal, 'Meus Alunos', '/personal/alunos',  'Users',           2, 0),
  (@m_personal, 'Treinos',     '/personal/treinos', 'Dumbbell',        3, 0)
) AS v(id_menu, nome, caminho, icone, ordem, administrador)
WHERE NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = v.caminho);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'personal'
  WHERE mi.id_menu = @m_personal
    AND NOT EXISTS (
      SELECT 1 FROM dbo.menu_item_perfil mip
      WHERE mip.id_menu_item = mi.id_menu_item AND mip.id_perfil = p.id_perfil
    );
