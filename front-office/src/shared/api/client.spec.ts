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

    const client = createApiClient('https://api.example.test/service/', fetcher)

    await client.request('/orders', isString)

    expect(requestedUrl).toBe('https://api.example.test/service/api/v1/orders')
  })
})

function isString(value: unknown): value is string {
  return typeof value === 'string'
}
