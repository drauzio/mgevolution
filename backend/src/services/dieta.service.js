const { getPool, sql } = require('../database/connection')
const { buscarParaGeracao: buscarDiretriz } = require('./ia-diretriz.service')

async function listarPlanos(idAluno) {
  const pool = await getPool()
  const req = pool.request()
  let where = 'WHERE 1=1'
  if (idAluno) { req.input('idAluno', sql.Int, idAluno); where += ' AND p.id_usuario = @idAluno' }

  const result = await req.query(`
    SELECT
      p.id_dieta_plano, p.nome, p.objetivo, p.calorias_meta, p.proteina_meta,
      p.ativo, p.status_plano, p.data_inicio, p.data_fim, p.data_criacao,
      u.nome   AS aluno_nome,
      u.email  AS aluno_email,
      n.nome   AS nutricionista_nome,
      (SELECT COUNT(*) FROM dbo.dieta_refeicao r WHERE r.id_dieta_plano = p.id_dieta_plano) AS qtd_refeicoes
    FROM dbo.dieta_plano p
    JOIN dbo.usuario u  ON u.id_usuario  = p.id_usuario
    LEFT JOIN dbo.usuario n ON n.id_usuario = p.id_nutricionista
    ${where}
    ORDER BY p.ativo DESC, p.data_criacao DESC
  `)
  return result.recordset
}

async function buscarCompleto(idPlano) {
  const pool = await getPool()

  const plano = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`
      SELECT p.*, u.nome AS aluno_nome, u.email AS aluno_email,
             n.nome AS nutricionista_nome
      FROM dbo.dieta_plano p
      JOIN dbo.usuario u ON u.id_usuario = p.id_usuario
      LEFT JOIN dbo.usuario n ON n.id_usuario = p.id_nutricionista
      WHERE p.id_dieta_plano = @id
    `)

  if (!plano.recordset.length) return null

  const refeicoes = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`SELECT * FROM dbo.dieta_refeicao WHERE id_dieta_plano = @id ORDER BY ordem, id_dieta_refeicao`)

  const itens = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`
      SELECT i.*
      FROM dbo.dieta_refeicao_item i
      JOIN dbo.dieta_refeicao r ON r.id_dieta_refeicao = i.id_dieta_refeicao
      WHERE r.id_dieta_plano = @id
      ORDER BY i.id_dieta_refeicao, i.ordem
    `)

  const substituicoes = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`
      SELECT s.*
      FROM dbo.dieta_refeicao_item_substituicao s
      JOIN dbo.dieta_refeicao_item i  ON i.id_dieta_refeicao_item = s.id_dieta_refeicao_item
      JOIN dbo.dieta_refeicao r       ON r.id_dieta_refeicao = i.id_dieta_refeicao
      WHERE r.id_dieta_plano = @id
      ORDER BY s.id_dieta_refeicao_item, s.ordem
    `)

  return {
    ...plano.recordset[0],
    refeicoes: refeicoes.recordset.map(r => ({
      ...r,
      itens: itens.recordset
        .filter(i => i.id_dieta_refeicao === r.id_dieta_refeicao)
        .map(i => ({
          ...i,
          substituicoes: substituicoes.recordset.filter(s => s.id_dieta_refeicao_item === i.id_dieta_refeicao_item),
        })),
    })),
  }
}

async function buscarPlanoAtivo(idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`SELECT TOP 1 id_dieta_plano FROM dbo.dieta_plano WHERE id_usuario = @id AND ativo = 1 AND status_plano = 'liberado' ORDER BY data_criacao DESC`)
  if (!r.recordset[0]) return null
  return buscarCompleto(r.recordset[0].id_dieta_plano)
}

async function buscarPlanoEmAndamento(idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`
      SELECT TOP 1 id_dieta_plano, nome, status_plano
      FROM dbo.dieta_plano
      WHERE id_usuario = @id AND ativo = 1 AND status_plano IN ('rascunho', 'revisao')
      ORDER BY data_criacao DESC
    `)
  return r.recordset[0] || null
}

async function atualizarStatusPlano(idPlano, status) {
  const pool = await getPool()
  await pool.request()
    .input('id',     sql.Int,         idPlano)
    .input('status', sql.VarChar(20), status)
    .query(`UPDATE dbo.dieta_plano SET status_plano = @status, data_atualizacao = SYSUTCDATETIME() WHERE id_dieta_plano = @id`)

  if (status === 'liberado') {
    const r = await pool.request()
      .input('id', sql.Int, idPlano)
      .query(`SELECT id_usuario FROM dbo.dieta_plano WHERE id_dieta_plano = @id`)
    const idUsuario = r.recordset[0]?.id_usuario
    if (idUsuario) {
      await pool.request()
        .input('id_usuario', sql.Int, idUsuario)
        .query(`UPDATE dbo.dieta_solicitacao SET status = 'concluida', data_atualizacao = SYSUTCDATETIME() WHERE id_usuario = @id_usuario AND status <> 'concluida'`)
    }
  }
}

async function criar(dados, idCriador) {
  const pool = await getPool()
  const { id_usuario, id_nutricionista, nome, objetivo, calorias_meta, proteina_meta, observacoes,
          data_inicio, data_fim, status_plano, refeicoes = [] } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',       sql.Int,          id_usuario)
      .input('id_nutricionista', sql.Int,          id_nutricionista ? Number(id_nutricionista) : null)
      .input('nome',             sql.VarChar(120),  nome)
      .input('objetivo',         sql.VarChar(200),  objetivo || null)
      .input('calorias_meta',    sql.Int,           calorias_meta ? Number(calorias_meta) : null)
      .input('proteina_meta',    sql.Int,           proteina_meta ? Number(proteina_meta) : null)
      .input('observacoes',      sql.VarChar(500),  observacoes || null)
      .input('data_inicio',      sql.Date,          data_inicio || null)
      .input('data_fim',         sql.Date,          data_fim || null)
      .input('status_plano',     sql.VarChar(20),   status_plano || 'rascunho')
      .query(`
        INSERT INTO dbo.dieta_plano
          (id_usuario, id_nutricionista, nome, objetivo, calorias_meta, proteina_meta, observacoes, data_inicio, data_fim, status_plano)
        OUTPUT INSERTED.id_dieta_plano
        VALUES (@id_usuario, @id_nutricionista, @nome, @objetivo, @calorias_meta, @proteina_meta, @observacoes, @data_inicio, @data_fim, @status_plano)
      `)

    const idPlano = r1.recordset[0].id_dieta_plano
    await _inserirRefeicoes(tx, idPlano, refeicoes)

    // Fecha solicitações pendentes do aluno
    if (id_usuario) {
      await tx.request()
        .input('id_usuario', sql.Int, id_usuario)
        .query(`UPDATE dbo.dieta_solicitacao SET status='concluida', data_atualizacao=SYSUTCDATETIME() WHERE id_usuario=@id_usuario AND status<>'concluida'`)
    }

    await tx.commit()
    return { id_dieta_plano: idPlano }
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(idPlano, dados) {
  const pool = await getPool()
  const { id_nutricionista, nome, objetivo, calorias_meta, proteina_meta, observacoes,
          data_inicio, data_fim, ativo, status_plano, refeicoes } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',               sql.Int,          idPlano)
      .input('id_nutricionista', sql.Int,          id_nutricionista ? Number(id_nutricionista) : null)
      .input('nome',             sql.VarChar(120),  nome)
      .input('objetivo',         sql.VarChar(200),  objetivo || null)
      .input('calorias_meta',    sql.Int,           calorias_meta ? Number(calorias_meta) : null)
      .input('proteina_meta',    sql.Int,           proteina_meta ? Number(proteina_meta) : null)
      .input('observacoes',      sql.VarChar(500),  observacoes || null)
      .input('data_inicio',      sql.Date,          data_inicio || null)
      .input('data_fim',         sql.Date,          data_fim || null)
      .input('ativo',            sql.Bit,           ativo !== undefined ? ativo : 1)
      .input('status_plano',     sql.VarChar(20),   status_plano || 'rascunho')
      .query(`
        UPDATE dbo.dieta_plano SET
          id_nutricionista = @id_nutricionista,
          nome = @nome, objetivo = @objetivo, calorias_meta = @calorias_meta,
          proteina_meta = @proteina_meta, observacoes = @observacoes,
          data_inicio = @data_inicio, data_fim = @data_fim, ativo = @ativo, status_plano = @status_plano,
          data_atualizacao = SYSUTCDATETIME()
        WHERE id_dieta_plano = @id
      `)

    if (refeicoes) {
      const idsRef = await tx.request()
        .input('id', sql.Int, idPlano)
        .query(`SELECT id_dieta_refeicao FROM dbo.dieta_refeicao WHERE id_dieta_plano = @id`)

      const ids = idsRef.recordset.map(r => r.id_dieta_refeicao)
      if (ids.length) {
        await tx.request().query(`DELETE FROM dbo.dieta_refeicao_item WHERE id_dieta_refeicao IN (${ids.join(',')})`)
        await tx.request().input('id', sql.Int, idPlano).query(`DELETE FROM dbo.dieta_refeicao WHERE id_dieta_plano = @id`)
      }
      await _inserirRefeicoes(tx, idPlano, refeicoes)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

async function _inserirRefeicoes(tx, idPlano, refeicoes) {
  for (let i = 0; i < refeicoes.length; i++) {
    const r = refeicoes[i]
    const ref = await tx.request()
      .input('id_dieta_plano', sql.Int,        idPlano)
      .input('nome',           sql.VarChar(80), r.nome || '')
      .input('horario',        sql.VarChar(5),  r.horario || null)
      .input('ordem',          sql.TinyInt,    i + 1)
      .query(`
        INSERT INTO dbo.dieta_refeicao (id_dieta_plano, nome, horario, ordem)
        OUTPUT INSERTED.id_dieta_refeicao
        VALUES (@id_dieta_plano, @nome, @horario, @ordem)
      `)

    const idRefeicao = ref.recordset[0].id_dieta_refeicao
    for (let j = 0; j < (r.itens || []).length; j++) {
      const it = r.itens[j]
      const itemR = await tx.request()
        .input('id_dieta_refeicao', sql.Int,           idRefeicao)
        .input('descricao',         sql.VarChar(200),   it.descricao || '')
        .input('quantidade',        sql.Decimal(8, 1),  it.quantidade ? Number(it.quantidade) : null)
        .input('unidade',           sql.VarChar(20),    it.unidade || 'g')
        .input('calorias',          sql.Int,            it.calorias    ? Number(it.calorias)    : null)
        .input('proteina',          sql.Int,            it.proteina    ? Number(it.proteina)    : null)
        .input('carboidrato',       sql.Int,            it.carboidrato ? Number(it.carboidrato) : null)
        .input('gordura',           sql.Int,            it.gordura     ? Number(it.gordura)     : null)
        .input('ordem',             sql.TinyInt,       j + 1)
        .query(`
          INSERT INTO dbo.dieta_refeicao_item
            (id_dieta_refeicao, descricao, quantidade, unidade, calorias, proteina, carboidrato, gordura, ordem)
          OUTPUT INSERTED.id_dieta_refeicao_item
          VALUES
            (@id_dieta_refeicao, @descricao, @quantidade, @unidade, @calorias, @proteina, @carboidrato, @gordura, @ordem)
        `)

      const idItem = itemR.recordset[0].id_dieta_refeicao_item
      for (let k = 0; k < (it.substituicoes || []).length; k++) {
        const sub = it.substituicoes[k]
        if (!sub.descricao?.trim()) continue
        await tx.request()
          .input('id_item',     sql.Int,          idItem)
          .input('descricao',   sql.NVarChar(200), sub.descricao)
          .input('quantidade',  sql.Decimal(8, 1), sub.quantidade  ? Number(sub.quantidade)  : null)
          .input('unidade',     sql.VarChar(20),   sub.unidade || 'g')
          .input('calorias',    sql.Int,           sub.calorias    ? Number(sub.calorias)    : null)
          .input('proteina',    sql.Int,           sub.proteina    ? Number(sub.proteina)    : null)
          .input('carboidrato', sql.Int,           sub.carboidrato ? Number(sub.carboidrato) : null)
          .input('gordura',     sql.Int,           sub.gordura     ? Number(sub.gordura)     : null)
          .input('ordem',       sql.TinyInt,       k + 1)
          .query(`
            INSERT INTO dbo.dieta_refeicao_item_substituicao
              (id_dieta_refeicao_item, descricao, quantidade, unidade, calorias, proteina, carboidrato, gordura, ordem)
            VALUES
              (@id_item, @descricao, @quantidade, @unidade, @calorias, @proteina, @carboidrato, @gordura, @ordem)
          `)
      }
    }
  }
}

async function clonar(idPlano, idUsuarioDestino, idPersonal) {
  const pool = await getPool()
  const original = await buscarCompleto(idPlano)
  if (!original) throw Object.assign(new Error('Plano não encontrado'), { status: 404 })

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',    sql.Int,          idUsuarioDestino)
      .input('id_personal',   sql.Int,          idPersonal)
      .input('nome',          sql.VarChar(120),  original.nome)
      .input('objetivo',      sql.VarChar(200),  original.objetivo || null)
      .input('calorias_meta', sql.Int,           original.calorias_meta || null)
      .input('proteina_meta', sql.Int,           original.proteina_meta || null)
      .input('observacoes',   sql.VarChar(500),  original.observacoes || null)
      .query(`
        INSERT INTO dbo.dieta_plano
          (id_usuario, id_personal, nome, objetivo, calorias_meta, proteina_meta, observacoes)
        OUTPUT INSERTED.id_dieta_plano
        VALUES (@id_usuario, @id_personal, @nome, @objetivo, @calorias_meta, @proteina_meta, @observacoes)
      `)

    const idNovoPlano = r1.recordset[0].id_dieta_plano
    await _inserirRefeicoes(tx, idNovoPlano, original.refeicoes || [])
    await tx.commit()

    // Fecha qualquer solicitação pendente do aluno destino
    await pool.request()
      .input('id_usuario', sql.Int, idUsuarioDestino)
      .query(`UPDATE dbo.dieta_solicitacao SET status = 'concluida', data_atualizacao = SYSUTCDATETIME() WHERE id_usuario = @id_usuario AND status <> 'concluida'`)

    return { id_dieta_plano: idNovoPlano }
  } catch (err) { await tx.rollback(); throw err }
}

async function dadosAlunoParaDieta(idUsuario) {
  const pool = await getPool()

  const aval = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`
      SELECT TOP 1
        af.objetivo, af.nivel, af.sexo, af.idade,
        peso_r.resposta_numero  AS peso,
        alt_r.resposta_numero   AS altura,
        lesao_r.resposta_bit    AS tem_lesao,
        lesao_r.resposta_texto  AS lesao_detalhe
      FROM dbo.avaliacao_fitness af
      LEFT JOIN dbo.avaliacao_fitness_resposta peso_r
        ON peso_r.id_avaliacao_fitness = af.id_avaliacao_fitness
       AND peso_r.id_avaliacao_fitness_pergunta =
           (SELECT id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'peso')
      LEFT JOIN dbo.avaliacao_fitness_resposta alt_r
        ON alt_r.id_avaliacao_fitness = af.id_avaliacao_fitness
       AND alt_r.id_avaliacao_fitness_pergunta =
           (SELECT id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'altura')
      LEFT JOIN dbo.avaliacao_fitness_resposta lesao_r
        ON lesao_r.id_avaliacao_fitness = af.id_avaliacao_fitness
       AND lesao_r.id_avaliacao_fitness_pergunta =
           (SELECT id_avaliacao_fitness_pergunta FROM dbo.avaliacao_fitness_pergunta WHERE codigo = 'lesao')
      WHERE af.id_usuario = @id AND af.ativo = 1
      ORDER BY af.data_inicio DESC
    `)

  return aval.recordset[0] || null
}

async function toggleAtivo(idPlano) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`UPDATE dbo.dieta_plano SET ativo = 1 - ativo, data_atualizacao = SYSUTCDATETIME() WHERE id_dieta_plano = @id`)
}

async function deletar(idPlano) {
  const pool = await getPool()
  const tx = pool.transaction()
  await tx.begin()
  try {
    // substituições → itens → refeições → plano
    await tx.request().input('id', sql.Int, idPlano).query(`
      DELETE s FROM dbo.dieta_refeicao_item_substituicao s
      JOIN dbo.dieta_refeicao_item i  ON i.id_dieta_refeicao_item = s.id_dieta_refeicao_item
      JOIN dbo.dieta_refeicao r       ON r.id_dieta_refeicao = i.id_dieta_refeicao
      WHERE r.id_dieta_plano = @id
    `)
    await tx.request().input('id', sql.Int, idPlano).query(`
      DELETE i FROM dbo.dieta_refeicao_item i
      JOIN dbo.dieta_refeicao r ON r.id_dieta_refeicao = i.id_dieta_refeicao
      WHERE r.id_dieta_plano = @id
    `)
    await tx.request().input('id', sql.Int, idPlano).query(`DELETE FROM dbo.dieta_refeicao WHERE id_dieta_plano = @id`)
    await tx.request().input('id', sql.Int, idPlano).query(`DELETE FROM dbo.dieta_plano WHERE id_dieta_plano = @id`)
    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

async function buscarSolicitacao(idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`
      SELECT TOP 1
        s.id_dieta_solicitacao, s.objetivo, s.restricoes, s.preferencias,
        s.refeicoes_dia, s.observacao, s.status, s.data_solicitacao
      FROM dbo.dieta_solicitacao s
      WHERE s.id_usuario = @id AND s.status <> 'concluida'
      ORDER BY s.data_solicitacao DESC
    `)
  return r.recordset[0] || null
}

async function solicitarDieta(idUsuario, dados) {
  const pool = await getPool()
  const { objetivo, restricoes, preferencias, refeicoes_dia, observacao } = dados

  // Se já existe pendente/em_andamento, atualiza; senão cria
  const existente = await buscarSolicitacao(idUsuario)
  if (existente) {
    await pool.request()
      .input('id',            sql.Int,           existente.id_dieta_solicitacao)
      .input('objetivo',      sql.NVarChar(200),  objetivo || null)
      .input('restricoes',    sql.NVarChar(500),  restricoes || null)
      .input('preferencias',  sql.NVarChar(500),  preferencias || null)
      .input('refeicoes_dia', sql.TinyInt,        refeicoes_dia ? Number(refeicoes_dia) : null)
      .input('observacao',    sql.NVarChar(1000), observacao || null)
      .query(`
        UPDATE dbo.dieta_solicitacao SET
          objetivo = @objetivo, restricoes = @restricoes, preferencias = @preferencias,
          refeicoes_dia = @refeicoes_dia, observacao = @observacao,
          status = 'pendente', data_atualizacao = SYSUTCDATETIME()
        WHERE id_dieta_solicitacao = @id
      `)
    return { id_dieta_solicitacao: existente.id_dieta_solicitacao }
  }

  const r = await pool.request()
    .input('id_usuario',    sql.Int,           idUsuario)
    .input('objetivo',      sql.NVarChar(200),  objetivo || null)
    .input('restricoes',    sql.NVarChar(500),  restricoes || null)
    .input('preferencias',  sql.NVarChar(500),  preferencias || null)
    .input('refeicoes_dia', sql.TinyInt,        refeicoes_dia ? Number(refeicoes_dia) : null)
    .input('observacao',    sql.NVarChar(1000), observacao || null)
    .query(`
      INSERT INTO dbo.dieta_solicitacao (id_usuario, objetivo, restricoes, preferencias, refeicoes_dia, observacao)
      OUTPUT INSERTED.id_dieta_solicitacao
      VALUES (@id_usuario, @objetivo, @restricoes, @preferencias, @refeicoes_dia, @observacao)
    `)
  return { id_dieta_solicitacao: r.recordset[0].id_dieta_solicitacao }
}

async function listarSolicitacoes(status) {
  const pool = await getPool()
  const req = pool.request()
  const where = status ? `WHERE s.status = @status` : `WHERE s.status <> 'concluida'`
  if (status) req.input('status', sql.NVarChar(20), status)

  const r = await req.query(`
    SELECT
      s.id_dieta_solicitacao, s.objetivo, s.restricoes, s.preferencias,
      s.refeicoes_dia, s.observacao, s.status, s.data_solicitacao,
      u.id_usuario, u.nome AS aluno_nome, u.email AS aluno_email
    FROM dbo.dieta_solicitacao s
    JOIN dbo.usuario u ON u.id_usuario = s.id_usuario
    ${where}
    ORDER BY s.data_solicitacao ASC
  `)
  return r.recordset
}

async function atualizarStatusSolicitacao(idSolicitacao, status) {
  const pool = await getPool()
  await pool.request()
    .input('id',     sql.Int,          idSolicitacao)
    .input('status', sql.NVarChar(20), status)
    .query(`
      UPDATE dbo.dieta_solicitacao SET
        status = @status, data_atualizacao = SYSUTCDATETIME()
      WHERE id_dieta_solicitacao = @id
    `)
}

async function gerarComIA(idSolicitacao, idNutricionista) {
  const pool = await getPool()

  const solR = await pool.request()
    .input('id', sql.Int, idSolicitacao)
    .query(`
      SELECT s.*, u.nome AS aluno_nome
      FROM dbo.dieta_solicitacao s
      JOIN dbo.usuario u ON u.id_usuario = s.id_usuario
      WHERE s.id_dieta_solicitacao = @id
    `)
  const sol = solR.recordset[0]
  if (!sol) throw Object.assign(new Error('Solicitação não encontrada'), { status: 404 })

  const perfil = await dadosAlunoParaDieta(sol.id_usuario)
  const numRef = sol.refeicoes_dia || 5

  const diretriz = idNutricionista
    ? await buscarDiretriz(idNutricionista, 'dieta', perfil?.objetivo || sol.objetivo, perfil?.sexo, perfil?.nivel)
    : null

  const linhas = [
    `Crie um plano alimentar completo retornando APENAS JSON válido, sem texto extra.`,
    diretriz ? `\nDIRETRIZES DA NUTRICIONISTA (seguir obrigatoriamente):\n${diretriz}\n` : null,
    ``,
    `PERFIL:`,
    `- Nome: ${sol.aluno_nome}`,
    perfil?.objetivo   ? `- Objetivo fitness: ${perfil.objetivo}` : null,
    sol.objetivo       ? `- Objetivo da dieta: ${sol.objetivo}`   : null,
    perfil?.sexo === 'M' ? '- Sexo: Masculino' : perfil?.sexo === 'F' ? '- Sexo: Feminino' : null,
    perfil?.idade      ? `- Idade: ${perfil.idade} anos`          : null,
    perfil?.peso       ? `- Peso: ${perfil.peso} kg`              : null,
    perfil?.altura     ? `- Altura: ${perfil.altura} cm`          : null,
    sol.restricoes     ? `- Restrições: ${sol.restricoes}`        : null,
    sol.preferencias   ? `- Preferências: ${sol.preferencias}`    : null,
    sol.observacao     ? `- Observações: ${sol.observacao}`       : null,
    ``,
    `Retorne JSON com esta estrutura exata:`,
    `{"nome":"Nome do plano","objetivo":"Objetivo resumido","calorias_totais":2500,"proteina_total":180,"carboidrato_total":250,"gordura_total":70,"observacoes":"Orientações gerais","refeicoes":[{"nome":"Café da manhã","horario":"07:00","itens":[{"descricao":"Ovo inteiro","quantidade":3,"unidade":"un","calorias":210,"proteina":18,"carboidrato":0,"gordura":15,"substituicoes":[{"descricao":"Clara de ovo","quantidade":150,"unidade":"g","calorias":75,"proteina":16,"carboidrato":1,"gordura":0}]}]}]}`,
    ``,
    `Crie ${numRef} refeições. Use alimentos brasileiros comuns. Todos os valores numéricos devem ser números. Inclua obrigatoriamente pelo menos 1 substituição para cada alimento (nunca deixe "substituicoes" vazio).`,
  ].filter(l => l !== null).join('\n')

  const OpenAI = require('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: linhas }],
    response_format: { type: 'json_object' },
  })

  const plano = JSON.parse(resp.choices[0].message.content)

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',       sql.Int,         sol.id_usuario)
      .input('id_nutricionista', sql.Int,          idNutricionista || null)
      .input('nome',             sql.VarChar(120),  plano.nome || `Dieta ${sol.aluno_nome}`)
      .input('objetivo',         sql.VarChar(200),  plano.objetivo || sol.objetivo || null)
      .input('calorias_meta',    sql.Int,           plano.calorias_totais ? Math.round(plano.calorias_totais) : null)
      .input('proteina_meta',    sql.Int,           plano.proteina_total  ? Math.round(plano.proteina_total)  : null)
      .input('observacoes',      sql.VarChar(500),  plano.observacoes || null)
      .input('status_plano',     sql.VarChar(20),  'revisao')
      .query(`
        INSERT INTO dbo.dieta_plano
          (id_usuario, id_nutricionista, nome, objetivo, calorias_meta, proteina_meta, observacoes, status_plano)
        OUTPUT INSERTED.id_dieta_plano
        VALUES (@id_usuario, @id_nutricionista, @nome, @objetivo, @calorias_meta, @proteina_meta, @observacoes, @status_plano)
      `)

    const idPlano = r1.recordset[0].id_dieta_plano
    await _inserirRefeicoes(tx, idPlano, plano.refeicoes || [])
    await tx.commit()

    await pool.request()
      .input('id', sql.Int, idSolicitacao)
      .query(`UPDATE dbo.dieta_solicitacao SET status = 'em_andamento', data_atualizacao = SYSUTCDATETIME() WHERE id_dieta_solicitacao = @id`)

    return { id_dieta_plano: idPlano }
  } catch (err) {
    await tx.rollback()
    throw err
  }
}

async function gerarSubstituicoes(idPlano) {
  const pool = await getPool()
  const plano = await buscarCompleto(idPlano)
  if (!plano) throw Object.assign(new Error('Plano não encontrado'), { status: 404 })

  const itensSemSub = []
  for (const ref of plano.refeicoes || []) {
    for (const it of ref.itens || []) {
      if (!it.substituicoes || it.substituicoes.length === 0) {
        itensSemSub.push({
          id:          it.id_dieta_refeicao_item,
          refeicao:    ref.nome,
          descricao:   it.descricao,
          quantidade:  it.quantidade,
          unidade:     it.unidade,
          calorias:    it.calorias,
          proteina:    it.proteina,
          carboidrato: it.carboidrato,
          gordura:     it.gordura,
        })
      }
    }
  }

  if (itensSemSub.length === 0) return { adicionadas: 0 }

  const listaItens = itensSemSub.map((it, i) =>
    `${i + 1}. [${it.refeicao}] ${it.descricao} (${it.quantidade ?? ''}${it.unidade}) — ${it.calorias ?? 0}kcal P:${it.proteina ?? 0}g C:${it.carboidrato ?? 0}g G:${it.gordura ?? 0}g`
  ).join('\n')

  const prompt = `Para cada alimento abaixo, gere 1 ou 2 substituições equivalentes em calorias e macros. Use alimentos brasileiros comuns e acessíveis.

Alimentos sem substituição:
${listaItens}

Retorne APENAS JSON válido:
{"itens":[{"indice":1,"substituicoes":[{"descricao":"Nome","quantidade":150,"unidade":"g","calorias":200,"proteina":30,"carboidrato":5,"gordura":8}]}]}

Use o mesmo número "indice" de cada alimento. Todos os valores numéricos devem ser números.`

  const OpenAI = require('openai')
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const resultado = JSON.parse(resp.choices[0].message.content)

  let adicionadas = 0
  for (const itemResp of resultado.itens || []) {
    const idx = (itemResp.indice ?? 0) - 1
    const orig = itensSemSub[idx]
    if (!orig || !itemResp.substituicoes?.length) continue

    for (let k = 0; k < itemResp.substituicoes.length; k++) {
      const sub = itemResp.substituicoes[k]
      if (!sub.descricao?.trim()) continue
      await pool.request()
        .input('id_item',     sql.Int,          orig.id)
        .input('descricao',   sql.NVarChar(200), sub.descricao)
        .input('quantidade',  sql.Decimal(8, 1), sub.quantidade  ? Number(sub.quantidade)  : null)
        .input('unidade',     sql.VarChar(20),   sub.unidade || 'g')
        .input('calorias',    sql.Int,           sub.calorias    ? Number(sub.calorias)    : null)
        .input('proteina',    sql.Int,           sub.proteina    ? Number(sub.proteina)    : null)
        .input('carboidrato', sql.Int,           sub.carboidrato ? Number(sub.carboidrato) : null)
        .input('gordura',     sql.Int,           sub.gordura     ? Number(sub.gordura)     : null)
        .input('ordem',       sql.TinyInt,       k + 1)
        .query(`
          INSERT INTO dbo.dieta_refeicao_item_substituicao
            (id_dieta_refeicao_item, descricao, quantidade, unidade, calorias, proteina, carboidrato, gordura, ordem)
          VALUES
            (@id_item, @descricao, @quantidade, @unidade, @calorias, @proteina, @carboidrato, @gordura, @ordem)
        `)
      adicionadas++
    }
  }

  return { adicionadas }
}

module.exports = {
  listarPlanos, buscarCompleto, buscarPlanoAtivo, buscarPlanoEmAndamento, criar, atualizar, toggleAtivo, deletar, atualizarStatusPlano, clonar, dadosAlunoParaDieta,
  buscarSolicitacao, solicitarDieta, listarSolicitacoes, atualizarStatusSolicitacao, gerarComIA, gerarSubstituicoes,
}
