import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { profileApi } from '../api'
import { useAuthStore } from '../store/authStore'

/**
 * Loads full profile (id, phone, etc.) after JWT login.
 * Merges into auth store so User.id is available everywhere.
 */
export function useProfileSync() {
  const { isAuthenticated, user, setUser } = useAuthStore()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    enabled: isAuthenticated && !user?.id,   // fetch only when id is missing
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (profile) setUser(profile)
  }, [profile, setUser])
}
