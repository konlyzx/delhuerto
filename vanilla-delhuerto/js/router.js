const basePath = (() => {
  const base = new URL('.', window.location.href).pathname
  const noSlash = base.endsWith('/') ? base.slice(0, -1) : base
  return noSlash === '/' ? '' : noSlash
})()

function stripBase(pathname) {
  if (!basePath) return pathname || '/'
  if (pathname.startsWith(basePath)) {
    const rest = pathname.slice(basePath.length)
    return rest.length === 0 ? '/' : rest
  }
  return pathname || '/'
}

function withBase(path) {
  if (!basePath) return path
  return `${basePath}${path === '/' ? '' : path}`
}

export function getRouteFromLocation() {
  const rawPath = stripBase(window.location.pathname)
  const path = rawPath.endsWith('/') && rawPath !== '/' ? rawPath.slice(0, -1) : rawPath
  if (path === '/') return { view: 'landing' }
  if (path === '/catalogo') return { view: 'market' }
  if (path === '/login') return { view: 'login' }
  if (path === '/registro') return { view: 'register' }
  if (path === '/panel-productor') return { view: 'dashboard' }
  if (path === '/mis-pedidos') return { view: 'orders' }
  if (path.startsWith('/producto/')) return { view: 'product', productId: path.split('/').pop() }
  if (path.startsWith('/productor/')) return { view: 'producer-profile', producerId: path.split('/').pop() }
  return { view: 'landing' }
}

export function navigate(path) {
  const to = withBase(path)
  if (window.location.pathname !== to) {
    window.history.pushState({}, '', to)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function initRedirectFrom404() {
  const r = sessionStorage.getItem('delhuerto:redirect')
  if (!r) return
  sessionStorage.removeItem('delhuerto:redirect')
  try {
    const url = new URL(r, window.location.origin)
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  } catch {}
}
