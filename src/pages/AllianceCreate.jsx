import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Icon } from '../components/Icons.jsx'
import { useUserAuth } from '../context/UserAuthContext.jsx'
import { crearComunidadUsuario } from '../services/alliancesService.js'
import './Alliances.css'

const initialForm = { nombre: '', slug: '', descripcion: '', modalidad: '', pais: '', idioma: 'Español', miembros_total: 0, logo_url: '', banner_url: '', discord_url: '' }
const modalities = ['NethPot', 'Mace CPvP', 'Sword', 'Overall', 'UHC 1.8']
const regions = ['Latinoamérica', 'Norteamérica', 'Europa', 'Asia', 'África', 'Oceanía', 'Medio Oriente']

export default function AllianceCreate() {
    const { user, isLoggedIn } = useUserAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState(initialForm)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function submit(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            const community = await crearComunidadUsuario(user.id, { ...form, miembros_total: Number(form.miembros_total) })
            navigate('/alianzas')
        } catch (requestError) {
            setError(requestError.message || 'No se pudo crear la comunidad')
        } finally {
            setSaving(false)
        }
    }

    if (!isLoggedIn) return <div className="platform-page alliances-page"><Header /><main className="platform-main"><div className="empty-state"><p>Inicia sesión para crear tu comunidad.</p><Link className="discord-cta" to="/login">Iniciar sesión</Link></div></main></div>

    return <div className="platform-page alliances-page"><Header /><main className="platform-main alliance-request-page"><Link className="back-link" to="/alianzas"><Icon name="chevronRight" size={15} className="rotated" /> Volver a alianzas</Link><div className="page-heading"><div><span className="section-kicker">Red competitiva</span><h1>Crear comunidad</h1><p>Configura la ficha pública de tu clan. Solo puedes crear una comunidad.</p></div></div><form className="alliance-form" onSubmit={submit}><div className="form-row"><label>Nombre<input required maxLength={100} value={form.nombre} onChange={event => setForm({ ...form, nombre: event.target.value })} /></label><label>Slug<input required maxLength={80} value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></label></div><label>Descripción<textarea required maxLength={1000} value={form.descripcion} onChange={event => setForm({ ...form, descripcion: event.target.value })} /></label><div className="form-row"><label>Modalidad<select required value={form.modalidad} onChange={event => setForm({ ...form, modalidad: event.target.value })}><option value="">Seleccionar modalidad</option>{modalities.map(modality => <option value={modality} key={modality}>{modality}</option>)}</select></label><label>Región<select required value={form.pais} onChange={event => setForm({ ...form, pais: event.target.value })}><option value="">Seleccionar región</option>{regions.map(region => <option value={region} key={region}>{region}</option>)}</select></label><label>Miembros<input type="number" min="0" value={form.miembros_total} onChange={event => setForm({ ...form, miembros_total: event.target.value })} /></label></div><label>Discord URL<input type="url" value={form.discord_url} onChange={event => setForm({ ...form, discord_url: event.target.value })} /></label>{error && <p className="request-error">{error}</p>}<button className="discord-cta" type="submit" disabled={saving}>{saving ? 'Creando...' : 'Crear comunidad'} <Icon name="plus" size={15} /></button></form></main></div>
}
