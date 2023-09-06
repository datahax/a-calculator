import { describe, it, expect } from 'vitest'
import { makeOperatorsLookNicer } from './index.tsx'


describe('calculator operator', () => {
  it('passes different operators', () => {
    expect(makeOperatorsLookNicer("-")).toEqual("−")
    expect(makeOperatorsLookNicer("/")).toEqual("÷")
    expect(makeOperatorsLookNicer("*")).toEqual("×")
  })
})
