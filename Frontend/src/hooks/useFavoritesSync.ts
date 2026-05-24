import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { favoritesApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { useFavoritesStore } from '../store/favoritesStore'

export function useFavoritesSync() {
  const { isAuthenticated } = useAuthStore()
  const { guestItems, setServerItems, clearGuest } = useFavoritesStore()
  const qc = useQueryClient()

  const { data: serverFavs } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.get,
    enabled: isAuthenticated,
  })

  const addMut = useMutation({ mutationFn: (id: number) => favoritesApi.add(id) })

  // Sync server data into store
  useEffect(() => {
    if (serverFavs) setServerItems(serverFavs)
  }, [serverFavs, setServerItems])

  // On login: push guest items not yet on server
  useEffect(() => {
    if (!isAuthenticated || !serverFavs || guestItems.length === 0) return
    const serverIds = new Set(serverFavs.map(f => f.productId))
    const toSync = guestItems.filter(g => !serverIds.has(g.productId))
    Promise.allSettled(toSync.map(g => addMut.mutateAsync(g.productId))).then(() => {
      clearGuest()
      qc.invalidateQueries({ queryKey: ['favorites'] })
    })
  }, [isAuthenticated, serverFavs]) // eslint-disable-line
}
