import { useEffect, useState } from 'react'
import Loading from '../../components/Loading.jsx'
import { Icon } from '../../components/Icons.jsx'
import { eliminarComunidad, guardarComunidad, guardarRepresentante, obtenerComunidades, obtenerComunidadesParaAdmin, obtenerUsuariosComunidad, resolverComunidad } from '../../services/alliancesService.js'
import './AdminCrud.css'

const emptyCommunity = { slug: '', nombre: '', logo_url: '', banner_url: '', descripcion: '', modalidad: '', pais: '', idioma: 'Español', discord_url: '', web_url: '', miembros_total: 0, estado: 'activa' }
const modalities = ['NethPot', 'Mace CPvP', 'Sword', 'Overall', 'UHC 1.8']
const regions = ['Latinoamérica', 'Norteamérica', 'Europa', 'Asia', 'África', 'Oceanía', 'Medio Oriente']

export default function AdminCommunities() {
    const [items, setItems] = useState([])
    const [users, setUsers] = useState([])
    const [form, setForm] = useState(emptyCommunity)
    const [representative, setRepresentative] = useState({ comunidad_id: '', usuario_id: '', rol: 'lider' })
    const [editing, setEditing] = useState(null)
    const [showEditor, setShowEditor] = useState(false)
    const [showRepresentativeForm, setShowRepresentativeForm] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    async function load() {
        setLoading(true)
        try {
            const [publicCommunities, pendingCommunities, communityUsers] = await Promise.all([obtenerComunidades(), obtenerComunidadesParaAdmin(), obtenerUsuariosComunidad()])
                const allCommunities = [...pendingCommunities, ...publicCommunities]
                setItems(allCommunities)
            setUsers(communityUsers)
        } catch (requestError) {
            setError(requestError.message || 'No se pudo cargar la configuración')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])
    function edit(item = null) {
        setEditing(item)
        setForm(item ? { ...emptyCommunity, ...item } : emptyCommunity)
        setShowEditor(true)
        setMessage('')
        setError('')
    }

    function closeEditor() {
        if (!saving) {
            setShowEditor(false)
            setEditing(null)
        }
    }

    async function save(event) {
        event.preventDefault()
        setSaving(true)
        setError('')
        try {
            await guardarComunidad(editing?.id, { ...form, miembros_total: Number(form.miembros_total) })
            setMessage(editing ? 'Comunidad actualizada' : 'Comunidad creada')
            closeEditor()
            await load()
        } catch (requestError) {
            setError(requestError.message || 'No se pudo guardar la comunidad')
        } finally {
            setSaving(false)
        }
    }

    async function remove(id) {
        if (!window.confirm('¿Eliminar esta comunidad?')) return
        try {
            await eliminarComunidad(id)
            setMessage('Comunidad eliminada')
            await load()
        } catch (requestError) {
            setError(requestError.message || 'No se pudo eliminar')
        }
    }

    async function assign(event) {
        event.preventDefault()
        setSaving(true)
        try {
            await guardarRepresentante(representative.comunidad_id, representative.usuario_id, representative.rol)
            setMessage('Representante asignado')
            setRepresentative({ comunidad_id: '', usuario_id: '', rol: 'lider' })
        } catch (requestError) {
            setError(requestError.message || 'No se pudo asignar el representante')
        } finally {
            setSaving(false)
        }
    }

    async function resolve(id, approve) {
        try {
            setSaving(true)
            await resolverComunidad(id, approve)
            setMessage(approve ? 'Comunidad aprobada' : 'Comunidad rechazada')
            await load()
        } catch (requestError) {
            setError(requestError.message || 'No se pudo resolver la comunidad')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loading text="Cargando comunidades..." />

    return (
        <div className="admin-crud">
            <div className="crud-header">
                <div>
                    <span className="admin-kicker">Red / Configuración</span>
                    <h1>Clanes y comunidades</h1>
                    <p>Configura la ficha pública y los líderes de cada comunidad.</p>
                </div>
                <div className="community-header-actions">
                    <button className="btn-primary" onClick={() => edit()}><Icon name="plus" size={17} /> Nueva comunidad</button>
                    <button className="btn-secondary" type="button" onClick={() => setShowRepresentativeForm(value => !value)}><Icon name="user" size={17} /> {showRepresentativeForm ? 'Ocultar representantes' : 'Asignar representante'}</button>
                </div>
            </div>

            {message && <div className="request-admin-error">{message}</div>}
            {error && <div className="request-admin-error">{error}</div>}

            <div className="community-list">
                {items.map(item => (
                    <article className="crud-card community-list-item" key={item.id}>
                        <div className="card-body">
                            <div className="community-card-heading">
                                <div><h3 className="card-title">{item.nombre}</h3><small>{item.slug} · {item.miembros_total} miembros · {item.estado}</small></div>
                                <div className="community-item-actions">{item.estado === 'pendiente' && <><button className="btn-icon" title="Aprobar comunidad" onClick={() => resolve(item.id, true)}><Icon name="check" size={16} /></button><button className="btn-icon btn-danger" title="Rechazar comunidad" onClick={() => resolve(item.id, false)}><Icon name="close" size={16} /></button></>}<button className="btn-icon" title="Editar" onClick={() => edit(item)}><Icon name="edit" size={16} /></button><button className="btn-icon btn-danger" title="Eliminar" onClick={() => remove(item.id)}><Icon name="trash" size={16} /></button></div>
                            </div>
                            <p>{item.descripcion || 'Sin descripción'}</p>
                        </div>
                    </article>
                ))}
            </div>

            {showRepresentativeForm && (
                <form className="community-admin-form" onSubmit={assign}>
                    <h2>Asignar representante</h2>
                    <div className="form-row">
                        <label>Comunidad<select required value={representative.comunidad_id} onChange={event => setRepresentative({ ...representative, comunidad_id: event.target.value })}><option value="">Seleccionar</option>{items.map(item => <option value={item.id} key={item.id}>{item.nombre}</option>)}</select></label>
                        <label>Usuario<select required value={representative.usuario_id} onChange={event => setRepresentative({ ...representative, usuario_id: event.target.value })}><option value="">Seleccionar</option>{users.map(user => <option value={user.id} key={user.id}>{user.nombre} · {user.email}</option>)}</select></label>
                        <label>Rol<select value={representative.rol} onChange={event => setRepresentative({ ...representative, rol: event.target.value })}><option value="lider">Líder</option><option value="representante">Representante</option></select></label>
                    </div>
                    <button className="btn-secondary" disabled={saving}>Guardar representante</button>
                </form>
            )}

            {showEditor && (
                <div className="modal-overlay" onClick={closeEditor}>
                    <form className="modal community-modal" onClick={event => event.stopPropagation()} onSubmit={save}>
                        <div className="modal-header"><h2>{editing ? 'Editar comunidad' : 'Nueva comunidad'}</h2><button type="button" onClick={closeEditor}><Icon name="close" size={20} /></button></div>
                        <div className="modal-form">
                            <div className="form-row"><label>Nombre<input required maxLength={100} value={form.nombre} onChange={event => setForm({ ...form, nombre: event.target.value })} /></label><label>Slug<input required maxLength={80} value={form.slug} onChange={event => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></label></div>
                            <label>Descripción<textarea maxLength={1000} value={form.descripcion} onChange={event => setForm({ ...form, descripcion: event.target.value })} /></label>
                            <div className="form-row"><label>Modalidad<select value={form.modalidad} onChange={event => setForm({ ...form, modalidad: event.target.value })}><option value="">Seleccionar modalidad</option>{modalities.map(modality => <option value={modality} key={modality}>{modality}</option>)}</select></label><label>Región<select value={form.pais} onChange={event => setForm({ ...form, pais: event.target.value })}><option value="">Seleccionar región</option>{regions.map(region => <option value={region} key={region}>{region}</option>)}</select></label><label>Idioma<input value={form.idioma} onChange={event => setForm({ ...form, idioma: event.target.value })} /></label><label>Miembros<input type="number" min="0" value={form.miembros_total} onChange={event => setForm({ ...form, miembros_total: event.target.value })} /></label></div>
                            <div className="form-row"><label>Logo URL<input type="url" value={form.logo_url} onChange={event => setForm({ ...form, logo_url: event.target.value })} /></label><label>Banner URL<input type="url" value={form.banner_url} onChange={event => setForm({ ...form, banner_url: event.target.value })} /></label></div>
                            <label>Discord URL<input type="url" value={form.discord_url} onChange={event => setForm({ ...form, discord_url: event.target.value })} /></label>
                        </div>
                        <div className="modal-actions"><button type="button" className="btn-secondary" onClick={closeEditor}>Cancelar</button><button className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar comunidad'}</button></div>
                    </form>
                </div>
            )}
        </div>
    )
}
