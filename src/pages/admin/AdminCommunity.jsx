import { useEffect, useState } from 'react'
import {
    actualizarActividad,
    actualizarDesafio,
    crearActividad,
    crearDesafio,
    eliminarActividad,
    eliminarDesafio,
    notificarDiscord,
    obtenerActividadFeed,
    obtenerDesafiosAdmin,
    obtenerResumenVotosTier
} from '../../services/supabaseService.js'
import { obtenerTodosMiembros } from '../../services/adminService.js'
import { getLocalDateTimeInputValue } from '../../utils/dateDefaults.js'
import { Icon } from '../../components/Icons.jsx'
import Loading from '../../components/Loading.jsx'
import './AdminCrud.css'

const emptyActivity = { miembro_id: '', tipo: 'anuncio', titulo: '', descripcion: '' }
const createChallenge = () => ({
    titulo: '',
    descripcion: '',
    objetivo_tipo: 'clips',
    objetivo_cantidad: 1,
    recompensa_puntos: 50,
    inicia_en: getLocalDateTimeInputValue(),
    termina_en: getLocalDateTimeInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    estado: 'activo'
})

function AdminCommunity({ section }) {
    const [activity, setActivity] = useState([])
    const [challenges, setChallenges] = useState([])
    const [votes, setVotes] = useState([])
    const [members, setMembers] = useState([])
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [activityForm, setActivityForm] = useState(emptyActivity)
    const [challengeForm, setChallengeForm] = useState(createChallenge())
    const [editingActivity, setEditingActivity] = useState(null)
    const [editingChallenge, setEditingChallenge] = useState(null)
    const [discordForm, setDiscordForm] = useState({ title: '', description: '' })

    async function loadData() {
        setLoading(true)
        try {
            const [feed, activeChallenges, allMembers, voteSummary] = await Promise.all([
                obtenerActividadFeed(),
                obtenerDesafiosAdmin(),
                obtenerTodosMiembros(),
                obtenerResumenVotosTier()
            ])
            setActivity(feed || [])
            setChallenges(activeChallenges || [])
            setMembers(allMembers || [])
            setVotes(voteSummary || [])
        } catch (error) {
            setMessage(error.message || 'No se pudo cargar la información')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    function openActivityForm(item = null) {
        setMessage('')
        setEditingActivity(item)
        setActivityForm(item ? {
            miembro_id: item.miembro_id || '',
            tipo: item.tipo || 'anuncio',
            titulo: item.titulo || '',
            descripcion: item.descripcion || ''
        } : emptyActivity)
        setShowForm(true)
    }

    function openChallengeForm(item = null) {
        setMessage('')
        setEditingChallenge(item)
        setChallengeForm(item ? {
            titulo: item.titulo || '',
            descripcion: item.descripcion || '',
            objetivo_tipo: item.objetivo_tipo || 'clips',
            objetivo_cantidad: item.objetivo_cantidad || 1,
            recompensa_puntos: item.recompensa_puntos || 0,
            inicia_en: getLocalDateTimeInputValue(new Date(item.inicia_en)),
            termina_en: getLocalDateTimeInputValue(new Date(item.termina_en)),
            estado: item.estado || 'activo'
        } : createChallenge())
        setShowForm(true)
    }

    function closeForm() {
        if (!saving) {
            setShowForm(false)
            setEditingActivity(null)
            setEditingChallenge(null)
        }
    }

    async function saveActivity(event) {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        try {
            const payload = { ...activityForm, miembro_id: activityForm.miembro_id || null }
            if (editingActivity) await actualizarActividad(editingActivity.id, payload)
            else await crearActividad(payload)
            setActivityForm(emptyActivity)
            setShowForm(false)
            setEditingActivity(null)
            setMessage(editingActivity ? 'Actividad actualizada' : 'Actividad publicada')
            await loadData()
        } catch (error) {
            setMessage(error.message || 'No se pudo publicar la actividad')
        } finally {
            setSaving(false)
        }
    }

    async function saveChallenge(event) {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        try {
            const payload = {
                ...challengeForm,
                objetivo_cantidad: Number(challengeForm.objetivo_cantidad),
                recompensa_puntos: Number(challengeForm.recompensa_puntos),
                inicia_en: new Date(challengeForm.inicia_en).toISOString(),
                termina_en: new Date(challengeForm.termina_en).toISOString()
            }
            if (editingChallenge) await actualizarDesafio(editingChallenge.id, payload)
            else await crearDesafio(payload)
            setChallengeForm(createChallenge())
            setShowForm(false)
            setEditingChallenge(null)
            setMessage(editingChallenge ? 'Desafío actualizado' : 'Desafío creado')
            await loadData()
        } catch (error) {
            setMessage(error.message || 'No se pudo crear el desafío')
        } finally {
            setSaving(false)
        }
    }

    async function removeActivity(id) {
        if (!window.confirm('¿Eliminar esta actividad?')) return
        try {
            setSaving(true)
            await eliminarActividad(id)
            setMessage('Actividad eliminada')
            await loadData()
        } catch (error) {
            setMessage(error.message || 'No se pudo eliminar la actividad')
        } finally {
            setSaving(false)
        }
    }

    async function removeChallenge(id) {
        if (!window.confirm('¿Eliminar este desafío?')) return
        try {
            setSaving(true)
            await eliminarDesafio(id)
            setMessage('Desafío eliminado')
            await loadData()
        } catch (error) {
            setMessage(error.message || 'No se pudo eliminar el desafío')
        } finally {
            setSaving(false)
        }
    }

    async function sendDiscord(event) {
        event.preventDefault()
        setSaving(true)
        setMessage('')
        try {
            await notificarDiscord({ ...discordForm, color: 0x5865F2 })
            setDiscordForm({ title: '', description: '' })
            setMessage('Anuncio enviado a Discord')
        } catch (error) {
            setMessage(error.message || 'No se pudo enviar el anuncio')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loading text="Cargando comunidad..." />

    const titles = {
        actividad: 'Actividad comunitaria',
        desafios: 'Desafíos',
        votos: 'Votos de Tier',
        discord: 'Anuncios de Discord'
    }
    const icons = { actividad: 'calendar', desafios: 'target', votos: 'trophy', discord: 'externalLink' }
    const canAdd = section === 'actividad' || section === 'desafios'

    return (
        <div className="admin-crud admin-community-page">
            <div className="crud-header">
                <div>
                    <span className="admin-kicker">Comunidad / Control</span>
                    <h1>{titles[section]}</h1>
                    <p>{section === 'discord' ? 'Envía anuncios manuales y consulta los automáticos.' : 'Gestiona el contenido de la comunidad.'}</p>
                </div>
                <div className="crud-header-actions">
                    <Icon name={icons[section]} size={28} />
                    {canAdd && <button className="btn-primary" type="button" onClick={() => section === 'actividad' ? openActivityForm() : openChallengeForm()}><Icon name="file" size={17} /> Añadir</button>}
                </div>
            </div>

            {message && <div className="request-admin-error">{message}</div>}

            {section === 'actividad' && (
                <div className="community-list activity-list">
                    {activity.length ? activity.map(item => <article className="activity-line community-list-item" key={item.id}><span className="activity-dot" /><div className="community-item-content"><strong>{item.titulo}</strong><small>{item.descripcion || 'Actividad registrada'} · {new Date(item.creado_en).toLocaleString('es-ES')}</small></div><div className="community-item-actions"><button className="btn-icon" type="button" title="Editar actividad" onClick={() => openActivityForm(item)}><Icon name="edit" size={16} /></button><button className="btn-icon btn-danger" type="button" title="Eliminar actividad" onClick={() => removeActivity(item.id)}><Icon name="trash" size={16} /></button></div></article>) : <div className="empty-state">No hay actividad publicada.</div>}
                </div>
            )}

            {section === 'desafios' && (
                <div className="community-list challenge-list">
                    {challenges.length ? challenges.map(challenge => <article className="crud-card community-list-item" key={challenge.id}><div className="card-body"><div className="community-card-heading"><h3 className="card-title">{challenge.titulo}</h3><div className="community-item-actions"><button className="btn-icon" type="button" title="Editar desafío" onClick={() => openChallengeForm(challenge)}><Icon name="edit" size={16} /></button><button className="btn-icon btn-danger" type="button" title="Eliminar desafío" onClick={() => removeChallenge(challenge.id)}><Icon name="trash" size={16} /></button></div></div><p>{challenge.descripcion}</p><span>{challenge.objetivo_cantidad} {challenge.objetivo_tipo} · {challenge.recompensa_puntos} puntos · {challenge.estado}</span><small>Hasta {new Date(challenge.termina_en).toLocaleString('es-ES')}</small></div></article>) : <div className="empty-state">No hay desafíos creados.</div>}
                </div>
            )}

            {section === 'votos' && (
                <div className="crud-table-wrapper community-votes-table"><table className="crud-table"><thead><tr><th>Miembro</th><th>Tier actual</th><th>Positivos</th><th>Negativos</th><th>Estado</th></tr></thead><tbody>{votes.map(member => <tr key={member.miembro_id}><td>{member.nombre_mostrar}</td><td>{member.tier_nombre || 'Tier I'}</td><td className="vote-positive">{member.positivos}</td><td className="vote-negative">{member.negativos}</td><td>{member.positivos >= 5 ? <span className="status-badge status-pendiente">Revisar</span> : <span className="status-badge status-activo">En seguimiento</span>}</td></tr>)}</tbody></table></div>
            )}

            {section === 'discord' && <form className="points-form community-discord-form" onSubmit={sendDiscord}><div className="points-form-title"><Icon name="externalLink" size={20} /><span>Nuevo anuncio</span></div><label>Título<input value={discordForm.title} onChange={event => setDiscordForm({ ...discordForm, title: event.target.value })} required maxLength={256} /></label><label>Mensaje<textarea value={discordForm.description} onChange={event => setDiscordForm({ ...discordForm, description: event.target.value })} maxLength={4000} /></label><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Enviando...' : 'Enviar a Discord'}</button></form>}

            {showForm && section === 'actividad' && <div className="modal-overlay" onClick={closeForm}><form className="modal community-modal" onClick={event => event.stopPropagation()} onSubmit={saveActivity}><div className="modal-header"><h2>Nueva actividad</h2><button type="button" onClick={closeForm}><Icon name="close" size={20} /></button></div><div className="modal-form"><label>Título<input value={activityForm.titulo} onChange={event => setActivityForm({ ...activityForm, titulo: event.target.value })} required maxLength={180} /></label><label>Descripción<textarea value={activityForm.descripcion} onChange={event => setActivityForm({ ...activityForm, descripcion: event.target.value })} /></label><label>Miembro relacionado<select value={activityForm.miembro_id} onChange={event => setActivityForm({ ...activityForm, miembro_id: event.target.value })}><option value="">Actividad general</option>{members.map(member => <option value={member.id} key={member.id}>{member.nombre_mostrar}</option>)}</select></label></div><div className="modal-actions"><button type="button" className="btn-secondary" onClick={closeForm}>Cancelar</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Publicando...' : 'Publicar actividad'}</button></div></form></div>}

            {showForm && section === 'desafios' && <div className="modal-overlay" onClick={closeForm}><form className="modal community-modal" onClick={event => event.stopPropagation()} onSubmit={saveChallenge}><div className="modal-header"><h2>Nuevo desafío</h2><button type="button" onClick={closeForm}><Icon name="close" size={20} /></button></div><div className="modal-form"><label>Título<input value={challengeForm.titulo} onChange={event => setChallengeForm({ ...challengeForm, titulo: event.target.value })} required maxLength={150} /></label><label>Descripción<textarea value={challengeForm.descripcion} onChange={event => setChallengeForm({ ...challengeForm, descripcion: event.target.value })} required /></label><label>Objetivo<select value={challengeForm.objetivo_tipo} onChange={event => setChallengeForm({ ...challengeForm, objetivo_tipo: event.target.value })}><option value="clips">Clips publicados</option><option value="eventos">Eventos asistidos</option><option value="puntos">Puntos ganados</option><option value="actividad">Actividades</option></select></label><div className="form-row"><label>Cantidad<input type="number" min="1" value={challengeForm.objetivo_cantidad} onChange={event => setChallengeForm({ ...challengeForm, objetivo_cantidad: event.target.value })} required /></label><label>Recompensa<input type="number" min="0" value={challengeForm.recompensa_puntos} onChange={event => setChallengeForm({ ...challengeForm, recompensa_puntos: event.target.value })} required /></label></div><div className="form-row"><label>Inicia<input type="datetime-local" value={challengeForm.inicia_en} onChange={event => setChallengeForm({ ...challengeForm, inicia_en: event.target.value })} required /></label><label>Termina<input type="datetime-local" value={challengeForm.termina_en} onChange={event => setChallengeForm({ ...challengeForm, termina_en: event.target.value })} required /></label></div></div><div className="modal-actions"><button type="button" className="btn-secondary" onClick={closeForm}>Cancelar</button><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear desafío'}</button></div></form></div>}
        </div>
    )
}

export default AdminCommunity
