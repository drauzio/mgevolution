-- Remove item "Agendamento" do menu Admin e "Agenda" do menu Personal
-- Executar no banco mgevolution

DELETE FROM dbo.menu_item_perfil
WHERE id_menu_item IN (
  SELECT id_menu_item FROM dbo.menu_item
  WHERE caminho IN ('/admin/agenda', '/personal/agenda')
);

DELETE FROM dbo.menu_item
WHERE caminho IN ('/admin/agenda', '/personal/agenda');
