-- ============================================================
-- REBUILD — Drop e recria todas as tabelas alteradas
-- Treino/Template, IA Diretrizes, Social, Notificação
-- ============================================================

-- ─── DROP (filhos antes dos pais) ────────────────────────────────────────────

-- Treino: sessões
IF OBJECT_ID('dbo.treino_sessao_exercicio',      'U') IS NOT NULL DROP TABLE dbo.treino_sessao_exercicio
IF OBJECT_ID('dbo.treino_sessao',                'U') IS NOT NULL DROP TABLE dbo.treino_sessao

-- Treino: exercícios dos dias
IF OBJECT_ID('dbo.treino_dia_exercicio',          'U') IS NOT NULL DROP TABLE dbo.treino_dia_exercicio
IF OBJECT_ID('dbo.treino_template_dia_exercicio', 'U') IS NOT NULL DROP TABLE dbo.treino_template_dia_exercicio
IF OBJECT_ID('dbo.template_dia_exercicio',        'U') IS NOT NULL DROP TABLE dbo.template_dia_exercicio

-- Treino: dias
IF OBJECT_ID('dbo.treino_dia',                    'U') IS NOT NULL DROP TABLE dbo.treino_dia
IF OBJECT_ID('dbo.treino_template_dia',           'U') IS NOT NULL DROP TABLE dbo.treino_template_dia
IF OBJECT_ID('dbo.template_dia',                  'U') IS NOT NULL DROP TABLE dbo.template_dia

-- Treino: protocolos e templates
IF OBJECT_ID('dbo.treino_protocolo',              'U') IS NOT NULL DROP TABLE dbo.treino_protocolo
IF OBJECT_ID('dbo.treino_protocolo_template',     'U') IS NOT NULL DROP TABLE dbo.treino_protocolo_template
IF OBJECT_ID('dbo.protocolo_template',            'U') IS NOT NULL DROP TABLE dbo.protocolo_template
IF OBJECT_ID('dbo.modelo_treino',                 'U') IS NOT NULL DROP TABLE dbo.modelo_treino

-- Exercícios
IF OBJECT_ID('dbo.exercicio',                     'U') IS NOT NULL DROP TABLE dbo.exercicio

-- IA Diretrizes
IF OBJECT_ID('dbo.ia_diretriz_criterio',          'U') IS NOT NULL DROP TABLE dbo.ia_diretriz_criterio
IF OBJECT_ID('dbo.ia_diretriz',                   'U') IS NOT NULL DROP TABLE dbo.ia_diretriz

-- Social
IF OBJECT_ID('dbo.feed_reacao',                   'U') IS NOT NULL DROP TABLE dbo.feed_reacao
IF OBJECT_ID('dbo.feed_item',                     'U') IS NOT NULL DROP TABLE dbo.feed_item
IF OBJECT_ID('dbo.desafio_participante',          'U') IS NOT NULL DROP TABLE dbo.desafio_participante
IF OBJECT_ID('dbo.desafio',                       'U') IS NOT NULL DROP TABLE dbo.desafio
IF OBJECT_ID('dbo.usuario_conquista',             'U') IS NOT NULL DROP TABLE dbo.usuario_conquista
IF OBJECT_ID('dbo.conquista',                     'U') IS NOT NULL DROP TABLE dbo.conquista

-- Notificação
IF OBJECT_ID('dbo.notificacao_aluno',             'U') IS NOT NULL DROP TABLE dbo.notificacao_aluno

GO

-- ─── CREATE TREINO ────────────────────────────────────────────────────────────

CREATE TABLE dbo.exercicio (
  id_exercicio   INT          IDENTITY(1,1) NOT NULL,
  nome           VARCHAR(120) NOT NULL,
  grupo_muscular VARCHAR(60)  NOT NULL,
  equipamento    VARCHAR(60)  NULL,
  descricao      VARCHAR(500) NULL,
  video_url      VARCHAR(300) NULL,
  ativo          BIT          NOT NULL DEFAULT 1,
  data_criacao   DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_exercicio PRIMARY KEY (id_exercicio)
)

CREATE TABLE dbo.protocolo_template (
  id_protocolo_template INT          IDENTITY(1,1) NOT NULL,
  id_personal           INT          NULL,
  nome                  VARCHAR(120) NOT NULL,
  objetivo              VARCHAR(200) NULL,
  observacoes           VARCHAR(500) NULL,
  criterio_objetivo     VARCHAR(100) NULL,
  criterio_nivel        VARCHAR(50)  NULL,
  criterio_sexo         VARCHAR(1)   NULL,
  criterio_idade_min    INT          NULL,
  criterio_idade_max    INT          NULL,
  ativo                 BIT          NOT NULL DEFAULT 1,
  data_criacao          DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao      DATETIME     NULL,
  CONSTRAINT PK_protocolo_template PRIMARY KEY (id_protocolo_template),
  CONSTRAINT FK_tpt_personal       FOREIGN KEY (id_personal) REFERENCES dbo.usuario(id_usuario)
)

CREATE INDEX IX_tpt_criterio ON dbo.protocolo_template (criterio_objetivo, criterio_nivel, criterio_sexo, ativo)

CREATE TABLE dbo.template_dia (
  id_template_dia INT         IDENTITY(1,1) NOT NULL,
  id_template     INT         NOT NULL,
  dia_semana      TINYINT     NOT NULL,
  nome            VARCHAR(80) NOT NULL,
  descanso        BIT         NOT NULL DEFAULT 0,
  ordem           TINYINT     NOT NULL DEFAULT 1,
  CONSTRAINT PK_template_dia       PRIMARY KEY (id_template_dia),
  CONSTRAINT FK_ttd_template        FOREIGN KEY (id_template) REFERENCES dbo.protocolo_template(id_protocolo_template),
  CONSTRAINT UQ_template_dia_semana UNIQUE (id_template, dia_semana)
)

CREATE INDEX IX_ttd_template ON dbo.template_dia (id_template, dia_semana)

CREATE TABLE dbo.template_dia_exercicio (
  id_template_dia_exercicio INT          IDENTITY(1,1) NOT NULL,
  id_template_dia           INT          NOT NULL,
  id_exercicio              INT          NOT NULL,
  series                    TINYINT      NOT NULL DEFAULT 3,
  repeticoes                VARCHAR(20)  NOT NULL DEFAULT '15',
  carga_sugerida            VARCHAR(30)  NULL,
  descanso_seg              SMALLINT     NULL,
  observacao                VARCHAR(300) NULL,
  ordem                     TINYINT      NOT NULL DEFAULT 1,
  CONSTRAINT PK_template_dia_exercicio PRIMARY KEY (id_template_dia_exercicio),
  CONSTRAINT FK_ttde_dia               FOREIGN KEY (id_template_dia) REFERENCES dbo.template_dia(id_template_dia),
  CONSTRAINT FK_ttde_exercicio         FOREIGN KEY (id_exercicio)    REFERENCES dbo.exercicio(id_exercicio)
)

CREATE INDEX IX_ttde_dia ON dbo.template_dia_exercicio (id_template_dia, ordem)

CREATE TABLE dbo.treino_protocolo (
  id_treino_protocolo INT          IDENTITY(1,1) NOT NULL,
  id_usuario          INT          NOT NULL,
  id_personal         INT          NULL,
  id_template_origem  INT          NULL,
  nome                VARCHAR(120) NOT NULL,
  objetivo            VARCHAR(200) NULL,
  observacoes         VARCHAR(500) NULL,
  data_inicio         DATE         NULL,
  data_fim            DATE         NULL,
  ativo               BIT          NOT NULL DEFAULT 1,
  data_criacao        DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao    DATETIME     NULL,
  CONSTRAINT PK_treino_protocolo          PRIMARY KEY (id_treino_protocolo),
  CONSTRAINT FK_protocolo_aluno           FOREIGN KEY (id_usuario)        REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_protocolo_personal        FOREIGN KEY (id_personal)       REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_protocolo_template_origem FOREIGN KEY (id_template_origem) REFERENCES dbo.protocolo_template(id_protocolo_template)
)

CREATE INDEX IX_protocolo_usuario         ON dbo.treino_protocolo (id_usuario, ativo)
CREATE INDEX IX_protocolo_template_origem ON dbo.treino_protocolo (id_template_origem) WHERE id_template_origem IS NOT NULL

CREATE TABLE dbo.treino_dia (
  id_treino_dia       INT         IDENTITY(1,1) NOT NULL,
  id_treino_protocolo INT         NOT NULL,
  dia_semana          TINYINT     NOT NULL,
  nome                VARCHAR(80) NOT NULL,
  descanso            BIT         NOT NULL DEFAULT 0,
  ordem               TINYINT     NOT NULL DEFAULT 1,
  CONSTRAINT PK_treino_dia          PRIMARY KEY (id_treino_dia),
  CONSTRAINT FK_treino_dia_protocolo FOREIGN KEY (id_treino_protocolo) REFERENCES dbo.treino_protocolo(id_treino_protocolo),
  CONSTRAINT UQ_treino_dia_semana   UNIQUE (id_treino_protocolo, dia_semana)
)

CREATE INDEX IX_treino_dia_protocolo ON dbo.treino_dia (id_treino_protocolo, dia_semana)

CREATE TABLE dbo.treino_dia_exercicio (
  id_treino_dia_exercicio INT          IDENTITY(1,1) NOT NULL,
  id_treino_dia           INT          NOT NULL,
  id_exercicio            INT          NOT NULL,
  series                  TINYINT      NOT NULL DEFAULT 3,
  repeticoes              VARCHAR(20)  NOT NULL DEFAULT '15',
  carga_sugerida          VARCHAR(30)  NULL,
  descanso_seg            SMALLINT     NULL,
  observacao              VARCHAR(300) NULL,
  ordem                   TINYINT      NOT NULL DEFAULT 1,
  CONSTRAINT PK_treino_dia_exercicio PRIMARY KEY (id_treino_dia_exercicio),
  CONSTRAINT FK_tde_dia              FOREIGN KEY (id_treino_dia) REFERENCES dbo.treino_dia(id_treino_dia),
  CONSTRAINT FK_tde_exercicio        FOREIGN KEY (id_exercicio)  REFERENCES dbo.exercicio(id_exercicio)
)

CREATE INDEX IX_tde_dia ON dbo.treino_dia_exercicio (id_treino_dia, ordem)

CREATE TABLE dbo.treino_sessao (
  id_treino_sessao    INT      IDENTITY(1,1) NOT NULL,
  id_treino_protocolo INT      NOT NULL,
  id_usuario          INT      NOT NULL,
  id_treino_dia       INT      NOT NULL,
  data_inicio         DATETIME NULL,
  data_sessao         DATE     NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
  concluida           BIT      NOT NULL DEFAULT 0,
  data_conclusao      DATETIME NULL,
  data_criacao        DATETIME NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_treino_sessao PRIMARY KEY (id_treino_sessao),
  CONSTRAINT UQ_treino_sessao UNIQUE (id_usuario, id_treino_dia, data_sessao),
  CONSTRAINT FK_ts_protocolo  FOREIGN KEY (id_treino_protocolo) REFERENCES dbo.treino_protocolo(id_treino_protocolo),
  CONSTRAINT FK_ts_usuario    FOREIGN KEY (id_usuario)          REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_ts_dia        FOREIGN KEY (id_treino_dia)       REFERENCES dbo.treino_dia(id_treino_dia)
)

CREATE INDEX IX_treino_sessao_usuario ON dbo.treino_sessao (id_usuario, data_sessao DESC)

CREATE TABLE dbo.treino_sessao_exercicio (
  id_treino_sessao_exercicio INT         IDENTITY(1,1) NOT NULL,
  id_treino_sessao           INT         NOT NULL,
  id_treino_dia_exercicio    INT         NOT NULL,
  feito                      BIT         NOT NULL DEFAULT 0,
  carga_usada                VARCHAR(30) NULL,
  data_hora                  DATETIME    NULL,
  CONSTRAINT PK_treino_sessao_exercicio PRIMARY KEY (id_treino_sessao_exercicio),
  CONSTRAINT UQ_tse           UNIQUE (id_treino_sessao, id_treino_dia_exercicio),
  CONSTRAINT FK_tse_sessao    FOREIGN KEY (id_treino_sessao)        REFERENCES dbo.treino_sessao(id_treino_sessao),
  CONSTRAINT FK_tse_exercicio FOREIGN KEY (id_treino_dia_exercicio) REFERENCES dbo.treino_dia_exercicio(id_treino_dia_exercicio)
)

GO

-- ─── CREATE IA DIRETRIZES ─────────────────────────────────────────────────────

CREATE TABLE dbo.ia_diretriz (
  id_diretriz      INT            IDENTITY(1,1) NOT NULL,
  id_usuario       INT            NOT NULL,
  nome             VARCHAR(100)   NOT NULL,
  tipo             VARCHAR(20)    NOT NULL DEFAULT 'dieta',  -- 'dieta' | 'treino'
  conteudo         NVARCHAR(3000) NOT NULL,
  ativo            BIT            NOT NULL DEFAULT 1,
  data_criacao     DATETIME       NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao DATETIME       NULL,
  CONSTRAINT PK_ia_diretriz        PRIMARY KEY (id_diretriz),
  CONSTRAINT FK_ia_diretriz_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
)

CREATE INDEX IX_ia_diretriz_usuario ON dbo.ia_diretriz (id_usuario, tipo, ativo)

CREATE TABLE dbo.ia_diretriz_criterio (
  id_ia_diretriz_criterio INT         IDENTITY(1,1) NOT NULL,
  id_diretriz             INT         NOT NULL,
  criterio                VARCHAR(30) NOT NULL,
  valor                   VARCHAR(50) NOT NULL,
  CONSTRAINT PK_ia_diretriz_criterio PRIMARY KEY (id_ia_diretriz_criterio),
  CONSTRAINT FK_idc_diretriz         FOREIGN KEY (id_diretriz) REFERENCES dbo.ia_diretriz(id_diretriz) ON DELETE CASCADE
)

GO

-- ─── CREATE SOCIAL ────────────────────────────────────────────────────────────

CREATE TABLE dbo.conquista (
  id_conquista   INT          IDENTITY(1,1) NOT NULL,
  codigo         VARCHAR(50)  NOT NULL UNIQUE,
  nome           VARCHAR(100) NOT NULL,
  descricao      VARCHAR(300) NOT NULL,
  icone          VARCHAR(10)  NOT NULL DEFAULT '🏆',
  criterio_tipo  VARCHAR(50)  NOT NULL,
  criterio_valor INT          NOT NULL DEFAULT 1,
  CONSTRAINT PK_conquista PRIMARY KEY (id_conquista)
)

CREATE TABLE dbo.usuario_conquista (
  id_usuario_conquista INT       IDENTITY(1,1) NOT NULL,
  id_usuario           INT       NOT NULL,
  id_conquista         INT       NOT NULL,
  data_desbloqueio     DATETIME2 DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_usuario_conquista    PRIMARY KEY (id_usuario_conquista),
  CONSTRAINT UQ_usuario_conquista    UNIQUE (id_usuario, id_conquista),
  CONSTRAINT FK_uconquista_usuario   FOREIGN KEY (id_usuario)   REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_uconquista_conquista FOREIGN KEY (id_conquista) REFERENCES dbo.conquista(id_conquista)
)

CREATE TABLE dbo.desafio (
  id_desafio   INT          IDENTITY(1,1) NOT NULL,
  titulo       VARCHAR(150) NOT NULL,
  descricao    VARCHAR(500) NULL,
  icone        VARCHAR(10)  DEFAULT '🏆',
  tipo_meta    VARCHAR(30)  NOT NULL,
  valor_meta   INT          NOT NULL,
  data_inicio  DATE         NOT NULL,
  data_fim     DATE         NOT NULL,
  ativo        BIT          DEFAULT 1,
  data_criacao DATETIME2    DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_desafio PRIMARY KEY (id_desafio)
)

CREATE TABLE dbo.desafio_participante (
  id_desafio_participante INT       IDENTITY(1,1) NOT NULL,
  id_desafio              INT       NOT NULL,
  id_usuario              INT       NOT NULL,
  progresso               INT       DEFAULT 0,
  concluido               BIT       DEFAULT 0,
  data_entrada            DATETIME2 DEFAULT SYSUTCDATETIME(),
  data_conclusao          DATETIME2 NULL,
  CONSTRAINT PK_desafio_participante PRIMARY KEY (id_desafio_participante),
  CONSTRAINT UQ_desafio_participante UNIQUE (id_desafio, id_usuario),
  CONSTRAINT FK_dp_desafio           FOREIGN KEY (id_desafio) REFERENCES dbo.desafio(id_desafio),
  CONSTRAINT FK_dp_usuario           FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
)

CREATE TABLE dbo.feed_item (
  id_feed_item  INT          IDENTITY(1,1) NOT NULL,
  id_usuario    INT          NOT NULL,
  tipo          VARCHAR(30)  NOT NULL,
  titulo        VARCHAR(200) NOT NULL,
  subtitulo     VARCHAR(300) NULL,
  id_referencia INT          NULL,
  data_criacao  DATETIME2    DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_feed_item    PRIMARY KEY (id_feed_item),
  CONSTRAINT FK_feed_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
)

CREATE TABLE dbo.feed_reacao (
  id_feed_reacao INT       IDENTITY(1,1) NOT NULL,
  id_feed_item   INT       NOT NULL,
  id_usuario     INT       NOT NULL,
  data_reacao    DATETIME2 DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_feed_reacao    PRIMARY KEY (id_feed_reacao),
  CONSTRAINT UQ_feed_reacao    UNIQUE (id_feed_item, id_usuario),
  CONSTRAINT FK_reacao_feed    FOREIGN KEY (id_feed_item) REFERENCES dbo.feed_item(id_feed_item),
  CONSTRAINT FK_reacao_usuario FOREIGN KEY (id_usuario)   REFERENCES dbo.usuario(id_usuario)
)

GO

-- ─── CREATE NOTIFICAÇÃO ───────────────────────────────────────────────────────

CREATE TABLE dbo.notificacao_aluno (
  id_notificacao_aluno INT            IDENTITY(1,1) NOT NULL,
  id_usuario           INT            NOT NULL,
  id_admin             INT            NOT NULL,
  titulo               NVARCHAR(200)  NOT NULL,
  descricao            NVARCHAR(1000) NULL,
  urgente              BIT            NOT NULL DEFAULT 0,
  lida                 BIT            NOT NULL DEFAULT 0,
  data_criacao         DATETIME       NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_notificacao_aluno PRIMARY KEY (id_notificacao_aluno),
  CONSTRAINT FK_notif_aluno FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_notif_admin FOREIGN KEY (id_admin)   REFERENCES dbo.usuario(id_usuario)
)

GO

PRINT 'Rebuild concluído com sucesso.'
