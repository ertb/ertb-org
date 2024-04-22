import { getSigningKey, signToken, verifyToken } from './auth-sign-verify'

describe('auth-sign-verify', ()=>{
  it('should sign and verify', async ()=> {
    const jwt = await signToken({id:1234})
    const result = await verifyToken(jwt)
    expect(result).not.toBeUndefined()
  })

  it('should verify using previous key', async ()=> {
    const jwt = await signToken({id:1234})
    getSigningKey({forceRotate:true}) // force key rotation
    const result = await verifyToken(jwt)
    expect(result).not.toBeUndefined()
  })

  it('should not verify using an old key', async ()=> {
    const jwt = await signToken({id:1234})
    await getSigningKey({forceRotate:true}) // force key rotation
    await getSigningKey({forceRotate:true}) // rotate again so original key is old
    hideConsoleError(async ()=>{
      const result = await verifyToken(jwt)
      expect(result).toBeUndefined()
    })
  })
})

const hideConsoleError = (fn:(()=>void)) => {
  const resetConsole = ()=>global.console = {...console}
  global.console = { ...console, error: jest.fn() }
  try {
    fn()
  } finally {
    resetConsole
  }
}