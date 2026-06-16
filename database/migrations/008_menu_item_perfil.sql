-- ============================================================
-- 008 - Tabela de ligação menu_item <-> perfil
-- ============================================================

CREATE TABLE dbo.menu_item_perfil (
  id_menu_item_perfil INT NOT NULL IDENTITY(1,1),
  id_menu_item        INT NOT NULL,
  id_perfil           INT NOT NULL,
  CONSTRAINT PK_menu_item_perfil  PRIMARY KEY (id_menu_item_perfil),
  CONSTRAINT UQ_menu_item_perfil  UNIQUE (id_menu_item, id_perfil),
  CONSTRAINT FK_mip_menu_item     FOREIGN KEY (id_menu_item) REFERENCES dbo.menu_item(id_menu_item),
  CONSTRAINT FK_mip_perfil        FOREIGN KEY (id_perfil)    REFERENCES dbo.perfil(id_perfil)
);
