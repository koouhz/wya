import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icons'
import {
    obtenerTodosCarries,
    obtenerSolicitudesMiembro
} from '../../services/adminService'
import { obtenerEstadisticasClan, obtenerClips } from '../../services/supabaseService'
import { obtenerComunidades, obtenerRankingAlianzas } from '../../services/alliancesService.js'
import './Dashboard.css'

function Dashboard() {
    const [stats, setStats] = useState({
        miembros: 0,
        clips: 0,
        carries: 0,
        solicitudes: 0,
        comunidades: 0,
        alianzas: 0
    })
    const [requestBreakdown, setRequestBreakdown] = useState([])
    const [communityBreakdown, setCommunityBreakdown] = useState([])
    const [allianceBreakdown, setAllianceBreakdown] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    async function loadStats() {
        try {
            const [summary, carries, solicitudes, clips, communities, alliances] = await Promise.all([
                obtenerEstadisticasClan(),
                obtenerTodosCarries(),
                obtenerSolicitudesMiembro(),
                obtenerClips(),
                obtenerComunidades(),
                obtenerRankingAlianzas()
            ])

            setStats({
                miembros: summary?.miembros_activos || 0,
                clips: clips?.length || summary?.clips_publicados || 0,
                carries: carries?.length || 0,
                solicitudes: solicitudes?.filter(item => item.estado === 'pendiente').length || 0,
                comunidades: communities?.length || 0,
                alianzas: alliances?.length || 0
            })
            setRequestBreakdown(['pendiente', 'aprobada', 'rechazada'].map(status => ({ label: status, value: solicitudes?.filter(item => item.estado === status).length || 0 })))
            setCommunityBreakdown((communities || []).slice(0, 5).map(community => ({ label: community.nombre, value: community.miembros_total || 0 })))
            setAllianceBreakdown((alliances || []).slice(0, 5).map(item => ({ label: `${item.alianzas?.comunidades_a?.nombre || ''} + ${item.alianzas?.comunidades_b?.nombre || ''}`, value: item.puntos || 0 })))
        } catch (error) {
            console.error('Error loading stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const cards = [
        { label: 'Miembros', value: stats.miembros, icon: 'user', color: '#3b82f6' },
        { label: 'Clips', value: stats.clips, icon: 'video', color: '#ef4444' },
        { label: 'Destacados', value: stats.carries, icon: 'star', color: '#f59e0b' },
        { label: 'Solicitudes pendientes', value: stats.solicitudes, icon: 'file', color: '#a855f7' },
        { label: 'Comunidades', value: stats.comunidades, icon: 'user', color: '#65c18c' },
        { label: 'Alianzas', value: stats.alianzas, icon: 'link', color: '#f2c14e' },
    ]

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <p>Bienvenido al panel de administración de Community Lou</p>
            </div>

            <div className="stats-grid">
                {cards.map(card => (
                    <div key={card.label} className="stat-card">
                        <div className="stat-icon" style={{ background: `${card.color}20`, color: card.color }}>
                            <Icon name={card.icon} size={24} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">
                                {loading ? '-' : card.value}
                            </span>
                            <span className="stat-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="quick-actions">
                <h2>Acciones Rápidas</h2>
                <div className="actions-grid">
                    <a href="/admin/miembros" className="action-card">
                        <Icon name="user" size={24} />
                        <span>Agregar Miembro</span>
                    </a>
                    <a href="/admin/clips" className="action-card">
                        <Icon name="video" size={24} />
                        <span>Subir Clip</span>
                    </a>
                    <a href="/admin/puntos" className="action-card">
                        <Icon name="target" size={24} />
                        <span>Asignar Puntos</span>
                    </a>
                    <a href={`${import.meta.env.BASE_URL}#/admin/solicitudes`} className="action-card">
                        <Icon name="file" size={24} />
                        <span>Revisar Solicitudes</span>
                    </a>
                </div>
            </div>

            <div className="dashboard-charts">
                <section className="dashboard-chart-panel">
                    <div className="dashboard-panel-heading"><div><span className="admin-kicker">Revisión</span><h2>Solicitudes</h2></div><Icon name="file" size={20} /></div>
                    <BarChart data={requestBreakdown} color="#a855f7" loading={loading} />
                </section>
                <section className="dashboard-chart-panel">
                    <div className="dashboard-panel-heading"><div><span className="admin-kicker">Red</span><h2>Comunidades</h2></div><Icon name="user" size={20} /></div>
                    <BarChart data={communityBreakdown} color="#65c18c" loading={loading} />
                </section>
                <section className="dashboard-chart-panel dashboard-chart-wide">
                    <div className="dashboard-panel-heading"><div><span className="admin-kicker">Competición</span><h2>Alianzas con más puntos</h2></div><Icon name="link" size={20} /></div>
                    <BarChart data={allianceBreakdown} color="#f2c14e" loading={loading} />
                </section>
            </div>
        </div>
    )
}

function BarChart({ data, color, loading }) {
    const max = Math.max(...data.map(item => item.value), 1)
    if (loading) return <div className="chart-empty">Cargando datos...</div>
    if (!data.length) return <div className="chart-empty">Todavía no hay datos suficientes.</div>
    return <div className="bar-chart">{data.map(item => <div className="bar-row" key={item.label}><span className="bar-label" title={item.label}>{item.label}</span><div className="bar-track"><span className="bar-fill" style={{ width: `${Math.max((item.value / max) * 100, item.value ? 4 : 0)}%`, background: color }} /></div><strong>{item.value}</strong></div>)}</div>
}

export default Dashboard
