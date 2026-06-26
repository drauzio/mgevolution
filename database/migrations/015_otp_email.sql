-- Permite OTP por e-mail: torna telefone nullable e adiciona coluna email
ALTER TABLE dbo.otp_verificacao ALTER COLUMN telefone VARCHAR(20) NULL;
ALTER TABLE dbo.otp_verificacao ADD email VARCHAR(120) NULL;
CREATE INDEX IX_otp_email ON dbo.otp_verificacao (email, criado_em DESC);
