import { getSigningKey, signToken, verifyToken } from './auth-sign-verify'

describe('auth-sign-verify', ()=>{
  it('should sign and verify', async ()=> {
    const {token, expires} = await signToken({id:1234})
    const result = await verifyToken(token)
    expect(result).not.toBeUndefined()
    expect(expires).toBeGreaterThan(Date.now()/1000)
  })

  it('should verify using previous key', async ()=> {
    const {token} = await signToken({id:1234})
    getSigningKey({forceRotate:true}) // force key rotation
    const result = await verifyToken(token)
    expect(result).not.toBeUndefined()
  })

  it('should not verify using an old key', async ()=> {
    const {token} = await signToken({id:1234})
    await getSigningKey({forceRotate:true}) // force key rotation
    await getSigningKey({forceRotate:true}) // rotate again so original key is old
    await hideConsoleError(async ()=>{
      await expect(verifyToken(token)).rejects.toThrow()
    })
  })
})

const hideConsoleError = async (fn:(()=>Promise<void>)) => {
  const resetConsole = ()=>global.console = {...console}
  global.console = { ...console, error: jest.fn() }
  try {
    await fn()
  } finally {
    resetConsole()
  }
}