import { supabase } from '../supabaseClient'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

async function fetchSupabase(table, query = '') {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${query}`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    }
  )
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`)
  }
  return response.json()
}
export async function obtenerMiembros() {
  const data = await fetchSupabase('miembros',
    'select=*,roles_miembro(roles(nombre,color)),enlaces_sociales_miembro(url_perfil,es_principal,plataformas_sociales(nombre,icono_url))&estado=eq.activo&order=nombre_mostrar'
  )
  return data
}

export async function obtenerMiembroPorId(id) {
  const data = await fetchSupabase('miembros',
    `select=*,roles_miembro(roles(nombre,color)),enlaces_sociales_miembro(url_perfil,es_principal,plataformas_sociales(nombre,icono_url))&id=eq.${id}&estado=eq.activo&limit=1`
  )
  return data?.[0] || null
}
export async function obtenerMiembrosTier() {
  return await fetchSupabase('vista_miembros_tier',
    'select=*&order=tier_orden.desc,puntos_totales.desc,nombre_mostrar'
  )
}

export async function obtenerEtiquetasMiembros() {
  const { data: tags, error: tagsError } = await supabase
    .from('etiquetas_miembro')
    .select('miembro_id,categoria_id')
  if (tagsError) throw tagsError
  const categories = await obtenerCategoriasPuntos()
  const categoriesById = Object.fromEntries(categories.map(category => [category.id, category]))
  return (tags || []).map(tag => ({
    miembro_id: tag.miembro_id,
    categorias_puntos: categoriesById[tag.categoria_id] || null
  })).filter(tag => tag.categorias_puntos)
}

export async function obtenerEstadisticasClan() {
  const data = await fetchSupabase('vista_estadisticas_clan', 'select=*&limit=1')
  return data?.[0] || null
}

export async function obtenerPuntosPorCategoria(miembroId) {
  return await fetchSupabase('vista_puntos_por_categoria',
    `select=*&miembro_id=eq.${encodeURIComponent(miembroId)}&order=puntos.desc`
  )
}

export async function obtenerCategoriasPuntos() {
  return await fetchSupabase('categorias_puntos', 'select=id,nombre,slug,color&estado=eq.activo&order=orden')
}

export async function obtenerEtiquetasMiembro(miembroId) {
  const { data, error } = await supabase
    .from('etiquetas_miembro')
    .select('categoria_id')
    .eq('miembro_id', miembroId)
  if (error) throw error
  return data?.map(item => item.categoria_id) || []
}

export async function guardarEtiquetasMiembro(miembroId, categoriaIds) {
  const { error: deleteError } = await supabase
    .from('etiquetas_miembro')
    .delete()
    .eq('miembro_id', miembroId)
  if (deleteError) throw deleteError

  if (!categoriaIds.length) return []
  const { data, error } = await supabase
    .from('etiquetas_miembro')
    .insert(categoriaIds.map(categoria_id => ({ miembro_id: miembroId, categoria_id })))
    .select('categoria_id')
  if (error) throw error
  return data?.map(item => item.categoria_id) || []
}

export async function obtenerRankingCategoria(categoriaId) {
  return await fetchSupabase('vista_ranking_categorias', `select=*&categoria_id=eq.${encodeURIComponent(categoriaId)}&etiquetado=eq.true&order=puntos.desc,nombre_mostrar`)
}

export async function obtenerProgresoMiembro(miembroId) {
  const data = await fetchSupabase('vista_progreso_miembros',
    `select=*&miembro_id=eq.${encodeURIComponent(miembroId)}&limit=1`
  )
  return data?.[0] || null
}

export async function obtenerActividadMiembro(miembroId) {
  return await fetchSupabase('actividad_clan',
    `select=*&miembro_id=eq.${encodeURIComponent(miembroId)}&order=creado_en.desc&limit=8`
  )
}
export async function obtenerClips() {
  const data = await fetchSupabase('clips',
    'select=*,miembros(id,nombre_mostrar,avatar_url),categorias_clips(nombre,slug)&estado=in.(aprobado,activo)&order=creado_en.desc'
  )
  return data
}

export async function obtenerClipsPorMiembro(miembroId) {
  const data = await fetchSupabase('clips',
    `select=*,categorias_clips(nombre,slug)&miembro_id=eq.${miembroId}&estado=in.(aprobado,activo)&order=creado_en.desc`
  )
  return data
}
export async function obtenerEventosPublicos() {
  return await fetchSupabase('eventos',
    'select=id,titulo,slug,descripcion,tipo,imagen_url,fecha_inicio,fecha_fin,ubicacion,estado&estado=eq.publicado&order=fecha_inicio.asc'
  )
}

export async function obtenerDesafiosActivos() {
  return await fetchSupabase('desafios_activos', 'select=*&estado=eq.activo&inicia_en=lte.now&termina_en=gte.now&order=termina_en')
}

export async function obtenerActividadFeed() {
  return await fetchSupabase('actividad_feed', 'select=*,miembros(nombre_mostrar,avatar_url)&order=creado_en.desc&limit=30')
}

export async function obtenerDesafiosAdmin() {
  return await fetchSupabaseAuthenticated('GET', 'desafios_activos', null, 'select=*&order=creado_en.desc')
}

export async function crearDesafio(desafio) {
  const { data, error } = await supabase
    .from('desafios_activos')
    .insert(desafio)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarDesafio(id, desafio) {
  const { data, error } = await supabase
    .from('desafios_activos')
    .update(desafio)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminarDesafio(id) {
  const { error } = await supabase
    .from('desafios_activos')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function crearActividad(actividad) {
  const { data, error } = await supabase
    .from('actividad_feed')
    .insert(actividad)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarActividad(id, actividad) {
  const { data, error } = await supabase
    .from('actividad_feed')
    .update(actividad)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function eliminarActividad(id) {
  const { error } = await supabase
    .from('actividad_feed')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function obtenerVotosTier(miembroId, usuarioId = null) {
  const { data, error } = await supabase
    .from('votos_tier')
    .select('voto,usuario_id')
    .eq('miembro_id', miembroId)
  if (error) throw error
  return {
    positivos: data?.filter(item => item.voto === 1).length || 0,
    negativos: data?.filter(item => item.voto === -1).length || 0,
    propio: data?.find(item => item.usuario_id === usuarioId)?.voto || 0
  }
}

export async function votarTier(miembroId, usuarioId, voto) {
  const { error } = await supabase
    .from('votos_tier')
    .upsert({ miembro_id: miembroId, usuario_id: usuarioId, voto }, { onConflict: 'miembro_id,usuario_id' })
  if (error) throw error
}

export async function obtenerResumenVotosTier() {
  const { data: votes, error: votesError } = await supabase
    .from('votos_tier')
    .select('miembro_id,voto')
  if (votesError) throw votesError
  const members = await obtenerMiembrosTier()
  const byMember = (votes || []).reduce((result, vote) => {
    if (!result[vote.miembro_id]) result[vote.miembro_id] = { positivos: 0, negativos: 0 }
    if (vote.voto === 1) result[vote.miembro_id].positivos += 1
    if (vote.voto === -1) result[vote.miembro_id].negativos += 1
    return result
  }, {})
  return members.map(member => ({
    ...member,
    ...(byMember[member.miembro_id] || { positivos: 0, negativos: 0 })
  })).sort((a, b) => b.positivos - a.positivos || b.negativos - a.negativos)
}

export async function notificarDiscord({ title, description, url, color }) {
  const { data, error } = await supabase.functions.invoke('discord-announcement', {
    body: { title, description, url, color, siteUrl: 'https://dwnse.github.io/wya/' }
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}

export async function obtenerCategoriasClips() {
  const data = await fetchSupabase('categorias_clips',
    'select=*&estado=eq.activo&order=orden_mostrar'
  )
  return data
}

export async function crearClip(clip) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Tu sesión ha caducado. Inicia sesión de nuevo.')

  const request = supabase.rpc('crear_clip_usuario', {
    p_titulo: clip.titulo.trim(),
    p_url: clip.youtube_url.trim(),
    p_descripcion: clip.descripcion?.trim() || null
  })
  const timeout = new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error('La subida tardó demasiado. Comprueba tu sesión e inténtalo de nuevo.')), 15000)
  })
  const { data, error } = await Promise.race([request, timeout])
  if (error) throw new Error(error.message || 'No se pudo enviar el clip')
  return data
}

export async function obtenerMisClips(usuarioId) {
  return await fetchSupabaseAuthenticated('GET', 'clips', null,
    `select=*,categorias_clips(nombre,slug)&usuario_id=eq.${usuarioId}&order=creado_en.desc`
  )
}

export async function obtenerClipsPendientes() {
  return await fetchSupabaseAuthenticated('GET', 'clips', null,
    `select=*,usuarios:usuarios!clips_usuario_id_fkey(id,nombre,avatar_url),miembros:miembros!clips_miembro_id_fkey(nombre_mostrar)&estado=eq.pendiente&order=creado_en.desc`
  )
}

export async function obtenerTodosClipsAdmin() {
  return await fetchSupabaseAuthenticated('GET', 'clips', null,
    `select=*,usuarios:usuarios!clips_usuario_id_fkey(id,nombre,avatar_url),miembros:miembros!clips_miembro_id_fkey(nombre_mostrar)&order=creado_en.desc`
  )
}

export async function actualizarEstadoClip(clipId, nuevoEstado) {
  if (!['aprobado', 'rechazado', 'pendiente', 'eliminado'].includes(nuevoEstado)) {
    throw new Error('Estado inválido')
  }
  return await fetchSupabaseAuthenticated('PATCH', 'clips', { estado: nuevoEstado }, `id=eq.${clipId}`)
}
export async function obtenerCarries() {
  const data = await fetchSupabase('carries',
    'select=*,miembros(id,nombre_mostrar,avatar_url,banner_url,biografia,roles_miembro(roles(nombre,color)),enlaces_sociales_miembro(url_perfil,plataformas_sociales(nombre,icono_url)))&estado=eq.activo&order=orden'
  )
  return data
}
export async function obtenerPlataformas() {
  const data = await fetchSupabase('plataformas_sociales',
    'select=*&estado=eq.activo'
  )
  return data
}
export async function obtenerRoles() {
  const data = await fetchSupabase('roles',
    'select=*&estado=eq.activo&order=prioridad.desc'
  )
  return data
}
function getAuthToken() {
  try {
    const projectRef = import.meta.env.VITE_SUPABASE_URL.match(/\/\/([^.]+)\./)?.[1]
    if (!projectRef) return null

    const key = `sb-${projectRef}-auth-token`
    const sessionStr = localStorage.getItem(key)
    if (!sessionStr) return null

    const session = JSON.parse(sessionStr)
    return session.access_token
  } catch (error) {
    return null
  }
}
async function fetchSupabaseAuthenticated(method, table, body = null, query = '') {
  const token = getAuthToken()
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${token || supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }

  const options = {
    method,
    headers
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${table}?${query}`,
    options
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export async function obtenerReacciones(tipoContenido, contenidoId, usuarioId = null) {
  const data = await fetchSupabase('reacciones',
    `select=emoji,usuario_id&tipo_contenido=eq.${tipoContenido}&contenido_id=eq.${contenidoId}`
  )

  const conteo = {}
  const misReacciones = new Set()

  data?.forEach(r => {
    conteo[r.emoji] = (conteo[r.emoji] || 0) + 1
    if (usuarioId && r.usuario_id === usuarioId) {
      misReacciones.add(r.emoji)
    }
  })

  return { conteo, misReacciones: Array.from(misReacciones) }
}

export async function toggleReaccion(tipoContenido, contenidoId, emoji, usuarioId) {
  if (!usuarioId) throw new Error('Usuario no autenticado')
  const existentes = await fetchSupabaseAuthenticated('GET', 'reacciones', null,
    `select=id&tipo_contenido=eq.${tipoContenido}&contenido_id=eq.${contenidoId}&emoji=eq.${encodeURIComponent(emoji)}&usuario_id=eq.${usuarioId}`
  )

  if (existentes?.length > 0) {
    await fetchSupabaseAuthenticated('DELETE', 'reacciones', null, `id=eq.${existentes[0].id}`)
    return { added: false }
  } else {
    await fetchSupabaseAuthenticated('POST', 'reacciones', {
      tipo_contenido: tipoContenido,
      contenido_id: contenidoId,
      emoji,
      usuario_id: usuarioId
    })
    return { added: true }
  }
}

export async function obtenerComentarios(tipoContenido, contenidoId) {
  const data = await fetchSupabase('comentarios',
    `select=*,usuarios!comentarios_usuario_id_fkey(nombre,avatar_url)&tipo_contenido=eq.${tipoContenido}&contenido_id=eq.${contenidoId}&estado=eq.activo&order=creado_en.desc`
  )
  return data
}

export async function crearComentario(tipoContenido, contenidoId, autor, contenido, usuarioId) {
  if (!usuarioId) throw new Error('Usuario no autenticado')

  const data = await fetchSupabaseAuthenticated('POST', 'comentarios', {
    tipo_contenido: tipoContenido,
    contenido_id: contenidoId,
    autor: autor.trim().substring(0, 50),
    contenido: contenido.trim().substring(0, 500),
    usuario_id: usuarioId
  },
    'select=*,usuarios!comentarios_usuario_id_fkey(nombre,avatar_url)'
  )
  return data?.[0]
}

export async function obtenerConteoComentarios(tipoContenido, contenidoId) {
  const data = await fetchSupabase('comentarios',
    `select=id&tipo_contenido=eq.${tipoContenido}&contenido_id=eq.${contenidoId}&estado=eq.activo`
  )
  return data?.length || 0
}

export async function eliminarComentarioPublico(id, usuarioId) {
  if (!usuarioId) throw new Error('Usuario no autenticado')
  await fetchSupabaseAuthenticated('DELETE', 'comentarios', null, `id=eq.${id}`)
}
