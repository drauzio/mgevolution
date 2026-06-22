-- ============================================================
-- DROP tabelas de treino/template e ia_diretriz
-- Executar ANTES de recriar via 001_schema.sql
-- Ordem: filhos antes dos pais (respeita FKs)
-- ============================================================

-- Sessões (filhos)
IF OBJECT_ID('dbo.treino_sessao_exercicio',      'U') IS NOT NULL DROP TABLE dbo.treino_sessao_exercicio
IF OBJECT_ID('dbo.treino_sessao',                'U') IS NOT NULL DROP TABLE dbo.treino_sessao

-- Exercícios dos dias (filhos)
IF OBJECT_ID('dbo.treino_dia_exercicio',          'U') IS NOT NULL DROP TABLE dbo.treino_dia_exercicio
IF OBJECT_ID('dbo.treino_template_dia_exercicio', 'U') IS NOT NULL DROP TABLE dbo.treino_template_dia_exercicio
IF OBJECT_ID('dbo.template_dia_exercicio',        'U') IS NOT NULL DROP TABLE dbo.template_dia_exercicio

-- Dias (intermediários)
IF OBJECT_ID('dbo.treino_dia',                    'U') IS NOT NULL DROP TABLE dbo.treino_dia
IF OBJECT_ID('dbo.treino_template_dia',           'U') IS NOT NULL DROP TABLE dbo.treino_template_dia
IF OBJECT_ID('dbo.template_dia',                  'U') IS NOT NULL DROP TABLE dbo.template_dia

-- Protocolos e templates (pais)
IF OBJECT_ID('dbo.treino_protocolo',              'U') IS NOT NULL DROP TABLE dbo.treino_protocolo
IF OBJECT_ID('dbo.treino_protocolo_template',     'U') IS NOT NULL DROP TABLE dbo.treino_protocolo_template
IF OBJECT_ID('dbo.protocolo_template',            'U') IS NOT NULL DROP TABLE dbo.protocolo_template
IF OBJECT_ID('dbo.modelo_treino',                 'U') IS NOT NULL DROP TABLE dbo.modelo_treino

-- Exercícios (referenciado pelos dias)
IF OBJECT_ID('dbo.exercicio',                     'U') IS NOT NULL DROP TABLE dbo.exercicio

-- IA Diretrizes
IF OBJECT_ID('dbo.ia_diretriz_criterio',          'U') IS NOT NULL DROP TABLE dbo.ia_diretriz_criterio
IF OBJECT_ID('dbo.ia_diretriz',                   'U') IS NOT NULL DROP TABLE dbo.ia_diretriz

-- Social
IF OBJECT_ID('dbo.feed_reacao',                   'U') IS NOT NULL DROP TABLE dbo.feed_reacao
IF OBJECT_ID('dbo.feed_item',                     'U') IS NOT NULL DROP TABLE dbo.feed_item
IF OBJECT_ID('dbo.desafio_participante',          'U') IS NOT NULL DROP TABLE dbo.desafio_participante
IF OBJECT_ID('dbo.desafio',                       'U') IS NOT NULL DROP TABLE dbo.desafio
IF OBJECT_ID('dbo.usuario_conquista',             'U') IS NOT NULL DROP TABLE dbo.usuario_conquista
IF OBJECT_ID('dbo.conquista',                     'U') IS NOT NULL DROP TABLE dbo.conquista

PRINT 'Tabelas removidas. Execute 001_schema.sql para recriar.'
GO
