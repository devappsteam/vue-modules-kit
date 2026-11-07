import { readFile } from 'node:fs/promises'

import type { ModuleNames } from './naming.js'
import { ModuleKitError } from './errors.js'

export type TemplateValues = ModuleNames & {
  readonly moduleName: string
}

export function createTemplateValues(
  moduleName: string,
  names: ModuleNames,
): TemplateValues {
  return { ...names, moduleName }
}

export function replaceTemplatePlaceholders(
  template: string,
  values: TemplateValues,
): string {
  const placeholders: Record<string, string> = {
    MODULE_NAME: values.pluralKebab,
    MODULE_NAME_PASCAL: values.pluralPascal,
    MODULE_NAME_CAMEL: values.pluralCamel,
    MODULE_NAME_KEBAB: values.pluralKebab,
    MODULE_NAME_SNAKE: values.pluralSnake,
    MODULE_NAME_PLURAL: values.pluralCamel,
    MODULE_SINGULAR: values.singular,
    MODULE_SINGULAR_PASCAL: values.singularPascal,
    MODULE_SINGULAR_CAMEL: values.singularCamel,
    MODULE_SINGULAR_KEBAB: values.singularKebab,
    MODULE_SINGULAR_SNAKE: values.singularSnake,
    MODULE_SINGULAR_TITLE: values.singularTitle,
    MODULE_PLURAL_TITLE: values.pluralTitle,
    MODULE_NAME_TITLE: values.pluralTitle,
  }

  return template.replace(
    /\{\{\s*([A-Z_]+)\s*}}/g,
    (placeholder, key: string) => {
      const value = placeholders[key]
      if (value === undefined) {
        throw new ModuleKitError(
          `Marcador de modelo desconhecido: "${placeholder}".`,
        )
      }
      return value
    },
  )
}

export async function renderTemplateFile(
  sourcePath: string,
  values: TemplateValues,
): Promise<string> {
  const template = await readFile(sourcePath, 'utf8')
  return replaceTemplatePlaceholders(template, values)
}
