-- ============================================================
-- Seed 000 - Perfis base do sistema
-- Depende: 007_perfil_usuario.sql
-- RODAR ANTES dos demais seeds
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM dbo.perfil WHERE nome = 'aluno')
  INSERT INTO dbo.perfil (nome, descricao) VALUES ('aluno', 'Aluno da academia — acessa treinos, dieta e evolução');

IF NOT EXISTS (SELECT 1 FROM dbo.perfil WHERE nome = 'personal')
  INSERT INTO dbo.perfil (nome, descricao) VALUES ('personal', 'Personal trainer — monta treinos e dietas dos seus alunos');

IF NOT EXISTS (SELECT 1 FROM dbo.perfil WHERE nome = 'admin')
  INSERT INTO dbo.perfil (nome, descricao) VALUES ('admin', 'Administrador — acesso total ao sistema');

IF NOT EXISTS (SELECT 1 FROM dbo.perfil WHERE nome = 'nutricionista')
  INSERT INTO dbo.perfil (nome, descricao) VALUES ('nutricionista', 'Nutricionista — elabora e gerencia os planos alimentares dos alunos');
