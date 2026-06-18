const { getPool, sql } = require('../database/connection')

function toJson(obj) {
  if (obj == null) return null
  try { return JSON.stringify(obj) } catch { return null }
}

async function registrar({ id_usuario, nome_usuario, acao, entidade, id_entidade, descricao, dados_antes, dados_depois, ip }) {
  try {
    const pool = await getPool()
    await pool.request()
      .input('id_usuario',   sql.Int,           id_usuario)
      .input('nome_usuario', sql.VarChar(100),   nome_usuario  || null)
      .input('acao',         sql.VarChar(50),    acao)
      .input('entidade',     sql.VarChar(50),    entidade      || null)
      .input('id_entidade',  sql.Int,            id_entidade   || null)
      .input('descricao',    sql.VarChar(500),   descricao     || null)
      .input('dados_antes',  sql.NVarChar(sql.MAX), toJson(dados_antes))
      .input('dados_depois', sql.NVarChar(sql.MAX), toJson(dados_depois))
      .input('ip',           sql.VarChar(45),    ip            || null)
      .query(`
        INSERT INTO dbo.auditoria_log
          (id_usuario, nome_usuario, acao, entidade, id_entidade, descricao, dados_antes, dados_depois, ip)
        VALUES
          (@id_usuario, @nome_usuario, @acao, @entidade, @id_entidade, @descricao, @dados_antes, @dados_depois, @ip)
      `)
  } catch (e) {
    console.error('[Auditoria] Erro ao registrar:', e.message)
  }
}

async function listar({ pagina = 1, acao, entidade, id_usuario_filtro } = {}) {
  const pool = await getPool()
  const rq   = pool.request().input('offset', sql.Int, (pagina - 1) * 50)

  let where = 'WHERE 1=1'
  if (acao)              { rq.input('acao',     sql.VarChar(50), acao);             where += ' AND al.acao LIKE @acao' }
  if (entidade)          { rq.input('entidade', sql.VarChar(50), entidade);         where += ' AND al.entidade = @entidade' }
  if (id_usuario_filtro) { rq.input('uid',      sql.Int,         id_usuario_filtro); where += ' AND al.id_usuario = @uid' }

  const result = await rq.query(`
    SELECT
      al.id_log, al.acao, al.entidade, al.id_entidade, al.descricao, al.ip,
      al.id_usuario, al.nome_usuario, al.dados_antes, al.dados_depois,
      CONVERT(VARCHAR(16), al.data_acao, 120) AS data_acao
    FROM dbo.auditoria_log al
    ${where}
    ORDER BY al.id_log DESC
    OFFSET @offset ROWS FETCH NEXT 50 ROWS ONLY
  `)
  return result.recordset
}

async function ultimaModificacao(entidade, id_entidade) {
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('entidade',    sql.VarChar(50), entidade)
      .input('id_entidade', sql.Int,         id_entidade)
      .query(`
        SELECT TOP 1
          al.acao, al.nome_usuario, al.id_usuario,
          CONVERT(VARCHAR(16), al.data_acao, 120) AS data_acao
        FROM dbo.auditoria_log al
        WHERE al.entidade = @entidade AND al.id_entidade = @id_entidade
        ORDER BY al.id_log DESC
      `)
    return result.recordset[0] || null
  } catch { return null }
}

module.exports = { registrar, listar, ultimaModificacao }
