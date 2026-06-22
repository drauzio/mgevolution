-- Grupo de menu "Comunicação"
IF NOT EXISTS (SELECT 1 FROM dbo.menu WHERE nome = 'Comunicação')
  INSERT INTO dbo.menu (nome, icone, ordem) VALUES ('Comunicação', 'MessageSquare', 90)
GO

-- Item de menu Notificações
IF NOT EXISTS (SELECT 1 FROM dbo.menu_item WHERE caminho = '/admin/notificacoes')
BEGIN
  DECLARE @id_menu  INT = (SELECT id_menu  FROM dbo.menu  WHERE nome = 'Comunicação')
  DECLARE @ordem    INT = ISNULL((SELECT MAX(ordem) FROM dbo.menu_item WHERE id_menu = @id_menu), 0) + 10

  INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
  VALUES (@id_menu, 'Notificações', '/admin/notificacoes', 'Bell', @ordem, 1)

  DECLARE @id_item   INT = SCOPE_IDENTITY()
  DECLARE @id_perfil INT = (SELECT id_perfil FROM dbo.perfil WHERE nome = 'admin')

  IF @id_perfil IS NOT NULL
    INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
    VALUES (@id_item, @id_perfil)
END
