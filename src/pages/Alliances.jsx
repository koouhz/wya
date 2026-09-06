import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Loading from '../components/Loading.jsx'
import { Icon } from '../components/Icons.jsx'
import { useUserAuth } from '../context/UserAuthContext.jsx'
import { obtenerComunidades, obtenerComunidad, obtenerMisComunidades, obtenerRankingAlianzas } from '../services/alliancesService.js'
import './Alliances.css'

function AllianceCard({ community, isOwnCommunity }) {
    return (
        <div className="alliance-card-shell">
            <article className="alliance-card">
                <Link className="alliance-card-main" to={`/alianzas/${community.slug}`}>
                    <div className="alliance-card-visual" style={community.banner_url ? { backgroundImage: `url(${community.banner_url})` } : undefined}>
                        <div className="alliance-card-shade" />
                        <img src={community.logo_url || `${import.meta.env.BASE_URL}images/logo123.jpg`} alt="" />
                        <span className={`alliance-status status-${community.estado}`}>{community.estado}</span>
                    </div>
                    <div className="alliance-card-body">
                        <h2>{community.nombre}</h2>
                        <p>{community.descripcion || 'Comunidad aliada de la red.'}</p>
                        <span><Icon name="user" size={14} /> {community.miembros_total} miembros · {community.modalidad || 'Comunidad gaming'}</span>
                    </div>
                </Link>
            </article>
            {isOwnCommunity ? <span className="alliance-card-pending">Tu comunidad</span> : community.estado === 'pendiente' ? <span className="alliance-card-pending">Pendiente de aprobación</span> : <Link className="alliance-card-action" to={`/alianzas/solicitar?objetivo=${community.id}`}><Icon name="link" size={14} /> Solicitar alianza</Link>}
        </div>
    )
}

function AllianceDirectory() {
    const [communities, setCommunities] = useState([])
    const [myCommunities, setMyCommunities] = useState(null)
    const [ranking, setRanking] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const { user, isLoggedIn, loading: authLoading } = useUserAuth()

    useEffect(() => {
        if (authLoading) return

        Promise.allSettled([
            obtenerComunidades(),
            obtenerRankingAlianzas(),
            user?.id ? obtenerMisComunidades(user.id) : Promise.resolve([])
        ]).then(([communitiesResult, rankingResult, ownResult]) => {
            if (communitiesResult.status === 'rejected') throw communitiesResult.reason

            const ownCommunities = ownResult.status === 'fulfilled' ? ownResult.value || [] : []
            setCommunities(communitiesResult.value || [])
            setRanking(rankingResult.status === 'fulfilled' ? rankingResult.value || [] : [])
            setMyCommunities(ownCommunities)
        }).catch(error => setError(error.message || 'No se pudieron cargar las alianzas')).finally(() => setLoading(false))
    }, [authLoading, user?.id])

    // Mostrar: comunidades públicas + la mía pendiente si existen
    const allCommunities = useMemo(() => {
        const result = [...communities]
        // Agregar comunidades pendientes/rechazadas propias
        if (isLoggedIn && myCommunities?.length > 0) {
            result.push(...myCommunities.filter(c => ['pendiente', 'finalizada'].includes(c.estado)))
        }
        return result
    }, [communities, myCommunities, isLoggedIn])

    const filtered = useMemo(() => allCommunities.filter(item => `${item.nombre} ${item.descripcion || ''} ${item.modalidad || ''}`.toLowerCase().includes(search.toLowerCase())), [allCommunities, search])

    return (
        <div className="platform-page alliances-page">
            <Header />
            <main className="platform-main">
                <div className="page-heading alliance-heading"><div><span className="section-kicker">Red competitiva</span><h1>Clanes aliados</h1><p>Comunidades, equipos y partners que comparten la competición.</p></div><div className="alliance-heading-actions">{isLoggedIn && !authLoading && !loading && myCommunities?.length === 0 && <Link className="discord-cta" to="/alianzas/crear"><Icon name="plus" size={17} /> Crear comunidad</Link>}</div></div>
                <label className="search-field alliance-search"><Icon name="user" size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar clan, modalidad o país" /></label>
                {loading && <Loading text="Cargando alianzas..." />}
                {error && <div className="empty-state"><p>{error}</p></div>}
                {!loading && !error && <div className="alliances-grid">{filtered.map(community => <AllianceCard key={community.id} community={community} isOwnCommunity={myCommunities?.some(own => String(own.id) === String(community.id))} />)}</div>}
                {!loading && !error && ranking.length > 0 && <section className="alliance-ranking"><div><span className="section-kicker">Competición entre comunidades</span><h2>Alianzas más activas</h2></div>{ranking.map((item, index) => { const first = item.alianzas?.comunidades_a?.nombre; const second = item.alianzas?.comunidades_b?.nombre; return <div className="alliance-ranking-row" key={item.alianza_id}><strong>{String(index + 1).padStart(2, '0')}</strong><span>{first} + {second}</span><small>{item.puntos} puntos · {item.eventos_realizados} eventos</small></div> })}</section>}
                {!loading && !error && !filtered.length && <div className="empty-state"><Icon name="link" size={38} /><p>No hay clanes aliados publicados todavía.</p></div>}
            </main>
            <Footer />
        </div>
    )
}

function AllianceProfile() {
    const { slug } = useParams()
    const [community, setCommunity] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        obtenerComunidad(slug).then(setCommunity).catch(error => setError(error.message || 'No se pudo cargar el clan')).finally(() => setLoading(false))
    }, [slug])

    if (loading) return <div className="platform-page"><Header /><main className="platform-main"><Loading text="Cargando clan..." /></main></div>
    if (error || !community) return <div className="platform-page"><Header /><main className="platform-main"><div className="empty-state"><p>{error || 'Clan no encontrado'}</p><Link to="/alianzas">Volver al directorio</Link></div></main></div>

    const representatives = (community.comunidades_miembros || []).filter(item => ['lider', 'representante'].includes(item.rol))
    const alliances = [...(community.alianzas_a || []), ...(community.alianzas_b || [])]

    return (
        <div className="platform-page alliances-page">
            <Header />
            <main className="platform-main alliance-profile-page">
                <Link className="back-link" to="/alianzas"><Icon name="chevronRight" size={15} className="rotated" /> Directorio de alianzas</Link>
                <section className="alliance-profile-hero" style={community.banner_url ? { backgroundImage: `url(${community.banner_url})` } : undefined}>
                        <div className="alliance-profile-shade" /><img src={community.logo_url || `${import.meta.env.BASE_URL}images/logo123.jpg`} alt="" /><div><span className="section-kicker">{community.modalidad || 'Comunidad gaming'} · {community.estado}</span><h1>{community.nombre}</h1><p>{community.descripcion || 'Comunidad aliada de la red.'}</p></div>
                </section>
                <div className="alliance-profile-grid">
                    <section className="alliance-panel"><h2>Información</h2><dl><div><dt>Miembros</dt><dd>{community.miembros_total}</dd></div><div><dt>Región / idioma</dt><dd>{[community.pais, community.idioma].filter(Boolean).join(' · ') || 'No indicado'}</dd></div><div><dt>Estado</dt><dd>{community.estado}</dd></div></dl>{community.discord_url && <a className="discord-cta" href={community.discord_url} target="_blank" rel="noreferrer"><Icon name="discord" size={17} /> Discord</a>}</section>
                    <section className="alliance-panel"><h2>Representantes</h2>{representatives.length ? representatives.map(item => <Link className="alliance-member" to={`/profile/${item.usuario_id}`} key={`${item.comunidad_id}-${item.usuario_id}`}><span>{item.usuarios?.avatar_url ? <img src={item.usuarios.avatar_url} alt="" /> : <Icon name="user" size={17} />}</span><strong>{item.usuarios?.nombre || 'Representante'}</strong><small>{item.rol}</small></Link>) : <p className="muted-copy">Representantes no publicados.</p>}</section>
                    <section className="alliance-panel alliance-panel-wide"><h2>Alianzas activas</h2>{alliances.length ? alliances.map(item => { const other = item.comunidades_a?.id === community.id ? item.comunidades_b : item.comunidades_a; return <Link className="alliance-mini-card" to={`/alianzas/${other?.slug}`} key={item.id}><strong>{other?.nombre}</strong><span>{item.niveles_alianza?.nombre || 'Aliado'}</span></Link> }) : <p className="muted-copy">Todavía no hay alianzas activas.</p>}</section>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default function Alliances() {
    return useParams().slug ? <AllianceProfile /> : <AllianceDirectory />
}
