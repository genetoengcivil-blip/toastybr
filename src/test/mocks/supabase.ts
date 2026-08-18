import { vi } from 'vitest'

export interface MockSupabaseResponse<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

function createChainableMock() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return chain
}

function createMockRealtimeChannel() {
  const handlers: Record<string, Array<(payload: any) => void>> = {}
  let subscribeStatus: string = 'SUBSCRIBED'
  const channel: any = {}

  channel.on = vi.fn((_type: string, _filter: any, cb: (payload: any) => void) => {
    const key = `${_type}:${_filter?.table ?? ''}`
    ;(handlers[key] ??= []).push(cb)
    return channel
  })
  channel.subscribe = vi.fn((cb?: (status: string) => void) => {
    if (cb) cb(subscribeStatus)
    return channel
  })
  channel.unsubscribe = vi.fn(() => {
    channel._setStatus('CLOSED')
    return Promise.resolve()
  })
  channel._setStatus = (status: string) => {
    subscribeStatus = status
  }
  channel._emit = (type: string, table: string, payload: any) => {
    const key = `${type}:${table}`
    ;(handlers[key] ?? []).forEach((h: (payload: any) => void) => h(payload))
  }
  return channel
}

export function createMockSupabaseClient() {
  let fromResponse: any = { data: null, error: null }

  const mockFrom = vi.fn(() => {
    const chain = createChainableMock()
    chain.single.mockResolvedValue(fromResponse)
    chain.maybeSingle.mockResolvedValue(fromResponse)
    Object.assign(chain, { then: (onFulfilled: (value: any) => any) => Promise.resolve(fromResponse).then(onFulfilled) })
    return chain
  })

  let rpcResponse: any = { data: null, error: null }
  const mockRpc = vi.fn().mockImplementation(() => Promise.resolve(rpcResponse))

  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  }

  const channels = new Map<string, any>()
  const mockChannel = vi.fn((name: string) => {
    if (!channels.has(name)) channels.set(name, createMockRealtimeChannel())
    return channels.get(name)
  })
  const mockRemoveChannel = vi.fn(() => Promise.resolve())

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: mockAuth,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
    _mocks: {
      from: mockFrom,
      rpc: mockRpc,
      auth: mockAuth,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    _setFromResponse: (response: any) => {
      fromResponse = response
    },
    _setRpcResponse: (response: any) => {
      rpcResponse = response
    },
    _setAuthResponse: (method: keyof typeof mockAuth, response: any) => {
      mockAuth[method].mockResolvedValue(response)
    },
  }
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>