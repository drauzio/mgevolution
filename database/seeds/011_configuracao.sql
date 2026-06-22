-- Seeds: configurações padrão do sistema
INSERT INTO dbo.configuracao (categoria, chave, label, descricao, valor, tipo, ordem) VALUES
-- Academia
('academia', 'nome',     'Nome da academia',          NULL,                                    'MG Evolution', 'texto',   1),
('academia', 'telefone', 'Telefone',                  NULL,                                    NULL,           'texto',   2),
('academia', 'cnpj',     'CNPJ',                      NULL,                                    NULL,           'texto',   3),
('academia', 'endereco', 'Endereço',                  NULL,                                    NULL,           'texto',   4),
('academia', 'horario',  'Horário de funcionamento',  'Ex: Seg–Sex 6h–22h · Sáb 8h–18h',      NULL,           'texto',   5),
('academia', 'email',    'E-mail de contato',         NULL,                                    NULL,           'texto',   6),

-- Notificações
('notificacoes', 'whatsapp_ativo',        'WhatsApp ativo',                    'Habilitar envio de mensagens via WhatsApp',        '0', 'booleano', 1),
('notificacoes', 'notif_boasvindas',      'Boas-vindas ao novo aluno',         'Enviar mensagem quando aluno é cadastrado',        '1', 'booleano', 2),
('notificacoes', 'notif_assinatura_nova', 'Confirmação de assinatura',         'Enviar mensagem quando assinatura é criada',       '1', 'booleano', 3),
('notificacoes', 'dias_vencimento',       'Avisar vencimento (dias antes)',    'Quantos dias antes do vencimento notificar',       '7', 'numero',   4),
('notificacoes', 'notif_vencimento',      'Aviso de vencimento ativo',         'Enviar alerta de assinatura prestes a vencer',     '1', 'booleano', 5),
('notificacoes', 'dias_inativo',          'Aluno inativo (dias sem treinar)',  'Após quantos dias sem treinar enviar alerta',      '7', 'numero',   6),
('notificacoes', 'notif_inativo',         'Aviso de inatividade ativo',        'Enviar alerta quando aluno para de treinar',       '1', 'booleano', 7),

-- Treino
('treino', 'max_treinos_semana',       'Máximo de treinos por semana',     'Limite de sessões que o aluno pode registrar',    '6',  'numero',   1),
('treino', 'descanso_padrao',          'Descanso padrão entre séries (s)', 'Tempo sugerido de descanso em segundos',          '60', 'numero',   2),
('treino', 'aluno_cria_sessao_livre',  'Aluno pode criar sessão livre',    'Permitir treino fora do protocolo cadastrado',    '0',  'booleano', 3),

-- Shape Score
('shape_score', 'peso_frequencia', 'Peso: frequência de treinos', 'Influência da frequência na nota final (0–100)', '40', 'numero', 1),
('shape_score', 'peso_medidas',    'Peso: evolução de medidas',   'Influência das medidas corporais na nota final', '30', 'numero', 2),
('shape_score', 'peso_fotos',      'Peso: registro de fotos',     'Influência das fotos de progresso na nota final','20', 'numero', 3),
('shape_score', 'peso_avaliacao',  'Peso: avaliação física',      'Influência da avaliação física na nota final',   '10', 'numero', 4),

-- Coach IA
('coach_ia', 'prompt_base',  'Prompt personalizado', 'Instruções adicionais para o assistente de IA. Deixe vazio para usar o padrão.', NULL,            'textarea', 1),
('coach_ia', 'tom_resposta', 'Tom das respostas',    'Como o assistente deve se comunicar com os alunos',                              'motivacional',  'texto',    2),

-- Social
('social', 'feed_ativo',       'Feed social ativo',  'Alunos podem ver atividades uns dos outros', '1', 'booleano', 1),
('social', 'conquistas_ativo', 'Conquistas ativas',  'Sistema de conquistas e badges habilitado',  '1', 'booleano', 2),
('social', 'desafios_ativo',   'Desafios ativos',    'Módulo de desafios habilitado',              '1', 'booleano', 3),
('social', 'ranking_ativo',    'Ranking ativo',       'Exibir ranking mensal de treinos',           '1', 'booleano', 4)
