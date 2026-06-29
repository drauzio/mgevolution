-- ============================================================
-- Migration 002 - Mercado Pago + Carência
-- ============================================================

-- Campo de carência no usuário
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.usuario') AND name = 'data_fim_carencia')
  ALTER TABLE dbo.usuario ADD data_fim_carencia DATE NULL

-- Campos de gateway no pagamento
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagamento') AND name = 'gateway_id')
  ALTER TABLE dbo.pagamento ADD gateway_id VARCHAR(100) NULL

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.pagamento') AND name = 'gateway_status')
  ALTER TABLE dbo.pagamento ADD gateway_status VARCHAR(30) NULL
