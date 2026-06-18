-- ─── Conquistas (definições fixas) ──────────────────────────────────────────
CREATE TABLE dbo.conquista (
  id_conquista  INT IDENTITY(1,1) PRIMARY KEY,
  codigo        VARCHAR(50)  NOT NULL UNIQUE,
  nome          VARCHAR(100) NOT NULL,
  descricao     VARCHAR(300) NOT NULL,
  icone         VARCHAR(10)  NOT NULL DEFAULT '🏆',
  criterio_tipo VARCHAR(50)  NOT NULL, -- treinos_total | streak_dias | desafio | medida | primeiro_treino
  criterio_valor INT         NOT NULL DEFAULT 1
)

INSERT INTO dbo.conquista (codigo, nome, descricao, icone, criterio_tipo, criterio_valor) VALUES
('primeiro_treino',  'Primeira Vez!',       'Concluiu o primeiro treino',                  '🎯', 'primeiro_treino', 1),
('treinos_10',       'Em Ritmo',            'Concluiu 10 treinos',                         '🔥', 'treinos_total',   10),
('treinos_30',       'Consistente',         'Concluiu 30 treinos',                         '💪', 'treinos_total',   30),
('treinos_100',      'Centenário',          'Concluiu 100 treinos',                        '🏅', 'treinos_total',   100),
('streak_7',         'Uma Semana Seguida',  'Treinou 7 dias seguidos',                     '📅', 'streak_dias',     7),
('streak_30',        'Mês Perfeito',        'Treinou 30 dias seguidos',                    '🌟', 'streak_dias',     30),
('primeira_medida',  'Me Conhecendo',       'Registrou a primeira medida corporal',        '📏', 'medida',          1),
('primeiro_desafio', 'Aceitei o Desafio',   'Completou o primeiro desafio',               '🎖️', 'desafio',         1)

-- ─── Conquistas do usuário ────────────────────────────────────────────────────
CREATE TABLE dbo.usuario_conquista (
  id_usuario_conquista INT IDENTITY(1,1) PRIMARY KEY,
  id_usuario           INT NOT NULL,
  id_conquista         INT NOT NULL,
  data_desbloqueio     DATETIME2 DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_usuario_conquista UNIQUE (id_usuario, id_conquista),
  CONSTRAINT FK_uconquista_usuario  FOREIGN KEY (id_usuario)  REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_uconquista_conquista FOREIGN KEY (id_conquista) REFERENCES dbo.conquista(id_conquista)
)

-- ─── Desafios ─────────────────────────────────────────────────────────────────
CREATE TABLE dbo.desafio (
  id_desafio    INT IDENTITY(1,1) PRIMARY KEY,
  titulo        VARCHAR(150) NOT NULL,
  descricao     VARCHAR(500),
  icone         VARCHAR(10)  DEFAULT '🏆',
  tipo_meta     VARCHAR(30)  NOT NULL, -- treinos | peso_perdido | medidas
  valor_meta    INT          NOT NULL,
  data_inicio   DATE         NOT NULL,
  data_fim      DATE         NOT NULL,
  ativo         BIT          DEFAULT 1,
  data_criacao  DATETIME2    DEFAULT SYSUTCDATETIME()
)

-- ─── Participantes do desafio ─────────────────────────────────────────────────
CREATE TABLE dbo.desafio_participante (
  id_participante INT IDENTITY(1,1) PRIMARY KEY,
  id_desafio      INT  NOT NULL,
  id_usuario      INT  NOT NULL,
  progresso       INT  DEFAULT 0,
  concluido       BIT  DEFAULT 0,
  data_entrada    DATETIME2 DEFAULT SYSUTCDATETIME(),
  data_conclusao  DATETIME2 NULL,
  CONSTRAINT UQ_desafio_participante UNIQUE (id_desafio, id_usuario),
  CONSTRAINT FK_dp_desafio  FOREIGN KEY (id_desafio) REFERENCES dbo.desafio(id_desafio),
  CONSTRAINT FK_dp_usuario  FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
)

-- ─── Feed ─────────────────────────────────────────────────────────────────────
CREATE TABLE dbo.feed_item (
  id_feed       INT IDENTITY(1,1) PRIMARY KEY,
  id_usuario    INT          NOT NULL,
  tipo          VARCHAR(30)  NOT NULL, -- treino | conquista | desafio | medida
  titulo        VARCHAR(200) NOT NULL,
  subtitulo     VARCHAR(300) NULL,
  id_referencia INT          NULL,
  data_criacao  DATETIME2    DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_feed_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
)

-- ─── Reações do feed ──────────────────────────────────────────────────────────
CREATE TABLE dbo.feed_reacao (
  id_reacao    INT IDENTITY(1,1) PRIMARY KEY,
  id_feed      INT NOT NULL,
  id_usuario   INT NOT NULL,
  data_reacao  DATETIME2 DEFAULT SYSUTCDATETIME(),
  CONSTRAINT UQ_feed_reacao UNIQUE (id_feed, id_usuario),
  CONSTRAINT FK_reacao_feed    FOREIGN KEY (id_feed)    REFERENCES dbo.feed_item(id_feed),
  CONSTRAINT FK_reacao_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
)
