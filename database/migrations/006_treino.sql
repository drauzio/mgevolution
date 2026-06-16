-- ============================================================
-- 006 - Módulo de Treino
-- exercicio → treino_protocolo → treino_dia → treino_dia_exercicio
-- ============================================================

-- ------------------------------------------------------------
-- Catálogo de exercícios (gerenciado pelo admin)
-- ------------------------------------------------------------
CREATE TABLE dbo.exercicio (
  id_exercicio    INT           IDENTITY(1,1) NOT NULL,
  nome            VARCHAR(120)  NOT NULL,
  grupo_muscular  VARCHAR(60)   NOT NULL,  -- Peito, Costas, Pernas, Ombro, Bíceps, etc.
  equipamento     VARCHAR(60)   NULL,       -- Barra, Halteres, Cabo, Máquina, Peso corporal
  descricao       VARCHAR(500)  NULL,
  video_url       VARCHAR(300)  NULL,
  ativo           BIT           NOT NULL DEFAULT 1,
  data_criacao    DATETIME      NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_exercicio PRIMARY KEY (id_exercicio)
);

-- ------------------------------------------------------------
-- Protocolo de treino — vincula um aluno a um plano
-- Um aluno pode ter histórico de protocolos, mas só 1 ativo
-- ------------------------------------------------------------
CREATE TABLE dbo.treino_protocolo (
  id_protocolo    INT           IDENTITY(1,1) NOT NULL,
  id_usuario      INT           NOT NULL,   -- aluno
  id_personal     INT           NOT NULL,   -- admin/personal que criou
  nome            VARCHAR(120)  NOT NULL,   -- "Hipertrofia Jan/2024"
  objetivo        VARCHAR(200)  NULL,       -- "Ganho de massa", "Definição"
  observacoes     VARCHAR(500)  NULL,
  data_inicio     DATE          NOT NULL,
  data_fim        DATE          NULL,
  ativo           BIT           NOT NULL DEFAULT 1,
  data_criacao    DATETIME      NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao DATETIME     NULL,
  CONSTRAINT PK_treino_protocolo PRIMARY KEY (id_protocolo),
  CONSTRAINT FK_protocolo_aluno    FOREIGN KEY (id_usuario)  REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_protocolo_personal FOREIGN KEY (id_personal) REFERENCES dbo.usuario(id_usuario)
);

-- ------------------------------------------------------------
-- Dias do protocolo (segunda a domingo)
-- Cada dia tem um nome e pode ser descanso
-- ------------------------------------------------------------
CREATE TABLE dbo.treino_dia (
  id_treino_dia   INT           IDENTITY(1,1) NOT NULL,
  id_protocolo    INT           NOT NULL,
  dia_semana      TINYINT       NOT NULL,   -- 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sab 7=Dom
  nome            VARCHAR(80)   NOT NULL,   -- "Peito e Tríceps", "Descanso"
  descanso        BIT           NOT NULL DEFAULT 0,
  ordem           TINYINT       NOT NULL DEFAULT 1,
  CONSTRAINT PK_treino_dia PRIMARY KEY (id_treino_dia),
  CONSTRAINT FK_treino_dia_protocolo FOREIGN KEY (id_protocolo) REFERENCES dbo.treino_protocolo(id_protocolo),
  CONSTRAINT UQ_treino_dia_semana UNIQUE (id_protocolo, dia_semana)
);

-- ------------------------------------------------------------
-- Exercícios de cada dia — o coração do protocolo
-- ------------------------------------------------------------
CREATE TABLE dbo.treino_dia_exercicio (
  id_treino_dia_exercicio INT          IDENTITY(1,1) NOT NULL,
  id_treino_dia           INT          NOT NULL,
  id_exercicio            INT          NOT NULL,
  series                  TINYINT      NOT NULL DEFAULT 3,
  repeticoes              VARCHAR(20)  NOT NULL DEFAULT '15',  -- "12", "8-12", "até a falha"
  carga_sugerida          VARCHAR(30)  NULL,                   -- "20kg", "60% 1RM", "moderada"
  descanso_seg            SMALLINT     NULL,                   -- pausa em segundos entre séries
  observacao              VARCHAR(300) NULL,                   -- dica do personal para esse exercício
  ordem                   TINYINT      NOT NULL DEFAULT 1,
  CONSTRAINT PK_treino_dia_exercicio PRIMARY KEY (id_treino_dia_exercicio),
  CONSTRAINT FK_tde_dia       FOREIGN KEY (id_treino_dia) REFERENCES dbo.treino_dia(id_treino_dia),
  CONSTRAINT FK_tde_exercicio FOREIGN KEY (id_exercicio)  REFERENCES dbo.exercicio(id_exercicio)
);

-- ------------------------------------------------------------
-- Índices para performance nas consultas mais comuns
-- ------------------------------------------------------------
CREATE INDEX IX_protocolo_usuario ON dbo.treino_protocolo (id_usuario, ativo);
CREATE INDEX IX_treino_dia_protocolo ON dbo.treino_dia (id_protocolo, dia_semana);
CREATE INDEX IX_tde_dia ON dbo.treino_dia_exercicio (id_treino_dia, ordem);
