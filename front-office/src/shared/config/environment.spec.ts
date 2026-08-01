import { describe, expect, it } from 'vitest'

import { validateEnvironment } from './environment'

describe('validateEnvironment', () => {
  it('принимает поддерживаемое окружение и абсолютный HTTP URL API', () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: 'local',
        VITE_API_BASE_URL: 'http://localhost:3000',
      }),
    ).not.toThrow()
  })

  it('отклоняет отсутствующее окружение', () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: undefined,
        VITE_API_BASE_URL: 'http://localhost:3000',
      }),
    ).toThrow('Неверная конфигурация: VITE_APP_ENV обязательна.')
  })

  it('отклоняет неподдерживаемое окружение без раскрытия значения', () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: 'preview',
        VITE_API_BASE_URL: 'http://localhost:3000',
      }),
    ).toThrow(
      'Неверная конфигурация: VITE_APP_ENV должна быть local, development, staging или production.',
    )
  })

  it('отклоняет отсутствующий или некорректный адрес API', () => {
    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: 'local',
        VITE_API_BASE_URL: undefined,
      }),
    ).toThrow('Неверная конфигурация: VITE_API_BASE_URL обязательна.')

    expect(() =>
      validateEnvironment({
        VITE_APP_ENV: 'local',
        VITE_API_BASE_URL: 'ftp://example.test',
      }),
    ).toThrow('Неверная конфигурация: VITE_API_BASE_URL должна быть абсолютным HTTP(S) URL.')
  })
})
