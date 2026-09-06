import { useState, useEffect } from 'react'
import {
    obtenerMiembros,
    obtenerClips,
    obtenerCategoriasClips,
    obtenerCarries,
    obtenerMisClips,
    obtenerMiembrosTier,
    obtenerEstadisticasClan,
    obtenerPuntosPorCategoria,
    obtenerProgresoMiembro
    , obtenerActividadMiembro
} from '../services/supabaseService'
function useSupabaseQuery(queryFn, deps = []) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let isMounted = true

        async function fetchData() {
            try {
                setLoading(true)
                const result = await queryFn()
                if (isMounted) {
                    setData(result)
                    setError(null)
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message)
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        fetchData()

        return () => {
            isMounted = false
        }
    }, deps)

    return { data, loading, error, refetch: () => queryFn().then(setData) }
}
export function useMiembros() {
    return useSupabaseQuery(obtenerMiembros)
}

export function useMiembrosTier() {
    return useSupabaseQuery(obtenerMiembrosTier)
}

export function useEstadisticasClan() {
    return useSupabaseQuery(obtenerEstadisticasClan)
}

export function usePuntosPorCategoria(miembroId) {
    return useSupabaseQuery(() => miembroId ? obtenerPuntosPorCategoria(miembroId) : Promise.resolve([]), [miembroId])
}

export function useProgresoMiembro(miembroId) {
    return useSupabaseQuery(() => miembroId ? obtenerProgresoMiembro(miembroId) : Promise.resolve(null), [miembroId])
}

export function useActividadMiembro(miembroId) {
    return useSupabaseQuery(() => miembroId ? obtenerActividadMiembro(miembroId) : Promise.resolve([]), [miembroId])
}

export function useClips() {
    return useSupabaseQuery(obtenerClips)
}

export function useCategoriasClips() {
    return useSupabaseQuery(obtenerCategoriasClips)
}

export function useCarries() {
    return useSupabaseQuery(obtenerCarries)
}

export function useMisClips(usuarioId) {
    return useSupabaseQuery(() => usuarioId ? obtenerMisClips(usuarioId) : Promise.resolve([]), [usuarioId])
}
export function useClipsAgrupados() {
    const { data: clips, loading, error } = useClips()

    const clipsAgrupados = clips?.reduce((acc, clip) => {
        const miembroId = clip.miembros?.id || 'sin-miembro'
        const miembroNombre = clip.miembros?.nombre_mostrar || 'Sin asignar'

        if (!acc[miembroId]) {
            acc[miembroId] = {
                miembro: clip.miembros,
                clips: []
            }
        }
        acc[miembroId].clips.push(clip)
        return acc
    }, {})

    return {
        data: clipsAgrupados ? Object.values(clipsAgrupados) : null,
        loading,
        error
    }
}
