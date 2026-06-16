-- ============================================================
-- Seed 005 - Item de menu: Avaliações (admin)
-- Depende: 003_menu.sql
-- ============================================================

DECLARE @m_admin INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Admin');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
VALUES (@m_admin, 'Avaliações', '/admin/avaliacoes', 'ClipboardList', 7, 1);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'admin'
  WHERE mi.id_menu = @m_admin AND mi.caminho = '/admin/avaliacoes';
