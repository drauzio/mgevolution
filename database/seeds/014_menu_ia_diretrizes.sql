-- ============================================================
-- Seed 014 - Menu: Diretrizes de IA
-- ============================================================

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador, ativo)
VALUES (7, 'Diretrizes de IA', '/admin/ia-diretrizes', 'BotMessageSquare', 8, 1, 1)

DECLARE @id INT = SCOPE_IDENTITY()

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil) VALUES (@id, 4) -- admin
INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil) VALUES (@id, 3) -- nutricionista
INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil) VALUES (@id, 2) -- personal
