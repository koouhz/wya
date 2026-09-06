import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../../components/Icons'
import './Login.css'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { refreshUser } = useAuth()

    const [attempts, setAttempts] = useState(() => {
        const stored = localStorage.getItem('admin_login_attempts')
        if (stored) {
            const { count, timestamp } = JSON.parse(stored)
            if (Date.now() - timestamp > 5 * 60 * 1000) return 0
            return count
        }
        return 0
    })

    const isBlocked = attempts >= 5

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (isBlocked) {
            setError('Demasiados intentos fallidos. Por favor espere 5 minutos.')
            return
        }
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email.trim() || !EMAIL_REGEX.test(email)) {
            setError('Formato de email inválido')
            return
        }

        if (!password) {
            setError('Ingrese la contraseña')
            return
        }

        setLoading(true)

        try {
            await login(email, password)
            await refreshUser()
            localStorage.removeItem('admin_login_attempts')
            setAttempts(0)
            navigate('/admin')
        } catch (err) {
            const newCount = attempts + 1
            setAttempts(newCount)
            localStorage.setItem('admin_login_attempts', JSON.stringify({
                count: newCount,
                timestamp: Date.now()
            }))
            setError('Credenciales inválidas o acceso denegado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>Community Lou</h1>
                    <p>Panel de Administración</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            <Icon name="warning" size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@communitylou.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <a href="https://dwnse.github.io/wya/#/" className="back-link">
                    <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} />
                    Volver al sitio
                </a>
            </div>
        </div>
    )
}

export default Login
