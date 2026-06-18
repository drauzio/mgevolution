const { getPool, sql } = require('../database/connection')

async function buscarOuCriar(idUsuario, idTreinoDia, idProtocolo) {
  const pool = await getPool()
  const hoje = new Date().toISOString().slice(0, 10)

  const temExercicios = await pool.request()
    .input('idTreinoDia', sql.Int, idTreinoDia)
    .query(`SELECT COUNT(*) AS cnt FROM dbo.treino_dia_exercicio WHERE id_treino_dia = @idTreinoDia`)
  if (temExercicios.recordset[0].cnt === 0) return null

  const existe = await pool.request()
    .input('idUsuario',   sql.Int,  idUsuario)
    .input('idTreinoDia', sql.Int,  idTreinoDia)
    .input('data',        sql.Date, hoje)
    .query(`
      SELECT id_treino_sessao, concluida
      FROM dbo.treino_sessao
      WHERE id_usuario = @idUsuario AND id_treino_dia = @idTreinoDia AND data_sessao = @data
    `)

  let idSessao
  if (existe.recordset[0]) {
    idSessao = existe.recordset[0].id_treino_sessao
  } else {
    const ins = await pool.request()
      .input('idUsuario',   sql.Int, idUsuario)
      .input('idTreinoDia', sql.Int, idTreinoDia)
      .input('idProtocolo', sql.Int, idProtocolo)
      .input('data',        sql.Date, hoje)
      .query(`
        INSERT INTO dbo.treino_sessao (id_usuario, id_treino_dia, id_protocolo, data_sessao)
        OUTPUT INSERTED.id_treino_sessao
        VALUES (@idUsuario, @idTreinoDia, @idProtocolo, @data)
      `)
    idSessao = ins.recordset[0].id_treino_sessao
  }

  const exercicios = await pool.request()
    .input('idSessao',    sql.Int, idSessao)
    .input('idTreinoDia', sql.Int, idTreinoDia)
    .query(`
      SELECT
        tse.id_treino_sessao_exercicio,
        tde.id_treino_dia_exercicio,
        ISNULL(tse.feito, 0)          AS feito,
        tse.carga_usada,
        tde.id_exercicio,
        e.nome AS exercicio_nome,
        e.grupo_muscular,
        e.equipamento,
        e.video_url,
        tde.series,
        tde.repeticoes,
        tde.carga_sugerida,
        tde.descanso_seg,
        tde.observacao,
        tde.ordem
      FROM dbo.treino_dia_exercicio tde
      JOIN dbo.exercicio e ON e.id_exercicio = tde.id_exercicio
      LEFT JOIN dbo.treino_sessao_exercicio tse
        ON tse.id_treino_dia_exercicio = tde.id_treino_dia_exercicio
        AND tse.id_treino_sessao = @idSessao
      WHERE tde.id_treino_dia = @idTreinoDia
      ORDER BY tde.ordem
    `)

  const sessao = await pool.request()
    .input('id', sql.Int, idSessao)
    .query(`SELECT * FROM dbo.treino_sessao WHERE id_treino_sessao = @id`)

  return {
    ...sessao.recordset[0],
    exercicios: exercicios.recordset,
  }
}

async function marcarExercicio(idSessao, idTreinoDiaExercicio, feito, cargaUsada) {
  const pool = await getPool()

  const existe = await pool.request()
    .input('idSessao',    sql.Int, idSessao)
    .input('idExercicio', sql.Int, idTreinoDiaExercicio)
    .query(`
      SELECT id_treino_sessao_exercicio
      FROM dbo.treino_sessao_exercicio
      WHERE id_treino_sessao = @idSessao AND id_treino_dia_exercicio = @idExercicio
    `)

  if (existe.recordset[0]) {
    await pool.request()
      .input('idSessao',    sql.Int,        idSessao)
      .input('idExercicio', sql.Int,        idTreinoDiaExercicio)
      .input('feito',       sql.Bit,        feito ? 1 : 0)
      .input('carga',       sql.VarChar(30), cargaUsada || null)
      .input('dataHora',    sql.DateTime,   feito ? new Date() : null)
      .query(`
        UPDATE dbo.treino_sessao_exercicio
        SET feito = @feito, carga_usada = @carga, data_hora = @dataHora
        WHERE id_treino_sessao = @idSessao AND id_treino_dia_exercicio = @idExercicio
      `)
  } else {
    await pool.request()
      .input('idSessao',    sql.Int,        idSessao)
      .input('idExercicio', sql.Int,        idTreinoDiaExercicio)
      .input('feito',       sql.Bit,        feito ? 1 : 0)
      .input('carga',       sql.VarChar(30), cargaUsada || null)
      .input('dataHora',    sql.DateTime,   feito ? new Date() : null)
      .query(`
        INSERT INTO dbo.treino_sessao_exercicio
          (id_treino_sessao, id_treino_dia_exercicio, feito, carga_usada, data_hora)
        VALUES (@idSessao, @idExercicio, @feito, @carga, @dataHora)
      `)
  }
}

async function iniciar(idSessao, idUsuario) {
  const pool = await getPool()
  await pool.request()
    .input('id',        sql.Int,      idSessao)
    .input('idUsuario', sql.Int,      idUsuario)
    .input('agora',     sql.DateTime, new Date())
    .query(`
      UPDATE dbo.treino_sessao
      SET data_inicio = CASE WHEN data_inicio IS NULL THEN @agora ELSE data_inicio END
      WHERE id_treino_sessao = @id AND id_usuario = @idUsuario
    `)
  const r = await pool.request()
    .input('id', sql.Int, idSessao)
    .query(`SELECT data_inicio FROM dbo.treino_sessao WHERE id_treino_sessao = @id`)
  return r.recordset[0]
}

async function concluir(idSessao, idUsuario) {
  const pool = await getPool()
  await pool.request()
    .input('id',        sql.Int,      idSessao)
    .input('idUsuario', sql.Int,      idUsuario)
    .input('agora',     sql.DateTime, new Date())
    .query(`
      UPDATE dbo.treino_sessao
      SET concluida = 1, data_conclusao = @agora
      WHERE id_treino_sessao = @id AND id_usuario = @idUsuario
    `)
}

async function historico(idUsuario, limit = 30) {
  const pool = await getPool()
  const result = await pool.request()
    .input('idUsuario', sql.Int, idUsuario)
    .input('limit',     sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        s.id_treino_sessao,
        s.data_sessao,
        s.concluida,
        s.data_inicio,
        s.data_conclusao,
        td.nome  AS dia_nome,
        td.dia_semana,
        COUNT(tse.id_treino_sessao_exercicio)                          AS total_exercicios,
        SUM(CASE WHEN tse.feito = 1 THEN 1 ELSE 0 END)                AS exercicios_feitos
      FROM dbo.treino_sessao s
      JOIN dbo.treino_dia td ON td.id_treino_dia = s.id_treino_dia
      LEFT JOIN dbo.treino_sessao_exercicio tse ON tse.id_treino_sessao = s.id_treino_sessao
      WHERE s.id_usuario = @idUsuario
      GROUP BY s.id_treino_sessao, s.data_sessao, s.concluida, s.data_inicio, s.data_conclusao, td.nome, td.dia_semana
      ORDER BY s.data_sessao DESC
    `)
  return result.recordset
}

async function cancelar(idSessao, idUsuario) {
  const pool = await getPool()
  await pool.request()
    .input('id',        sql.Int, idSessao)
    .input('idUsuario', sql.Int, idUsuario)
    .query(`DELETE FROM dbo.treino_sessao_exercicio WHERE id_treino_sessao = @id`)
  await pool.request()
    .input('id',        sql.Int, idSessao)
    .input('idUsuario', sql.Int, idUsuario)
    .query(`DELETE FROM dbo.treino_sessao WHERE id_treino_sessao = @id AND id_usuario = @idUsuario AND concluida = 0`)
}

module.exports = { buscarOuCriar, iniciar, marcarExercicio, concluir, cancelar, historico }
