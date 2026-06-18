-- ============================================================
-- 002 - Planos e Assinaturas
-- Execute conectado ao banco mgevolution
-- ============================================================

USE mgevolution;
GO

-- Planos oferecidos pela academia
CREATE TABLE dbo.plano (
  id_plano       INT           IDENTITY(1,1) NOT NULL,
  nome           VARCHAR(100)  NOT NULL,
  descricao      VARCHAR(500)  NULL,
  preco          DECIMAL(10,2) NOT NULL DEFAULT 0,
  duracao_dias   INT           NOT NULL DEFAULT 30,
  ativo          BIT           NOT NULL DEFAULT 1,
  data_criacao   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_plano PRIMARY KEY (id_plano)
);
GO

-- Assinaturas dos alunos
CREATE TABLE dbo.assinatura (
  id_assinatura    INT           IDENTITY(1,1) NOT NULL,
  id_usuario       INT           NOT NULL,
  id_plano         INT           NOT NULL,
  data_inicio      DATE          NOT NULL,
  data_fim         DATE          NOT NULL,
  status           VARCHAR(20)   NOT NULL DEFAULT 'ativa',  -- ativa | suspensa | cancelada | expirada
  valor_pago       DECIMAL(10,2) NULL,
  observacao       VARCHAR(500)  NULL,
  data_criacao     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_assinatura            PRIMARY KEY (id_assinatura),
  CONSTRAINT FK_assinatura_usuario    FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_assinatura_plano      FOREIGN KEY (id_plano)   REFERENCES dbo.plano(id_plano),
  CONSTRAINT CK_assinatura_status     CHECK (status IN ('ativa','suspensa','cancelada','expirada')),
  CONSTRAINT CK_assinatura_datas      CHECK (data_fim >= data_inicio)
);
GO

CREATE INDEX IX_assinatura_usuario ON dbo.assinatura (id_usuario, status);
CREATE INDEX IX_assinatura_status  ON dbo.assinatura (status, data_fim);
GO
