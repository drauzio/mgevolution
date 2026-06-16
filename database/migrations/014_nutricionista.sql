-- ============================================================
-- 014 - Perfil nutricionista + vínculo com dieta_plano
-- ============================================================

-- Adiciona coluna id_nutricionista no plano alimentar
ALTER TABLE dbo.dieta_plano
  ADD id_nutricionista INT NULL
      CONSTRAINT FK_dieta_plano_nutricionista REFERENCES dbo.usuario(id_usuario);

-- ── Menu do Nutricionista (área própria) ──────────────────────
DECLARE @m_nutri INT;
INSERT INTO dbo.menu (nome, icone, ordem) VALUES ('Nutricionista', 'Salad', 4);
SET @m_nutri = SCOPE_IDENTITY();

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador) VALUES
  (@m_nutri, 'Dashboard',    '/nutri',         'LayoutDashboard', 1, 0),
  (@m_nutri, 'Meus Planos',  '/nutri/dietas',  'Salad',           2, 0),
  (@m_nutri, 'Meus Alunos',  '/nutri/alunos',  'Users',           3, 0);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT mi.id_menu_item, p.id_perfil
  FROM dbo.menu_item mi
  JOIN dbo.perfil p ON p.nome = 'nutricionista'
  WHERE mi.id_menu = @m_nutri;

-- ── Item "Nutricionistas" no menu Admin ───────────────────────
DECLARE @m_admin INT = (SELECT id_menu FROM dbo.menu WHERE nome = 'Admin');

INSERT INTO dbo.menu_item (id_menu, nome, caminho, icone, ordem, administrador)
VALUES (@m_admin, 'Nutricionistas', '/admin/nutricionistas', 'Salad', 7, 1);

INSERT INTO dbo.menu_item_perfil (id_menu_item, id_perfil)
  SELECT SCOPE_IDENTITY(), id_perfil FROM dbo.perfil WHERE nome = 'admin';
