import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, extractData, extractList, extractMeta } from '@/lib/api'
import { toast } from '@/store/ui.store'

// Generic list hook
export function useList<T>(key: string[], url: string, params?: Record<string, any>) {
  return useQuery<{ data: T[]; meta: any }>({
    queryKey: [...key, params],
    queryFn: async () => {
      const res = await api.get(url, { params })
      return { data: extractList<T>(res), meta: extractMeta(res) }
    },
  })
}

// Generic single item hook
export function useItem<T>(key: string[], url: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const res = await api.get(url)
      return extractData<T>(res)
    },
    enabled,
  })
}

// Generic mutation hook
export function useMutate<T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  urlFn: (data?: any) => string,
  invalidateKeys?: string[][],
  options?: { successMsg?: string; errorMsg?: string; onSuccess?: (data: T) => void }
) {
  const qc = useQueryClient()
  return useMutation<T, any, any>({
    mutationFn: async (data) => {
      const url = urlFn(data)
      const res = method === 'delete'
        ? await api.delete(url)
        : await api[method](url, data)
      return extractData<T>(res)
    },
    onSuccess: (data) => {
      if (options?.successMsg) toast.success(options.successMsg)
      invalidateKeys?.forEach((k) => qc.invalidateQueries({ queryKey: k }))
      options?.onSuccess?.(data)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || options?.errorMsg || 'Une erreur est survenue'
      toast.error(typeof msg === 'string' ? msg : msg.join(', '))
    },
  })
}
