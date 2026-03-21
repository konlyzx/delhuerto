/**
 * API Mockup using LocalStorage and JSON files
 */

async function loadJson(path) {
  const res = await fetch(path)
  return res.json()
}

const authListeners = new Set()

function dispatchAuth(user) {
  for (const l of authListeners) l(user)
}

// Helper to get/set local data
function getLocal(key, defaultValue = []) {
  const raw = localStorage.getItem(`delhuerto:${key}`)
  if (!raw) return defaultValue
  try {
    return JSON.parse(raw)
  } catch {
    return defaultValue
  }
}

function setLocal(key, data) {
  localStorage.setItem(`delhuerto:${key}`, JSON.stringify(data))
}

// Initial data cache
let initialProducts = []
let initialProducers = []

async function ensureInitialData() {
  if (initialProducts.length === 0) {
    initialProducts = await loadJson('./data/products.json')
  }
  if (initialProducers.length === 0) {
    initialProducers = await loadJson('./data/producers.json')
  }
}

export async function fetchProducts() {
  await ensureInitialData()
  const localProducts = getLocal('products', [])
  // Merge initial with local (local overrides or adds)
  const allProducts = [...initialProducts]
  
  localProducts.forEach(lp => {
    const idx = allProducts.findIndex(p => p.id === lp.id)
    if (idx !== -1) {
      allProducts[idx] = lp
    } else {
      allProducts.push(lp)
    }
  })

  // Filter out deleted products (using a flag if we want to soft-delete, 
  // but here we just manage the local list)
  const deletedIds = getLocal('deleted_products', [])
  return allProducts.filter(p => !deletedIds.includes(p.id))
}

export async function fetchProducers() {
  await ensureInitialData()
  const localProducers = getLocal('producers', [])
  const allProducers = [...initialProducers]
  
  localProducers.forEach(lp => {
    const idx = allProducers.findIndex(p => p.id === lp.id)
    if (idx !== -1) {
      allProducers[idx] = lp
    } else {
      allProducers.push(lp)
    }
  })
  
  return allProducers
}

export async function getUserDoc(uid) {
  const users = getLocal('users', [])
  let user = users.find(u => u.id === uid)
  if (!user) {
    // Check if it's one of the initial producers
    await ensureInitialData()
    const producer = initialProducers.find(p => p.id === uid)
    if (producer) {
      user = { ...producer, role: 'producer' }
    }
  }
  return user || null
}

export async function setUserDoc(uid, data) {
  const users = getLocal('users', [])
  const idx = users.findIndex(u => u.id === uid)
  const userData = { id: uid, ...data }
  if (idx !== -1) {
    users[idx] = userData
  } else {
    users.push(userData)
  }
  setLocal('users', users)
}

export async function updateUserDoc(uid, data) {
  const users = getLocal('users', [])
  const idx = users.findIndex(u => u.id === uid)
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...data }
    setLocal('users', users)
  } else {
    // Check if it's an initial producer we need to "promote" to local storage
    const user = await getUserDoc(uid)
    if (user) {
      users.push({ ...user, ...data })
      setLocal('users', users)
    }
  }
}

// Authentication (Simulated)
export function listenAuth(cb) {
  authListeners.add(cb)
  const currentUser = getLocal('current_user', null)
  cb(currentUser)
  return () => authListeners.delete(cb)
}

export async function loginWithEmail(email, password) {
  const users = getLocal('users', [])
  const user = users.find(u => u.email === email && u.password === password)
  if (!user) {
    // Check initial producers (mock password as '123456' for testing)
    await ensureInitialData()
    const cleanEmail = email.toLowerCase().split('@')[0]
    const producer = initialProducers.find(p => 
      p.id.toLowerCase() === email.toLowerCase() || 
      p.id.toLowerCase() === cleanEmail ||
      p.name.toLowerCase().includes(cleanEmail)
    )
    if (producer && password === '123456') {
       const u = { 
         ...producer, 
         email, 
         role: 'producer', 
         id: producer.id, 
         name: producer.name,
         location: producer.location, 
         description: producer.about, 
         image_url: producer.image_url 
       }
       setLocal('current_user', u)
       dispatchAuth(u)
       return { user: { uid: u.id, email: u.email } }
    }
    throw new Error('Invalid credentials')
  }
  setLocal('current_user', user)
  dispatchAuth(user)
  return { user: { uid: user.id, email: user.email } }
}

export async function loginWithGoogle() {
  // Simulate google login
  const id = 'google-user-' + Math.random().toString(36).substr(2, 9)
  const user = {
    id,
    name: 'Usuario Google',
    email: 'google@example.com',
    role: 'consumer',
    location: 'Bogotá'
  }
  setLocal('current_user', user)
  dispatchAuth(user)
  return { user: { uid: id, email: user.email, displayName: user.name } }
}

export async function registerWithEmail(email, password) {
  const id = 'user-' + Math.random().toString(36).substr(2, 9)
  const newUser = { id, email, password, role: 'consumer', name: email.split('@')[0], location: 'Bogotá' }
  const users = getLocal('users', [])
  users.push(newUser)
  setLocal('users', users)
  setLocal('current_user', newUser)
  dispatchAuth(newUser)
  return { user: { uid: id, email } }
}

export async function logout() {
  localStorage.removeItem('delhuerto:current_user')
  dispatchAuth(null)
}

// Orders
export async function fetchOrdersByConsumer(consumerId) {
  const orders = getLocal('orders', [])
  return orders.filter(o => o.consumer_id === consumerId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function createOrder({ consumerId, items, total }) {
  const orders = getLocal('orders', [])
  const newOrder = {
    id: 'ord-' + Math.random().toString(36).substr(2, 9),
    consumer_id: consumerId,
    items,
    total,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  orders.push(newOrder)
  setLocal('orders', orders)
}

// Products
export async function updateProductStock(productId, newStock) {
  const products = await fetchProducts()
  const idx = products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    products[idx].stock = newStock
    const localProducts = getLocal('products', [])
    const lIdx = localProducts.findIndex(p => p.id === productId)
    if (lIdx !== -1) {
      localProducts[lIdx].stock = newStock
    } else {
      localProducts.push(products[idx])
    }
    setLocal('products', localProducts)
  }
}

export async function deleteProduct(productId) {
  const deletedIds = getLocal('deleted_products', [])
  if (!deletedIds.includes(productId)) {
    deletedIds.push(productId)
    setLocal('deleted_products', deletedIds)
  }
}

export async function updateProduct(productId, data) {
  const products = await fetchProducts()
  const idx = products.findIndex(p => p.id === productId)
  if (idx !== -1) {
    const updated = { ...products[idx], ...data }
    const localProducts = getLocal('products', [])
    const lIdx = localProducts.findIndex(p => p.id === productId)
    if (lIdx !== -1) {
      localProducts[lIdx] = updated
    } else {
      localProducts.push(updated)
    }
    setLocal('products', localProducts)
  }
}

export async function createProduct(data) {
  const id = 'p-' + Math.random().toString(36).substr(2, 9)
  const newProduct = { id, ...data, created_at: new Date().toISOString() }
  const localProducts = getLocal('products', [])
  localProducts.push(newProduct)
  setLocal('products', localProducts)
}

export async function uploadProductImage(file) {
  // In a vanilla app without a backend, we can use FileReader to get a base64 string
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function fetchWikipediaInfo(title) {
  const res = await fetch(
    `https://es.wikipedia.org/w/api.php?action=query&prop=pageimages|extracts&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(title)}&format=json&pithumbsize=600&origin=*`,
  )
  return res.json()
}
