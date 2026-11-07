import { realpath, mkdir } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  createModuleDirectory,
  listTemplateFiles,
  removeGeneratedDirectory,
  resolveInsideDirectory,
  writeGeneratedFile,
} from './filesystem.js'
import { ModuleKitError } from './errors.js'
import { parseModulePath } from './naming.js'
import {
  createTemplateValues,
  renderTemplateFile,
  replaceTemplatePlaceholders,
} from './template-engine.js'

export type ModuleMode = 'modal' | 'page'

export interface GenerateModuleOptions {
  readonly mode?: ModuleMode
  readonly cwd?: string
  readonly modulesDirectory?: string
  readonly templatesDirectory?: string
}

export interface GeneratedModule {
  readonly destination: string
  readonly relativeDestination: string
  readonly mode: ModuleMode
  readonly files: string[]
}

const DEFAULT_TEMPLATES_DIRECTORY = fileURLToPath(
  new URL('../templates', import.meta.url),
)

function assertInsideRealRoot(root: string, destination: string): void {
  const relativePath = relative(root, destination)
  if (
    isAbsolute(relativePath) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`)
  ) {
    throw new ModuleKitError(
      'O caminho do módulo aponta para fora do diretório configurado.',
    )
  }
}

export async function generateModule(
  modulePath: string,
  options: GenerateModuleOptions = {},
): Promise<GeneratedModule> {
  const mode = options.mode ?? 'modal'
  if (mode !== 'modal' && mode !== 'page') {
    throw new ModuleKitError(`Modo de módulo não suportado: "${String(mode)}".`)
  }

  const parsedPath = parseModulePath(modulePath)
  const cwd = resolve(options.cwd ?? process.cwd())
  const modulesDirectory = options.modulesDirectory ?? 'src/modules'
  const modulesRoot = resolve(cwd, modulesDirectory)
  const relativeModuleDirectory = [
    ...parsedPath.organizationalDirectories,
    parsedPath.names.pluralKebab,
  ]
  const destination = resolveInsideDirectory(
    modulesRoot,
    ...relativeModuleDirectory,
  )
  const templatesDirectory = resolve(
    options.templatesDirectory ?? DEFAULT_TEMPLATES_DIRECTORY,
    mode,
  )

  await mkdir(modulesRoot, { recursive: true })
  const realModulesRoot = await realpath(modulesRoot)

  let organizationalPath = modulesRoot
  for (
    let index = 0;
    index < parsedPath.organizationalDirectories.length;
    index += 1
  ) {
    organizationalPath = resolveInsideDirectory(
      modulesRoot,
      ...parsedPath.organizationalDirectories.slice(0, index + 1),
    )
    try {
      await mkdir(organizationalPath)
    } catch (error) {
      if (!isAlreadyExistsError(error)) {
        throw error
      }
    }

    const realDirectory = await realpath(organizationalPath)
    assertInsideRealRoot(realModulesRoot, realDirectory)
  }

  const realParent = await realpath(organizationalPath)
  assertInsideRealRoot(realModulesRoot, realParent)
  assertInsideRealRoot(
    realModulesRoot,
    resolve(realParent, parsedPath.names.pluralKebab),
  )

  const templates = await listTemplateFiles(templatesDirectory)
  if (templates.length === 0) {
    throw new ModuleKitError(
      `Não foram encontrados modelos para o modo ${mode}.`,
    )
  }

  const values = createTemplateValues(parsedPath.moduleName, parsedPath.names)
  const generatedFiles: string[] = []

  await createModuleDirectory(destination)

  try {
    for (const template of templates) {
      const outputRelativePath = replaceTemplatePlaceholders(
        template.relativePath.replace(/\.stub$/, ''),
        values,
      )
      const outputPath = resolveInsideDirectory(destination, outputRelativePath)
      const contents = await renderTemplateFile(template.sourcePath, values)

      await writeGeneratedFile(outputPath, contents)
      generatedFiles.push(
        relative(destination, outputPath).split(sep).join('/'),
      )
    }
  } catch (error) {
    try {
      await removeGeneratedDirectory(destination)
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `A geração falhou e não foi possível remover o módulo parcial em "${destination}".`,
      )
    }
    throw error
  }

  return {
    destination,
    relativeDestination: relative(cwd, destination).split(sep).join('/'),
    mode,
    files: generatedFiles,
  }
}

function isAlreadyExistsError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'EEXIST'
  )
}
