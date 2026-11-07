import {
  lstat,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

import { ModuleKitError } from './errors.js'

export interface TemplateFile {
  readonly sourcePath: string
  readonly relativePath: string
}

export async function listTemplateFiles(
  directory: string,
  relativeDirectory = '',
): Promise<TemplateFile[]> {
  const entries = (await readdir(directory, { withFileTypes: true })).sort(
    (left, right) => left.name.localeCompare(right.name),
  )
  const files: TemplateFile[] = []

  for (const entry of entries) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${entry.name}`
      : entry.name
    const sourcePath = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listTemplateFiles(sourcePath, relativePath)))
    } else if (entry.isFile() && entry.name.endsWith('.stub')) {
      files.push({ sourcePath, relativePath })
    }
  }

  return files
}

export function resolveInsideDirectory(
  root: string,
  ...segments: string[]
): string {
  const resolvedRoot = resolve(root)
  const destination = resolve(resolvedRoot, ...segments)
  const relativePath = relative(resolvedRoot, destination)

  if (
    isAbsolute(relativePath) ||
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`)
  ) {
    throw new ModuleKitError(
      'O caminho resolvido está fora do diretório de módulos configurado.',
    )
  }

  return destination
}

export async function createModuleDirectory(path: string): Promise<void> {
  try {
    await mkdir(path)
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      throw new ModuleKitError(
        `O módulo já existe.\n\nLocal: ${path}\n\nNenhum arquivo foi alterado.`,
      )
    }
    throw error
  }
}

export async function writeGeneratedFile(
  destinationPath: string,
  contents: string,
): Promise<void> {
  await mkdir(dirname(destinationPath), { recursive: true })
  await writeFile(destinationPath, contents, { flag: 'wx' })
}

export async function removeGeneratedDirectory(path: string): Promise<void> {
  try {
    const entry = await lstat(path)
    if (entry.isDirectory()) {
      await rm(path, { recursive: true, force: true })
    }
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }
  }
}

export async function readGeneratedFile(path: string): Promise<string> {
  return readFile(path, 'utf8')
}

function isAlreadyExistsError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'EEXIST'
  )
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  )
}
