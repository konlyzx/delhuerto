(() => {
  const STORAGE = {
    products: 'dh_products_v1',
    producers: 'dh_producers_v1',
    user: 'dh_user_v1',
    cart: 'dh_cart_v1',
    orders: 'dh_orders_v1',
  }

  const CATEGORY_ALL = 'Todos'
  const CATEGORIES = [CATEGORY_ALL, 'Verduras', 'Frutas', 'Granos', 'Otros']

  const nav = document.querySelector('[data-nav]')
  const cartEl = document.querySelector('[data-cart]')
  const openCartBtn = document.querySelector('[data-open-cart]')
  const closeCartBtns = document.querySelectorAll('[data-close-cart]')

  function safeJsonParse(s) {
    try {
      return JSON.parse(s)
    } catch {
      return null
    }
  }

  function readStorage(key, fallback) {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = safeJsonParse(raw)
    return parsed ?? fallback
  }

  function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  function uid(prefix = 'id') {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
  }

  function formatMoney(n) {
    const v = Number(n)
    if (!Number.isFinite(v)) return '$0.00'
    return `$${v.toFixed(2)}`
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href)
    return url.searchParams.get(name)
  }

  function setCompactNav() {
    if (!nav) return
    const compact = window.scrollY > 50
    nav.classList.toggle('nav--compact', compact)
  }

  function openCart() {
    if (!cartEl) return
    cartEl.setAttribute('aria-hidden', 'false')
  }

  function closeCart() {
    if (!cartEl) return
    cartEl.setAttribute('aria-hidden', 'true')
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`No se pudo cargar ${path}`)
    return await res.json()
  }

  async function ensureSeedData() {
    const hasProducts = Boolean(localStorage.getItem(STORAGE.products))
    const hasProducers = Boolean(localStorage.getItem(STORAGE.producers))
    if (!hasProducers) {
      const producers = await fetchJson('./data/producers.json')
      writeStorage(STORAGE.producers, producers)
    }
    if (!hasProducts) {
      const products = await fetchJson('./data/products.json')
      writeStorage(STORAGE.products, products)
    }
  }

  function getUser() {
    return readStorage(STORAGE.user, null)
  }

  function setUser(user) {
    writeStorage(STORAGE.user, user)
  }

  function clearUser() {
    localStorage.removeItem(STORAGE.user)
  }

  function getCart() {
    return readStorage(STORAGE.cart, [])
  }

  function setCart(cart) {
    writeStorage(STORAGE.cart, cart)
  }

  function getOrders() {
    return readStorage(STORAGE.orders, [])
  }

  function setOrders(orders) {
    writeStorage(STORAGE.orders, orders)
  }

  function getProducts() {
    return readStorage(STORAGE.products, [])
  }

  function setProducts(products) {
    writeStorage(STORAGE.products, products)
  }

  function getProducers() {
    return readStorage(STORAGE.producers, [])
  }

  function findProducer(producers, id) {
    return producers.find((p) => String(p.id) === String(id)) || null
  }

  function findProduct(products, id) {
    return products.find((p) => String(p.id) === String(id)) || null
  }

  function cartCount(cart) {
    return cart.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
  }

  function cartTotal(cart, products) {
    return cart.reduce((sum, it) => {
      const p = findProduct(products, it.product_id)
      if (!p) return sum
      const q = Number(it.quantity) || 0
      return sum + (Number(p.price) || 0) * q
    }, 0)
  }

  function upsertCartItem(cart, productId, nextQty) {
    const qty = Math.max(0, Number(nextQty) || 0)
    const next = cart.slice()
    const idx = next.findIndex((it) => String(it.product_id) === String(productId))
    if (idx === -1 && qty > 0) next.push({ product_id: String(productId), quantity: qty })
    if (idx !== -1) {
      if (qty <= 0) next.splice(idx, 1)
      else next[idx] = { ...next[idx], quantity: qty }
    }
    return next
  }

  function syncNav(user, cart) {
    const badge = document.querySelector('.nav__right .badge')
    const cartIcon = document.querySelector('[data-open-cart]')
    if (badge) {
      const count = cartCount(cart)
      badge.textContent = String(count)
      badge.setAttribute('aria-label', `${count} productos en el carrito`)
      badge.style.display = count > 0 ? 'inline-flex' : 'none'
    }
    if (cartIcon && user?.role === 'producer') {
      cartIcon.style.display = 'none'
      if (badge) badge.style.display = 'none'
    }

    const right = document.querySelector('.nav__right')
    if (!right) return

    const loginLink = right.querySelector('a[href="./login.html"]')
    const registerLink = right.querySelector('a[href="./registro.html"]')
    if (loginLink) loginLink.style.display = user ? 'none' : ''
    if (registerLink) registerLink.style.display = user ? 'none' : ''

    const existingUserBox = right.querySelector('[data-user-box]')
    if (existingUserBox) existingUserBox.remove()

    if (user) {
      const box = document.createElement('div')
      box.setAttribute('data-user-box', 'true')
      box.className = 'row'
      box.style.gap = '10px'
      box.style.alignItems = 'center'
      const targetHref = user.role === 'producer' ? './panel-productor.html' : './mis-pedidos.html'
      const targetLabel = user.role === 'producer' ? 'Mi Huerto' : 'Mis pedidos'
      box.innerHTML = `
        <a class="btn btn-outline" href="${targetHref}">${targetLabel}</a>
        <button class="btn btn-outline" type="button" data-action="logout">Salir</button>
      `
      right.appendChild(box)
    }

    const navLinks = document.querySelector('.nav__links')
    if (navLinks) {
      const registerNav = navLinks.querySelector('a[href="./registro.html"]')
      if (registerNav) registerNav.style.display = user ? 'none' : ''
      const ordersNav = navLinks.querySelector('a[href="./mis-pedidos.html"]')
      if (ordersNav) ordersNav.style.display = user?.role === 'consumer' ? '' : 'none'
    }
  }

  function renderCartDrawer(cart, products, user) {
    if (!cartEl) return
    const body = cartEl.querySelector('.cart__body')
    const footer = cartEl.querySelector('.cart__footer')
    if (!body || !footer) return

    if (user?.role === 'producer') {
      body.innerHTML = `<div class="muted">El modo productor no usa carrito.</div>`
      footer.innerHTML = `
        <div class="row-between" style="margin-bottom: 12px;">
          <strong>Total</strong>
          <strong style="font-size: 20px;">$0.00</strong>
        </div>
        <a class="btn btn-primary" href="./panel-productor.html" style="width: 100%;">Ir a Mi Huerto</a>
      `
      return
    }

    if (!cart.length) {
      body.innerHTML = `<div class="muted">Tu carrito está vacío.</div>`
    } else {
      body.innerHTML = cart
        .map((it) => {
          const p = findProduct(products, it.product_id)
          if (!p) return ''
          const q = Number(it.quantity) || 0
          const line = (Number(p.price) || 0) * q
          return `
            <div class="cart__item" data-cart-item="${String(p.id)}">
              <div>
                <strong>${String(p.name)}</strong><br />
                <span class="muted">${formatMoney(p.price)} x ${q}</span>
              </div>
              <div class="row" style="gap: 8px; align-items: center;">
                <button class="btn btn-outline" type="button" data-action="cart-dec" data-product-id="${String(p.id)}" style="padding: 6px 10px; border-radius: 10px;">-</button>
                <span style="font-weight: 900; min-width: 14px; text-align: center;">${q}</span>
                <button class="btn btn-outline" type="button" data-action="cart-inc" data-product-id="${String(p.id)}" style="padding: 6px 10px; border-radius: 10px;">+</button>
                <button class="btn btn-outline" type="button" data-action="cart-remove" data-product-id="${String(p.id)}" style="padding: 6px 10px; border-radius: 10px; border-color: #ef4444; color: #ef4444;">Quitar</button>
                <strong>${formatMoney(line)}</strong>
              </div>
            </div>
          `
        })
        .join('')
    }

    const total = cartTotal(cart, products)
    const checkoutDisabled = !cart.length
    footer.innerHTML = `
      <div class="row-between" style="margin-bottom: 12px;">
        <strong>Total</strong>
        <strong style="font-size: 20px;">${formatMoney(total)}</strong>
      </div>
      <button class="btn btn-primary" type="button" data-action="checkout" style="width: 100%;" ${checkoutDisabled ? 'disabled' : ''}>
        Confirmar Pedido
      </button>
    `
  }

  function requireConsumer(user) {
    if (!user) return false
    return user.role === 'consumer'
  }

  function handleCheckout(user, cart, products) {
    if (!requireConsumer(user)) {
      const next = encodeURIComponent(window.location.pathname.replace(/^\//, './') + window.location.search)
      window.location.href = `./login.html?redirect=${next}`
      return
    }
    if (!cart.length) return

    const now = new Date().toISOString()
    const orderItems = cart
      .map((it) => {
        const p = findProduct(products, it.product_id)
        if (!p) return null
        const q = Math.max(0, Number(it.quantity) || 0)
        return {
          product_id: String(p.id),
          name: String(p.name),
          price: Number(p.price) || 0,
          quantity: q,
        }
      })
      .filter(Boolean)

    const total = orderItems.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0)
    const nextOrder = {
      id: uid('ord'),
      consumer_id: String(user.id),
      status: 'En preparación',
      created_at: now,
      total,
      items: orderItems,
    }

    const nextOrders = [nextOrder, ...getOrders()]
    setOrders(nextOrders)

    const nextProducts = products.map((p) => {
      const line = orderItems.find((it) => String(it.product_id) === String(p.id))
      if (!line) return p
      const nextStock = Math.max(0, (Number(p.stock) || 0) - (Number(line.quantity) || 0))
      return { ...p, stock: nextStock }
    })
    setProducts(nextProducts)
    setCart([])
    window.location.href = './mis-pedidos.html'
  }

  function bindGlobalActions(user, products) {
    document.addEventListener('click', (e) => {
      const t = e.target
      if (!(t instanceof Element)) return

      const logoutBtn = t.closest('[data-action="logout"]')
      if (logoutBtn) {
        clearUser()
        window.location.href = './'
        return
      }

      const addToCartBtn = t.closest('[data-action="add-to-cart"]')
      if (addToCartBtn) {
        const productId = addToCartBtn.getAttribute('data-product-id')
        if (!productId) return
        const u = getUser()
        if (u?.role === 'producer') return
        const p = findProduct(products, productId)
        if (!p || !p.is_active || (Number(p.stock) || 0) <= 0) return
        const cart = getCart()
        const existing = cart.find((it) => String(it.product_id) === String(productId))
        const nextQty = Math.min(Number(p.stock) || 0, (Number(existing?.quantity) || 0) + 1)
        const nextCart = upsertCartItem(cart, productId, nextQty)
        setCart(nextCart)
        syncNav(getUser(), nextCart)
        renderCartDrawer(nextCart, getProducts(), getUser())
        openCart()
        return
      }

      const cartInc = t.closest('[data-action="cart-inc"]')
      if (cartInc) {
        const productId = cartInc.getAttribute('data-product-id')
        if (!productId) return
        const cart = getCart()
        const p = findProduct(products, productId)
        const max = Number(p?.stock) || 99
        const existing = cart.find((it) => String(it.product_id) === String(productId))
        const nextQty = Math.min(max, (Number(existing?.quantity) || 0) + 1)
        const nextCart = upsertCartItem(cart, productId, nextQty)
        setCart(nextCart)
        syncNav(getUser(), nextCart)
        renderCartDrawer(nextCart, getProducts(), getUser())
        return
      }

      const cartDec = t.closest('[data-action="cart-dec"]')
      if (cartDec) {
        const productId = cartDec.getAttribute('data-product-id')
        if (!productId) return
        const cart = getCart()
        const existing = cart.find((it) => String(it.product_id) === String(productId))
        const nextQty = (Number(existing?.quantity) || 0) - 1
        const nextCart = upsertCartItem(cart, productId, nextQty)
        setCart(nextCart)
        syncNav(getUser(), nextCart)
        renderCartDrawer(nextCart, getProducts(), getUser())
        return
      }

      const cartRemove = t.closest('[data-action="cart-remove"]')
      if (cartRemove) {
        const productId = cartRemove.getAttribute('data-product-id')
        if (!productId) return
        const cart = getCart()
        const nextCart = upsertCartItem(cart, productId, 0)
        setCart(nextCart)
        syncNav(getUser(), nextCart)
        renderCartDrawer(nextCart, getProducts(), getUser())
        return
      }

      const checkoutBtn = t.closest('[data-action="checkout"]')
      if (checkoutBtn) {
        handleCheckout(user, getCart(), getProducts())
      }
    })
  }

  function initAuthPages(producers) {
    const path = window.location.pathname
    const isLogin = path.endsWith('/login.html') || path.endsWith('\\login.html') || path.endsWith('login.html')
    const isRegister = path.endsWith('/registro.html') || path.endsWith('\\registro.html') || path.endsWith('registro.html')
    if (!isLogin && !isRegister) return

    const redirect = getQueryParam('redirect') || './catalogo.html'
    const googleBtn = document.querySelector('button.btn.btn-outline[type="button"]')
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        const role = isRegister ? 'producer' : 'consumer'
        const email = `demo_${Math.random().toString(16).slice(2, 6)}@delhuerto.com`
        const name = role === 'producer' ? 'Productor Demo' : 'Comprador Demo'
        const producerId = role === 'producer' ? producers[0]?.id : null
        setUser({ id: uid('usr'), email, name, role, producer_id: producerId })
        window.location.href = redirect
      })
    }

    const form = document.querySelector('form')
    if (!form) return

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const fd = new FormData(form)
      const email = String(fd.get('email') || '').trim()
      const name = String(fd.get('name') || '').trim() || (email ? email.split('@')[0] : 'Usuario')
      const isProducer = Boolean(fd.get('is_producer'))
      const role = isRegister && isProducer ? 'producer' : 'consumer'
      const producerId = role === 'producer' ? producers[0]?.id : null
      setUser({ id: uid('usr'), email, name, role, producer_id: producerId })
      window.location.href = redirect
    })
  }

  function initOrdersPage(user) {
    const path = window.location.pathname
    const isOrders = path.endsWith('/mis-pedidos.html') || path.endsWith('\\mis-pedidos.html') || path.endsWith('mis-pedidos.html')
    if (!isOrders) return

    const container = document.querySelector('[data-orders]')
    if (!container) return

    if (!user) {
      const next = encodeURIComponent('./mis-pedidos.html')
      window.location.href = `./login.html?redirect=${next}`
      return
    }
    if (user.role !== 'consumer') {
      window.location.href = './panel-productor.html'
      return
    }

    const orders = getOrders().filter((o) => String(o.consumer_id) === String(user.id))
    if (!orders.length) {
      container.innerHTML = `<div class="muted">Aún no tienes pedidos. Agrega productos al carrito y confirma tu compra.</div>`
      return
    }

    container.innerHTML = orders
      .map((o) => {
        const dt = new Date(o.created_at)
        const dateText = Number.isNaN(dt.getTime()) ? '' : dt.toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
        const itemsHtml = (o.items || [])
          .map((it) => {
            return `
              <div class="order-item">
                <span style="font-weight: 800;">${Number(it.quantity) || 0}x ${String(it.name || '')}</span>
                <span>${formatMoney(it.price)}</span>
              </div>
            `
          })
          .join('')
        return `
          <article class="sketch-card order-card">
            <div class="order-head">
              <div>
                <div class="tag">Pedido #${String(o.id).slice(-6).toUpperCase()}</div>
                <div style="font-weight: 900;">${dateText}</div>
              </div>
              <div class="order-meta">
                <span class="status">${String(o.status || '')}</span>
                <span style="font-weight: 900; color: var(--brand-leaf); font-size: 22px;">${formatMoney(o.total)}</span>
              </div>
            </div>
            <div class="stack" style="gap: 10px;">
              <strong>Artículos Comprados:</strong>
              ${itemsHtml}
            </div>
          </article>
        `
      })
      .join('')
  }

  function initCatalogPage(products, producers, user) {
    const path = window.location.pathname
    const isCatalog = path.endsWith('/catalogo.html') || path.endsWith('\\catalogo.html') || path.endsWith('catalogo.html')
    if (!isCatalog) return

    const searchInput = document.querySelector('#q')
    const categoryButtons = Array.from(document.querySelectorAll('[data-category]'))
    const list = document.querySelector('[data-catalog-list]')
    const countEl = document.querySelector('[data-result-count]')
    const sortEl = document.querySelector('[data-sort]')
    if (!list) return

    let q = String(searchInput?.value || '').trim().toLowerCase()
    let cat = getQueryParam('cat') || CATEGORY_ALL
    if (!CATEGORIES.includes(cat)) cat = CATEGORY_ALL
    let sort = String(sortEl?.value || 'Más recientes')

    function applyFilters() {
      const filtered = products
        .filter((p) => p && p.is_active !== false)
        .filter((p) => (cat === CATEGORY_ALL ? true : String(p.category) === String(cat)))
        .filter((p) => {
          if (!q) return true
          const hay = `${p.name || ''} ${p.category || ''}`.toLowerCase()
          return hay.includes(q)
        })

      const sorted = filtered.slice()
      if (sort === 'Precio: menor a mayor') sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
      if (sort === 'Precio: mayor a menor') sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
      if (sort === 'Más recientes') sorted.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))

      if (countEl) countEl.textContent = `${sorted.length} productos encontrados`

      categoryButtons.forEach((b) => {
        const c = b.getAttribute('data-category') || CATEGORY_ALL
        b.classList.toggle('btn-primary', c === cat)
        b.classList.toggle('btn-outline', c !== cat)
      })

      list.innerHTML = sorted
        .map((p) => {
          const producer = findProducer(producers, p.producer_id)
          const canBuy = !user || user.role !== 'producer'
          const outOfStock = (Number(p.stock) || 0) <= 0
          const btnDisabled = !canBuy || outOfStock
          const btnText = btnDisabled ? (outOfStock ? 'Sin stock' : 'Modo productor') : 'Ver producto'
          const producerLink = producer ? `./productor.html?id=${encodeURIComponent(producer.id)}` : './productor.html'
          return `
            <article class="product-card">
              <div class="product-card__media">
                <img src="${String(p.image_url || '')}" alt="${String(p.name || '')}" loading="lazy" referrerpolicy="no-referrer" />
                <div class="product-card__price">${formatMoney(p.price)}</div>
              </div>
              <div class="product-card__body">
                <div class="tag">${String(p.category || '')}</div>
                <h3 class="product-card__title">${String(p.name || '')}</h3>
                <a class="product-card__producer" href="${producerLink}">
                  <img src="${String(producer?.image_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(String(p.producer_id || 'huerta'))}`)}" alt="${String(producer?.name || '')}" />
                  ${String(producer?.name || 'Productor')}
                </a>
                <a class="btn btn-primary" href="./producto.html?id=${encodeURIComponent(String(p.id))}" style="width: 100%; ${btnDisabled ? 'pointer-events:none; opacity:0.6;' : ''}">${btnText}</a>
              </div>
            </article>
          `
        })
        .join('')
    }

    categoryButtons.forEach((b) => {
      b.addEventListener('click', () => {
        cat = b.getAttribute('data-category') || CATEGORY_ALL
        applyFilters()
      })
    })
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        q = String(searchInput.value || '').trim().toLowerCase()
        applyFilters()
      })
    }
    if (sortEl) {
      sortEl.addEventListener('change', () => {
        sort = String(sortEl.value || 'Más recientes')
        applyFilters()
      })
    }

    applyFilters()
  }

  function initProductPage(products, producers, user) {
    const path = window.location.pathname
    const isProduct = path.endsWith('/producto.html') || path.endsWith('\\producto.html') || path.endsWith('producto.html')
    if (!isProduct) return

    const id = getQueryParam('id') || products[0]?.id
    const product = findProduct(products, id)
    if (!product) return

    const mediaImg = document.querySelector('.product__media img')
    const catEl = document.querySelector('.tag')
    const titleEl = document.querySelector('.product__title')
    const priceEl = document.querySelector('.product__price strong')
    const unitEl = document.querySelector('.product__price .muted')
    const descEl = document.querySelector('.product__desc')
    const chip = document.querySelector('.product__chip')
    const addBtn = document.querySelector('[data-action="add-to-cart"]') || document.querySelector('.btn.btn-primary[href="./mis-pedidos.html"]')
    const producerCard = document.querySelector('.producer-card')
    const producerName = document.querySelector('.producer-card__name')
    const producerImg = document.querySelector('.producer-card__img img')
    const producerLoc = document.querySelector('.producer-card__loc')

    if (mediaImg) {
      mediaImg.src = String(product.image_url || mediaImg.getAttribute('src') || '')
      mediaImg.alt = String(product.name || '')
    }
    if (catEl) catEl.textContent = String(product.category || '')
    if (titleEl) titleEl.textContent = String(product.name || '')
    if (priceEl) priceEl.textContent = formatMoney(product.price)
    if (unitEl) unitEl.textContent = `/ ${String(product.unit || '')}`
    if (descEl) descEl.textContent = String(product.description || '')
    if (chip) {
      const inStock = (Number(product.stock) || 0) > 0
      chip.innerHTML = `<span class="dot"></span>${inStock ? 'Disponible' : 'Sin stock'}`
    }

    const producer = findProducer(producers, product.producer_id)
    if (producerCard && producer) producerCard.setAttribute('href', `./productor.html?id=${encodeURIComponent(producer.id)}`)
    if (producerName && producer) producerName.textContent = String(producer.name || '')
    if (producerImg && producer) producerImg.src = String(producer.image_url || '')
    if (producerLoc && producer) {
      const textNode = producerLoc.querySelector('svg')?.nextSibling
      if (textNode) textNode.textContent = ` ${producer.location || ''}`
    }

    if (addBtn instanceof HTMLAnchorElement) {
      addBtn.removeAttribute('href')
      addBtn.setAttribute('role', 'button')
    }
    if (addBtn instanceof HTMLElement) {
      addBtn.setAttribute('data-action', 'add-to-cart')
      addBtn.setAttribute('data-product-id', String(product.id))
      const blocked = user?.role === 'producer' || (Number(product.stock) || 0) <= 0
      addBtn.textContent = blocked ? (user?.role === 'producer' ? 'Modo productor' : 'Sin stock') : 'Añadir al carrito'
      addBtn.toggleAttribute('disabled', blocked)
      addBtn.style.pointerEvents = blocked ? 'none' : ''
      addBtn.style.opacity = blocked ? '0.6' : ''
    }
  }

  function initProducerPage(products, producers) {
    const path = window.location.pathname
    const isProducer = path.endsWith('/productor.html') || path.endsWith('\\productor.html') || path.endsWith('productor.html')
    if (!isProducer) return

    const id = getQueryParam('id') || products[0]?.producer_id
    const producer = findProducer(producers, id)
    if (!producer) return

    const title = document.querySelector('.producer-title')
    const avatarImg = document.querySelector('.producer-avatar img')
    const desc = document.querySelector('.producer-desc')
    const loc = document.querySelector('.producer-location')
    if (title) title.textContent = String(producer.name || '')
    if (avatarImg) avatarImg.src = String(producer.image_url || '')
    if (desc) desc.textContent = String(producer.about || '')
    if (loc) {
      const textNode = loc.querySelector('svg')?.nextSibling
      if (textNode) textNode.textContent = ` ${producer.location || ''}`
    }

    const list = document.querySelector('[data-producer-products]')
    if (!list) return
    const mine = products.filter((p) => String(p.producer_id) === String(producer.id) && p.is_active !== false)
    list.innerHTML = mine
      .map((p) => {
        const meta = `${Number(p.stock) || 0} ${String(p.unit || '')}`.trim()
        return `
          <article class="product-card">
            <div class="product-card__media">
              <img src="${String(p.image_url || '')}" alt="${String(p.name || '')}" loading="lazy" referrerpolicy="no-referrer" />
              <div class="product-card__price">${formatMoney(p.price)}</div>
            </div>
            <div class="product-card__body">
              <div class="tag">${String(p.category || '')}</div>
              <h3 class="product-card__title">${String(p.name || '')}</h3>
              <div class="product-card__meta"><span>${meta}</span><span>${(Number(p.stock) || 0) > 0 ? 'Disponible' : 'Sin stock'}</span></div>
              <a class="btn btn-primary" href="./producto.html?id=${encodeURIComponent(String(p.id))}" style="width: 100%;">Ver producto</a>
            </div>
          </article>
        `
      })
      .join('')
  }

  function initProducerPanel(user, products, producers) {
    const path = window.location.pathname
    const isPanel = path.endsWith('/panel-productor.html') || path.endsWith('\\panel-productor.html') || path.endsWith('panel-productor.html')
    if (!isPanel) return

    if (!user) {
      const next = encodeURIComponent('./panel-productor.html')
      window.location.href = `./login.html?redirect=${next}`
      return
    }
    if (user.role !== 'producer') {
      window.location.href = './catalogo.html'
      return
    }

    const producer = findProducer(producers, user.producer_id) || producers[0]
    if (producer) {
      const img = document.querySelector('.dash-aside img')
      const name = document.querySelector('.dash-aside [style*="font-size: 20px"]')
      const tag = document.querySelector('.dash-aside .tag')
      if (img) img.src = String(producer.image_url || '')
      if (name) name.textContent = String(producer.name || '')
      if (tag) tag.textContent = `${String(producer.location || '').split(',')[0]} • Productor`
      const hname = document.querySelector('#hname')
      const hloc = document.querySelector('#hloc')
      const hdesc = document.querySelector('#hdesc')
      if (hname) hname.value = String(producer.name || '')
      if (hloc) hloc.value = String(producer.location || '')
      if (hdesc) hdesc.value = String(producer.about || '')
    }

    const inventoryList = document.querySelector('[data-inventory]')
    const summaryProducts = document.querySelector('[data-summary-products]')
    const summaryUnits = document.querySelector('[data-summary-units]')
    const formNew = document.querySelector('#nuevo')
    const formProfile = document.querySelector('#perfil')

    function renderInventory() {
      if (!inventoryList) return
      const all = getProducts()
      const mine = all.filter((p) => String(p.producer_id) === String(user.producer_id))
      if (!mine.length) {
        inventoryList.innerHTML = `<div class="muted">Aún no tienes productos publicados.</div>`
      } else {
        inventoryList.innerHTML = mine
          .map((p) => {
            const meta = `Stock: ${Number(p.stock) || 0} ${String(p.unit || '')}`.trim()
            const unitPrice = `${formatMoney(p.price)}/${String(p.unit || '')}`
            return `
              <div class="inventory-item" data-prod="${String(p.id)}">
                <img src="${String(p.image_url || '')}" alt="${String(p.name || '')}" referrerpolicy="no-referrer" />
                <div class="inventory-item__body">
                  <div>
                    <div style="font-weight: 900;">${String(p.name || '')} - ${unitPrice}</div>
                    <div class="muted">${meta}</div>
                  </div>
                  <div class="inventory-actions">
                    <span class="chip">${p.is_active === false ? 'Inactivo' : 'Activo'}</span>
                    <button class="btn btn-outline" type="button" data-action="edit-product" data-product-id="${String(p.id)}">Editar</button>
                    <button class="btn btn-outline" type="button" data-action="delete-product" data-product-id="${String(p.id)}" style="border-color: #ef4444; color: #ef4444;">Eliminar</button>
                  </div>
                </div>
              </div>
            `
          })
          .join('')
      }

      if (summaryProducts) summaryProducts.textContent = String(mine.length)
      if (summaryUnits) summaryUnits.textContent = String(mine.reduce((sum, p) => sum + (Number(p.stock) || 0), 0))
    }

    if (formNew instanceof HTMLFormElement) {
      formNew.addEventListener('submit', (e) => {
        e.preventDefault()
        const fd = new FormData(formNew)
        const name = String(fd.get('pname') || '').trim()
        const category = String(fd.get('pcat') || '').trim()
        const price = Number(fd.get('pprice') || 0)
        const stock = Number(fd.get('pstock') || 0)
        const image_url = String(fd.get('pimg') || '').trim()
        const description = String(fd.get('pdesc') || '').trim()
        if (!name) return

        const newProduct = {
          id: uid('p'),
          name,
          category: CATEGORIES.includes(category) ? category : 'Otros',
          price: Number.isFinite(price) ? price : 0,
          unit: 'kg',
          stock: Math.max(0, Number.isFinite(stock) ? stock : 0),
          producer_id: String(user.producer_id || ''),
          image_url,
          description,
          is_active: true,
          created_at: new Date().toISOString(),
        }
        const next = [newProduct, ...getProducts()]
        setProducts(next)
        formNew.reset()
        renderInventory()
      })
    }

    if (formProfile instanceof HTMLFormElement) {
      const saveBtn = formProfile.querySelector('button.btn.btn-primary')
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const producersNow = getProducers()
          const idx = producersNow.findIndex((p) => String(p.id) === String(user.producer_id))
          const next = producersNow.slice()
          const nextProducer = {
            ...(idx >= 0 ? next[idx] : { id: String(user.producer_id || uid('huerto')) }),
            name: String((document.querySelector('#hname') || {}).value || ''),
            location: String((document.querySelector('#hloc') || {}).value || ''),
            about: String((document.querySelector('#hdesc') || {}).value || ''),
          }
          if (idx >= 0) next[idx] = { ...next[idx], ...nextProducer }
          else next.unshift(nextProducer)
          writeStorage(STORAGE.producers, next)
        })
      }
    }

    document.addEventListener('click', (e) => {
      const t = e.target
      if (!(t instanceof Element)) return
      const delBtn = t.closest('[data-action="delete-product"]')
      if (delBtn) {
        const id = delBtn.getAttribute('data-product-id')
        if (!id) return
        const next = getProducts().filter((p) => String(p.id) !== String(id))
        setProducts(next)
        renderInventory()
        return
      }
      const editBtn = t.closest('[data-action="edit-product"]')
      if (editBtn) {
        const id = editBtn.getAttribute('data-product-id')
        if (!id) return
        const prod = findProduct(getProducts(), id)
        if (!prod) return
        const pname = document.querySelector('#pname')
        const pcat = document.querySelector('#pcat')
        const pprice = document.querySelector('#pprice')
        const pstock = document.querySelector('#pstock')
        const pimg = document.querySelector('#pimg')
        const pdesc = document.querySelector('#pdesc')
        if (pname) pname.value = String(prod.name || '')
        if (pcat) pcat.value = String(prod.category || '')
        if (pprice) pprice.value = String(prod.price || 0)
        if (pstock) pstock.value = String(prod.stock || 0)
        if (pimg) pimg.value = String(prod.image_url || '')
        if (pdesc) pdesc.value = String(prod.description || '')
        return
      }
    })

    renderInventory()
  }

  async function init() {
    setCompactNav()
    window.addEventListener('scroll', setCompactNav, { passive: true })

    if (openCartBtn) openCartBtn.addEventListener('click', openCart)
    closeCartBtns.forEach((b) => b.addEventListener('click', closeCart))

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart()
    })

    await ensureSeedData()

    const user = getUser()
    const cart = getCart()
    const products = getProducts()
    const producers = getProducers()

    syncNav(user, cart)
    renderCartDrawer(cart, products, user)
    bindGlobalActions(user, products)
    initAuthPages(producers)
    initOrdersPage(user)
    initCatalogPage(products, producers, user)
    initProductPage(products, producers, user)
    initProducerPage(products, producers)
    initProducerPanel(user, products, producers)
  }

  init().catch(() => {})
})()
