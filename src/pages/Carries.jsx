import { useEffect, useState, useMemo } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Loading from '../components/Loading.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { Icon } from '../components/Icons.jsx'
import { Link } from 'react-router-dom'
import { useCarries } from '../hooks/useSupabase.js'
import { obtenerEtiquetasMiembros } from '../services/supabaseService.js'
import './Carries.css'

function Carries() {
    const { data: carries, loading, error, refetch } = useCarries()
    const [busqueda, setBusqueda] = useState('')
    const [filtroDestacado, setFiltroDestacado] = useState('todos')
    const [memberTags, setMemberTags] = useState({})
    useEffect(() => {
        obtenerEtiquetasMiembros().then(tags => setMemberTags(tags.reduce((result, tag) => {
            if (!result[tag.miembro_id]) result[tag.miembro_id] = []
            if (tag.categorias_puntos) result[tag.miembro_id].push(tag.categorias_puntos)
            return result
        }, {}))).catch(() => setMemberTags({}))
    }, [])
    const carriesFiltrados = useMemo(() => {
        if (!carries) return []

        return carries.filter(carry => {
            const matchBusqueda = !busqueda ||
                carry.miembros?.nombre_mostrar?.toLowerCase().includes(busqueda.toLowerCase()) ||
                carry.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
                carry.especialidad?.toLowerCase().includes(busqueda.toLowerCase())
            const matchDestacado = filtroDestacado === 'todos' ||
                (filtroDestacado === 'destacado' && carry.destacado) ||
                (filtroDestacado === 'normal' && !carry.destacado)
            return matchBusqueda && matchDestacado
        })
    }, [carries, busqueda, filtroDestacado])

    return (
        <div className="carries-page">
            <Header />

            <main className="carries-content">
                <div className="page-header">
                    <h1>
                        <Icon name="star" size={36} />
                        Miembros destacados
                    </h1>
                    <p className="page-subtitle">Jugadores destacados de todas las comunidades</p>
                </div>

                {}
                <div className="filters-bar">
                    <div className="filter-search">
                        <Icon name="star" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar jugador..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <button className="clear-search" onClick={() => setBusqueda('')}>
                                <Icon name="close" size={16} />
                            </button>
                        )}
                    </div>
                    <select
                        className="filter-select"
                        value={filtroDestacado}
                        onChange={(e) => setFiltroDestacado(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        <option value="destacado">Destacados</option>
                        <option value="normal">Normales</option>
                    </select>
                    <span className="filter-count">{carriesFiltrados.length} jugadores</span>
                </div>

                {loading && <Loading text="Cargando miembros destacados..." />}

                {error && <ErrorMessage message={error} onRetry={refetch} />}

                {!loading && !error && carriesFiltrados?.length === 0 && (
                    <div className="empty-state">
                        <Icon name="star" size={48} />
                        <p>No se encontraron jugadores</p>
                        {(busqueda || filtroDestacado !== 'todos') && (
                            <button
                                className="btn-clear-filters"
                                onClick={() => { setBusqueda(''); setFiltroDestacado('todos'); }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}

                <div className="carries-grid">
                    {!loading && !error && carriesFiltrados?.map((carry, index) => (
                        <div
                            key={carry.id}
                            className={`carry-card animate-fade-in ${carry.destacado ? 'featured' : ''}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {carry.miembros?.banner_url && (
                                <div
                                    className="carry-banner"
                                    style={{ backgroundImage: `url(${carry.miembros.banner_url})` }}
                                />
                            )}

                            <div className="carry-avatar-wrapper">
                                <img
                                    src={carry.miembros?.avatar_url || `${import.meta.env.BASE_URL}images/logo123.jpg`}
                                    alt={carry.miembros?.nombre_mostrar}
                                    className="carry-avatar"
                                />
                                {carry.destacado && (
                                    <span className="carry-crown">
                                        <Icon name="crown" size={20} />
                                    </span>
                                )}
                            </div>

                            <div className="carry-info">
                                <h3><Link to={`/profile/${carry.miembros?.id}`}>{carry.miembros?.nombre_mostrar}</Link></h3>

                                {carry.titulo && (
                                    <span className="carry-title">{carry.titulo}</span>
                                )}

                                <div className="carry-roles">
                                    {carry.miembros?.roles_miembro?.map((rm, i) => (
                                        <span
                                            key={i}
                                            className="role-badge"
                                            style={{ backgroundColor: rm.roles?.color || '#666' }}
                                        >
                                            {rm.roles?.nombre}
                                        </span>
                                    ))}
                                </div>

                                <div className="carry-tags">
                                    {(memberTags[carry.miembros?.id] || []).map(tag => <span key={tag.id} style={{ borderColor: tag.color || 'var(--color-primary)' }}>{tag.nombre}</span>)}
                                </div>

                                {carry.especialidad && (
                                    <p className="carry-detail">
                                        <Icon name="target" size={16} />
                                        {carry.especialidad}
                                    </p>
                                )}

                                {carry.logros && (
                                    <p className="carry-detail">
                                        <Icon name="trophy" size={16} />
                                        {carry.logros}
                                    </p>
                                )}

                                <div className="carry-socials">
                                    {carry.miembros?.enlaces_sociales_miembro?.map((enlace, i) => (
                                        <a
                                            key={i}
                                            href={enlace.url_perfil}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="social-btn"
                                            title={enlace.plataformas_sociales?.nombre}
                                        >
                                            {enlace.plataformas_sociales?.nombre === 'YouTube' ? (
                                                <Icon name="youtube" size={18} />
                                            ) : (
                                                <Icon name="link" size={18} />
                                            )}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    )
}

export default Carries
