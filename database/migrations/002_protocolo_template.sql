-- ============================================================
-- 002 - Migração: separar templates de protocolos individuais
-- Execute com o banco existente (001 já aplicado)
-- ============================================================

BEGIN TRANSACTION;

-- 1. Criar tabela de templates
CREATE TABLE dbo.treino_protocolo_template (
  id_template        INT          IDENTITY(1,1) NOT NULL,
  id_personal        INT          NULL,
  nome               VARCHAR(120) NOT NULL,
  objetivo           VARCHAR(200) NULL,
  observacoes        VARCHAR(500) NULL,
  criterio_objetivo  VARCHAR(100) NULL,
  criterio_nivel     VARCHAR(50)  NULL,
  criterio_sexo      VARCHAR(1)   NULL,
  criterio_idade_min INT          NULL,
  criterio_idade_max INT          NULL,
  ativo              BIT          NOT NULL DEFAULT 1,
  data_criacao       DATETIME     NOT NULL DEFAULT SYSUTCDATETIME(),
  data_atualizacao   DATETIME     NULL,
  old_id             INT          NULL,   -- temporário para mapeamento
  CONSTRAINT PK_treino_protocolo_template PRIMARY KEY (id_template),
  CONSTRAINT FK_tpt_personal              FOREIGN KEY (id_personal) REFERENCES dbo.usuario(id_usuario)
);

-- 2. Migrar templates existentes (mantendo old_id para mapeamento)
INSERT INTO dbo.treino_protocolo_template
  (id_personal, nome, objetivo, observacoes,
   criterio_objetivo, criterio_nivel, criterio_sexo, criterio_idade_min, criterio_idade_max,
   ativo, data_criacao, old_id)
SELECT
  id_personal, nome, objetivo, observacoes,
  criterio_objetivo, criterio_nivel, criterio_sexo, criterio_idade_min, criterio_idade_max,
  ativo, data_criacao, id_protocolo
FROM dbo.treino_protocolo
WHERE is_template = 1;

-- 3. Criar tabela de dias do template
CREATE TABLE dbo.treino_template_dia (
  id_template_dia INT         IDENTITY(1,1) NOT NULL,
  id_template     INT         NOT NULL,
  dia_semana      TINYINT     NOT NULL,
  nome            VARCHAR(80) NOT NULL,
  descanso        BIT         NOT NULL DEFAULT 0,
  ordem           TINYINT     NOT NULL DEFAULT 1,
  old_id_dia      INT         NULL,   -- temporário para mapeamento
  CONSTRAINT PK_treino_template_dia        PRIMARY KEY (id_template_dia),
  CONSTRAINT FK_ttd_template               FOREIGN KEY (id_template) REFERENCES dbo.treino_protocolo_template(id_template),
  CONSTRAINT UQ_treino_template_dia_semana UNIQUE (id_template, dia_semana)
);

-- 4. Migrar dias dos templates
INSERT INTO dbo.treino_template_dia (id_template, dia_semana, nome, descanso, ordem, old_id_dia)
SELECT tpt.id_template, td.dia_semana, td.nome, td.descanso, td.ordem, td.id_treino_dia
FROM dbo.treino_dia td
JOIN dbo.treino_protocolo_template tpt ON tpt.old_id = td.id_protocolo;

-- 5. Criar tabela de exercícios do template
CREATE TABLE dbo.treino_template_dia_exercicio (
  id_template_dia_exercicio INT          IDENTITY(1,1) NOT NULL,
  id_template_dia           INT          NOT NULL,
  id_exercicio              INT          NOT NULL,
  series                    TINYINT      NOT NULL DEFAULT 3,
  repeticoes                VARCHAR(20)  NOT NULL DEFAULT '15',
  carga_sugerida            VARCHAR(30)  NULL,
  descanso_seg              SMALLINT     NULL,
  observacao                VARCHAR(300) NULL,
  ordem                     TINYINT      NOT NULL DEFAULT 1,
  CONSTRAINT PK_treino_template_dia_exercicio PRIMARY KEY (id_template_dia_exercicio),
  CONSTRAINT FK_ttde_dia                      FOREIGN KEY (id_template_dia) REFERENCES dbo.treino_template_dia(id_template_dia),
  CONSTRAINT FK_ttde_exercicio                FOREIGN KEY (id_exercicio)    REFERENCES dbo.exercicio(id_exercicio)
);

-- 6. Migrar exercícios dos dias do template
INSERT INTO dbo.treino_template_dia_exercicio
  (id_template_dia, id_exercicio, series, repeticoes, carga_sugerida, descanso_seg, observacao, ordem)
SELECT
  ttd.id_template_dia, tde.id_exercicio, tde.series, tde.repeticoes,
  tde.carga_sugerida, tde.descanso_seg, tde.observacao, tde.ordem
FROM dbo.treino_dia_exercicio tde
JOIN dbo.treino_template_dia ttd ON ttd.old_id_dia = tde.id_treino_dia;

-- 7. Atualizar id_template_origem nos protocolos de alunos
--    (antes apontava para id_protocolo do template, agora aponta para id_template)
UPDATE dbo.treino_protocolo
SET id_template_origem = tpt.id_template
FROM dbo.treino_protocolo tp
JOIN dbo.treino_protocolo_template tpt ON tpt.old_id = tp.id_template_origem
WHERE tp.is_template = 0 AND tp.id_template_origem IS NOT NULL;

-- 8. Remover colunas temporárias de mapeamento
ALTER TABLE dbo.treino_protocolo_template DROP COLUMN old_id;
ALTER TABLE dbo.treino_template_dia       DROP COLUMN old_id_dia;

-- 9. Deletar dias/exercícios dos templates da tabela antiga
DELETE FROM dbo.treino_dia_exercicio
WHERE id_treino_dia IN (
  SELECT td.id_treino_dia FROM dbo.treino_dia td
  JOIN dbo.treino_protocolo tp ON tp.id_protocolo = td.id_protocolo
  WHERE tp.is_template = 1
);

DELETE FROM dbo.treino_dia
WHERE id_protocolo IN (SELECT id_protocolo FROM dbo.treino_protocolo WHERE is_template = 1);

-- 10. Deletar templates da tabela antiga
DELETE FROM dbo.treino_protocolo WHERE is_template = 1;

-- 11. Dropar constraint FK auto-referente (template_origem apontava para si mesmo)
ALTER TABLE dbo.treino_protocolo DROP CONSTRAINT FK_protocolo_template_origem;

-- 12. Remover colunas de template da treino_protocolo
ALTER TABLE dbo.treino_protocolo DROP COLUMN is_template;
ALTER TABLE dbo.treino_protocolo DROP COLUMN criterio_objetivo;
ALTER TABLE dbo.treino_protocolo DROP COLUMN criterio_nivel;
ALTER TABLE dbo.treino_protocolo DROP COLUMN criterio_sexo;
ALTER TABLE dbo.treino_protocolo DROP COLUMN criterio_idade_min;
ALTER TABLE dbo.treino_protocolo DROP COLUMN criterio_idade_max;

-- 13. Tornar id_usuario NOT NULL (agora todos os registros têm aluno)
ALTER TABLE dbo.treino_protocolo ALTER COLUMN id_usuario INT NOT NULL;

-- 14. Recriar FK de id_template_origem apontando para a nova tabela
ALTER TABLE dbo.treino_protocolo
  ADD CONSTRAINT FK_protocolo_template_origem
  FOREIGN KEY (id_template_origem) REFERENCES dbo.treino_protocolo_template(id_template);

-- 15. Dropar índices antigos e recriar
DROP INDEX IF EXISTS IX_protocolo_template         ON dbo.treino_protocolo;
DROP INDEX IF EXISTS IX_protocolo_template_origem  ON dbo.treino_protocolo;
DROP INDEX IF EXISTS IX_protocolo_usuario          ON dbo.treino_protocolo;

CREATE INDEX IX_protocolo_usuario         ON dbo.treino_protocolo (id_usuario, ativo);
CREATE INDEX IX_protocolo_template_origem ON dbo.treino_protocolo (id_template_origem)
  WHERE id_template_origem IS NOT NULL;

-- 16. Criar índices nas novas tabelas
CREATE INDEX IX_tpt_criterio ON dbo.treino_protocolo_template (criterio_objetivo, criterio_nivel, criterio_sexo, ativo);
CREATE INDEX IX_ttd_template ON dbo.treino_template_dia (id_template, dia_semana);
CREATE INDEX IX_ttde_dia     ON dbo.treino_template_dia_exercicio (id_template_dia, ordem);

COMMIT;
