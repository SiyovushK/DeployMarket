import { create } from 'zustand'
import { tokenStorage } from '../api/client'
import type { AuthResponse, UserProfile } from '../types'

interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  role: string | null

  login: (response: AuthResponse) => void
  logout: () => void
  setUser: (user: UserProfile) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!tokenStorage.getAccess() || !!tokenStorage.getRefresh(),
  user: null,
  // Restore role from localStorage so admin guard works after page refresh
  role: tokenStorage.getRole() || null,

  login: (response) => {
    tokenStorage.setAccess(response.accessToken)
    tokenStorage.setRefresh(response.refreshToken)
    tokenStorage.setRole(response.role)
    set({
      isAuthenticated: true,
      role: response.role,
      user: {
        id: '',
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        phone: null,
        role: response.role,
        createdAt: '',
      },
    })
  },

  logout: () => {
    tokenStorage.clearAll()
    set({ isAuthenticated: false, user: null, role: null })
  },

  setUser: (user) => {
    // Also persist role when profile is loaded
    tokenStorage.setRole(user.role)
    set({ user, role: user.role })
  },
}))

// Listen for forced logout (e.g., refresh token expired)
window.addEventListener('auth:logout', () => {
  useAuthStore.getState().logout()
})
