import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useUserAuth } from '../context/UserAuthContext'
import { useMiembrosTier } from '../hooks/useSupabase.js'
import { Icon } from './Icons.jsx'
import './Header.css'

const primaryLinks = [
    { path: '/', icon: 'home', label: 'Inicio' },
    { path: '/tier-list', icon: 'trophy', label: 'Tier List' },
    { path: '/clips', icon: 'video', label: 'Clips' },
    { path: '/carries', icon: 'user', label: 'Miembros' }
]

const menuGroups = [
    { label: 'Comunidad', icon: 'user', links: [{ path: '/events', icon: 'calendar', label: 'Eventos' }, { path: '/actividad', icon: 'file', label: 'Actividad' }, { path: '/alianzas', icon: 'link', label: 'Alianzas' }] },
    { label: 'Más', icon: 'menu', links: [{ path: '/solicitar-membresia', icon: 'file', label: 'Membresía' }] }
]

function Header() {
    const location = useLocation()
    const { user, isLoggedIn, logout } = useUserAuth()
    const { data: verifiedMembers } = useMiembrosTier()
    const [openMenu, setOpenMenu] = useState(null)
    const isVerifiedMember = Boolean(user && verifiedMembers?.some(member => member.usuario_id === user.id))
    const visibleMenuGroups = menuGroups.map(group => ({
        ...group,
        links: group.links.filter(link => link.path !== '/solicitar-membresia' || !isVerifiedMember)
    })).filter(group => group.links.length)

    useEffect(() => {
        function closeMenus(event) {
            if (!event.target.closest('.site-nav, .mobile-nav')) setOpenMenu(null)
        }
        document.addEventListener('click', closeMenus)
        return () => document.removeEventListener('click', closeMenus)
    }, [])

    const isActive = (path) => path === '/'
        ? location.pathname === path
        : location.pathname.startsWith(path)

    return (
        <>
            <header className="site-header">
            <Link to="/" className="site-brand" aria-label="Community Lou, inicio">
                <span className="site-brand-mark"><Icon name="skull" size={22} /></span>
                <span className="site-brand-name">COMMUNITY LOU</span>
            </Link>

            <nav className="site-nav" aria-label="Navegación principal">
                {primaryLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`site-nav-link ${isActive(link.path) ? 'active' : ''}`}
                        aria-label={link.label}
                        aria-current={isActive(link.path) ? 'page' : undefined}
                    >
                        <Icon name={link.icon} size={19} />
                        <span>{link.label}</span>
                    </Link>
                ))}
                {visibleMenuGroups.map(group => <details className="nav-dropdown" key={group.label} open={openMenu === group.label}><summary onClick={event => { event.preventDefault(); setOpenMenu(current => current === group.label ? null : group.label) }}><Icon name={group.icon} size={18} /><span>{group.label}</span></summary><div className="nav-dropdown-menu">{group.links.map(link => <Link key={link.path} to={link.path} onClick={() => setOpenMenu(null)} className={isActive(link.path) ? 'active' : ''}><Icon name={link.icon} size={16} />{link.label}</Link>)}</div></details>)}
            </nav>

            <div className="site-actions">
                {isLoggedIn ? (
                    <Link to="/profile" className="profile-link" aria-label="Abrir perfil">
                        <span className="profile-avatar">
                            {user?.avatar_url
                                ? <img src={user.avatar_url} alt="" />
                                : <Icon name="user" size={17} />}
                        </span>
                        <span className="profile-name">{user?.nombre || 'Perfil'}</span>
                    </Link>
                ) : (
                    <Link to="/login" className="login-link" aria-label="Iniciar sesión">
                        <Icon name="user" size={18} />
                        <span>Entrar</span>
                    </Link>
                )}
                {isLoggedIn && (
                    <button className="icon-action" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
                        <Icon name="logout" size={18} />
                    </button>
                )}
            </div>

            </header>

        <nav className="mobile-nav" aria-label="Navegación móvil">
                {primaryLinks.map(link => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                        aria-label={link.label}
                        aria-current={isActive(link.path) ? 'page' : undefined}
                    >
                        <Icon name={link.icon} size={20} />
                        <span>{link.label}</span>
                    </Link>
                ))}
                {visibleMenuGroups.length > 0 && <details className="mobile-nav-more" open={openMenu === 'mobile-more'}><summary className="mobile-nav-link" onClick={event => { event.preventDefault(); setOpenMenu(current => current === 'mobile-more' ? null : 'mobile-more') }}><Icon name="menu" size={20} /><span>Más</span></summary><div className="mobile-nav-menu">{visibleMenuGroups.flatMap(group => group.links).map(link => <Link key={link.path} to={link.path} onClick={() => setOpenMenu(null)} className={`mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}><Icon name={link.icon} size={20} /><span>{link.label}</span></Link>)}</div></details>}
                <Link to={isLoggedIn ? '/profile' : '/login'} className="mobile-nav-link" aria-label="Perfil">
                    <Icon name="user" size={20} />
                    <span>Perfil</span>
                </Link>
            </nav>
        </>
    )
}

export default Header
