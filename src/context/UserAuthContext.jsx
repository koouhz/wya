import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const UserAuthContext = createContext({})

export function UserAuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkUser()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (session?.user) {
                    setLoading(true)
                    window.setTimeout(async () => {
                        try {
                            await loadUserProfile(session.user.id, session.access_token)
                        } finally {
                            setLoading(false)
                        }
                    }, 0)
                } else if (event === 'SIGNED_OUT') {
                    setUser(null)
                    setLoading(false)
                }
            }
        )
        return () => subscription.unsubscribe()
    }, [])

    async function checkUser() {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) await loadUserProfile(session.user.id)
            else setUser(null)
        } catch (error) {
            console.error('Error checking user:', error)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    async function getAuthHeaders(accessToken) {
        const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY
        return {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        }
    }

    async function loadUserProfile(authUserId, accessToken) {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const headers = await getAuthHeaders(accessToken)
            let response = await fetch(`${supabaseUrl}/rest/v1/usuarios?select=*,roles(nombre,color)&auth_user_id=eq.${authUserId}&estado=eq.activo&limit=1`, { headers })
            if (response.status === 401) {
                const { data: { session } } = await supabase.auth.refreshSession()
                if (session?.access_token) response = await fetch(`${supabaseUrl}/rest/v1/usuarios?select=*,roles(nombre,color)&auth_user_id=eq.${authUserId}&estado=eq.activo&limit=1`, { headers: { ...headers, Authorization: `Bearer ${session.access_token}` } })
            }
            if (!response.ok) throw new Error(`Error loading profile: ${response.status}`)
            const users = await response.json()
            const userData = users?.[0]
            if (userData?.roles) {
                userData.rol = userData.roles.nombre
                userData.rol_color = userData.roles.color
            }
            setUser(userData || null)
        } catch (error) {
            console.error('Error loading user profile:', error)
            setUser({ id: 'temp_' + authUserId, auth_user_id: authUserId, nombre: 'Usuario', email: '' })
        }
    }

    async function register(email, password) {
        email = email.trim().toLowerCase()
        if (!email.endsWith('@gmail.com')) throw new Error('Debes registrarte con un correo Gmail')
        const nombre = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50) || 'Usuario'
        const signupRequest = supabase.auth.signUp({ email, password, options: { data: { nombre } } })
        const timeout = new Promise((_, reject) => window.setTimeout(() => reject(new Error('El registro tardó demasiado. Comprueba tu conexión e inténtalo de nuevo.')), 15000))
        const { data, error } = await Promise.race([signupRequest, timeout])
        if (error) {
            if (error.status === 429) {
                const rateLimitError = new Error('Has realizado demasiados intentos. Espera unos segundos.')
                rateLimitError.code = 'RATE_LIMITED'
                rateLimitError.retryAfter = 45
                throw rateLimitError
            }
            throw new Error(error.message || 'Error al registrarse')
        }
        return { user: data.user, requiresConfirmation: Boolean(data.user && !data.session) }
    }

    async function login(email, password) {
        email = email.trim().toLowerCase()
        console.log('[UserAuthContext] Intentando login REST...', email)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        try {
            const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            })

            const authData = await authResponse.json()

            if (!authResponse.ok) {
                console.error('[UserAuthContext] Auth error REST:', authData)
                const authMessage = authData.error_description || authData.msg || 'Error al iniciar sesión'
                if (authMessage.toLowerCase().includes('email not confirmed')) {
                    throw new Error('Tu email todavía no está confirmado. Revisa tu bandeja de entrada o solicita otro correo de confirmación.')
                }
                throw new Error(authMessage)
            }

            console.log('[UserAuthContext] REST Login éxito')
            if (authData.access_token) {
                await supabase.auth.setSession({
                    access_token: authData.access_token,
                    refresh_token: authData.refresh_token
                })
                try {
                    const projectRef = import.meta.env.VITE_SUPABASE_URL.match(/\/\/([^.]+)\./)?.[1]
                    if (projectRef) {
                        const key = `sb-${projectRef}-auth-token`
                        localStorage.setItem(key, JSON.stringify({
                            access_token: authData.access_token,
                            refresh_token: authData.refresh_token,
                            user: authData.user,
                            expires_at: Math.floor(Date.now() / 1000) + (authData.expires_in || 3600),
                            token_type: 'bearer'
                        }))
                    }
                } catch (e) { }
            }

            if (authData.user && authData.access_token) {
                const token = authData.access_token
                const headers = {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
                try {
                    let response = await fetch(
                        `${supabaseUrl}/rest/v1/usuarios?select=*,roles(nombre,color)&auth_user_id=eq.${authData.user.id}&estado=eq.activo&limit=1`,
                        { headers }
                    )

                    let users = await response.json()
                    if (!users?.length) {
                    }
                    if (!users?.length) {
                        const metaName = authData.user.user_metadata?.nombre || authData.user.user_metadata?.name
                        const finalName = metaName || email.split('@')[0]

                        const createResponse = await fetch(
                            `${supabaseUrl}/rest/v1/usuarios`,
                            {
                                method: 'POST',
                                headers: { ...headers, 'Prefer': 'return=representation' },
                                body: JSON.stringify({
                                    auth_user_id: authData.user.id,
                                    nombre: finalName,
                                    email: email
                                })
                            }
                        )

                        if (createResponse.ok) {
                            users = await createResponse.json()
                        }
                    }

                    const userData = users?.[0]
                    if (userData) {
                        fetch(
                            `${supabaseUrl}/rest/v1/usuarios?id=eq.${userData.id}`,
                            {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({ ultimo_acceso: new Date().toISOString() })
                            }
                        ).catch(e => { })
                    }

                    if (userData) {
                        if (userData.roles) {
                            userData.rol = userData.roles.nombre
                            userData.rol_color = userData.roles.color
                        }
                        setUser(userData)
                        return userData
                    }
                } catch (err) {
                    console.error('[UserAuthContext] Error en flujo de perfil:', err)
                }
                const fallbackUser = {
                    id: 'temp_' + authData.user.id,
                    auth_user_id: authData.user.id,
                    nombre: email.split('@')[0],
                    email: email,
                    avatar_url: null
                }
                setUser(fallbackUser)
                return fallbackUser
            }

            return null
        } catch (e) {
            console.error('[UserAuthContext] Error en login:', e)
            throw e
        }
    }

    async function resendConfirmation(email) {
        const normalizedEmail = email.trim().toLowerCase()
        if (!normalizedEmail) throw new Error('Escribe tu email para reenviar la confirmación')

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: normalizedEmail,
            options: {
                emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`
            }
        })

        if (error) {
            if (error.status === 429) throw new Error('Espera unos segundos antes de solicitar otro correo.')
            throw new Error(error.message || 'No se pudo reenviar el correo de confirmación')
        }
    }

    async function logout() {
        try {
            const projectRef = import.meta.env.VITE_SUPABASE_URL.match(/\/\/([^.]+)\./)?.[1]
            if (projectRef) {
                localStorage.removeItem(`sb-${projectRef}-auth-token`)
            }
        } catch (e) { }

        try {
            supabase.auth.signOut().then(() => { }).catch(() => { })
        } catch (e) { }

        setUser(null)
    }

    async function updateProfile(updates) {
        if (!user) throw new Error('No hay usuario logueado')

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const headers = await getAuthHeaders()

        const response = await fetch(
            `${supabaseUrl}/rest/v1/usuarios?id=eq.${user.id}`,
            {
                method: 'PATCH',
                headers: { ...headers, 'Prefer': 'return=representation' },
                body: JSON.stringify(updates)
            }
        )

        if (!response.ok) throw new Error('Error updating profile')
        const data = await response.json()

        setUser(data[0])
        return data[0]
    }

    const value = {
        user,
        loading,
        isLoggedIn: !!user,
        register,
        login,
        resendConfirmation,
        logout,
        updateProfile
    }

    return (
        <UserAuthContext.Provider value={value}>
            {children}
        </UserAuthContext.Provider>
    )
}

export function useUserAuth() {
    const context = useContext(UserAuthContext)
    if (!context) {
        throw new Error('useUserAuth debe usarse dentro de UserAuthProvider')
    }
    return context
}

export default UserAuthContext
