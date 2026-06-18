IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'auditoria_log')
BEGIN
  CREATE TABLE dbo.auditoria_log (
    id_log       INT IDENTITY(1,1) NOT NULL,
    id_usuario   INT           NOT NULL,
    nome_usuario VARCHAR(100)  NULL,
    acao         VARCHAR(50)   NOT NULL,
    entidade     VARCHAR(50)   NULL,
    id_entidade  INT           NULL,
    descricao    VARCHAR(500)  NULL,
    dados_antes  NVARCHAR(MAX) NULL,
    dados_depois NVARCHAR(MAX) NULL,
    ip           VARCHAR(45)   NULL,
    data_acao    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_auditoria_log PRIMARY KEY (id_log),
    CONSTRAINT FK_auditoria_log_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
  );

  CREATE INDEX IX_auditoria_log_usuario  ON dbo.auditoria_log(id_usuario);
  CREATE INDEX IX_auditoria_log_acao     ON dbo.auditoria_log(acao);
  CREATE INDEX IX_auditoria_log_data     ON dbo.auditoria_log(data_acao);
  CREATE INDEX IX_auditoria_log_entidade ON dbo.auditoria_log(entidade, id_entidade);
END;
