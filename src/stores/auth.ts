import { create } from 'zustand'

// Lightweight auth state using zustand
const TOKEN_KEY = 'learnsmart_token'
const USER_KEY = 'learnsmart_user'
const REMEMBER_KEY = 'learnsmart_remember'

export interface SeoMeta {
  title: string
  description: string
  noindex?: boolean
  type?: 'website' | 'article' | 'profile'
}

export interface UserProfile {
  id: number
  username: string
  email: string
  avatar_url?: string
  is_superuser?: boolean
}

function getLocalStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function getSessionStorage() {
  try {
    return globalThis.sessionStorage
  } catch {
    return null
  }
}

function readToken(): string | null {
  try {
    const local = getLocalStorage()
    const session = getSessionStorage()
    return local?.getItem(TOKEN_KEY) || session?.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

function persistToken(next: string | null, remember?: boolean) {
  try {
    const local = getLocalStorage()
    const session = getSessionStorage()
    if (!next) {
      local?.removeItem(TOKEN_KEY)
      session?.removeItem(TOKEN_KEY)
      return
    }

    if (remember) {
      local?.setItem(TOKEN_KEY, next)
      session?.removeItem(TOKEN_KEY)
    } else {
      session?.setItem(TOKEN_KEY, next)
      local?.removeItem(TOKEN_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

function readUser(): UserProfile | null {
  try {
    const local = getLocalStorage()
    const session = getSessionStorage()
    const raw = local?.getItem(USER_KEY) || session?.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

function persistUser(next: UserProfile | null) {
  try {
    const local = getLocalStorage()
    const session = getSessionStorage()
    if (!next) {
      local?.removeItem(USER_KEY)
      session?.removeItem(USER_KEY)
      return
    }
    session?.setItem(USER_KEY, JSON.stringify(next))
    local?.removeItem(USER_KEY)
  } catch {
    // ignore storage errors
  }
}

interface AuthState {
  token: string | null
  user: UserProfile | null
  isAuthed: boolean
  avatarBuster: number
  setToken: (next: string | null, remember?: boolean) => void
  setUser: (next: UserProfile | null) => void
  bumpAvatarBuster: () => void
  logout: () => void
  fetchProfile: (force?: boolean) => Promise<UserProfile | null>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: readToken(),
  user: readUser(),
  avatarBuster: 0,
  isAuthed: !!readToken(),

  setToken: (next, remember) => {
    persistToken(next, remember)
    set({ token: next, isAuthed: !!next })
  },

  setUser: (next) => {
    persistUser(next)
    set({ user: next, isAuthed: !!next || !!get().token })
  },

  bumpAvatarBuster: () => {
    set((state) => ({ avatarBuster: state.avatarBuster + 1 }))
  },

  logout: () => {
    persistToken(null)
    persistUser(null)
    set({ token: null, user: null, isAuthed: false })
  },

  fetchProfile: async (_force = false) => {
    const { token } = get()
    if (!token) {
      set({ user: null })
      return null
    }

    // TODO: Implement actual API call to get current user
    // For now, return stored user
    const storedUser = readUser()
    set({ user: storedUser })
    return storedUser
  },
}))

export default useAuthStore

// Alias for pages expecting Context-based useAuth
export const useAuth = useAuthStore
