CREATE TABLE dbo.configuracao (
  id_config     INT IDENTITY(1,1) PRIMARY KEY,
  categoria     VARCHAR(50)   NOT NULL,
  chave         VARCHAR(100)  NOT NULL,
  label         VARCHAR(200)  NOT NULL,
  descricao     VARCHAR(400)  NULL,
  valor         NVARCHAR(MAX) NULL,
  tipo          VARCHAR(20)   NOT NULL DEFAULT 'texto', -- texto | numero | booleano | textarea
  ordem         INT           DEFAULT 0,
  atualizado_em DATETIME2     DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_config_chave UNIQUE (categoria, chave)
)
