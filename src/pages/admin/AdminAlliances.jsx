import { useEffect, useState } from 'react'
import Loading from '../../components/Loading.jsx'
import { Icon } from '../../components/Icons.jsx'
import { obtenerSolicitudesAlianza, resolverSolicitudAlianza } from '../../services/alliancesService.js'
import './AdminCrud.css'

export default function AdminAlliances() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [processing, setProcessing] = useState(null)

    async function load() {
        setLoading(true)
        try { setRequests(await obtenerSolicitudesAlianza()) } catch (requestError) { setError(requestError.message || 'No se pudieron cargar las solicitudes') } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    async function resolve(id, accepted) {
        let reason = null
        if (!accepted) { reason = window.prompt('Motivo del rechazo (opcional):'); if (reason === null) return }
        try { setProcessing(id); await resolverSolicitudAlianza(id, accepted, reason); await load() } catch (requestError) { setError(requestError.message || 'No se pudo resolver la solicitud') } finally { setProcessing(null) }
    }

    if (loading) return <Loading text="Cargando solicitudes de alianza..." />
    return <div className="admin-crud"><div className="crud-header"><div><span className="admin-kicker">Red / Alianzas</span><h1>Solicitudes de alianza</h1><p>Revisa las colaboraciones propuestas entre comunidades.</p></div><button className="btn-secondary" onClick={load}><Icon name="refresh" size={16} /> Actualizar</button></div>{error && <div className="request-admin-error">{error}</div>}<div className="community-list">{requests.length ? requests.map(item => <article className="crud-card community-list-item" key={item.id}><div className="card-body"><div className="community-card-heading"><div><h3 className="card-title">{item.comunidad_solicitante?.nombre} <span className="muted-copy">→</span> {item.comunidad_objetivo?.nombre}</h3><small>{new Date(item.creado_en).toLocaleString('es-ES')} · {item.estado}</small></div></div><p>{item.mensaje}</p>{item.estado === 'pendiente' && <div className="modal-actions"><button className="btn-secondary" disabled={processing === item.id} onClick={() => resolve(item.id, false)}><Icon name="close" size={16} /> Rechazar</button><button className="btn-primary" disabled={processing === item.id} onClick={() => resolve(item.id, true)}><Icon name="check" size={16} /> Aceptar</button></div>}</div></article>) : <div className="empty-state">No hay solicitudes de alianza.</div>}</div></div>
}
