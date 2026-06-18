-- ============================================================
-- Seed 010 - Menu da Nutricionista + item Nutricionistas no Admin
-- Depende: 003_menu.sql
-- ============================================================

-- ── Grupo de menu ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM dbo.menu WHERE nome = 'Nutricionista')
  INSERT INTO dbo.menu (nome, icone, ordem) VALUES ('Nutricionista', 'Salad', 4);

-- ── Itens do menu NUTRICIONISTA ───────────────────────────
DECLARE @m_nutri INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Nutricionista');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
SELECT v.id_menu, v.nome, v.caminho, v.icone, v.ordem, v.administrador
FROM (VALUES
  (@m_nutri, 'Dashboard',   '/nutri',        'LayoutDashboard', 1, 0),
  (@m_nutri, 'Meus Planos', '/nutri/dietas', 'Salad',           2, 0),
  (@m_nutri, 'Meus Alunos', '/nutri/alunos', 'Users',           3, 0)
) AS v(id_menu, nome, caminho, icone, ordem, administrador)
WHERE NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = v.caminho);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'nutricionista'
  WHERE mi.id_menu = @m_nutri
    AND NOT EXISTS (
      SELECT 1 FROM dbo.menu_item_perfil mip
      WHERE mip.id_menu_item = mi.id_menu_item AND mip.id_perfil = p.id_perfil
    );

-- ── Item "Nutricionistas" no menu Admin ───────────────────
DECLARE @m_admin INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Administração');

IF NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = '/admin/nutricionistas')
BEGIN
  INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
  VALUES (@m_admin, 'Nutricionistas', '/admin/nutricionistas', 'Salad', 6, 1);

  INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
    SELECT mi.id_menu_item, p.id_perfil
    FROM dbo.menu_item mi
    JOIN dbo.perfil p ON p.nome = 'admin'
    WHERE mi.id_menu = @m_admin AND mi.caminho = '/admin/nutricionistas';
END
