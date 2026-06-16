-- ============================================================
-- 003 - Avaliação Fitness (questionário → modelo de treino)
-- ============================================================

CREATE TABLE dbo.avaliacao_fitness (
  id_avaliacao_fitness INT          IDENTITY(1,1) NOT NULL,
  id_usuario           INT          NOT NULL,
  objetivo             VARCHAR(30)  NULL,
  nivel                VARCHAR(30)  NULL,
  status               VARCHAR(20)  NOT NULL DEFAULT 'em_andamento',
  data_inicio          DATETIME     NOT NULL DEFAULT GETDATE(),
  data_finalizacao     DATETIME     NULL,
  ativo                BIT          NOT NULL DEFAULT 1,
  CONSTRAINT pk_avaliacao_fitness          PRIMARY KEY(id_avaliacao_fitness),
  CONSTRAINT fk_avaliacao_fitness_usuario  FOREIGN KEY(id_usuario) REFERENCES dbo.usuario(id_usuario)
);

CREATE TABLE dbo.avaliacao_fitness_pergunta (
  id_avaliacao_fitness_pergunta INT          IDENTITY(1,1) NOT NULL,
  codigo                        VARCHAR(50)  NOT NULL,
  pergunta                      VARCHAR(250) NOT NULL,
  tipo                          VARCHAR(20)  NOT NULL DEFAULT 'bool', -- bool | opcao | numero | texto
  obrigatorio                   BIT          NOT NULL DEFAULT 1,
  exibir_detalhe_sim            BIT          NOT NULL DEFAULT 0,
  descricao_detalhe_sim         VARCHAR(120) NULL,
  ordem                         INT          NOT NULL DEFAULT 0,
  ativo                         BIT          NOT NULL DEFAULT 1,
  CONSTRAINT pk_avaliacao_fitness_pergunta PRIMARY KEY(id_avaliacao_fitness_pergunta),
  CONSTRAINT uq_avaliacao_fitness_pergunta_codigo UNIQUE(codigo)
);

CREATE TABLE dbo.avaliacao_fitness_pergunta_opcao (
  id_avaliacao_fitness_pergunta_opcao INT         IDENTITY(1,1) NOT NULL,
  id_avaliacao_fitness_pergunta       INT         NOT NULL,
  valor                               VARCHAR(100) NOT NULL,
  ordem                               INT          NOT NULL DEFAULT 0,
  ativo                               BIT          NOT NULL DEFAULT 1,
  CONSTRAINT pk_avaliacao_fitness_pergunta_opcao PRIMARY KEY(id_avaliacao_fitness_pergunta_opcao),
  CONSTRAINT fk_avaliacao_fitness_pergunta_opcao FOREIGN KEY(id_avaliacao_fitness_pergunta)
    REFERENCES dbo.avaliacao_fitness_pergunta(id_avaliacao_fitness_pergunta)
);

CREATE TABLE dbo.avaliacao_fitness_resposta (
  id_avaliacao_fitness_resposta       INT            IDENTITY(1,1) NOT NULL,
  id_avaliacao_fitness                INT            NOT NULL,
  id_avaliacao_fitness_pergunta       INT            NOT NULL,
  resposta_bit                        BIT            NULL,
  resposta_texto                      NVARCHAR(500)  NULL,
  resposta_numero                     DECIMAL(18,2)  NULL,
  id_avaliacao_fitness_pergunta_opcao INT            NULL,
  CONSTRAINT pk_avaliacao_fitness_resposta     PRIMARY KEY(id_avaliacao_fitness_resposta),
  CONSTRAINT fk_avaliacao_fitness_resp_aval    FOREIGN KEY(id_avaliacao_fitness)
    REFERENCES dbo.avaliacao_fitness(id_avaliacao_fitness),
  CONSTRAINT fk_avaliacao_fitness_resp_perg    FOREIGN KEY(id_avaliacao_fitness_pergunta)
    REFERENCES dbo.avaliacao_fitness_pergunta(id_avaliacao_fitness_pergunta),
  CONSTRAINT fk_avaliacao_fitness_resp_opcao   FOREIGN KEY(id_avaliacao_fitness_pergunta_opcao)
    REFERENCES dbo.avaliacao_fitness_pergunta_opcao(id_avaliacao_fitness_pergunta_opcao)
);

-- Garante uma resposta por pergunta por avaliação
CREATE UNIQUE INDEX ux_avaliacao_fitness_resposta
ON dbo.avaliacao_fitness_resposta (id_avaliacao_fitness, id_avaliacao_fitness_pergunta);


-- ============================================================
-- 004 - Modelo de treino (selecionado pelo questionário)
-- ============================================================
CREATE TABLE dbo.modelo_treino (
  id_modelo_treino INT          IDENTITY(1,1) NOT NULL,
  nome             VARCHAR(100) NOT NULL,
  objetivo         VARCHAR(30)  NOT NULL,  -- hipertrofia | emagrecimento | condicionamento
  nivel            VARCHAR(30)  NOT NULL,  -- iniciante | intermediario | avancado
  dias_semana      INT          NOT NULL,
  local_treino     VARCHAR(30)  NOT NULL,  -- academia | casa | ao_ar_livre
  sexo             VARCHAR(20)  NULL,      -- NULL = ambos
  ativo            BIT          NOT NULL DEFAULT 1,
  CONSTRAINT pk_modelo_treino PRIMARY KEY(id_modelo_treino)
);

-- Consulta de seleção automática de modelo
-- SELECT TOP 1 * FROM dbo.modelo_treino
-- WHERE objetivo = @objetivo AND nivel = @nivel
--   AND dias_semana = @dias_semana AND local_treino = @local_treino
--   AND ativo = 1;
