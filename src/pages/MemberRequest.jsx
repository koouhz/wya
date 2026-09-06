import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Icon } from '../components/Icons.jsx'
import { useUserAuth } from '../context/UserAuthContext.jsx'
import { useMiembrosTier } from '../hooks/useSupabase.js'
import { obtenerMiSolicitud, solicitarMembresia } from '../services/memberRequestService.js'
import { getLocalDateInputValue } from '../utils/dateDefaults.js'
import './PlatformPages.css'

function MemberRequest() {
    const { user, isLoggedIn } = useUserAuth()
    const { data: miembros, loading: loadingMembers } = useMiembrosTier()
    const member = useMemo(() => miembros?.find(item => item.usuario_id === user?.id), [miembros, user?.id])
    const [solicitud, setSolicitud] = useState(null)
    const [form, setForm] = useState({ nombre_usuario: '', nombre_mostrar: '', minecraft_username: '', fecha_ingreso: getLocalDateInputValue(), razon: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!user?.id || member) return
        obtenerMiSolicitud(user.id).then(setSolicitud).catch(() => setSolicitud(null))
    }, [user?.id, member])

    async function handleSubmit(event) {
        event.preventDefault()
        if (!user?.id || form.razon.trim().length < 20 || !form.minecraft_username.trim() || !form.fecha_ingreso) return
        try {
            setLoading(true)
            setError('')
            setSolicitud(await solicitarMembresia(user.id, { ...form, email: user.email }))
            setForm({ nombre_usuario: '', nombre_mostrar: '', minecraft_username: '', fecha_ingreso: getLocalDateInputValue(), razon: '' })
        } catch (requestError) {
            setError(requestError.message || 'No se pudo enviar la solicitud')
        } finally {
            setLoading(false)
        }
    }

    let content
    if (!isLoggedIn) {
        content = <><div className="empty-state"><Icon name="user" size={30} /><p>Inicia sesión para solicitar tu membresía.</p></div><Link className="discord-cta" to="/login"><Icon name="user" size={18} /> Iniciar sesión</Link></>
    } else if (loadingMembers) {
        content = <div className="empty-state">Cargando tu estado...</div>
    } else if (member) {
        content = <div className="empty-state"><Icon name="check" size={30} /><p>Ya tienes un perfil de miembro aprobado.</p><Link className="discord-cta" to="/profile">Ver mi perfil</Link></div>
    } else if (solicitud?.estado === 'pendiente') {
        content = <div className="member-request-panel"><div className="panel-title"><span>Solicitud enviada</span><Icon name="file" size={17} /></div><p className="request-status">Tu solicitud está pendiente de revisión por un administrador.</p></div>
    } else if (!user.email?.toLowerCase().endsWith('@gmail.com')) {
        content = <div className="empty-state"><Icon name="warning" size={30} /><p>Para solicitar membresía necesitas una cuenta Gmail.</p></div>
    } else {
        content = <div className="member-request-panel"><div className="panel-title"><span>Solicitar membresía</span><Icon name="file" size={17} /></div>{solicitud?.estado === 'rechazada' && <p className="request-status request-rejected">Tu solicitud fue rechazada. Puedes enviar una nueva.</p>}<form onSubmit={handleSubmit}><label htmlFor="request-minecraft">Minecraft username</label><input id="request-minecraft" value={form.minecraft_username} onChange={event => setForm({ ...form, minecraft_username: event.target.value, nombre_usuario: event.target.value, nombre_mostrar: event.target.value })} maxLength={50} placeholder="Steve" required /><label htmlFor="request-date">Fecha de ingreso</label><input id="request-date" type="date" value={form.fecha_ingreso} onChange={event => setForm({ ...form, fecha_ingreso: event.target.value })} required /><label htmlFor="member-reason">¿Por qué quieres ser miembro?</label><textarea id="member-reason" value={form.razon} onChange={event => setForm({ ...form, razon: event.target.value })} minLength={20} maxLength={1000} placeholder="Escribe la razón de tu solicitud" required /><small>{form.razon.length}/1000 caracteres. Mínimo 20.</small><button className="discord-cta" type="submit" disabled={loading || form.razon.trim().length < 20 || !form.minecraft_username.trim() || !form.fecha_ingreso}>{loading ? 'Enviando...' : 'Enviar solicitud'}</button>{error && <p className="request-error">{error}</p>}</form></div>
    }

    return <div className="platform-page"><Header /><main className="platform-main"><div className="page-heading"><div><span className="section-kicker">Community Lou / Comunidad</span><h1>Solicitud de membresía comunitaria</h1><p>Forma parte de Community Lou y accede a la tier list de miembros verificados.</p></div></div>{content}</main></div>
}

export default MemberRequest
