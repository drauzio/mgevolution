const { getPool, sql } = require('../database/connection')
const { clonarParaAluno } = require('./template.service')

async function getStatus(id_usuario) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id_usuario', sql.Int, id_usuario)
    .query(`
      SELECT TOP 1 id_avaliacao_fitness, status
      FROM dbo.avaliacao_fitness
      WHERE id_usuario = @id_usuario AND ativo = 1
      ORDER BY data_inicio DESC
    `)
  const row = result.recordset[0]
  return {
    concluida: !!row && row.status === 'concluida',
    id_avaliacao: row?.id_avaliacao_fitness || null,
  }
}

async function getPerguntas() {
  const pool = await getPool()

  const pergs = await pool.request().query(`
    SELECT id_avaliacao_fitness_pergunta AS id, codigo, pergunta, tipo,
           obrigatorio, exibir_detalhe_sim, descricao_detalhe_sim, ordem
    FROM dbo.avaliacao_fitness_pergunta
    WHERE ativo = 1
    ORDER BY ordem
  `)

  const opts = await pool.request().query(`
    SELECT id_avaliacao_fitness_pergunta AS id_pergunta,
           id_avaliacao_fitness_pergunta_opcao AS id,
           valor, ordem
    FROM dbo.avaliacao_fitness_pergunta_opcao
    WHERE ativo = 1
    ORDER BY ordem
  `)

  const opcoesMap = {}
  opts.recordset.forEach(o => {
    if (!opcoesMap[o.id_pergunta]) opcoesMap[o.id_pergunta] = []
    opcoesMap[o.id_pergunta].push({ id: o.id, valor: o.valor })
  })

  return pergs.recordset.map(p => ({
    ...p,
    opcoes: opcoesMap[p.id] || [],
  }))
}

async function salvar(id_usuario, respostas) {
  const pool = await getPool()
  const tx = pool.transaction()
  await tx.begin()

  try {
    // Cria ou reaproveita avaliação em andamento
    let id_avaliacao
    const existe = await tx.request()
      .input('id_usuario', sql.Int, id_usuario)
      .query(`
        SELECT TOP 1 id_avaliacao_fitness FROM dbo.avaliacao_fitness
        WHERE id_usuario = @id_usuario AND status = 'em_andamento' AND ativo = 1
      `)

    if (existe.recordset[0]) {
      id_avaliacao = existe.recordset[0].id_avaliacao_fitness
    } else {
      const novo = await tx.request()
        .input('id_usuario', sql.Int, id_usuario)
        .query(`
          INSERT INTO dbo.avaliacao_fitness (id_usuario, status)
          OUTPUT INSERTED.id_avaliacao_fitness
          VALUES (@id_usuario, 'em_andamento')
        `)
      id_avaliacao = novo.recordset[0].id_avaliacao_fitness
    }

    // Apaga respostas anteriores desta avaliação (re-submit)
    await tx.request()
      .input('id', sql.Int, id_avaliacao)
      .query(`DELETE FROM dbo.avaliacao_fitness_resposta WHERE id_avaliacao_fitness = @id`)

    // Insere cada resposta
    for (const r of respostas) {
      const req = tx.request()
        .input('id_avaliacao', sql.Int, id_avaliacao)
        .input('id_pergunta', sql.Int, r.id_pergunta)
        .input('bit',    sql.Bit,           r.resposta_bit    ?? null)
        .input('texto',  sql.NVarChar(500), r.resposta_texto  ?? null)
        .input('numero', sql.Decimal(18,2), r.resposta_numero ?? null)
        .input('id_opcao', sql.Int,         r.id_opcao        ?? null)

      await req.query(`
        INSERT INTO dbo.avaliacao_fitness_resposta
          (id_avaliacao_fitness, id_avaliacao_fitness_pergunta,
           resposta_bit, resposta_texto, resposta_numero, id_avaliacao_fitness_pergunta_opcao)
        VALUES (@id_avaliacao, @id_pergunta, @bit, @texto, @numero, @id_opcao)
      `)
    }

    // Extrai campos-chave das respostas para gravar no cabeçalho
    const objResp   = respostas.find(r => r.codigo === 'objetivo')
    const nivResp   = respostas.find(r => r.codigo === 'nivel')
    const sexoResp  = respostas.find(r => r.codigo === 'sexo')
    const idadeResp = respostas.find(r => r.codigo === 'idade')

    const objetivo = objResp?.valor_texto || null
    const nivel    = nivResp?.valor_texto || null
    const sexoTexto = sexoResp?.valor_texto || null
    const sexo = sexoTexto === 'Masculino' ? 'M' : sexoTexto === 'Feminino' ? 'F' : sexoTexto || null

    // Calcula idade a partir da data de nascimento (DD/MM/YYYY ou YYYY-MM-DD)
    let idade = null
    const dataNasc = idadeResp?.resposta_texto || idadeResp?.resposta_numero
    if (dataNasc) {
      const d = new Date(String(dataNasc).includes('/')
        ? String(dataNasc).split('/').reverse().join('-')
        : dataNasc)
      if (!isNaN(d)) {
        const hoje = new Date()
        idade = hoje.getFullYear() - d.getFullYear()
        if (hoje.getMonth() < d.getMonth() || (hoje.getMonth() === d.getMonth() && hoje.getDate() < d.getDate()))
          idade--
      }
    }

    await tx.request()
      .input('id',       sql.Int,        id_avaliacao)
      .input('objetivo', sql.VarChar(30), objetivo)
      .input('nivel',    sql.VarChar(30), nivel)
      .input('sexo',     sql.VarChar(1),  sexo)
      .input('idade',    sql.Int,         idade)
      .query(`
        UPDATE dbo.avaliacao_fitness
        SET status = 'concluida', objetivo = @objetivo, nivel = @nivel,
            sexo = @sexo, idade = @idade,
            data_finalizacao = SYSUTCDATETIME()
        WHERE id_avaliacao_fitness = @id
      `)

    // Auto-atribuir template (erro não bloqueia a avaliação)
    try {
      await clonarParaAluno(tx, id_usuario, null, objetivo, nivel, sexo, idade)
    } catch (tmplErr) {
      console.error('[avaliacao] template não atribuído:', tmplErr.message)
    }

    await tx.commit()
    return id_avaliacao
  } catch (err) {
    await tx.rollback()
    throw err
  }
}

async function getMinhaAvaliacao(id_usuario) {
  const pool = await getPool()

  const header = await pool.request()
    .input('id_usuario', sql.Int, id_usuario)
    .query(`
      SELECT TOP 1
        af.id_avaliacao_fitness AS id,
        af.status, af.objetivo, af.nivel, af.sexo, af.idade,
        af.data_inicio, af.data_finalizacao,
        tp.id_protocolo AS protocolo_id,
        tp.nome         AS protocolo_nome
      FROM dbo.avaliacao_fitness af
      OUTER APPLY (
        SELECT TOP 1 id_treino_protocolo AS id_protocolo, nome
        FROM dbo.treino_protocolo
        WHERE id_usuario = af.id_usuario AND ativo = 1
        ORDER BY data_criacao DESC
      ) tp
      WHERE af.id_usuario = @id_usuario AND af.ativo = 1
      ORDER BY af.data_inicio DESC
    `)

  if (!header.recordset[0]) return null

  const { id } = header.recordset[0]

  const respostas = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        p.pergunta,
        p.tipo,
        p.codigo,
        p.ordem,
        r.resposta_bit,
        r.resposta_texto,
        r.resposta_numero,
        o.valor AS opcao_valor
      FROM dbo.avaliacao_fitness_resposta r
      JOIN dbo.avaliacao_fitness_pergunta p
        ON p.id_avaliacao_fitness_pergunta = r.id_avaliacao_fitness_pergunta
      LEFT JOIN dbo.avaliacao_fitness_pergunta_opcao o
        ON o.id_avaliacao_fitness_pergunta_opcao = r.id_avaliacao_fitness_pergunta_opcao
      WHERE r.id_avaliacao_fitness = @id
      ORDER BY p.ordem
    `)

  return { ...header.recordset[0], respostas: respostas.recordset }
}

module.exports = { getStatus, getPerguntas, salvar, getMinhaAvaliacao }
