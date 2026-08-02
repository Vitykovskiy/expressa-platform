import { describe, expect, it } from 'vitest'

import { ApiClient, ApiError, createApiClient } from './client'

describe('ApiClient', () => {
  it('преобразует ошибку API в единый объект ошибки', async () => {
    const client = new ApiClient({
      baseUrl: 'https://api.example.test/api/v1',
      fetcher: async () =>
        new Response(
          JSON.stringify({
            code: 'AUTH_CODE_INVALID',
            details: { attemptsLeft: 2 },
            message: 'Код не принят.',
            requestId: 'request-42',
          }),
          { status: 400 },
        ),
    })

    await expect(client.request('/auth/code', isString)).rejects.toMatchObject({
      code: 'AUTH_CODE_INVALID',
      details: { attemptsLeft: 2 },
      message: 'Код не принят.',
      requestId: 'request-42',
    } satisfies Partial<ApiError>)
  })

  it('сообщает о нарушении формата ошибки API', async () => {
    const client = new ApiClient({
      baseUrl: 'https://api.example.test/api/v1',
      fetcher: async () => new Response(JSON.stringify({ message: 'Ошибка.' }), { status: 500 }),
    })

    await expect(client.request('/orders', isString)).rejects.toMatchObject({
      code: 'API_CONTRACT_ERROR',
      message: 'Сервер вернул ошибку, не соответствующую контракту API.',
    } satisfies Partial<ApiError>)
  })

  it('добавляет /api/v1 к проверенному базовому URL без двойных слешей', async () => {
    let requestedUrl = ''
    const response = new Response(JSON.stringify('ok'))

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString()
      return response
    }

    const client = createApiClient('https://api.example.test/', fetcher)

    await client.request('/orders', isString)

    expect(requestedUrl).toBe('https://api.example.test/api/v1/orders')
  })

  it('создаёт same-origin URL с /api/v1 без двойных слешей', async () => {
    let requestedUrl = ''
    const response = new Response(JSON.stringify('ok'))

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString()
      return response
    }

    const client = createApiClient('/', fetcher)

    await client.request('/orders', isString)

    expect(requestedUrl).toBe('/api/v1/orders')
  })

  it('сохраняет кодирование и query/hash в same-origin URL', async () => {
    let requestedUrl = ''
    const response = new Response(JSON.stringify('ok'))

    const fetcher = async (url: string | URL | Request): Promise<Response> => {
      requestedUrl = url.toString()
      return response
    }

    const client = createApiClient('/', fetcher)

    await client.request('/заказы/с пробелом?фильтр=новый#итог', isString)

    expect(requestedUrl).toBe(
      '/api/v1/%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D1%8B/%D1%81%20%D0%BF%D1%80%D0%BE%D0%B1%D0%B5%D0%BB%D0%BE%D0%BC?%D1%84%D0%B8%D0%BB%D1%8C%D1%82%D1%80=%D0%BD%D0%BE%D0%B2%D1%8B%D0%B9#%D0%B8%D1%82%D0%BE%D0%B3',
    )
  })

  it('отклоняет protocol-relative базовый URL API', () => {
    expect(() => createApiClient('//evil.example.test')).toThrow(
      'Неверная конфигурация: VITE_API_BASE_URL не может быть protocol-relative URL.',
    )
  })
})

function isString(value: unknown): value is string {
  return typeof value === 'string'
}
