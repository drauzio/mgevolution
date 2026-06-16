-- ============================================================
-- 001 - Usuário e reset de senha
-- ============================================================

CREATE TABLE dbo.usuario (
  id_usuario          INT IDENTITY(1,1) NOT NULL,
  nome                VARCHAR(120)      NOT NULL,
  cpf                 VARCHAR(11)       NOT NULL,
  email               VARCHAR(120)      NOT NULL UNIQUE,
  senha_hash          VARBINARY(256)    NOT NULL,
  telefone            VARCHAR(20)       NULL,
  ativo               BIT               NOT NULL DEFAULT 1,
  administrador       BIT               NOT NULL DEFAULT 0,
  senha_provisoria    BIT               NOT NULL DEFAULT 0,
  data_criacao        DATETIME          NOT NULL DEFAULT SYSUTCDATETIME(),
  usuario_atualizacao VARCHAR(120)      NULL,
  data_atualizacao    DATETIME          NULL,
  CONSTRAINT PK_usuario PRIMARY KEY (id_usuario)
);

CREATE TABLE dbo.usuario_reset_senha (
  id_usuario_reset_senha INT IDENTITY(1,1) NOT NULL,
  id_usuario             INT              NOT NULL REFERENCES dbo.usuario(id_usuario),
  token                  VARCHAR(200)     NOT NULL UNIQUE,
  expiracao              DATETIME         NOT NULL,
  usado                  BIT              NOT NULL DEFAULT 0,
  data_criacao           DATETIME         NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT PK_usuario_reset_senha PRIMARY KEY (id_usuario_reset_senha),
  CONSTRAINT FK_usuario_reset_senha_id_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);
