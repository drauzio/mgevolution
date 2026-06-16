-- 011 - Rastreia qual template originou cada protocolo de aluno
-- Permite propagar alterações do template para os protocolos vinculados
ALTER TABLE dbo.treino_protocolo
  ADD id_template_origem INT NULL
  CONSTRAINT FK_protocolo_template_origem
    FOREIGN KEY REFERENCES dbo.treino_protocolo(id_protocolo);

CREATE INDEX IX_protocolo_template_origem
  ON dbo.treino_protocolo (id_template_origem)
  WHERE id_template_origem IS NOT NULL;
