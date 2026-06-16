-- ============================================================
-- Seed 000 - Perfis base do sistema
-- Depende: 007_perfil_usuario.sql
-- RODAR ANTES dos demais seeds
-- ============================================================

INSERT INTO dbo.perfil (nome, descricao) VALUES
  ('aluno',    'Aluno da academia — acessa treinos, dieta e evolução'),
  ('personal', 'Personal trainer — monta treinos e dietas dos seus alunos'),
  ('admin',    'Administrador — acesso total ao sistema');
