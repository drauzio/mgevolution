const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const sessoes = new Map() // id_usuario → histórico de mensagens

const SYSTEM_PROMPT = `Você é o Coach IA MG, assistente de transformação física baseado no método do Márcio Gonçalves.

Diretrizes:
- Responda sempre em português brasileiro, de forma direta e motivadora
- Base suas respostas no método MG: treino intenso, déficit calórico controlado, sono de qualidade e consistência
- Seja específico e prático — evite respostas genéricas
- Encoraje o aluno sem ser exagerado
- Nunca substitua orientação médica; para questões de saúde, indique procurar um profissional
- Mantenha respostas entre 2 e 5 parágrafos curtos`

async function chat(id_usuario, mensagem) {
  if (!sessoes.has(id_usuario)) sessoes.set(id_usuario, [])

  const historico = sessoes.get(id_usuario)
  historico.push({ role: 'user', content: mensagem })

  // Mantém no máximo 20 mensagens por sessão
  if (historico.length > 20) historico.splice(0, 2)

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: historico,
  })

  const resposta = response.content[0].text
  historico.push({ role: 'assistant', content: resposta })

  return resposta
}

function limparSessao(id_usuario) {
  sessoes.delete(id_usuario)
}

module.exports = { chat, limparSessao }
