import process from 'node:process'
import { URL } from 'node:url'
import { chromium } from 'playwright'

const probePath = '/api/v1/__e01_same_origin_probe__'
const timeoutMs = 30_000

function requiredBaseUrl() {
  const value = process.env.BASE_URL

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('BASE_URL обязателен.')
  }

  let baseUrl
  try {
    baseUrl = new URL(value)
  } catch {
    throw new Error('BASE_URL должен быть HTTP(S) URL без credentials.')
  }
  if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
    throw new Error('BASE_URL должен быть HTTP(S) URL без credentials.')
  }

  return baseUrl
}

function isUnifiedNotFound(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const body = value
  return body.code === 'NOT_FOUND' && typeof body.requestId === 'string' && body.requestId.length > 0
}

const baseUrl = requiredBaseUrl()
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage()
  page.setDefaultTimeout(timeoutMs)

  await page.goto(baseUrl.href, { waitUntil: 'domcontentloaded' })
  if (new URL(page.url()).origin !== baseUrl.origin) {
    throw new Error('Страница клиента открылась с другого origin.')
  }

  const requestPromise = page.waitForRequest((request) => new URL(request.url()).pathname === probePath)
  const responsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === probePath)
  const resultPromise = page.evaluate(async (path) => {
    const response = await globalThis.fetch(path, { cache: 'no-store' })
    const body = await response.json()

    return {
      body,
      pageOrigin: globalThis.location.origin,
      responseOrigin: new globalThis.URL(response.url).origin,
      status: response.status,
    }
  }, probePath)
  const [request, response, result] = await Promise.all([requestPromise, responsePromise, resultPromise])

  if (new URL(request.url()).origin !== result.pageOrigin || new URL(response.url()).origin !== result.pageOrigin) {
    throw new Error('Probe запрос или ответ покинул origin клиента.')
  }
  if (result.responseOrigin !== result.pageOrigin) {
    throw new Error('Fetch response имеет другой origin.')
  }
  if (result.status !== 404 || !isUnifiedNotFound(result.body)) {
    throw new Error('Probe не вернул unified backend 404 с requestId.')
  }
} finally {
  await browser.close()
}
