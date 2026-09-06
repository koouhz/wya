import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import { Icon } from '../components/Icons.jsx'
import { obtenerActividadFeed, obtenerDesafiosActivos } from '../services/supabaseService.js'
import './PlatformPages.css'

function Community() {
    const [activity, setActivity] = useState([])
    const [challenges, setChallenges] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([obtenerActividadFeed(), obtenerDesafiosActivos()])
            .then(([feed, activeChallenges]) => { setActivity(feed || []); setChallenges(activeChallenges || []) })
            .catch(() => { setActivity([]); setChallenges([]) })
            .finally(() => setLoading(false))
    }, [])

    return <div className="platform-page"><Header /><main className="platform-main"><div className="page-heading"><div><span className="section-kicker">Comunidad / Actividad</span><h1>Actividad</h1><p>Las novedades recientes de Community Lou.</p></div></div>{loading ? <div className="empty-state">Cargando actividad...</div> : <div className="profile-grid"><section className="profile-panel"><div className="panel-title"><span>Desafíos activos</span><Icon name="target" size={17} /></div>{challenges.length ? <div className="activity-list">{challenges.map(challenge => <article className="activity-line" key={challenge.id}><span className="activity-dot" /><div><strong>{challenge.titulo}</strong><small>{challenge.descripcion} · {challenge.recompensa_puntos} pts</small></div></article>)}</div> : <div className="panel-empty">No hay desafíos activos.</div>}</section><section className="profile-panel"><div className="panel-title"><span>Feed de actividad</span><Icon name="calendar" size={17} /></div>{activity.length ? <div className="activity-list">{activity.map(item => <article className="activity-line" key={item.id}><span className="activity-dot" /><div><strong>{item.titulo}</strong><small>{item.descripcion || item.miembros?.nombre_mostrar || 'Community Lou'} · {new Date(item.creado_en).toLocaleString('es-ES')}</small></div></article>)}</div> : <div className="panel-empty">Todavía no hay actividad publicada.</div>}</section></div>}</main></div>
}

export default Community