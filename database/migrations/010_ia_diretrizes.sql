-- ============================================================
-- IA DIRETRIZES
-- Diretrizes por usuário (nutricionista ou personal) que entram
-- automaticamente no prompt de geração de dieta/treino conforme
-- perfil do aluno
-- ============================================================

CREATE TABLE dbo.ia_diretriz (
  id_diretriz      INT            IDENTITY(1,1) NOT NULL,
  id_usuario       INT            NOT NULL,        -- nutricionista OU personal
  nome             VARCHAR(100)   NOT NULL,
  tipo             VARCHAR(20)    NOT NULL DEFAULT 'dieta',  -- 'dieta' | 'treino'
  conteudo         NVARCHAR(3000) NOT NULL,
  ativo            BIT            NOT NULL DEFAULT 1,
  data_criacao     DATETIME       NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao DATETIME       NULL,
  CONSTRAINT PK_ia_diretriz        PRIMARY KEY (id_diretriz),
  CONSTRAINT FK_ia_diretriz_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

CREATE INDEX IX_ia_diretriz_usuario ON dbo.ia_diretriz (id_usuario, tipo, ativo);

CREATE TABLE dbo.ia_diretriz_criterio (
  id_criterio  INT          IDENTITY(1,1) NOT NULL,
  id_diretriz  INT          NOT NULL,
  criterio     VARCHAR(30)  NOT NULL,   -- 'objetivo' | 'sexo' | 'nivel'
  valor        VARCHAR(50)  NOT NULL,
  CONSTRAINT PK_ia_diretriz_criterio PRIMARY KEY (id_criterio),
  CONSTRAINT FK_idc_diretriz         FOREIGN KEY (id_diretriz) REFERENCES dbo.ia_diretriz(id_diretriz) ON DELETE CASCADE
);
