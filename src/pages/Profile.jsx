import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Icon } from '../components/Icons.jsx'
import MinecraftProfileCard from '../components/MinecraftProfileCard.jsx'
import { useUserAuth } from '../context/UserAuthContext.jsx'
import { useActividadMiembro, useMiembrosTier, usePuntosPorCategoria, useProgresoMiembro } from '../hooks/useSupabase.js'
import { obtenerCategoriasPuntos, obtenerEtiquetasMiembro, guardarEtiquetasMiembro, obtenerVotosTier, votarTier } from '../services/supabaseService.js'
import './PlatformPages.css'

function Profile() {
    const { id } = useParams()
    const { user, isLoggedIn } = useUserAuth()
    const { data: miembros, loading: loadingMember } = useMiembrosTier()
    const member = useMemo(() => id
        ? miembros?.find(item => item.miembro_id === id)
        : miembros?.find(item => item.usuario_id === user?.id), [id, miembros, user?.id])
    const [minecraftAvatar, setMinecraftAvatar] = useState(null)
    const memberId = member?.miembro_id
    const { data: progress, loading: loadingProgress } = useProgresoMiembro(memberId)
    const { data: pointsCategories } = usePuntosPorCategoria(memberId)
    const { data: activity } = useActividadMiembro(memberId)
    const [availableCategories, setAvailableCategories] = useState([])
    const [selectedCategories, setSelectedCategories] = useState([])
    const [savingCategories, setSavingCategories] = useState(false)
    const [categoryMessage, setCategoryMessage] = useState('')
    const [tierVotes, setTierVotes] = useState({ positivos: 0, negativos: 0, propio: 0 })
    const isOwnProfile = !id && member?.usuario_id === user?.id

    useEffect(() => {
        if (!memberId) return
        Promise.all([obtenerCategoriasPuntos(), obtenerEtiquetasMiembro(memberId)])
            .then(([availableCategories, memberCategories]) => {
                setAvailableCategories(availableCategories || [])
                setSelectedCategories(memberCategories || [])
            })
            .catch(() => setCategoryMessage('No se pudieron cargar las categorías'))
    }, [memberId])

    useEffect(() => {
        if (!memberId) return
        obtenerVotosTier(memberId, user?.id).then(setTierVotes).catch(() => setTierVotes({ positivos: 0, negativos: 0, propio: 0 }))
    }, [memberId, user?.id])

    async function voteTier(vote) {
        if (!user?.id || isOwnProfile) return
        try {
            await votarTier(memberId, user.id, vote)
            setTierVotes(current => ({ ...current, propio: vote, positivos: current.positivos + (vote === 1 && current.propio !== 1 ? 1 : 0) - (current.propio === 1 && vote !== 1 ? 1 : 0), negativos: current.negativos + (vote === -1 && current.propio !== -1 ? 1 : 0) - (current.propio === -1 && vote !== -1 ? 1 : 0) }))
        } catch (error) {
            setCategoryMessage(error.message || 'No se pudo registrar el voto')
        }
    }

    async function saveCategories() {
        setSavingCategories(true)
        setCategoryMessage('')
        try {
            await guardarEtiquetasMiembro(memberId, selectedCategories)
            setCategoryMessage('Categorías actualizadas')
        } catch (error) {
            setCategoryMessage(error.message || 'No se pudieron guardar las categorías')
        } finally {
            setSavingCategories(false)
        }
    }
    if (!id && !isLoggedIn) {
        return <div className="platform-page"><Header /><main className="platform-main"><div className="page-heading"><div><span className="section-kicker">Identidad / Progreso</span><h1>Tu perfil</h1><p>Inicia sesión para consultar tu recorrido dentro de Community Lou.</p></div></div><Link className="discord-cta" to="/login"><Icon name="user" size={18} /> Iniciar sesión</Link></main></div>
    }

    if (loadingMember || (memberId && loadingProgress)) {
        return <div className="platform-page"><Header /><main className="platform-main"><div className="empty-state">Cargando perfil...</div></main></div>
    }

    if (!member) {
        return <div className="platform-page"><Header /><main className="platform-main"><div className="empty-state"><Icon name="user" size={30} /><p>Este jugador todavía no tiene un perfil competitivo.</p></div>{!id && isLoggedIn && <Link className="discord-cta" to="/solicitar-membresia"><Icon name="file" size={18} /> Solicitar membresía</Link>}</main></div>
    }

    const currentPoints = progress?.puntos_totales ?? member.puntos_totales ?? 0
    const progressValue = progress?.siguiente_tier_puntos
        ? Math.min(100, Math.round((currentPoints / progress.siguiente_tier_puntos) * 100))
        : 100

    return <div className="platform-page"><Header /><main className="platform-main profile-main">
        <section className="profile-hero">
            <div className="profile-avatar-large">{minecraftAvatar || member.avatar_url ? <img src={minecraftAvatar || member.avatar_url} alt="" /> : <Icon name="user" size={34} />}</div>
            <div className="profile-identity"><span className="section-kicker">Miembro verificado</span><h1>{member.nombre_mostrar}</h1><p>{member.minecraft_username || member.nombre_usuario}</p></div>
            <div className="tier-badge"><span>{member.tier_nombre || 'Tier I'}</span><small>Rango actual</small></div>
        </section>
        <MinecraftProfileCard username={member.minecraft_username} fallbackName={member.nombre_mostrar} cachedMember={member} onAvatarChange={setMinecraftAvatar} />
        {!isOwnProfile && isLoggedIn && <section className="profile-panel tier-votes"><div className="panel-title"><span>Votar por este tier</span><Icon name="trophy" size={17} /></div><p>Ayuda a la comunidad a proponer cambios de tier.</p><div className="tier-vote-actions"><button type="button" className={tierVotes.propio === 1 ? 'selected' : ''} onClick={() => voteTier(1)}>Subir tier · {tierVotes.positivos}</button><button type="button" className={tierVotes.propio === -1 ? 'selected' : ''} onClick={() => voteTier(-1)}>Bajar tier · {tierVotes.negativos}</button></div></section>}
        <section className="profile-progress"><div className="profile-progress-head"><span>Progreso competitivo</span><strong>{currentPoints.toLocaleString('es-ES')} pts</strong></div><div className="progress-track"><span style={{ width: `${progressValue}%` }} /></div><div className="profile-progress-foot"><span>{progress?.siguiente_tier_nombre ? `Siguiente: ${progress.siguiente_tier_nombre}` : 'Rango máximo alcanzado'}</span><strong>{progress?.puntos_para_siguiente_tier ? `${progress.puntos_para_siguiente_tier} puntos restantes` : '100%'}</strong></div></section>
        <div className="profile-grid"><section className="profile-panel"><div className="panel-title"><span>Especialidades</span><Icon name="target" size={17} /></div>{pointsCategories?.length ? <div className="category-list">{pointsCategories.map(category => <div className="category-line" key={category.categoria_id}><span><i style={{ background: category.categoria_color || '#f05a47' }} />{category.categoria_nombre}</span><strong>{category.puntos}</strong></div>)}</div> : <div className="panel-empty">Aún no cuentas con actividad en categorías.</div>}</section><section className="profile-panel"><div className="panel-title"><span>Actividad reciente</span><Icon name="calendar" size={17} /></div>{activity?.length ? <div className="activity-list">{activity.map(item => <div className="activity-line" key={item.id}><span className="activity-dot" /><div><strong>{item.titulo}</strong><small>{item.descripcion}</small></div></div>)}</div> : <div className="panel-empty">Aún no cuentas con actividad.</div>}</section></div>
        {isOwnProfile && <section className="profile-panel profile-category-editor"><div className="panel-title"><span>Mis categorías</span><Icon name="target" size={17} /></div><p>Elige las categorías que quieres mostrar en el ranking.</p><div className="category-checkboxes">{availableCategories.map(category => <label key={category.id}><input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => setSelectedCategories(current => current.includes(category.id) ? current.filter(id => id !== category.id) : [...current, category.id])} />{category.nombre}</label>)}</div><button className="discord-cta" type="button" onClick={saveCategories} disabled={savingCategories}>{savingCategories ? 'Guardando...' : 'Guardar categorías'}</button>{categoryMessage && <small>{categoryMessage}</small>}</section>}
    </main></div>
}

export default Profile
