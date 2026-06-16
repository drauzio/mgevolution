-- ============================================================
-- Seed 001 - Usuário administrador padrão
-- Depende: 000_perfis.sql
-- ============================================================
-- E-mail : admin@mgevolution.com
-- Senha  : Admin@123
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE email = 'admin@mgevolution.com')
BEGIN
  INSERT INTO dbo.usuario (nome, cpf, email, senha_hash, administrador, senha_provisoria)
  VALUES (
    'Administrador',
    '00000000000',
    'admin@mgevolution.com',
    0x243262243130244f79537241584d344947435871615973316439552f4f2e536b4a596633796a71526b516b32397a7139766a2e6a6b353873526e4871,
    1,
    0
  )

  -- Vincula ao perfil admin e aluno
  INSERT INTO dbo.usuario_perfil (id_usuario, id_perfil)
    SELECT id_usuario, id_perfil FROM dbo.usuario, dbo.perfil
    WHERE dbo.usuario.email = 'admin@mgevolution.com'
      AND dbo.perfil.nome IN ('admin', 'aluno')

  PRINT 'Admin criado: admin@mgevolution.com / Admin@123'
END
ELSE
  PRINT 'Admin já existe, nenhuma alteração feita.'
GO
