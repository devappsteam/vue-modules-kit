import { describe, expect, it } from 'vitest'

import { ModuleKitError } from './errors.js'
import { parseModulePath } from './naming.js'
import {
  createTemplateValues,
  replaceTemplatePlaceholders,
} from './template-engine.js'

describe('replaceTemplatePlaceholders', () => {
  it('replaces placeholders including Vue formatter whitespace', () => {
    const parsed = parseModulePath('SalesOrder')
    const values = createTemplateValues(parsed.moduleName, parsed.names)

    expect(
      replaceTemplatePlaceholders(
        '{{MODULE_NAME}}/{{ MODULE_NAME_PASCAL }}/{{MODULE_SINGULAR_TITLE}}',
        values,
      ),
    ).toBe('sales-orders/SalesOrders/Sales Order')
  })

  it('reports unknown placeholders instead of leaving them in generated files', () => {
    const parsed = parseModulePath('Product')
    const values = createTemplateValues(parsed.moduleName, parsed.names)

    expect(() =>
      replaceTemplatePlaceholders('{{UNKNOWN_TOKEN}}', values),
    ).toThrow(ModuleKitError)
  })
})
