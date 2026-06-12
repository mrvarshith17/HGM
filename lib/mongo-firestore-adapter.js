/* eslint-disable @typescript-eslint/no-require-imports */
const { GoogleAuth } = require('google-auth-library')
const { MongoClient } = require('mongodb')

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
    return null
  }

  if (localOidcCallback !== undefined) {
    return localOidcCallback
  }

  const credentials = getServiceAccountCredentials()

  if (!credentials) {
    localOidcCallback = null
    return localOidcCallback
  }

  const auth = new GoogleAuth({ credentials })

  localOidcCallback = async ({ tokenAudience }) => {
    const audience = tokenAudience || 'FIRESTORE'
    const client = await auth.getIdTokenClient(audience)
    const headers = await client.getRequestHeaders()
    const authorization = getAuthorizationHeader(headers)

    if (!authorization) {
      throw new Error('Google Auth did not return an authorization header')
    }

    return {
      accessToken: authorization.replace(/^Bearer\s+/i, ''),
    }
  }

  return localOidcCallback
}

function getServiceAccountCredentials() {
  if (process.env.GCP_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.GCP_SERVICE_ACCOUNT)
    } catch {
      console.warn('[MongoDB] GCP_SERVICE_ACCOUNT is not valid JSON; falling back to firebase-key.json')
    }
  }

  try {
    return require('../firebase-key.json')
  } catch {
    return null
  }
}

function getAuthorizationHeader(headers) {
  if (typeof headers.get === 'function') {
    return headers.get('authorization')
  }

  return headers.Authorization || headers.authorization
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
