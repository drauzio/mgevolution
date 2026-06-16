-- ============================================================
-- 000 - Criar banco de dados
-- Execute conectado ao master: sqlcmd -S localhost\SQLEXPRESS -E -i 000_create_database.sql
-- ============================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'mgevolution')
BEGIN
  CREATE DATABASE mgevolution
    COLLATE Latin1_General_CI_AI;
  PRINT 'Banco mgevolution criado.';
END
ELSE
  PRINT 'Banco mgevolution já existe.';
GO

USE mgevolution;
GO

admin@mgevolution.com
Admin@123