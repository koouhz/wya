import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Icon } from '../components/Icons.jsx'
import { useUserAuth } from '../context/UserAuthContext.jsx'
import { obtenerComunidades, obtenerMisComunidades, solicitarAlianza } from '../services/alliancesService.js'
import './Alliances.css'

export default function AllianceRequest() {
    const { user, isLoggedIn, loading: authLoading } = useUserAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [communities, setCommunities] = useState([])
    const [ownCommunities, setOwnCommunities] = useState([])
    const [form, setForm] = useState({ comunidad_solicitante_id: '', comunidad_objetivo_id: searchParams.get('objetivo') || '', mensaje: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (authLoading) return

        Promise.all([obtenerComunidades(), obtenerMisComunidades(user?.id)]).then(([items, own]) => {
            setCommunities(items)
            setOwnCommunities(own)
            setForm(current => ({ ...current, comunidad_solicitante_id: own[0]?.id || '' }))
        }).catch(error => setError(error.message || 'No se pudieron cargar los clanes')).finally(() => setLoading(false))
    }, [authLoading, user?.id])

    async function submit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        setMessage('')
        try {
            if (String(form.comunidad_solicitante_id) === String(form.comunidad_objetivo_id)) {
                throw new Error('No puedes solicitar una alianza a tu propia comunidad.')
            }
            await solicitarAlianza(form)
            setMessage('Solicitud enviada. El clan objetivo recibirá la petición para revisarla.')
            setTimeout(() => navigate('/alianzas'), 1200)
        } catch (requestError) {
            setError(requestError.message || 'No se pudo enviar la solicitud')
        } finally {
            setSaving(false)
        }
    }

    const ownCommunity = ownCommunities[0]
    const targetIsOwnCommunity = ownCommunity && String(ownCommunity.id) === String(form.comunidad_objetivo_id)

    return <div className="platform-page alliances-page"><Header /><main className="platform-main alliance-request-page"><Link className="back-link" to="/alianzas"><Icon name="chevronRight" size={15} className="rotated" /> Volver a alianzas</Link><div className="page-heading"><div><span className="section-kicker">Red competitiva</span><h1>Solicitar alianza</h1><p>Tu comunidad y el clan objetivo se rellenan automáticamente.</p></div></div>{authLoading || loading ? <div className="empty-state">Cargando clanes...</div> : !isLoggedIn ? <div className="empty-state"><p>Inicia sesión para solicitar una alianza.</p><Link className="discord-cta" to="/login">Iniciar sesión</Link></div> : !ownCommunities.length ? <div className="empty-state"><p>Primero debes crear tu comunidad para solicitar alianzas.</p><Link className="discord-cta" to="/alianzas/crear">Crear comunidad</Link></div> : <form className="alliance-form" onSubmit={submit}><label>Tu clan<input value={ownCommunity.nombre} readOnly /></label><label>Clan objetivo<select required value={form.comunidad_objetivo_id} onChange={event => setForm({ ...form, comunidad_objetivo_id: event.target.value })}><option value="">Seleccionar clan</option>{communities.filter(item => item.id !== ownCommunity.id).map(item => <option value={item.id} key={item.id}>{item.nombre}</option>)}</select></label>{targetIsOwnCommunity && <p className="request-error">No puedes solicitar una alianza a tu propia comunidad.</p>}<label>Mensaje<textarea required minLength={20} maxLength={1000} value={form.mensaje} onChange={event => setForm({ ...form, mensaje: event.target.value })} placeholder="Explica brevemente la colaboración propuesta." /></label>{error && <p className="request-error">{error}</p>}{message && <p className="request-success">{message}</p>}<button className="discord-cta" type="submit" disabled={saving || targetIsOwnCommunity}>{saving ? 'Enviando...' : 'Enviar solicitud'} <Icon name="externalLink" size={15} /></button></form>}</main></div>
}
