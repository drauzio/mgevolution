-- ============================================================
-- Seed 008 - Item de menu: Questionário (admin)
-- Depende: 003_menu.sql, 008_menu_item_perfil (migration)
-- ============================================================

DECLARE @m_admin INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Admin');

IF NOT EXISTS (
  SELECT 1 FROM dbo.menu_item
  WHERE id_menu = @m_admin AND caminho = '/admin/questionario'
)
BEGIN
  INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
  VALUES (@m_admin, 'Questionário', '/admin/questionario', 'FileQuestion', 8, 1);

  INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
    SELECT mi.id_menu_item, p.id_perfil
    FROM dbo.menu_item mi
    JOIN dbo.perfil p ON p.nome = 'admin'
    WHERE mi.id_menu = @m_admin AND mi.caminho = '/admin/questionario';
END
