-- ============================================================
-- 012 - Módulo de Dieta
-- dieta_plano → dieta_refeicao → dieta_refeicao_item
-- ============================================================

CREATE TABLE dbo.dieta_plano (
  id_plano         INT           IDENTITY(1,1) NOT NULL,
  id_usuario       INT           NOT NULL,
  id_personal      INT           NULL,
  nome             VARCHAR(120)  NOT NULL,
  objetivo         VARCHAR(200)  NULL,
  calorias_meta    INT           NULL,
  proteina_meta    INT           NULL,
  observacoes      VARCHAR(500)  NULL,
  ativo            BIT           NOT NULL DEFAULT 1,
  data_inicio      DATE          NULL,
  data_fim         DATE          NULL,
  data_criacao     DATETIME      NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao DATETIME      NULL,
  CONSTRAINT PK_dieta_plano PRIMARY KEY (id_plano),
  CONSTRAINT FK_dieta_plano_usuario  FOREIGN KEY (id_usuario)  REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_dieta_plano_personal FOREIGN KEY (id_personal) REFERENCES dbo.usuario(id_usuario)
);

CREATE TABLE dbo.dieta_refeicao (
  id_refeicao  INT          IDENTITY(1,1) NOT NULL,
  id_plano     INT          NOT NULL,
  nome         VARCHAR(80)  NOT NULL,
  horario      VARCHAR(5)   NULL,
  ordem        TINYINT      NOT NULL DEFAULT 1,
  CONSTRAINT PK_dieta_refeicao PRIMARY KEY (id_refeicao),
  CONSTRAINT FK_dieta_refeicao_plano FOREIGN KEY (id_plano) REFERENCES dbo.dieta_plano(id_plano)
);

CREATE TABLE dbo.dieta_refeicao_item (
  id_item      INT            IDENTITY(1,1) NOT NULL,
  id_refeicao  INT            NOT NULL,
  descricao    VARCHAR(200)   NOT NULL,
  quantidade   DECIMAL(8,1)   NULL,
  unidade      VARCHAR(20)    NULL DEFAULT 'g',
  calorias     INT            NULL,
  proteina     INT            NULL,
  carboidrato  INT            NULL,
  gordura      INT            NULL,
  ordem        TINYINT        NOT NULL DEFAULT 1,
  CONSTRAINT PK_dieta_refeicao_item PRIMARY KEY (id_item),
  CONSTRAINT FK_dri_refeicao FOREIGN KEY (id_refeicao) REFERENCES dbo.dieta_refeicao(id_refeicao)
);

CREATE INDEX IX_dieta_plano_usuario  ON dbo.dieta_plano (id_usuario, ativo);
CREATE INDEX IX_dieta_refeicao_plano ON dbo.dieta_refeicao (id_plano, ordem);
CREATE INDEX IX_dri_refeicao         ON dbo.dieta_refeicao_item (id_refeicao, ordem);
