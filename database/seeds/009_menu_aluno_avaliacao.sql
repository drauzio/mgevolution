-- ============================================================
-- Seed 009 - Item de menu: Minha Avaliação (aluno)
-- ============================================================

DECLARE @m_aluno INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Aluno');

IF NOT EXISTS (
  SELECT 1 FROM dbo.menu_item
  WHERE id_menu = @m_aluno AND caminho = '/minha-avaliacao'
)
BEGIN
  INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
  VALUES (@m_aluno, 'Minha Avaliação', '/minha-avaliacao', 'ClipboardList', 8, 0);

  INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
    SELECT mi.id_menu_item, p.id_perfil
    FROM dbo.menu_item mi
    JOIN dbo.perfil p ON p.nome = 'aluno'
    WHERE mi.id_menu = @m_aluno AND mi.caminho = '/minha-avaliacao';
END
