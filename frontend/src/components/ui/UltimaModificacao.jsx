import useSWR from 'swr'
import { ultimaModificacao } from '../../services/logs'

export default function UltimaModificacao({ entidade, id }) {
  const { data } = useSWR(
    id ? ['ultima-mod', entidade, id] : null,
    () => ultimaModificacao(entidade, id),
    { revalidateOnFocus: false }
  )

  if (!data?.data_acao) return null

  return (
    <p style={{ fontSize: 11, color: '#A09890' }}>
      Última alteração em <strong>{data.data_acao}</strong> por <strong>{data.nome_usuario || `#${data.id_usuario}`}</strong>
    </p>
  )
}
