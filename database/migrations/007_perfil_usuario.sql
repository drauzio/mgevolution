-- ============================================================
-- 007 - Tabela de perfis e ligação usuario_perfil
-- ============================================================

-- ------------------------------------------------------------
-- Catálogo de perfis
-- ------------------------------------------------------------
CREATE TABLE dbo.perfil (
  id_perfil    INT          IDENTITY(1,1) NOT NULL,
  nome         VARCHAR(30)  NOT NULL UNIQUE,   -- 'aluno', 'personal', 'admin'
  descricao    VARCHAR(100) NULL,
  ativo        BIT          NOT NULL DEFAULT 1,
  data_criacao DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_perfil PRIMARY KEY (id_perfil)
);

-- ------------------------------------------------------------
-- Ligação usuario <-> perfil (N:N)
-- ------------------------------------------------------------
CREATE TABLE dbo.usuario_perfil (
  id_usuario_perfil INT      IDENTITY(1,1) NOT NULL,
  id_usuario        INT      NOT NULL,
  id_perfil         INT      NOT NULL,
  ativo             BIT      NOT NULL DEFAULT 1,
  data_criacao      DATETIME NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_usuario_perfil    PRIMARY KEY (id_usuario_perfil),
  CONSTRAINT UQ_usuario_perfil    UNIQUE (id_usuario, id_perfil),
  CONSTRAINT FK_up_usuario        FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_up_perfil         FOREIGN KEY (id_perfil)  REFERENCES dbo.perfil(id_perfil)
);

CREATE INDEX IX_usuario_perfil_usuario ON dbo.usuario_perfil (id_usuario, ativo);

