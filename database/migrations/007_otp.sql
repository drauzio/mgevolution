CREATE TABLE dbo.otp_verificacao (
  id_otp_verificacao INT IDENTITY(1,1) PRIMARY KEY,
  telefone    VARCHAR(20)  NOT NULL,
  codigo      CHAR(6)      NOT NULL,
  token       VARCHAR(36)  NULL,           -- gerado após verificação bem-sucedida
  expira_em   DATETIME2    NOT NULL,
  tentativas  TINYINT      DEFAULT 0,
  verificado  BIT          DEFAULT 0,
  criado_em   DATETIME2    DEFAULT SYSUTCDATETIME()
)

CREATE INDEX IX_otp_telefone ON dbo.otp_verificacao (telefone, criado_em DESC)
