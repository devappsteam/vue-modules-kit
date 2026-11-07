import pluralize from 'pluralize'

import { ModuleKitError } from './errors.js'

export interface ModuleNames {
  readonly singular: string
  readonly singularPascal: string
  readonly singularCamel: string
  readonly singularKebab: string
  readonly singularSnake: string
  readonly singularTitle: string
  readonly plural: string
  readonly pluralPascal: string
  readonly pluralCamel: string
  readonly pluralKebab: string
  readonly pluralSnake: string
  readonly pluralTitle: string
}

export interface ParsedModulePath {
  readonly organizationalDirectories: string[]
  readonly moduleName: string
  readonly names: ModuleNames
}

const MODULE_SEGMENT_PATTERN = /^[A-Za-z][A-Za-z0-9]*(?:[-_][A-Za-z0-9]+)*$/
const DIRECTORY_SEGMENT_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/

function splitWords(value: string): string[] {
  const words = value.match(/[A-Z]+(?=[A-Z][a-z]|\d|$)|[A-Z]?[a-z]+|\d+/g)

  if (!words?.length) {
    throw new ModuleKitError(`Nome de módulo inválido: "${value}".`)
  }

  return words.map((word) => word.toLowerCase())
}

function toPascalCase(words: readonly string[]): string {
  return words.map((word) => word[0]!.toUpperCase() + word.slice(1)).join('')
}

function toCamelCase(words: readonly string[]): string {
  const [first, ...rest] = words
  return `${first}${toPascalCase(rest)}`
}

function toTitleCase(words: readonly string[]): string {
  return words.map((word) => word[0]!.toUpperCase() + word.slice(1)).join(' ')
}

function createNames(moduleName: string): ModuleNames {
  if (!MODULE_SEGMENT_PATTERN.test(moduleName)) {
    throw new ModuleKitError(
      `Nome de módulo inválido: "${moduleName}". Use letras e números separados por hífen ou sublinhado.`,
    )
  }

  const singularWords = splitWords(moduleName)
  const singular = singularWords.join(' ')
  const pluralWords = splitWords(pluralize.plural(singular))
  const singularPascal = toPascalCase(singularWords)
  const pluralPascal = toPascalCase(pluralWords)

  return {
    singular,
    singularPascal,
    singularCamel: toCamelCase(singularWords),
    singularKebab: singularWords.join('-'),
    singularSnake: singularWords.join('_'),
    singularTitle: toTitleCase(singularWords),
    plural: pluralWords.join(' '),
    pluralPascal,
    pluralCamel: toCamelCase(pluralWords),
    pluralKebab: pluralWords.join('-'),
    pluralSnake: pluralWords.join('_'),
    pluralTitle: toTitleCase(pluralWords),
  }
}

export function parseModulePath(input: string): ParsedModulePath {
  if (!input || input.trim() !== input) {
    throw new ModuleKitError(
      'O caminho do módulo não pode estar vazio nem conter espaços nas extremidades.',
    )
  }

  if (
    input.startsWith('/') ||
    input.startsWith('\\') ||
    /^[A-Za-z]:/.test(input) ||
    input.includes('\\')
  ) {
    throw new ModuleKitError(
      'O caminho do módulo deve ser relativo e usar "/" como separador.',
    )
  }

  const segments = input.split('/')

  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new ModuleKitError(
      'O caminho do módulo contém um segmento vazio ou de travessia.',
    )
  }

  const moduleName = segments.at(-1)
  if (!moduleName) {
    throw new ModuleKitError('O caminho deve terminar com o nome do módulo.')
  }

  for (const directory of segments.slice(0, -1)) {
    if (!DIRECTORY_SEGMENT_PATTERN.test(directory)) {
      throw new ModuleKitError(
        `Diretório organizacional inválido: "${directory}". Use letras e números, com "_" ou "-" opcional.`,
      )
    }
  }

  return {
    organizationalDirectories: segments.slice(0, -1),
    moduleName,
    names: createNames(moduleName),
  }
}
