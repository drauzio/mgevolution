import useSWR from 'swr'
import { useAuthContext } from '../context/AuthContext'
import api from '../services/api'

const fetcher = ([, id]) => api.get('/menu').then(r => r.data)

export function useMenu() {
  const { token, usuario } = useAuthContext()
  const { data, error, isLoading } = useSWR(
    token ? ['menu', usuario?.id] : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  return { itens: data || [], isLoading, error }
}
