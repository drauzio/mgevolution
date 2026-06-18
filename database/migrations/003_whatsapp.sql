-- Tabela de log de mensagens WhatsApp
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'whatsapp_log')
BEGIN
  CREATE TABLE dbo.whatsapp_log (
    id_log       INT IDENTITY(1,1) NOT NULL,
    tipo         VARCHAR(50)   NOT NULL,
    id_usuario   INT           NULL,
    telefone     VARCHAR(20)   NULL,
    status       VARCHAR(10)   NOT NULL DEFAULT 'enviado',
    message_id   VARCHAR(100)  NULL,
    motivo_erro  VARCHAR(500)  NULL,
    data_envio   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_whatsapp_log PRIMARY KEY (id_log),
    CONSTRAINT CK_whatsapp_log_status CHECK (status IN ('enviado','erro')),
    CONSTRAINT FK_whatsapp_log_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
  );

  CREATE INDEX IX_whatsapp_log_usuario   ON dbo.whatsapp_log(id_usuario);
  CREATE INDEX IX_whatsapp_log_tipo_data ON dbo.whatsapp_log(tipo, data_envio);
END;
