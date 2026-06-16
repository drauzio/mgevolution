-- data_inicio ficou NOT NULL na 006 mas templates não têm data (corrige omissão da 009)
ALTER TABLE dbo.treino_protocolo
  ALTER COLUMN data_inicio DATE NULL;

-- Adiciona sexo e idade extraídos nas respostas da avaliação
ALTER TABLE dbo.avaliacao_fitness
  ADD sexo  VARCHAR(1) NULL,   -- 'M' ou 'F'
      idade INT        NULL;

-- Adiciona critérios de sexo e faixa etária nos templates de treino
ALTER TABLE dbo.treino_protocolo
  ADD criterio_sexo      VARCHAR(1) NULL,  -- 'M', 'F' ou NULL (qualquer)
      criterio_idade_min INT        NULL,  -- idade mínima, NULL = sem limite
      criterio_idade_max INT        NULL;  -- idade máxima, NULL = sem limite

-- Índice atualizado para incluir novos critérios
DROP INDEX IF EXISTS IX_protocolo_template ON dbo.treino_protocolo;
CREATE INDEX IX_protocolo_template
  ON dbo.treino_protocolo (is_template, criterio_objetivo, criterio_nivel, criterio_sexo)
  WHERE is_template = 1;
