-- ============================================================
-- 002 - Menu, Menu Item e permissões por usuário
-- ============================================================

CREATE TABLE dbo.menu (
  id_menu                INT          IDENTITY(1,1) NOT NULL,
  nome                   VARCHAR(100) NOT NULL,
  icone                  VARCHAR(50)  NULL,
  ordem                  INT          NOT NULL DEFAULT 0,
  id_usuario_criacao     INT          NULL,
  data_criacao           DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  id_usuario_atualizacao INT          NULL,
  data_atualizacao       DATETIME     NULL,
  ativo                  BIT          NOT NULL DEFAULT 1,
  CONSTRAINT PK_menu                          PRIMARY KEY (id_menu),
  CONSTRAINT FK_menu_id_usuario_criacao       FOREIGN KEY (id_usuario_criacao)     REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_menu_id_usuario_atualizacao   FOREIGN KEY (id_usuario_atualizacao) REFERENCES dbo.usuario(id_usuario)
);
CREATE UNIQUE INDEX UX_Menu_Grupo_Nome  ON dbo.menu(nome);
CREATE        INDEX IX_Menu_Grupo_Ordem ON dbo.menu(ordem);

CREATE TABLE dbo.menu_item (
  id_menu_item           INT          IDENTITY(1,1) NOT NULL,
  id_menu                INT          NOT NULL,
  nome                   VARCHAR(120) NOT NULL,
  caminho                VARCHAR(255) NOT NULL,
  icone                  VARCHAR(50)  NULL,
  ordem                  INT          NOT NULL DEFAULT 0,
  administrador          BIT          NOT NULL DEFAULT 1,
  id_usuario_criacao     INT          NULL,
  data_criacao           DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  id_usuario_atualizacao INT          NULL,
  data_atualizacao       DATETIME     NULL,
  ativo                  BIT          NOT NULL DEFAULT 1,
  CONSTRAINT PK_menu_item                         PRIMARY KEY (id_menu_item),
  CONSTRAINT FK_menu_item_id_menu                 FOREIGN KEY (id_menu)                REFERENCES dbo.menu(id_menu),
  CONSTRAINT FK_menu_item_id_usuario_criacao      FOREIGN KEY (id_usuario_criacao)     REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_menu_item_id_usuario_atualizacao  FOREIGN KEY (id_usuario_atualizacao) REFERENCES dbo.usuario(id_usuario)
);
CREATE        INDEX IX_Menu_Item_Grupo_Ordem ON dbo.menu_item(id_menu, ordem);
CREATE UNIQUE INDEX UX_Menu_Item_Caminho     ON dbo.menu_item(caminho);

