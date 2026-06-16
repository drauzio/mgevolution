import useSWR from 'swr'
import { useAuthContext } from '../context/AuthContext'
import { buscarStatus } from '../services/avaliacao'

export function useAvaliacaoStatus() {
  const { token } = useAuthContext()
  const { data, isLoading, mutate } = useSWR(
    token ? 'avaliacao-status' : null,
    buscarStatus,
    { revalidateOnFocus: false }
  )
  return { status: data, isLoading, revalidar: mutate }
}
