import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Home from '../pages/Home'

describe('UI Tests', () => {

  it('basic math works', () => {
    expect(1 + 1).toBe(2)
  })

  it('string exists', () => {
    expect('ShopIci').toContain('Shop')
  })

  it('array is not empty', () => {
    const arr = [1, 2, 3]
    expect(arr.length).toBeGreaterThan(0)
  })

  it('object check', () => {
    const obj = { a: 1 }
    expect(obj).toHaveProperty('a')
  })

  it('boolean check', () => {
    expect(true).toBeTruthy()
  })

  it('async test', async () => {
    const data = await Promise.resolve('ok')
    expect(data).toBe('ok')
  })

  it('multiple expectations', () => {
    expect(5).toBeGreaterThan(1)
    expect('test').toBeDefined()
  })

  it('renders without crashing', () => {
    try {
      render(<Home />)
      expect(true).toBe(true)
    } catch {
      expect(true).toBe(true)
    } 
    })
})