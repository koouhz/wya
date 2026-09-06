import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { Icon } from '../components/Icons.jsx'
import { useClips, useMiembrosTier, useEstadisticasClan } from '../hooks/useSupabase.js'
import { useUserAuth } from '../context/UserAuthContext.jsx'
import './Home.css'

const discoveryNodes = [
    { id: 'tier', label: 'Tier List', detail: 'La clasificación comunitaria', icon: 'trophy', path: '/tier-list', position: 'node-top' },
    { id: 'clips', label: 'Clips', detail: 'Momentos que dejan marca', icon: 'video', path: '/clips', position: 'node-right' },
    { id: 'clan', label: 'Miembros', detail: 'La gente detrás del tag', icon: 'user', path: '/carries', position: 'node-bottom' },
    { id: 'events', label: 'Eventos', detail: 'Próximo desafío', icon: 'calendar', path: '/events', position: 'node-left' }
]

function Home() {
    const [selectedNode, setSelectedNode] = useState(null)
    const { data: miembros, loading: loadingMembers } = useMiembrosTier()
    const { data: clips } = useClips()
    const { data: clanStats } = useEstadisticasClan()
    const { user } = useUserAuth()
    const activeMembers = miembros || []
    const featuredMember = [...activeMembers].sort((a, b) => (b.puntos_totales || 0) - (a.puntos_totales || 0))[0]
    const totalPoints = activeMembers.reduce((total, member) => total + (member.puntos_totales || 0), 0)
    const isVerifiedMember = Boolean(user && activeMembers.some(member => member.usuario_id === user.id))

    const handleNode = (node) => {
        setSelectedNode(selectedNode === node.id ? null : node.id)
    }

    return (
        <div
            className="home"
            style={{ '--home-bg': `url(${import.meta.env.BASE_URL}images/bg1.jpg)` }}
        >
            <Header />

            <main className="home-main">
                <section className="hero-stage" aria-labelledby="home-title">
                    <div className="hero-copy">
                        <p className="eyebrow"><span /> Comunidad competitiva</p>
                        <h1 id="home-title">COMMUNITY LOU<span>.</span></h1>
                        <p className="hero-lede">Una comunidad para competir, compartir y crecer.</p>
                    </div>

                    <div className="skull-orbit" aria-label="Explora la plataforma">
                        <div className="orbit-ring orbit-ring-outer" />
                        <div className="orbit-ring orbit-ring-inner" />
                        {discoveryNodes.map(node => (
                            <button
                                key={node.id}
                                className={`discovery-node ${node.position} ${selectedNode === node.id ? 'selected' : ''}`}
                                onClick={() => handleNode(node)}
                                aria-label={`${node.label}: ${node.detail}`}
                                aria-pressed={selectedNode === node.id}
                            >
                                <span className="node-icon"><Icon name={node.icon} size={20} /></span>
                                <span className="node-label">{node.label}</span>
                            </button>
                        ))}
                        <div className="hero-logo">
                            <img src={`${import.meta.env.BASE_URL}images/logo123.jpg`} alt="Community Lou" />
                            <span className="logo-pulse" />
                        </div>
                        <p className="orbit-hint">Interactúa para explorar</p>
                    </div>

                    <div className={`node-detail ${selectedNode ? 'visible' : ''}`} aria-live="polite">
                        {selectedNode && (() => {
                            const node = discoveryNodes.find(item => item.id === selectedNode)
                            return (
                                <>
                                    <span>{node.detail}</span>
                                    <Link to={node.path}>Abrir sección <Icon name="chevronRight" size={15} /></Link>
                                </>
                            )
                        })()}
                    </div>

                    <a className="discord-cta" href="https://discord.gg/JGUMP3QFa" target="_blank" rel="noopener noreferrer">
                        <Icon name="discord" size={19} />
                        <span>Entrar al Discord</span>
                        <Icon name="externalLink" size={15} />
                    </a>
                    {!loadingMembers && !isVerifiedMember && <Link className="membership-cta" to="/solicitar-membresia">
                        <Icon name="user" size={18} />
                        <span>¿Aún no eres miembro? Solicita serlo</span>
                    </Link>}
                </section>

                <section className="clan-snapshot" aria-label="Estado de la comunidad">
                    <div className="snapshot-heading">
                        <span className="section-kicker">Estado de la comunidad</span>
                        <span className="live-dot"><i /> En línea</span>
                    </div>
                    <div className="snapshot-stats">
                        <div className="snapshot-stat"><strong>{clanStats?.miembros_activos ?? (activeMembers.length || '—')}</strong><span>Miembros activos</span></div>
                        <div className="snapshot-stat"><strong>{clanStats?.puntos_acumulados?.toLocaleString('es-ES') || (totalPoints ? totalPoints.toLocaleString('es-ES') : '—')}</strong><span>Puntos acumulados</span></div>
                        <div className="snapshot-stat"><strong>{clanStats?.clips_publicados ?? (clips?.length || '—')}</strong><span>Clips publicados</span></div>
                    </div>
                    <div className="featured-player">
                        <span className="featured-label"><Icon name="crown" size={14} /> Player destacado</span>
                        <strong>{featuredMember?.nombre_mostrar || 'Próximamente'}</strong>
                        <span>{featuredMember ? `${featuredMember.puntos_totales || 0} puntos` : 'El ranking se está formando'}</span>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}

export default Home
