import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useUserAuth } from '../context/UserAuthContext'
import { Icon } from '../components/Icons.jsx'
import './UserAuth.css'

function UserAuth() {
    const [mode, setMode] = useState('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const { login, register, resendConfirmation } = useUserAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from || '/'

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const PASSWORD_REGEX = /^(?=.*\p{L})(?=.*\p{N}).{8,}$/u

    async function handleSubmit(e) {
        e.preventDefault()
        if (cooldown > 0) return
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            if (!email.trim() || !EMAIL_REGEX.test(email)) {
                throw new Error('Por favor ingresa un email válido: ejemplo@correo.com')
            }

            if (mode === 'login') {
                if (!password) throw new Error('Ingresa tu contraseña')

                await login(email, password)
                navigate(from, { replace: true })
            } else {
                if (!PASSWORD_REGEX.test(password)) {
                    throw new Error('La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.')
                }

                if (password !== confirmPassword) {
                    throw new Error('Las contraseñas no coinciden')
                }

                const registration = await register(email, password)
                if (registration?.requiresConfirmation) {
                    setSuccess('Cuenta creada. Revisa tu correo y confirma la cuenta antes de iniciar sesión.')
                } else {
                    setSuccess('Cuenta creada correctamente. Ya puedes comenzar a usar Community Lou.')
                    window.setTimeout(() => navigate(from, { replace: true }), 700)
                }
            }
        } catch (err) {
            setError(err.message || 'Error de autenticación')
            if (err.code === 'RATE_LIMITED') {
                setCooldown(err.retryAfter || 45)
                const cooldownTimer = window.setInterval(() => {
                    setCooldown(previous => {
                        if (previous <= 1) {
                            window.clearInterval(cooldownTimer)
                            return 0
                        }
                        return previous - 1
                    })
                }, 1000)
            }
        } finally {
            setLoading(false)
        }
    }

    async function handleResendConfirmation() {
        setError('')
        setSuccess('')
        setResendLoading(true)
        try {
            await resendConfirmation(email)
            setSuccess('Correo de confirmación reenviado. Revisa también la carpeta de spam.')
        } catch (err) {
            setError(err.message || 'No se pudo reenviar el correo')
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="user-auth-page">
            <div className="auth-background">
                <div className="auth-gradient"></div>
            </div>

            <div className="auth-container">
                <Link to="/" className="auth-logo">
                    <img src={`${import.meta.env.BASE_URL}images/logo123.jpg`} alt="Community Lou" />
                    <span>Community Lou</span>
                </Link>

                <div className="auth-card">
                    <div className="auth-tabs">
                        <button
                            className={mode === 'login' ? 'active' : ''}
                            onClick={() => { setMode('login'); setError(''); }}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            className={mode === 'register' ? 'active' : ''}
                            onClick={() => { setMode('register'); setError(''); }}
                        >
                            Registrarse
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === 'register' ? "Min. 8 caracteres" : "••••••••"}
                                required
                                minLength={8}
                            />
                        </div>

                        {mode === 'register' && (
                            <div className="form-group">
                                <label>Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repite tu contraseña"
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div className="auth-error">
                                <Icon name="warning" size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {mode === 'login' && error.toLowerCase().includes('confirmado') && (
                            <button type="button" className="auth-resend" onClick={handleResendConfirmation} disabled={resendLoading}>
                                {resendLoading ? 'Enviando...' : 'Reenviar confirmación'}
                            </button>
                        )}

                        {success && (
                            <div className="auth-success">
                                <Icon name="star" size={16} />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading || cooldown > 0}
                        >
                            {loading ? 'Cargando...' : cooldown > 0 ? `Espera ${cooldown}s` : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                        </button>
                    </form>

                    <p className="auth-note">
                        {mode === 'login'
                            ? '¿No tienes cuenta? Regístrate para comentar y reaccionar.'
                            : 'Al registrarte podrás comentar y reaccionar en clips y actividades.'}
                    </p>
                </div>

                <Link to="/" className="back-link">
                    <Icon name="chevronRight" size={16} className="rotated" />
                    Volver al inicio
                </Link>
            </div>
        </div>
    )
}

export default UserAuth
