-- ============================================================
-- Seed 012 - Item "Configurações" no painel Admin
-- ============================================================

DECLARE @m_admin INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Administração');

IF NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = '/admin/configuracoes')
BEGIN
  INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
  VALUES (@m_admin, 'Configurações', '/admin/configuracoes', 'Settings', 100, 1);

  INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
    SELECT mi.id_menu_item, p.id_perfil
    FROM dbo.menu_item mi
    JOIN dbo.perfil p ON p.nome = 'admin'
    WHERE mi.caminho = '/admin/configuracoes';
END
