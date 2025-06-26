import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pondService, type Pond, type PondInsert, type PondUpdate } from '@/services/supabase'

export function usePonds() {
  return useQuery({
    queryKey: ['ponds'],
    queryFn: pondService.getAll,
  })
}

export function useCreatePond() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pond: Omit<PondInsert, 'user_id'>) => pondService.create(pond),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useUpdatePond() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PondUpdate }) =>
      pondService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

export function useDeletePond() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => pondService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}