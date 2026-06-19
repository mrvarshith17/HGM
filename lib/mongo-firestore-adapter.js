/* eslint-disable @typescript-eslint/no-require-imports */
const { MongoClient } = require('mongodb')
const crypto = require('crypto')

let mongoClientPromise = null
let mongoDb = null
let configuredDb = null
let localOidcCallback = undefined

function getMongoUri() {
  return process.env.MONGODB_URI || process.env.FIRESTORE_MONGODB_URI || ''
}

function hasMongoUri() {
  return Boolean(getMongoUri())
}

function getMongoClient() {
  const uri = getMongoUri()

  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  if (!mongoClientPromise) {
    const timeoutMs = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 10000)
    const client = new MongoClient(uri, {
      authMechanismProperties: getAuthMechanismProperties(),
      connectTimeoutMS: timeoutMs,
      family: 4,
      serverSelectionTimeoutMS: timeoutMs,
      socketTimeoutMS: timeoutMs,
    })

    mongoClientPromise = client.connect().then((connectedClient) => {
      console.log('[MongoDB] Connected to Firestore MongoDB-compatible endpoint')
      return connectedClient
    })
  }

  return mongoClientPromise
}

function getAuthMechanismProperties() {
  const properties = {
    ALLOWED_HOSTS: ['*.firestore.goog'],
  }
  const oidcCallback = getLocalOidcCallback()

  if (oidcCallback) {
    properties.OIDC_CALLBACK = oidcCallback
  }

  return properties
}

function getLocalOidcCallback() {
  if (process.env.MONGODB_USE_GCP_METADATA === 'true') {
    console.log('[MongoDB] Using GCP metadata server for authentication')
    return null
  }

  if (localOidcCallback !== undefined) {
    return localOidcCallback
  }

  const credentials = getServiceAccountCredentials()

  if (!credentials) {
    console.error('[MongoDB] Failed to load service account credentials. OIDC callback will be null.')
    localOidcCallback = null
    return localOidcCallback
  }

  console.log('[MongoDB] Service account loaded successfully:', credentials.client_email)

  localOidcCallback = async ({ tokenAudience }) => {
    const audience = tokenAudience || 'FIRESTORE'
    try {
      // Manually create and sign JWT token
      const now = Math.floor(Date.now() / 1000)
      const exp = now + 3600 // 1 hour expiry

      const header = {
        alg: 'RS256',
        typ: 'JWT',
        kid: credentials.private_key_id,
      }

      const payload = {
        iss: credentials.client_email,
        sub: credentials.client_email,
        aud: audience,
        iat: now,
        exp: exp,
      }

      // Create the JWT token
      const token = createSignedJWT(header, payload, credentials.private_key)

      console.log('[MongoDB] OIDC token generated successfully for audience:', audience)
      return {
        accessToken: token,
      }
    } catch (error) {
      console.error('[MongoDB] Error generating OIDC token:', error.message, error.stack)
      throw error
    }
  }

  return localOidcCallback
}

function createSignedJWT(header, payload, privateKey) {
  // Base64URL encode
  const base64UrlEncode = (str) => {
    return Buffer.from(str, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  // Create the signing input
  const headerStr = base64UrlEncode(JSON.stringify(header))
  const payloadStr = base64UrlEncode(JSON.stringify(payload))
  const signingInput = `${headerStr}.${payloadStr}`

  // Sign with private key using SHA256
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signingInput)
  const signature = base64UrlEncode(sign.sign(privateKey, 'base64'))

  return `${signingInput}.${signature}`
}

function getServiceAccountCredentials() {
  if (process.env.GCP_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.GCP_SERVICE_ACCOUNT)
      console.log('[MongoDB] Loaded service account from GCP_SERVICE_ACCOUNT env var')
      return parsed
    } catch (error) {
      console.warn('[MongoDB] GCP_SERVICE_ACCOUNT is not valid JSON:', error.message)
      console.warn('[MongoDB] Falling back to firebase-key.json')
    }
  }

  try {
    const credentials = require('../firebase-key.json')
    console.log('[MongoDB] Loaded service account from firebase-key.json')
    return credentials
  } catch (error) {
    console.error('[MongoDB] Failed to load firebase-key.json:', error.message)
    return null
  }
}

async function getMongoDatabase() {
  if (!mongoDb) {
    const client = await getMongoClient()
    mongoDb = client.db()
  }

  return mongoDb
}

async function getMongoCollection(collectionName) {
  const db = await getMongoDatabase()
  return db.collection(collectionName)
}

function withoutMongoId(document) {
  if (!document) {
    return undefined
  }

  const data = { ...document }
  delete data._id

  return data
}

class MongoDocumentSnapshot {
  constructor(id, document) {
    this.id = String(id)
    this._document = document
    this.exists = Boolean(document)
  }

  data() {
    return withoutMongoId(this._document)
  }
}

class MongoQuerySnapshot {
  constructor(documents) {
    this.docs = documents.map((document) => (
      new MongoDocumentSnapshot(document._id, document)
    ))
    this.empty = this.docs.length === 0
    this.size = this.docs.length
  }

  forEach(callback) {
    this.docs.forEach(callback)
  }
}

class MongoDocumentReference {
  constructor(collectionName, id) {
    this.collectionName = collectionName
    this.id = String(id)
  }

  async get() {
    const collection = await getMongoCollection(this.collectionName)
    const document = await collection.findOne({ _id: this.id })
    return new MongoDocumentSnapshot(this.id, document)
  }

  async set(data) {
    const collection = await getMongoCollection(this.collectionName)
    const replacement = { _id: this.id, ...data }
    await collection.replaceOne({ _id: this.id }, replacement, { upsert: true })
  }

  async update(data) {
    const collection = await getMongoCollection(this.collectionName)
    const result = await collection.updateOne({ _id: this.id }, { $set: data })

    if (result.matchedCount === 0) {
      throw new Error(`Document ${this.collectionName}/${this.id} does not exist`)
    }
  }

  async delete() {
    const collection = await getMongoCollection(this.collectionName)
    await collection.deleteOne({ _id: this.id })
  }
}

class MongoQuery {
  constructor(collectionName, filters = [], orderings = [], limitCount = null) {
    this.collectionName = collectionName
    this.filters = filters
    this.orderings = orderings
    this.limitCount = limitCount
  }

  where(field, operator, value) {
    return new MongoQuery(
      this.collectionName,
      [...this.filters, { field, operator, value }],
      this.orderings,
      this.limitCount
    )
  }

  orderBy(field, direction = 'asc') {
    return new MongoQuery(
      this.collectionName,
      this.filters,
      [...this.orderings, { field, direction }],
      this.limitCount
    )
  }

  limit(count) {
    return new MongoQuery(
      this.collectionName,
      this.filters,
      this.orderings,
      count
    )
  }

  async get() {
    const collection = await getMongoCollection(this.collectionName)
    const filter = this.toMongoFilter()
    const sort = this.toMongoSort()
    let cursor = collection.find(filter)

    if (Object.keys(sort).length > 0) {
      cursor = cursor.sort(sort)
    }

    if (typeof this.limitCount === 'number') {
      cursor = cursor.limit(this.limitCount)
    }

    return new MongoQuerySnapshot(await cursor.toArray())
  }

  toMongoFilter() {
    return this.filters.reduce((filter, { field, operator, value }) => {
      if (operator === '==') {
        filter[field] = value
        return filter
      }

      if (operator === 'in') {
        filter[field] = { ...(filter[field] || {}), $in: value }
        return filter
      }

      const mongoOperator = {
        '<': '$lt',
        '<=': '$lte',
        '>': '$gt',
        '>=': '$gte',
      }[operator]

      if (!mongoOperator) {
        throw new Error(`Unsupported query operator: ${operator}`)
      }

      filter[field] = { ...(filter[field] || {}), [mongoOperator]: value }
      return filter
    }, {})
  }

  toMongoSort() {
    return this.orderings.reduce((sort, { field, direction }) => {
      sort[field] = String(direction).toLowerCase() === 'desc' ? -1 : 1
      return sort
    }, {})
  }
}

class MongoCollectionReference extends MongoQuery {
  constructor(collectionName) {
    super(collectionName)
  }

  doc(id) {
    return new MongoDocumentReference(this.collectionName, id)
  }
}

class MongoFirestoreAdapter {
  collection(collectionName) {
    return new MongoCollectionReference(collectionName)
  }
}

function getConfiguredDb() {
  if (!configuredDb) {
    configuredDb = new MongoFirestoreAdapter()
  }

  return configuredDb
}

async function pingMongo() {
  const db = await getMongoDatabase()
  await db.command({ ping: 1 })
}

async function closeMongo() {
  if (!mongoClientPromise) {
    return
  }

  const client = await mongoClientPromise
  await client.close()
  mongoClientPromise = null
  mongoDb = null
}

module.exports = {
  closeMongo,
  getConfiguredDb,
  getMongoClient,
  getMongoDatabase,
  hasMongoUri,
  pingMongo,
}
