-- ============================================================
-- Seed 015 - Acesso do Personal: Treinos, Protocolos e Exercícios
-- ============================================================

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
SELECT mi.id_menu_item, p.id_perfil
FROM dbo.menu_item mi
JOIN dbo.perfil p ON p.nome = 'personal'
WHERE mi.caminho IN (
  '/conteudo/treinos',
  '/conteudo/protocolos',
  '/conteudo/exercicios'
)
AND NOT EXISTS (
  SELECT 1 FROM dbo.menu_item_perfil x
  WHERE x.id_menu_item = mi.id_menu_item
    AND x.id_perfil = p.id_perfil
)
