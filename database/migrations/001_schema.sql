-- ============================================================
-- 001 - Schema completo do sistema MG Evolution
-- Execute após 000_create_database.sql
-- ============================================================

-- ============================================================
-- USUÁRIOS
-- ============================================================

CREATE TABLE dbo.usuario (
  id_usuario          INT IDENTITY(1,1) NOT NULL,
  nome                VARCHAR(120)      NOT NULL,
  cpf                 VARCHAR(11)       NOT NULL,
  email               VARCHAR(120)      NOT NULL UNIQUE,
  senha_hash          VARBINARY(256)    NOT NULL,
  telefone            VARCHAR(20)       NULL,
  tipo_documento      VARCHAR(20)       NULL,   -- CPF, RG, CRN, CREF, CRM etc.
  numero_documento    VARCHAR(30)       NULL,
  data_nascimento     DATE              NULL,
  sexo                VARCHAR(1)        NULL,   -- 'M' ou 'F'
  bio                 VARCHAR(500)      NULL,
  foto_url            VARCHAR(500)      NULL,
  ativo               BIT               NOT NULL DEFAULT 1,
  administrador       BIT               NOT NULL DEFAULT 0,
  senha_provisoria    BIT               NOT NULL DEFAULT 0,
  data_criacao        DATETIME          NOT NULL DEFAULT SYSUTCDATETIME(),
  usuario_atualizacao VARCHAR(120)      NULL,
  data_atualizacao    DATETIME          NULL,
  CONSTRAINT PK_usuario PRIMARY KEY (id_usuario)
);

CREATE TABLE dbo.usuario_reset_senha (
  id_usuario_reset_senha INT IDENTITY(1,1) NOT NULL,
  id_usuario             INT              NOT NULL,
  token                  VARCHAR(200)     NOT NULL UNIQUE,
  expiracao              DATETIME         NOT NULL,
  usado                  BIT              NOT NULL DEFAULT 0,
  data_criacao           DATETIME         NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT PK_usuario_reset_senha              PRIMARY KEY (id_usuario_reset_senha),
  CONSTRAINT FK_usuario_reset_senha_id_usuario   FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

-- ============================================================
-- PERFIS E MENU
-- ============================================================

CREATE TABLE dbo.perfil (
  id_perfil    INT          IDENTITY(1,1) NOT NULL,
  nome         VARCHAR(30)  NOT NULL UNIQUE,
  descricao    VARCHAR(100) NULL,
  ativo        BIT          NOT NULL DEFAULT 1,
  data_criacao DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_perfil PRIMARY KEY (id_perfil)
);

CREATE TABLE dbo.usuario_perfil (
  id_usuario_perfil INT      IDENTITY(1,1) NOT NULL,
  id_usuario        INT      NOT NULL,
  id_perfil         INT      NOT NULL,
  ativo             BIT      NOT NULL DEFAULT 1,
  data_criacao      DATETIME NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_usuario_perfil  PRIMARY KEY (id_usuario_perfil),
  CONSTRAINT UQ_usuario_perfil  UNIQUE (id_usuario, id_perfil),
  CONSTRAINT FK_up_usuario      FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_up_perfil       FOREIGN KEY (id_perfil)  REFERENCES dbo.perfil(id_perfil)
);

CREATE INDEX IX_usuario_perfil_usuario ON dbo.usuario_perfil (id_usuario, ativo);

CREATE TABLE dbo.menu (
  id_menu                INT          IDENTITY(1,1) NOT NULL,
  nome                   VARCHAR(100) NOT NULL,
  icone                  VARCHAR(50)  NULL,
  ordem                  INT          NOT NULL DEFAULT 0,
  id_usuario_criacao     INT          NULL,
  data_criacao           DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  id_usuario_atualizacao INT          NULL,
  data_atualizacao       DATETIME     NULL,
  ativo                  BIT          NOT NULL DEFAULT 1,
  CONSTRAINT PK_menu                        PRIMARY KEY (id_menu),
  CONSTRAINT FK_menu_id_usuario_criacao     FOREIGN KEY (id_usuario_criacao)     REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_menu_id_usuario_atualizacao FOREIGN KEY (id_usuario_atualizacao) REFERENCES dbo.usuario(id_usuario)
);

CREATE UNIQUE INDEX UX_Menu_Nome  ON dbo.menu(nome);
CREATE        INDEX IX_Menu_Ordem ON dbo.menu(ordem);

CREATE TABLE dbo.menu_item (
  id_menu_item           INT          IDENTITY(1,1) NOT NULL,
  id_menu                INT          NOT NULL,
  nome                   VARCHAR(120) NOT NULL,
  caminho                VARCHAR(255) NOT NULL,
  icone                  VARCHAR(50)  NULL,
  ordem                  INT          NOT NULL DEFAULT 0,
  administrador          BIT          NOT NULL DEFAULT 1,
  id_usuario_criacao     INT          NULL,
  data_criacao           DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  id_usuario_atualizacao INT          NULL,
  data_atualizacao       DATETIME     NULL,
  ativo                  BIT          NOT NULL DEFAULT 1,
  CONSTRAINT PK_menu_item                        PRIMARY KEY (id_menu_item),
  CONSTRAINT FK_menu_item_id_menu                FOREIGN KEY (id_menu)                REFERENCES dbo.menu(id_menu),
  CONSTRAINT FK_menu_item_id_usuario_criacao     FOREIGN KEY (id_usuario_criacao)     REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_menu_item_id_usuario_atualizacao FOREIGN KEY (id_usuario_atualizacao) REFERENCES dbo.usuario(id_usuario)
);

CREATE        INDEX IX_Menu_Item_Ordem  ON dbo.menu_item(id_menu, ordem);
CREATE UNIQUE INDEX UX_Menu_Item_Caminho ON dbo.menu_item(caminho);

CREATE TABLE dbo.menu_item_perfil (
  id_menu_item_perfil INT NOT NULL IDENTITY(1,1),
  id_menu_item        INT NOT NULL,
  id_perfil           INT NOT NULL,
  CONSTRAINT PK_menu_item_perfil PRIMARY KEY (id_menu_item_perfil),
  CONSTRAINT UQ_menu_item_perfil UNIQUE (id_menu_item, id_perfil),
  CONSTRAINT FK_mip_menu_item    FOREIGN KEY (id_menu_item) REFERENCES dbo.menu_item(id_menu_item),
  CONSTRAINT FK_mip_perfil       FOREIGN KEY (id_perfil)    REFERENCES dbo.perfil(id_perfil)
);

-- ============================================================
-- AVALIAÇÃO FITNESS
-- ============================================================

CREATE TABLE dbo.avaliacao_fitness (
  id_avaliacao_fitness INT         IDENTITY(1,1) NOT NULL,
  id_usuario           INT         NOT NULL,
  objetivo             VARCHAR(30) NULL,
  nivel                VARCHAR(30) NULL,
  sexo                 VARCHAR(1)  NULL,   -- 'M' ou 'F'
  idade                INT         NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'em_andamento',
  data_inicio          DATETIME    NOT NULL DEFAULT GETDATE(),
  data_finalizacao     DATETIME    NULL,
  ativo                BIT         NOT NULL DEFAULT 1,
  CONSTRAINT PK_avaliacao_fitness         PRIMARY KEY (id_avaliacao_fitness),
  CONSTRAINT FK_avaliacao_fitness_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

CREATE TABLE dbo.avaliacao_fitness_pergunta (
  id_avaliacao_fitness_pergunta INT          IDENTITY(1,1) NOT NULL,
  codigo                        VARCHAR(50)  NOT NULL,
  pergunta                      VARCHAR(250) NOT NULL,
  tipo                          VARCHAR(20)  NOT NULL DEFAULT 'bool',  -- bool | opcao | numero | texto
  obrigatorio                   BIT          NOT NULL DEFAULT 1,
  exibir_detalhe_sim            BIT          NOT NULL DEFAULT 0,
  descricao_detalhe_sim         VARCHAR(120) NULL,
  ordem                         INT          NOT NULL DEFAULT 0,
  ativo                         BIT          NOT NULL DEFAULT 1,
  CONSTRAINT PK_avaliacao_fitness_pergunta        PRIMARY KEY (id_avaliacao_fitness_pergunta),
  CONSTRAINT UQ_avaliacao_fitness_pergunta_codigo UNIQUE (codigo)
);

CREATE TABLE dbo.avaliacao_fitness_pergunta_opcao (
  id_avaliacao_fitness_pergunta_opcao INT          IDENTITY(1,1) NOT NULL,
  id_avaliacao_fitness_pergunta       INT          NOT NULL,
  valor                               VARCHAR(100) NOT NULL,
  ordem                               INT          NOT NULL DEFAULT 0,
  ativo                               BIT          NOT NULL DEFAULT 1,
  CONSTRAINT PK_avaliacao_fitness_pergunta_opcao  PRIMARY KEY (id_avaliacao_fitness_pergunta_opcao),
  CONSTRAINT FK_avaliacao_fitness_pergunta_opcao  FOREIGN KEY (id_avaliacao_fitness_pergunta) REFERENCES dbo.avaliacao_fitness_pergunta(id_avaliacao_fitness_pergunta)
);

CREATE TABLE dbo.avaliacao_fitness_resposta (
  id_avaliacao_fitness_resposta       INT           IDENTITY(1,1) NOT NULL,
  id_avaliacao_fitness                INT           NOT NULL,
  id_avaliacao_fitness_pergunta       INT           NOT NULL,
  resposta_bit                        BIT           NULL,
  resposta_texto                      NVARCHAR(500) NULL,
  resposta_numero                     DECIMAL(18,2) NULL,
  id_avaliacao_fitness_pergunta_opcao INT           NULL,
  CONSTRAINT PK_avaliacao_fitness_resposta    PRIMARY KEY (id_avaliacao_fitness_resposta),
  CONSTRAINT FK_avaliacao_fitness_resp_aval   FOREIGN KEY (id_avaliacao_fitness)               REFERENCES dbo.avaliacao_fitness(id_avaliacao_fitness),
  CONSTRAINT FK_avaliacao_fitness_resp_perg   FOREIGN KEY (id_avaliacao_fitness_pergunta)       REFERENCES dbo.avaliacao_fitness_pergunta(id_avaliacao_fitness_pergunta),
  CONSTRAINT FK_avaliacao_fitness_resp_opcao  FOREIGN KEY (id_avaliacao_fitness_pergunta_opcao) REFERENCES dbo.avaliacao_fitness_pergunta_opcao(id_avaliacao_fitness_pergunta_opcao)
);

CREATE UNIQUE INDEX UX_avaliacao_fitness_resposta
  ON dbo.avaliacao_fitness_resposta (id_avaliacao_fitness, id_avaliacao_fitness_pergunta);

-- ============================================================
-- SHAPE SCORE
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
  CONSTRAINT PK_shape_score         PRIMARY KEY (id_shape_score),
  CONSTRAINT FK_shape_score_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

CREATE UNIQUE INDEX UX_shape_score_usuario_data ON dbo.shape_score (id_usuario, data);
CREATE        INDEX IX_shape_score_data         ON dbo.shape_score (data);

-- ============================================================
-- TREINO
-- ============================================================

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
);

CREATE TABLE dbo.treino_protocolo (
  id_protocolo        INT          IDENTITY(1,1) NOT NULL,
  id_usuario          INT          NULL,   -- NULL para templates
  id_personal         INT          NULL,   -- NULL para templates
  id_template_origem  INT          NULL,   -- template que originou este protocolo
  nome                VARCHAR(120) NOT NULL,
  objetivo            VARCHAR(200) NULL,
  observacoes         VARCHAR(500) NULL,
  is_template         BIT          NOT NULL DEFAULT 0,
  criterio_objetivo   VARCHAR(100) NULL,
  criterio_nivel      VARCHAR(50)  NULL,
  criterio_sexo       VARCHAR(1)   NULL,   -- 'M', 'F' ou NULL (qualquer)
  criterio_idade_min  INT          NULL,
  criterio_idade_max  INT          NULL,
  data_inicio         DATE         NULL,
  data_fim            DATE         NULL,
  ativo               BIT          NOT NULL DEFAULT 1,
  data_criacao        DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao    DATETIME     NULL,
  CONSTRAINT PK_treino_protocolo          PRIMARY KEY (id_protocolo),
  CONSTRAINT FK_protocolo_aluno           FOREIGN KEY (id_usuario)         REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_protocolo_personal        FOREIGN KEY (id_personal)        REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_protocolo_template_origem FOREIGN KEY (id_template_origem) REFERENCES dbo.treino_protocolo(id_protocolo)
);

CREATE INDEX IX_protocolo_usuario  ON dbo.treino_protocolo (id_usuario, ativo);
CREATE INDEX IX_protocolo_template ON dbo.treino_protocolo (is_template, criterio_objetivo, criterio_nivel, criterio_sexo)
  WHERE is_template = 1;
CREATE INDEX IX_protocolo_template_origem ON dbo.treino_protocolo (id_template_origem)
  WHERE id_template_origem IS NOT NULL;

CREATE TABLE dbo.treino_dia (
  id_treino_dia  INT         IDENTITY(1,1) NOT NULL,
  id_protocolo   INT         NOT NULL,
  dia_semana     TINYINT     NOT NULL,   -- 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sab 7=Dom
  nome           VARCHAR(80) NOT NULL,   -- "Peito e Tríceps", "Descanso"
  descanso       BIT         NOT NULL DEFAULT 0,
  ordem          TINYINT     NOT NULL DEFAULT 1,
  CONSTRAINT PK_treino_dia          PRIMARY KEY (id_treino_dia),
  CONSTRAINT FK_treino_dia_protocolo FOREIGN KEY (id_protocolo) REFERENCES dbo.treino_protocolo(id_protocolo),
  CONSTRAINT UQ_treino_dia_semana   UNIQUE (id_protocolo, dia_semana)
);

CREATE INDEX IX_treino_dia_protocolo ON dbo.treino_dia (id_protocolo, dia_semana);

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
);

CREATE INDEX IX_tde_dia ON dbo.treino_dia_exercicio (id_treino_dia, ordem);

CREATE TABLE dbo.treino_sessao (
  id_treino_sessao INT      IDENTITY(1,1) NOT NULL,
  id_protocolo     INT      NOT NULL,
  id_usuario       INT      NOT NULL,
  id_treino_dia    INT      NOT NULL,
  data_inicio      DATETIME NULL,
  data_sessao      DATE     NOT NULL DEFAULT CAST(SYSUTCDATETIME() AS DATE),
  concluida        BIT      NOT NULL DEFAULT 0,
  data_conclusao   DATETIME NULL,
  data_criacao     DATETIME NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_treino_sessao PRIMARY KEY (id_treino_sessao),
  CONSTRAINT UQ_treino_sessao UNIQUE (id_usuario, id_treino_dia, data_sessao),
  CONSTRAINT FK_ts_protocolo  FOREIGN KEY (id_protocolo)  REFERENCES dbo.treino_protocolo(id_protocolo),
  CONSTRAINT FK_ts_usuario    FOREIGN KEY (id_usuario)    REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_ts_dia        FOREIGN KEY (id_treino_dia) REFERENCES dbo.treino_dia(id_treino_dia)
);

CREATE INDEX IX_treino_sessao_usuario ON dbo.treino_sessao (id_usuario, data_sessao DESC);

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
);

-- ============================================================
-- DIETA
-- ============================================================

CREATE TABLE dbo.dieta_plano (
  id_dieta_plano   INT          IDENTITY(1,1) NOT NULL,
  id_usuario       INT          NOT NULL,
  id_personal      INT          NULL,
  id_nutricionista INT          NULL,
  nome             VARCHAR(120) NOT NULL,
  objetivo         VARCHAR(200) NULL,
  calorias_meta    INT          NULL,
  proteina_meta    INT          NULL,
  observacoes      VARCHAR(500) NULL,
  status_plano     VARCHAR(20)  NOT NULL DEFAULT 'liberado',  -- rascunho | revisao | liberado
  ativo            BIT          NOT NULL DEFAULT 1,
  data_inicio      DATE         NULL,
  data_fim         DATE         NULL,
  data_criacao     DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao DATETIME     NULL,
  CONSTRAINT PK_dieta_plano              PRIMARY KEY (id_dieta_plano),
  CONSTRAINT FK_dieta_plano_usuario      FOREIGN KEY (id_usuario)       REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_dieta_plano_personal     FOREIGN KEY (id_personal)      REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT FK_dieta_plano_nutricionista FOREIGN KEY (id_nutricionista) REFERENCES dbo.usuario(id_usuario)
);

CREATE INDEX IX_dieta_plano_usuario ON dbo.dieta_plano (id_usuario, ativo);

CREATE TABLE dbo.dieta_refeicao (
  id_dieta_refeicao INT         IDENTITY(1,1) NOT NULL,
  id_dieta_plano    INT         NOT NULL,
  nome              VARCHAR(80) NOT NULL,
  horario           VARCHAR(5)  NULL,
  ordem             TINYINT     NOT NULL DEFAULT 1,
  CONSTRAINT PK_dieta_refeicao       PRIMARY KEY (id_dieta_refeicao),
  CONSTRAINT FK_dieta_refeicao_plano FOREIGN KEY (id_dieta_plano) REFERENCES dbo.dieta_plano(id_dieta_plano)
);

CREATE INDEX IX_dieta_refeicao_plano ON dbo.dieta_refeicao (id_dieta_plano, ordem);

CREATE TABLE dbo.dieta_refeicao_item (
  id_dieta_refeicao_item INT           IDENTITY(1,1) NOT NULL,
  id_dieta_refeicao      INT           NOT NULL,
  descricao              VARCHAR(200)  NOT NULL,
  quantidade             DECIMAL(8,1)  NULL,
  unidade                VARCHAR(20)   NULL DEFAULT 'g',
  calorias               INT           NULL,
  proteina               INT           NULL,
  carboidrato            INT           NULL,
  gordura                INT           NULL,
  ordem                  TINYINT       NOT NULL DEFAULT 1,
  CONSTRAINT PK_dieta_refeicao_item PRIMARY KEY (id_dieta_refeicao_item),
  CONSTRAINT FK_dri_refeicao        FOREIGN KEY (id_dieta_refeicao) REFERENCES dbo.dieta_refeicao(id_dieta_refeicao)
);

CREATE INDEX IX_dri_refeicao ON dbo.dieta_refeicao_item (id_dieta_refeicao, ordem);

CREATE TABLE dbo.dieta_refeicao_item_substituicao (
  id_substituicao        INT           IDENTITY(1,1) NOT NULL,
  id_dieta_refeicao_item INT           NOT NULL,
  descricao              NVARCHAR(200) NOT NULL,
  quantidade             DECIMAL(8,1)  NULL,
  unidade                VARCHAR(20)   NULL DEFAULT 'g',
  calorias               INT           NULL,
  proteina               INT           NULL,
  carboidrato            INT           NULL,
  gordura                INT           NULL,
  ordem                  TINYINT       NOT NULL DEFAULT 1,
  CONSTRAINT PK_dieta_refeicao_item_substituicao PRIMARY KEY (id_substituicao),
  CONSTRAINT FK_substituicao_item FOREIGN KEY (id_dieta_refeicao_item) REFERENCES dbo.dieta_refeicao_item(id_dieta_refeicao_item) ON DELETE CASCADE
);

CREATE TABLE dbo.dieta_solicitacao (
  id_dieta_solicitacao INT            IDENTITY(1,1) NOT NULL,
  id_usuario           INT            NOT NULL,
  objetivo             NVARCHAR(200)  NULL,
  restricoes           NVARCHAR(500)  NULL,
  preferencias         NVARCHAR(500)  NULL,
  refeicoes_dia        TINYINT        NULL,
  observacao           NVARCHAR(1000) NULL,
  status               NVARCHAR(20)   NOT NULL DEFAULT 'pendente',  -- pendente | em_andamento | concluida
  data_solicitacao     DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao     DATETIME2      NULL,
  CONSTRAINT PK_dieta_solicitacao         PRIMARY KEY (id_dieta_solicitacao),
  CONSTRAINT FK_dieta_solicitacao_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

-- ============================================================
-- EVOLUÇÃO
-- ============================================================

CREATE TABLE dbo.evolucao_medida (
  id_evolucao_medida INT          IDENTITY(1,1) NOT NULL,
  id_usuario         INT          NOT NULL,
  data               DATE         NOT NULL,
  peso               DECIMAL(5,2) NULL,   -- kg
  gordura_pct        DECIMAL(4,1) NULL,   -- %
  massa_magra        DECIMAL(5,2) NULL,   -- kg
  cintura_cm         DECIMAL(5,1) NULL,
  quadril_cm         DECIMAL(5,1) NULL,
  peito_cm           DECIMAL(5,1) NULL,
  braco_cm           DECIMAL(5,1) NULL,
  coxa_cm            DECIMAL(5,1) NULL,
  observacao         VARCHAR(300) NULL,
  data_registro      DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_evolucao_medida         PRIMARY KEY (id_evolucao_medida),
  CONSTRAINT FK_evolucao_medida_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

CREATE INDEX IX_evolucao_medida_usuario ON dbo.evolucao_medida (id_usuario, data DESC);

CREATE TABLE dbo.evolucao_foto (
  id_evolucao_foto INT          IDENTITY(1,1) NOT NULL,
  id_usuario       INT          NOT NULL,
  tipo             VARCHAR(20)  NOT NULL DEFAULT 'progresso',  -- antes | depois | progresso
  filekey          VARCHAR(300) NOT NULL,
  data             DATE         NOT NULL,
  data_registro    DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_evolucao_foto         PRIMARY KEY (id_evolucao_foto),
  CONSTRAINT FK_evolucao_foto_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);

CREATE INDEX IX_evolucao_foto_usuario ON dbo.evolucao_foto (id_usuario, data DESC);

CREATE TABLE dbo.evolucao_analise_cache (
  id_usuario   INT           NOT NULL,
  analise      NVARCHAR(MAX) NOT NULL,
  data_geracao DATETIME      NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_evolucao_analise_cache         PRIMARY KEY (id_usuario),
  CONSTRAINT FK_evolucao_analise_cache_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
);
