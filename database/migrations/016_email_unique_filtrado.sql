-- Troca o UNIQUE constraint de email por índice filtrado (somente ativo = 1)
-- Assim usuários inativos (excluídos ou desativados pelo admin) não bloqueiam novo cadastro

DECLARE @constraint NVARCHAR(200)
SELECT @constraint = kc.name
FROM sys.key_constraints kc
JOIN sys.index_columns ic
  ON kc.unique_index_id = ic.index_id AND kc.parent_object_id = ic.object_id
WHERE kc.parent_object_id = OBJECT_ID('dbo.usuario')
  AND kc.type = 'UQ'
  AND ic.column_id = COLUMNPROPERTY(OBJECT_ID('dbo.usuario'), 'email', 'ColumnId')

IF @constraint IS NOT NULL
  EXEC('ALTER TABLE dbo.usuario DROP CONSTRAINT ' + @constraint)

CREATE UNIQUE INDEX UX_usuario_email_ativo ON dbo.usuario(email) WHERE ativo = 1
