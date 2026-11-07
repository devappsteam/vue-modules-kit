import { describe, expect, it } from 'vitest'

import { ModuleKitError } from './errors.js'
import { parseModulePath } from './naming.js'

describe('parseModulePath', () => {
  it.each([
    ['Product', 'products', 'Products', 'products', 'products'],
    ['Customer', 'customers', 'Customers', 'customers', 'customers'],
    [
      'SalesOrder',
      'sales-orders',
      'SalesOrders',
      'salesOrders',
      'sales_orders',
    ],
    [
      'UserProfile',
      'user-profiles',
      'UserProfiles',
      'userProfiles',
      'user_profiles',
    ],
    ['OrderItem', 'order-items', 'OrderItems', 'orderItems', 'order_items'],
  ])('creates naming variants for %s', (input, kebab, pascal, camel, snake) => {
    const result = parseModulePath(input)

    expect(result.names.pluralKebab).toBe(kebab)
    expect(result.names.pluralPascal).toBe(pascal)
    expect(result.names.pluralCamel).toBe(camel)
    expect(result.names.pluralSnake).toBe(snake)
  })

  it('uses only the final segment for module naming and preserves its parents', () => {
    const result = parseModulePath('RH/Recruitment/Job')

    expect(result.organizationalDirectories).toEqual(['RH', 'Recruitment'])
    expect(result.moduleName).toBe('Job')
    expect(result.names.pluralKebab).toBe('jobs')
  })

  it('creates readable title forms for compound module names', () => {
    const result = parseModulePath('SalesOrder')

    expect(result.names.singularTitle).toBe('Sales Order')
    expect(result.names.pluralTitle).toBe('Sales Orders')
  })

  it.each([
    '',
    '../malicious',
    'RH/../../malicious',
    '/etc/malicious',
    'C:\\temp\\Product',
    'RH//Product',
    'RH/./Product',
    'bad name',
    '-Product',
    'RH/invalid.name',
  ])('rejects invalid module path %j', (input) => {
    expect(() => parseModulePath(input)).toThrow(ModuleKitError)
  })
})
