import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Icon } from '../components/Icons.jsx'
import { obtenerEtiquetasMiembros } from '../services/supabaseService.js'
import { useMiembrosTier } from '../hooks/useSupabase.js'
import { consultarPerfilMinecraft, obtenerAvatarMinecraft } from '../services/minecraftService.js'
import './PlatformPages.css'

const tierOrder = ['Tier S', 'Tier IV', 'Tier III', 'Tier II', 'Tier I']

function TierList() {
    const { data: miembros, loading } = useMiembrosTier()
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState('points')
    const [minecraftAvatars, setMinecraftAvatars] = useState({})
    const [memberTags, setMemberTags] = useState({})
    const players = useMemo(() => (miembros || []).filter(member =>
        `${member.nombre_mostrar} ${member.nombre_usuario} ${member.minecraft_username || ''}`
            .toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => sort === 'name'
        ? a.nombre_mostrar.localeCompare(b.nombre_mostrar)
        : (b.puntos_totales || 0) - (a.puntos_totales || 0)), [miembros, search, sort])

    useEffect(() => {
        let active = true
        const membersWithoutAvatar = (miembros || []).filter(member => !member.avatar_url)

        Promise.all(membersWithoutAvatar.map(async member => {
            const profile = await consultarPerfilMinecraft(member.minecraft_username)
            return [member.miembro_id, obtenerAvatarMinecraft(member.minecraft_username, profile)]
        })).then(entries => {
            if (active) setMinecraftAvatars(Object.fromEntries(entries))
        })

        return () => { active = false }
    }, [miembros])

    useEffect(() => {
        obtenerEtiquetasMiembros().then(tags => {
            const grouped = tags.reduce((result, tag) => {
                if (!result[tag.miembro_id]) result[tag.miembro_id] = []
                if (tag.categorias_puntos) result[tag.miembro_id].push(tag.categorias_puntos)
                return result
            }, {})
            setMemberTags(grouped)
        }).catch(() => setMemberTags({}))
    }, [])

    return (
        <div className="platform-page">
            <Header />
            <main className="platform-main">
                <div className="page-heading">
                    <div><span className="section-kicker">Competición / Ranking</span><h1>Tier List</h1><p>Ranking compartido de miembros verificados de Community Lou.</p></div>
                </div>
                <div className="toolbar">
                    <label className="search-field"><Icon name="target" size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar jugador" /></label>
                    <select value={sort} onChange={event => setSort(event.target.value)} aria-label="Ordenar jugadores"><option value="points">Más puntos</option><option value="name">Nombre</option></select>
                </div>
                {loading ? <div className="empty-state">Cargando ranking...</div> : <div className="tier-list">
                    {tierOrder.map(tier => {
                        const tierPlayers = players.filter(player => (player.tier_nombre || 'Tier I') === tier)
                                        return <section className="tier-group" key={tier}><div className="tier-title"><span>{tier}</span><small>{tierPlayers.length} jugadores</small></div>{tierPlayers.length ? tierPlayers.map((player, index) => <Link className="player-row" to={`/profile/${player.miembro_id}`} key={player.miembro_id}><span className="player-position">{String(index + 1).padStart(2, '0')}</span><span className="player-avatar">{(player.avatar_url || minecraftAvatars[player.miembro_id]) ? <img src={player.avatar_url || minecraftAvatars[player.miembro_id]} alt="" /> : <Icon name="user" size={18} />}</span><span className="player-identity"><strong>{player.nombre_mostrar}</strong><small>{player.minecraft_username || player.nombre_usuario}</small><span className="player-tags">{(memberTags[player.miembro_id] || []).map(tag => <em key={tag.id} style={{ borderColor: tag.color || 'var(--color-primary)' }}>{tag.nombre}</em>)}</span></span><span className="player-specialty">{player.categoria_principal || 'Clan member'}</span><strong className="player-points">{(player.puntos_totales || 0).toLocaleString('es-ES')} <small>PTS</small></strong><Icon name="chevronRight" size={17} /></Link>) : <div className="tier-empty">Aún no hay miembros clasificados aquí.</div>}</section>
                    })}
                </div>}
            </main>
        </div>
    )
}

export default TierList
