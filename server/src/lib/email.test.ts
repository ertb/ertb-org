import { smtpPort } from './email'

describe('smtpPort', () => {
  it.each([
    ['smtps://user:pass@host:465', 465],
    ['smtps://user:pass@host:587', 587],
    ['smtp://user:pass@host:2525', 2525],
    ['smtps://user:pass@host', 465],
    ['smtp://user:pass@host', 25],
  ])('%s -> %i', (url, port) => {
    expect(smtpPort(new URL(url))).toBe(port)
  })
})
