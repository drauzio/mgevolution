-- ============================================================
-- 009 - Suporte a templates de protocolo de treino
-- Permite criar protocolos sem aluno vinculado (templates)
-- com critérios de objetivo e nível para auto-atribuição
-- ============================================================

-- id_usuario e id_personal ficam nulos nos templates
ALTER TABLE dbo.treino_protocolo
  ALTER COLUMN id_usuario  INT NULL;

ALTER TABLE dbo.treino_protocolo
  ALTER COLUMN id_personal INT NULL;

-- Colunas de template
ALTER TABLE dbo.treino_protocolo
  ADD is_template        BIT          NOT NULL DEFAULT 0,
      criterio_objetivo  VARCHAR(100) NULL,
      criterio_nivel     VARCHAR(50)  NULL;

-- Índice para busca rápida de templates por critério
CREATE INDEX IX_protocolo_template
  ON dbo.treino_protocolo (is_template, criterio_objetivo, criterio_nivel)
  WHERE is_template = 1;
