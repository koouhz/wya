import Header from '../components/Header.jsx'
import { useEffect, useState } from 'react'
import { Icon } from '../components/Icons.jsx'
import { obtenerEventosPublicos } from '../services/supabaseService.js'
import { obtenerEventosAlianza } from '../services/alliancesService.js'
import './PlatformPages.css'

function Events() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([obtenerEventosPublicos(), obtenerEventosAlianza()]).then(([regular, alliance]) => setEvents([
            ...(regular || []),
            ...(alliance || []).map(event => ({ ...event, tipo: `Alianza · ${event.tipo}`, fecha_inicio: event.fecha_inicio, ubicacion: event.ubicacion || 'Evento compartido' }))
        ])).catch(() => setEvents([])).finally(() => setLoading(false))
    }, [])

    return <div className="platform-page"><Header /><main className="platform-main"><div className="page-heading"><div><span className="section-kicker">Comunidad / Agenda</span><h1>Eventos</h1><p>Próximos eventos de Community Lou y sus comunidades aliadas.</p></div></div>{loading ? <div className="empty-state">Cargando eventos...</div> : events.length ? <div className="public-events">{events.map(event => <article className="public-event" key={event.id}><div className="public-event-date"><strong>{new Date(event.fecha_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</strong><span>{new Date(event.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></div><div><span className="public-event-type">{event.tipo || 'Evento'}</span><h2>{event.titulo}</h2>{event.descripcion && <p>{event.descripcion}</p>}<small>{event.ubicacion || 'Próximamente'}</small></div></article>)}</div> : <div className="empty-state"><Icon name="calendar" size={30} /><p>Los próximos eventos aparecerán aquí.</p></div>}</main></div>
}

export default Events
