CREATE TABLE dbo.pagamento (
  id_pagamento    INT            IDENTITY(1,1) NOT NULL,
  id_assinatura   INT            NOT NULL,
  id_usuario      INT            NOT NULL,
  valor           DECIMAL(10,2)  NOT NULL,
  forma_pagamento VARCHAR(30)    NULL,   -- pix | dinheiro | cartao | boleto | transferencia
  status          VARCHAR(20)    NOT NULL DEFAULT 'pendente', -- pendente | pago | cancelado
  data_vencimento DATE           NOT NULL,
  data_pagamento  DATE           NULL,
  observacao      VARCHAR(500)   NULL,
  registrado_por  INT            NULL,
  data_criacao    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT PK_pagamento               PRIMARY KEY (id_pagamento),
  CONSTRAINT FK_pagamento_assinatura    FOREIGN KEY (id_assinatura) REFERENCES dbo.assinatura(id_assinatura),
  CONSTRAINT FK_pagamento_usuario       FOREIGN KEY (id_usuario)    REFERENCES dbo.usuario(id_usuario),
  CONSTRAINT CK_pagamento_status        CHECK (status IN ('pendente','pago','cancelado')),
  CONSTRAINT CK_pagamento_forma         CHECK (forma_pagamento IN ('pix','dinheiro','cartao','boleto','transferencia') OR forma_pagamento IS NULL)
)

CREATE INDEX IX_pagamento_usuario  ON dbo.pagamento (id_usuario, status)
CREATE INDEX IX_pagamento_status   ON dbo.pagamento (status, data_vencimento)
