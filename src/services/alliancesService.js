import { supabase } from '../supabaseClient'

export async function obtenerComunidades() {
    const { data, error } = await supabase
        .from('comunidades')
        .select('id,slug,nombre,logo_url,banner_url,descripcion,modalidad,pais,idioma,discord_url,web_url,miembros_total,estado,creado_por')
        .in('estado', ['activa', 'pausada'])
        .order('nombre')
    if (error) throw error
    return data || []
}

export async function obtenerMisComunidades(usuarioId) {
    if (!usuarioId) return []
    const { data, error } = await supabase
        .from('comunidades')
        .select('id,slug,nombre,logo_url,banner_url,descripcion,modalidad,pais,idioma,discord_url,web_url,miembros_total,estado,creado_por')
        .eq('creado_por', usuarioId)
        .order('nombre')
    if (error) throw error
    return data || []
}

    export async function obtenerMiPrimerasComunidades(usuarioId) {
        if (!usuarioId) return []
        const { data, error } = await supabase
            .from('comunidades')
            .select('id,slug,nombre,logo_url,banner_url,descripcion,modalidad,pais,idioma,discord_url,web_url,miembros_total,estado,creado_por')
            .eq('creado_por', usuarioId)
            .eq('estado', 'pendiente')
            .order('creado_en', { ascending: false })
        if (error) throw error
        return data || []
    }

        export async function obtenerComunidadDelUsuario(usuarioId) {
            if (!usuarioId) return null
            const { data, error } = await supabase
                .from('comunidades')
                .select('id,slug,nombre,logo_url,banner_url,descripcion,modalidad,pais,idioma,discord_url,web_url,miembros_total,estado,creado_por')
                .eq('creado_por', usuarioId)
                .order('creado_en', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (error) throw error
            return data || null
        }

    export async function obtenerComunidadesParaAdmin() {
        const { data, error } = await supabase
            .from('comunidades')
            .select('id,slug,nombre,logo_url,descripcion,modalidad,estado,creado_por,creado_en,actualizado_en,usuarios:usuarios!comunidades_creado_por_fkey(id,nombre,email)')
            .eq('estado', 'pendiente')
            .order('creado_en', { ascending: false })
        if (error) throw error
        return data || []
    }

    export async function crearComunidadUsuario(usuarioId, payload) {
    const { data, error } = await supabase
        .from('comunidades')
        .insert({ ...payload, creado_por: usuarioId, estado: 'pendiente' })
        .select()
        .single()
    if (error) {
        if (error.code === '23505') throw new Error('Ya tienes una comunidad creada.')
        throw error
    }
    return data
}

export async function resolverComunidad(id, aprobar) {
    const { data, error } = await supabase.rpc('resolver_comunidad', {
        p_comunidad_id: id,
        p_aprobar: aprobar
    })
    if (error) throw error
    return data
}

export async function guardarComunidad(id, payload) {
    const query = id
        ? supabase.from('comunidades').update(payload).eq('id', id).select().single()
        : supabase.from('comunidades').insert(payload).select().single()
    const { data, error } = await query
    if (error) throw error
    return data
}

export async function eliminarComunidad(id) {
    const { error } = await supabase.from('comunidades').delete().eq('id', id)
    if (error) throw error
}

export async function obtenerUsuariosComunidad() {
    const { data, error } = await supabase.from('usuarios').select('id,nombre,email,avatar_url').eq('estado', 'activo').order('nombre')
    if (error) throw error
    return data || []
}

export async function guardarRepresentante(comunidadId, usuarioId, rol) {
    const { data, error } = await supabase.from('comunidades_miembros').upsert({ comunidad_id: comunidadId, usuario_id: usuarioId, rol, estado: 'activo' }).select().single()
    if (error) throw error
    return data
}

export async function obtenerComunidad(slug) {
    const { data, error } = await supabase
        .from('comunidades')
        .select('*,comunidades_miembros(usuario_id,rol,estado,destacado,usuarios(id,nombre,email,avatar_url))')
        .eq('slug', slug)
        .maybeSingle()
    if (error) throw error
    if (!data) return null
    const [as, bs] = await Promise.all([
        supabase.from('alianzas').select('id,estado,nivel_id,niveles_alianza(nombre,slug,color),comunidades_b:comunidades!alianzas_comunidad_b_id_fkey(id,slug,nombre,logo_url)').eq('comunidad_a_id', data.id),
        supabase.from('alianzas').select('id,estado,nivel_id,niveles_alianza(nombre,slug,color),comunidades_a:comunidades!alianzas_comunidad_a_id_fkey(id,slug,nombre,logo_url)').eq('comunidad_b_id', data.id)
    ])
    if (as.error) throw as.error
    if (bs.error) throw bs.error
    return { ...data, alianzas_a: as.data || [], alianzas_b: bs.data || [] }
}

export async function solicitarAlianza(payload) {
    if (String(payload.comunidad_solicitante_id) === String(payload.comunidad_objetivo_id)) {
        throw new Error('No puedes solicitar una alianza a tu propia comunidad.')
    }
    const { data, error } = await supabase.rpc('solicitar_alianza', {
        p_comunidad_solicitante: payload.comunidad_solicitante_id,
        p_comunidad_objetivo: payload.comunidad_objetivo_id,
        p_mensaje: payload.mensaje.trim()
    })
    if (error) throw error
    return data
}

export async function obtenerSolicitudesAlianza() {
    const { data, error } = await supabase
        .from('solicitudes_alianza')
        .select('*,comunidad_solicitante:comunidades!solicitudes_alianza_comunidad_solicitante_id_fkey(id,slug,nombre,logo_url),comunidad_objetivo:comunidades!solicitudes_alianza_comunidad_objetivo_id_fkey(id,slug,nombre,logo_url)')
        .order('creado_en', { ascending: false })
    if (error) throw error
    return data || []
}

export async function resolverSolicitudAlianza(id, aceptar, motivo = null) {
    const { data, error } = await supabase.rpc('resolver_solicitud_alianza', {
        p_solicitud_id: id,
        p_aceptar: aceptar,
        p_motivo: motivo
    })
    if (error) throw error
    return data
}

export async function obtenerEventosAlianza() {
    const { data, error } = await supabase
        .from('eventos_alianza')
        .select('*,alianzas(id,comunidades_a:comunidades!alianzas_comunidad_a_id_fkey(nombre,slug),comunidades_b:comunidades!alianzas_comunidad_b_id_fkey(nombre,slug))')
        .order('fecha_inicio')
    if (error) throw error
    return data || []
}

export async function obtenerRankingAlianzas() {
    const { data, error } = await supabase
        .from('ranking_alianzas')
        .select('*,alianzas(id,comunidades_a:comunidades!alianzas_comunidad_a_id_fkey(nombre,slug),comunidades_b:comunidades!alianzas_comunidad_b_id_fkey(nombre,slug),niveles_alianza(nombre,color))')
        .order('puntos', { ascending: false })
        .limit(10)
    if (error) throw error
    return data || []
}

export async function obtenerComunidadesRechazadas() {
    const { data, error } = await supabase
        .from('comunidades')
        .select('id,slug,nombre,logo_url,descripcion,estado,creado_por,creado_en,actualizado_en,usuarios:usuarios!comunidades_creado_por_fkey(nombre,email)')
        .eq('estado', 'finalizada')
        .order('actualizado_en', { ascending: false })
    if (error) throw error
    return data || []
}
