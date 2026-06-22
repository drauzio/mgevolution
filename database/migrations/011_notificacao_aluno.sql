-- Tabela de notificações enviadas pelo admin para alunos
CREATE TABLE dbo.notificacao_aluno (
  id_notificacao_aluno INT IDENTITY(1,1) PRIMARY KEY,
  id_usuario           INT            NOT NULL,
  id_admin             INT            NOT NULL,
  titulo               NVARCHAR(200)  NOT NULL,
  descricao            NVARCHAR(1000) NULL,
  urgente              BIT            NOT NULL DEFAULT 0,
  lida                 BIT            NOT NULL DEFAULT 0,
  data_criacao         DATETIME       NOT NULL DEFAULT GETDATE(),
  CONSTRAINT FK_notif_aluno FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_notif_admin FOREIGN KEY (id_admin)   REFERENCES dbo.usuario(id_usuario)
)
