import { useState, useMemo, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Loading from '../components/Loading.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { Icon } from '../components/Icons.jsx'
import { InteraccionesPanel } from '../components/Interacciones.jsx'
import { useClipsAgrupados, useMisClips } from '../hooks/useSupabase.js'
import { useUserAuth } from '../context/UserAuthContext'
import { crearClip } from '../services/supabaseService'
import { getVideoData } from '../utils/videoData.js'
import './Clips.css'

function Clips() {
    const { user } = useUserAuth()
    const { data: clipsAgrupados, loading, error, refetch } = useClipsAgrupados()
    const { data: misClips, loading: loadingMisClips, refetch: refetchMisClips } = useMisClips(user?.id)

    const [activeTab, setActiveTab] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [filtroMiembro, setFiltroMiembro] = useState('todos')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadForm, setUploadForm] = useState({ youtube_url: '', titulo: '', descripcion: '' })
    const [uploadStatus, setUploadStatus] = useState('idle')
    const [uploadError, setUploadError] = useState('')
    const [uploadCooldown, setUploadCooldown] = useState(0)

    useEffect(() => {
        if (!uploadCooldown) return undefined
        const timer = window.setInterval(() => setUploadCooldown(value => Math.max(0, value - 1)), 1000)
        return () => window.clearInterval(timer)
    }, [uploadCooldown])

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!user || !uploadForm.youtube_url || !uploadForm.titulo || uploadCooldown > 0) return

        try {
            setUploadStatus('loading')
            setUploadError('')
            await crearClip({
                ...uploadForm,
                usuario_id: user.id
            })
            setUploadStatus('success')
            setUploadForm({ youtube_url: '', titulo: '', descripcion: '' })
            setTimeout(() => {
                setShowUploadModal(false)
                setUploadStatus('idle')
                refetchMisClips()
            }, 2000)
        } catch (err) {
            console.error(err)
            setUploadStatus('error')
            setUploadError(err.message || 'No se pudo enviar el clip.')
            if (err.message?.includes('5 minutos')) setUploadCooldown(300)
        }
    }
    const miembros = useMemo(() => {
        if (!clipsAgrupados) return []
        return clipsAgrupados
            .filter(g => g.miembro)
            .map(g => ({ id: g.miembro.id, nombre: g.miembro.nombre_mostrar }))
    }, [clipsAgrupados])
    const clipsFiltrados = useMemo(() => {
        if (!clipsAgrupados) return []

        return clipsAgrupados
            .map(grupo => ({
                ...grupo,
                clips: grupo.clips.filter(clip => {
                    const matchBusqueda = !busqueda ||
                        clip.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
                        clip.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
                    return matchBusqueda
                })
            }))
            .filter(grupo => {
                const matchMiembro = filtroMiembro === 'todos' || grupo.miembro?.id === filtroMiembro
                return matchMiembro && grupo.clips.length > 0
            })
    }, [clipsAgrupados, busqueda, filtroMiembro])

    const totalClips = clipsFiltrados.reduce((acc, g) => acc + g.clips.length, 0)

    return (
        <div className="clips-page">
            <Header />

            <main className="clips-content">
                <div className="page-header">
                    <h1>
                        <Icon name="video" size={36} />
                        Clips
                    </h1>
                    <p className="page-subtitle">Los mejores momentos de la comunidad</p>

                    {user && (
                        <div className="header-actions">
                            <button
                                className="btn-primary"
                                onClick={() => setShowUploadModal(true)}
                            >
                                <Icon name="plus" size={18} />
                                Subir Clip
                            </button>
                        </div>
                    )}
                </div>

                {user && (
                    <div className="tabs-container">
                        <button
                            className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('todos')}
                        >
                            Todos los Clips
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'mis-clips' ? 'active' : ''}`}
                            onClick={() => setActiveTab('mis-clips')}
                        >
                            Mis Clips
                        </button>
                    </div>
                )}

                {}
                <div className="filters-bar">
                    <div className="filter-search">
                        <Icon name="video" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar clips..."
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
                        value={filtroMiembro}
                        onChange={(e) => setFiltroMiembro(e.target.value)}
                    >
                        <option value="todos">Todos los miembros</option>
                        {miembros.map(m => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>
                    <span className="filter-count">{totalClips} clips</span>
                </div>

                {loading && <Loading text="Cargando clips..." />}

                {error && <ErrorMessage message={error} onRetry={refetch} />}

                {!loading && !error && clipsFiltrados?.length === 0 && (
                    <div className="empty-state">
                        <Icon name="video" size={48} />
                        <p>No se encontraron clips</p>
                        {(busqueda || filtroMiembro !== 'todos') && (
                            <button
                                className="btn-clear-filters"
                                onClick={() => { setBusqueda(''); setFiltroMiembro('todos'); }}
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}

                {!loading && !error && activeTab === 'todos' && clipsFiltrados?.map((grupo, index) => (
                    <section
                        key={grupo.miembro?.id || index}
                        className="clips-section animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="section-header">
                            {grupo.miembro?.avatar_url && (
                                <img
                                    src={grupo.miembro.avatar_url}
                                    alt={grupo.miembro.nombre_mostrar}
                                    className="section-avatar"
                                />
                            )}
                            <h2>{grupo.miembro?.nombre_mostrar || 'Clips'}</h2>
                            <span className="section-count">{grupo.clips.length} clips</span>
                        </div>

                        <div className="clips-grid">
                            {grupo.clips.map(clip => {
                                const videoData = getVideoData(clip.youtube_url)
                                return (
                                    <div key={clip.id} className="clip-card">
                                        <div className="clip-video">
                                            {videoData?.type === 'iframe' && (
                                                <iframe
                                                    src={videoData.src}
                                                    title={clip.titulo}
                                                    allowFullScreen
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                ></iframe>
                                            )}
                                            {videoData?.type === 'video' && (
                                                <video
                                                    src={videoData.src}
                                                    controls
                                                    preload="metadata"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                ></video>
                                            )}
                                            {videoData?.type === 'external' && (
                                                <div className="clip-external-preview">
                                                    <Icon name="video" size={34} />
                                                    <span>Clip alojado en Medal</span>
                                                    <a href={videoData.src} target="_blank" rel="noopener noreferrer">Ver en Medal <Icon name="externalLink" size={15} /></a>
                                                </div>
                                            )}
                                            {!videoData && (
                                                <div className="clip-placeholder">
                                                    <Icon name="video" size={48} />
                                                    <p>Formato no compatible</p>
                                                    <a href={clip.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                                                        Ver enlace original
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="clip-info">
                                            <h3>{clip.titulo}</h3>
                                            {clip.descripcion && (
                                                <p>{clip.descripcion}</p>
                                            )}
                                            {clip.destacado && (
                                                <span className="badge badge-gold">
                                                    <Icon name="star" size={12} />
                                                    Destacado
                                                </span>
                                            )}
                                            <InteraccionesPanel
                                                tipoContenido="clip"
                                                contenidoId={clip.id}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                ))}

                {}
                {activeTab === 'mis-clips' && (
                    <div className="my-clips-view animate-fade-in">
                        {loadingMisClips && <Loading text="Cargando tus clips..." />}
                        {!loadingMisClips && misClips?.length === 0 && (
                            <div className="empty-state">
                                <Icon name="video" size={48} />
                                <p>No has subido ningún clip aún</p>
                                <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                                    Subir mi primer clip
                                </button>
                            </div>
                        )}

                        <div className="clips-grid">
                            {!loadingMisClips && misClips?.map(clip => {
                                const videoData = getVideoData(clip.youtube_url)
                                return (
                                    <div key={clip.id} className="clip-card">
                                        <div className="clip-status-badge" data-status={clip.estado}>
                                            {clip.estado === 'pendiente' ? '⏳ Pendiente' :
                                                clip.estado === 'aprobado' ? '✅ Aprobado' :
                                                    clip.estado === 'rechazado' ? '❌ Rechazado' : clip.estado}
                                        </div>
                                        <div className="clip-video">
                                            {videoData?.type === 'iframe' && (
                                                <iframe
                                                    src={videoData.src}
                                                    title={clip.titulo}
                                                    allowFullScreen
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                ></iframe>
                                            )}
                                            {videoData?.type === 'video' && (
                                                <video src={videoData.src} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
                                            )}
                                            {videoData?.type === 'external' && (
                                                <div className="clip-external-preview">
                                                    <Icon name="video" size={34} />
                                                    <span>Clip alojado en Medal</span>
                                                    <a href={videoData.src} target="_blank" rel="noopener noreferrer">Ver en Medal <Icon name="externalLink" size={15} /></a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="clip-info">
                                            <h3>{clip.titulo}</h3>
                                            <p className="clip-date">Subido el {new Date(clip.creado_en).toLocaleDateString()}</p>
                                            {clip.estado === 'rechazado' && <p className="text-red text-sm">Este clip no fue aprobado.</p>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {}
                {showUploadModal && (
                    <div className="modal-overlay">
                        <div className="modal-content upload-modal">
                            <div className="modal-header">
                                <h2>Subir Nuevo Clip</h2>
                                <button className="btn-close" onClick={() => setShowUploadModal(false)}>
                                    <Icon name="close" size={20} />
                                </button>
                            </div>

                            {uploadStatus === 'success' ? (
                                <div className="upload-success">
                                    <Icon name="check" size={48} className="text-green" />
                                    <p>¡Clip enviado correctamente!</p>
                                    <p className="text-sm">Tu clip está en revisión y aparecerá pronto.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleUpload}>
                                    <div className="form-group">
                                        <label>Título del Clip</label>
                                        <input
                                            type="text"
                                            required
                                            value={uploadForm.titulo}
                                            onChange={e => setUploadForm({ ...uploadForm, titulo: e.target.value })}
                                            placeholder="Ej: Jugada épica en..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Enlace del Video</label>
                                        <input
                                            type="url"
                                            required
                                            value={uploadForm.youtube_url}
                                            onChange={e => setUploadForm({ ...uploadForm, youtube_url: e.target.value })}
                                            placeholder="YouTube, Medal, Discord, etc."
                                        />
                                        <small>Soporta: YouTube, Medal.tv, archivos directos (.mp4)</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Descripción (Opcional)</label>
                                        <textarea
                                            value={uploadForm.descripcion}
                                            onChange={e => setUploadForm({ ...uploadForm, descripcion: e.target.value })}
                                            placeholder="Cuenta un poco sobre qué pasó..."
                                        />
                                    </div>
                                    {uploadStatus === 'error' && <p className="error-text">{uploadCooldown ? `Debes esperar ${Math.ceil(uploadCooldown / 60)} minutos para enviar otro clip.` : uploadError}</p>}
                                    <button type="submit" className="btn-primary" disabled={uploadStatus === 'loading' || uploadCooldown > 0}>
                                        {uploadStatus === 'loading' ? 'Enviando...' : uploadCooldown ? `Espera ${Math.ceil(uploadCooldown / 60)} min` : 'Enviar Clip'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div >
    )
}

export default Clips
