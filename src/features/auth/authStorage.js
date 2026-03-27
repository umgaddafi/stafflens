const AUTH_STORE_KEY = 'stafflens_auth_secure_store_v1'
const AUTH_SESSION_KEY = 'stafflens_auth_session_v1'
const DEFAULT_ADMIN_EMAIL = 'admin@stafflens.edu.ng'
const DEFAULT_ADMIN_PASSWORD = 'Admin@12345'
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30

function nowIso() {
  return new Date().toISOString()
}

function getCryptoApi() {
  if (!window.crypto?.subtle) {
    throw new Error('Secure browser cryptography is unavailable in this environment.')
  }

  return window.crypto
}

function randomHex(bytes = 16) {
  const cryptoApi = getCryptoApi()
  const values = new Uint8Array(bytes)
  cryptoApi.getRandomValues(values)
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('')
}

async function hashValue(value, salt) {
  const cryptoApi = getCryptoApi()
  const encoder = new TextEncoder()
  const baseKey = await cryptoApi.subtle.importKey(
    'raw',
    encoder.encode(value),
    'PBKDF2',
    false,
    ['deriveBits'],
  )

  const bits = await cryptoApi.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 120000,
      hash: 'SHA-256',
    },
    baseKey,
    256,
  )

  return Array.from(new Uint8Array(bits), (valuePart) =>
    valuePart.toString(16).padStart(2, '0'),
  ).join('')
}

function readStore() {
  const rawStore = localStorage.getItem(AUTH_STORE_KEY)

  if (!rawStore) {
    return null
  }

  try {
    return JSON.parse(rawStore)
  } catch {
    return null
  }
}

function writeStore(store) {
  localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(store))
}

function buildEmptyStore() {
  return {
    admins: [],
    resetTokens: [],
    auditTrail: [],
    metadata: {
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  }
}

async function createAdminRecord(email, password) {
  const passwordSalt = randomHex(16)
  const passwordHash = await hashValue(password, passwordSalt)

  return {
    id: randomHex(12),
    email: email.toLowerCase(),
    fullName: 'Primary Administrator',
    role: 'Super Admin',
    status: 'Active',
    passwordSalt,
    passwordHash,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export async function initializeAuthStore() {
  const existingStore = readStore()

  if (existingStore?.admins?.length) {
    return existingStore
  }

  const seededStore = buildEmptyStore()
  const defaultAdmin = await createAdminRecord(
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
  )

  seededStore.admins.push(defaultAdmin)
  seededStore.auditTrail.push({
    id: randomHex(10),
    type: 'seed_admin',
    email: defaultAdmin.email,
    createdAt: nowIso(),
  })
  seededStore.metadata.updatedAt = nowIso()
  writeStore(seededStore)

  return seededStore
}

function sanitizeSession(admin) {
  return {
    id: admin.id,
    email: admin.email,
    signedInAt: nowIso(),
  }
}

export async function loginAdmin(email, password) {
  const store = await initializeAuthStore()
  const normalizedEmail = email.trim().toLowerCase()
  const admin = store.admins.find((item) => item.email === normalizedEmail)

  if (!admin) {
    throw new Error('No admin account was found for that email address.')
  }

  const computedHash = await hashValue(password, admin.passwordSalt)

  if (computedHash !== admin.passwordHash) {
    throw new Error('The password you entered is incorrect.')
  }

  const session = sanitizeSession(admin)
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))

  store.auditTrail.unshift({
    id: randomHex(10),
    type: 'login',
    email: admin.email,
    createdAt: nowIso(),
  })
  store.metadata.updatedAt = nowIso()
  writeStore(store)

  return session
}

export async function requestPasswordReset(email) {
  const store = await initializeAuthStore()
  const normalizedEmail = email.trim().toLowerCase()
  const admin = store.admins.find((item) => item.email === normalizedEmail)

  if (!admin) {
    throw new Error('No admin account was found for that recovery email.')
  }

  const rawToken = randomHex(20)
  const tokenSalt = randomHex(12)
  const tokenHash = await hashValue(rawToken, tokenSalt)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

  store.resetTokens = store.resetTokens.filter(
    (token) => token.email !== admin.email || token.usedAt,
  )
  store.resetTokens.unshift({
    id: randomHex(12),
    email: admin.email,
    tokenSalt,
    tokenHash,
    expiresAt,
    usedAt: null,
    createdAt: nowIso(),
  })
  store.auditTrail.unshift({
    id: randomHex(10),
    type: 'reset_requested',
    email: admin.email,
    createdAt: nowIso(),
  })
  store.metadata.updatedAt = nowIso()
  writeStore(store)

  return {
    email: admin.email,
    token: rawToken,
    expiresAt,
  }
}

export async function resetPassword(token, nextPassword, confirmPassword) {
  const store = await initializeAuthStore()
  const normalizedToken = token.trim()

  if (!normalizedToken) {
    throw new Error('Enter the reset token that was generated for this account.')
  }

  if (nextPassword.length < 8) {
    throw new Error('Use a password with at least 8 characters.')
  }

  if (nextPassword !== confirmPassword) {
    throw new Error('The password confirmation does not match.')
  }

  const matchingToken = await findActiveResetToken(store, normalizedToken)

  if (!matchingToken) {
    throw new Error('That reset token is invalid or has already expired.')
  }

  const admin = store.admins.find((item) => item.email === matchingToken.email)

  if (!admin) {
    throw new Error('The target admin account could not be found.')
  }

  admin.passwordSalt = randomHex(16)
  admin.passwordHash = await hashValue(nextPassword, admin.passwordSalt)
  admin.updatedAt = nowIso()
  matchingToken.usedAt = nowIso()

  store.auditTrail.unshift({
    id: randomHex(10),
    type: 'password_reset',
    email: admin.email,
    createdAt: nowIso(),
  })
  store.metadata.updatedAt = nowIso()
  writeStore(store)

  return { email: admin.email }
}

async function findActiveResetToken(store, rawToken) {
  const activeTokens = store.resetTokens.filter(
    (token) => !token.usedAt && new Date(token.expiresAt).getTime() > Date.now(),
  )

  for (const tokenEntry of activeTokens) {
    const computedHash = await hashValue(rawToken, tokenEntry.tokenSalt)

    if (computedHash === tokenEntry.tokenHash) {
      return tokenEntry
    }
  }

  return null
}

export function getCurrentSession() {
  const rawSession = sessionStorage.getItem(AUTH_SESSION_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession)
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getCurrentSession())
}

export function logoutAdmin() {
  const session = getCurrentSession()

  if (!session) {
    return
  }

  const store = readStore()

  if (store) {
    store.auditTrail.unshift({
      id: randomHex(10),
      type: 'logout',
      email: session.email,
      createdAt: nowIso(),
    })
    store.metadata.updatedAt = nowIso()
    writeStore(store)
  }

  sessionStorage.removeItem(AUTH_SESSION_KEY)
}

export function getAuthDiagnostics() {
  const store = readStore()

  if (!store) {
    return null
  }

  return {
    admins: store.admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      status: admin.status,
      updatedAt: admin.updatedAt,
    })),
    resetTokens: store.resetTokens.map((token) => ({
      email: token.email,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
    })),
    auditTrail: store.auditTrail.slice(0, 8),
  }
}

export async function listAdminUsers() {
  const store = await initializeAuthStore()

  return store.admins.map((admin) => ({
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName || 'Admin User',
    role: admin.role || 'Admin',
    status: admin.status || 'Active',
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  }))
}

export async function createAdminUser({
  email,
  password,
  fullName,
  role,
  status,
}) {
  const store = await initializeAuthStore()
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    throw new Error('Admin email is required.')
  }

  if (store.admins.some((admin) => admin.email === normalizedEmail)) {
    throw new Error('An admin user with that email already exists.')
  }

  if (!password || password.length < 8) {
    throw new Error('Use a password with at least 8 characters.')
  }

  const adminRecord = await createAdminRecord(normalizedEmail, password)
  adminRecord.fullName = fullName?.trim() || 'Admin User'
  adminRecord.role = role || 'Admin'
  adminRecord.status = status || 'Active'

  store.admins.unshift(adminRecord)
  store.auditTrail.unshift({
    id: randomHex(10),
    type: 'admin_created',
    email: adminRecord.email,
    createdAt: nowIso(),
  })
  store.metadata.updatedAt = nowIso()
  writeStore(store)

  return {
    id: adminRecord.id,
    email: adminRecord.email,
    fullName: adminRecord.fullName,
    role: adminRecord.role,
    status: adminRecord.status,
    createdAt: adminRecord.createdAt,
    updatedAt: adminRecord.updatedAt,
  }
}

export async function updateAdminUser(id, updates) {
  const store = await initializeAuthStore()
  const admin = store.admins.find((item) => item.id === id)

  if (!admin) {
    throw new Error('The selected admin user could not be found.')
  }

  if (updates.email) {
    const normalizedEmail = updates.email.trim().toLowerCase()
    const duplicate = store.admins.find(
      (item) => item.email === normalizedEmail && item.id !== id,
    )

    if (duplicate) {
      throw new Error('Another admin user already uses that email address.')
    }

    admin.email = normalizedEmail
  }

  if (updates.fullName !== undefined) {
    admin.fullName = updates.fullName.trim() || admin.fullName || 'Admin User'
  }

  if (updates.role !== undefined) {
    admin.role = updates.role || admin.role || 'Admin'
  }

  if (updates.status !== undefined) {
    admin.status = updates.status || admin.status || 'Active'
  }

  if (updates.password) {
    if (updates.password.length < 8) {
      throw new Error('Use a password with at least 8 characters.')
    }

    admin.passwordSalt = randomHex(16)
    admin.passwordHash = await hashValue(updates.password, admin.passwordSalt)
  }

  admin.updatedAt = nowIso()
  store.auditTrail.unshift({
    id: randomHex(10),
    type: 'admin_updated',
    email: admin.email,
    createdAt: nowIso(),
  })
  store.metadata.updatedAt = nowIso()
  writeStore(store)

  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    status: admin.status,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  }
}

export async function deleteAdminUser(id) {
  const store = await initializeAuthStore()
  const target = store.admins.find((item) => item.id === id)

  if (!target) {
    throw new Error('The selected admin user could not be found.')
  }

  if (store.admins.length <= 1) {
    throw new Error('You must keep at least one admin user in the system.')
  }

  store.admins = store.admins.filter((item) => item.id !== id)
  store.auditTrail.unshift({
    id: randomHex(10),
    type: 'admin_deleted',
    email: target.email,
    createdAt: nowIso(),
  })
  store.metadata.updatedAt = nowIso()
  writeStore(store)
}
