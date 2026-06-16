-- ============================================================
-- 004 - Shape Score (check-in diário)
-- ============================================================

CREATE TABLE dbo.shape_score (
  id_shape_score INT          IDENTITY(1,1) NOT NULL,
  id_usuario     INT          NOT NULL,
  data           DATE         NOT NULL,
  treino         BIT          NOT NULL DEFAULT 0,
  cardio         BIT          NOT NULL DEFAULT 0,
  dieta          DECIMAL(5,2) NOT NULL DEFAULT 0,   -- % aderência 0-100
  sono           DECIMAL(4,1) NOT NULL DEFAULT 0,   -- horas
  agua           DECIMAL(4,1) NOT NULL DEFAULT 0,   -- litros
  pontos         INT          NOT NULL DEFAULT 0,   -- 0-100
  data_registro  DATETIME     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_shape_score          PRIMARY KEY (id_shape_score),
  CONSTRAINT FK_shape_score_usuario  FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

-- Um check-in por usuário por dia
CREATE UNIQUE INDEX UX_shape_score_usuario_data ON dbo.shape_score (id_usuario, data);
CREATE        INDEX IX_shape_score_data         ON dbo.shape_score (data);
