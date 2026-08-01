import { describe, expect, it } from 'vitest'

import { ApiClient, ApiError, createApiClient } from './client'

describe('ApiClient', () => {
  it('преобразует ошибку API в единый объект ошибки и не возвращает подтверждение', async () => {
    const client = new ApiClient({
      baseUrl: 'https://api.example.test/api/v1',
      fetcher: async () =>
        new Response(
          JSON.stringify({
            code: 'AVAILABILITY_UPDATE_REJECTED',
            details: { field: 'acceptingOrders' },
            message: 'Изменение не принято.',
            requestId: 'request-42',
          }),
          { status: 422 },
        ),
    })

    await expect(client.request('/availability', isString)).rejects.toMatchObject({
      code: 'AVAILABILITY_UPDATE_REJECTED',
      details: { field: 'acceptingOrders' },
      message: 'Изменение не принято.',
      requestId: 'request-42',
    } satisfies Partial<ApiError>)
  })

  it('сообщает о нарушении формата успешного ответа API', async () => {
    const client = new ApiClient({
      baseUrl: 'https://api.example.test/api/v1',
      fetcher: async () => new Response(JSON.stringify({ accepted: true }), { status: 200 }),
    })

    await expect(client.request('/queue', isString)).rejects.toMatchObject({
      code: 'API_CONTRACT_ERROR',
      message: 'Сервер вернул ответ, не соответствующий контракту API.',
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

    await client.request('/queue', isString)

    expect(requestedUrl).toBe('https://api.example.test/service/api/v1/queue')
  })
})

function isString(value: unknown): value is string {
  return typeof value === 'string'
}
