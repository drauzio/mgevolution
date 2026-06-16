const { getPool, sql } = require('../database/connection')

function calcularPontos({ treino, cardio, dieta, sono, agua }) {
  return Math.round(
    (treino ? 25 : 0) +
    (cardio ? 20 : 0) +
    Math.min(dieta / 100, 1) * 25 +
    Math.min(sono / 8, 1) * 15 +
    Math.min(agua / 3, 1) * 15
  )
}

async function registrar(id_usuario, dados) {
  const pool = await getPool()
  const pontos = calcularPontos(dados)
  const hoje = new Date().toISOString().slice(0, 10)

  await pool.request()
    .input('id_usuario', sql.Int, id_usuario)
    .input('data', sql.Date, hoje)
    .input('treino', sql.Bit, dados.treino ? 1 : 0)
    .input('cardio', sql.Bit, dados.cardio ? 1 : 0)
    .input('dieta', sql.Decimal(5, 2), dados.dieta)
    .input('sono', sql.Decimal(4, 1), dados.sono)
    .input('agua', sql.Decimal(4, 1), dados.agua)
    .input('pontos', sql.Int, pontos)
    .query(`
      MERGE dbo.shape_score AS alvo
      USING (SELECT @id_usuario AS id_usuario, @data AS data) AS novo
        ON alvo.id_usuario = novo.id_usuario AND alvo.data = novo.data
      WHEN MATCHED THEN
        UPDATE SET treino=@treino, cardio=@cardio, dieta=@dieta,
                   sono=@sono, agua=@agua, pontos=@pontos
      WHEN NOT MATCHED THEN
        INSERT (id_usuario, data, treino, cardio, dieta, sono, agua, pontos)
        VALUES (@id_usuario, @data, @treino, @cardio, @dieta, @sono, @agua, @pontos);
    `)

  return { pontos }
}

async function historico(id_usuario, dias = 30) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id_usuario', sql.Int, id_usuario)
    .input('dias', sql.Int, dias)
    .query(`
      SELECT TOP (@dias) data, pontos, treino, cardio, dieta, sono, agua
      FROM dbo.shape_score
      WHERE id_usuario = @id_usuario
      ORDER BY data DESC
    `)
  return result.recordset
}

async function mediaSemanal(id_usuario) {
  const pool = await getPool()
  const result = await pool.request()
    .input('id_usuario', sql.Int, id_usuario)
    .query(`
      SELECT ROUND(AVG(CAST(pontos AS FLOAT)), 0) AS media
      FROM dbo.shape_score
      WHERE id_usuario = @id_usuario
        AND data >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
    `)
  return result.recordset[0]?.media || 0
}

module.exports = { registrar, historico, mediaSemanal }
