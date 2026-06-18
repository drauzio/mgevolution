-- Seed 013 - Item "Pagamentos" no grupo Administração
DECLARE @m INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Administração');

IF NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = '/admin/pagamentos')
BEGIN
  INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
  VALUES (@m, 'Pagamentos', '/admin/pagamentos', 'DollarSign', 7, 1);

  INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
    SELECT mi.id_menu_item, p.id_perfil
    FROM dbo.menu_item mi
    JOIN dbo.perfil p ON p.nome = 'admin'
    WHERE mi.caminho = '/admin/pagamentos';
END
