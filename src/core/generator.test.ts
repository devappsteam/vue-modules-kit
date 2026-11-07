import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { generateModule } from './generator.js'

const temporaryDirectories: string[] = []

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'vue-modules-kit-'))
  temporaryDirectories.push(directory)
  return directory
}

async function readAllFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name)
      return entry.isDirectory() ? readAllFiles(path) : readFile(path, 'utf8')
    }),
  )

  return contents.flat()
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe('generateModule', () => {
  it('generates a generic CRUD modal module with substituted names', async () => {
    const cwd = await createTemporaryDirectory()
    const result = await generateModule('Product', { cwd })
    const moduleDirectory = join(cwd, 'src/modules/products')
    const files = await readdir(moduleDirectory)

    expect(result.mode).toBe('modal')
    expect(files.sort()).toEqual([
      'components',
      'router.ts',
      'services',
      'stores',
      'types',
      'views',
    ])
    await expect(
      readFile(join(moduleDirectory, 'views/ProductsView.vue'), 'utf8'),
    ).resolves.toContain('ProductsFormModal')
    await expect(
      readFile(join(moduleDirectory, 'types/products.types.ts'), 'utf8'),
    ).resolves.toContain('interface Product')
    await expect(
      readFile(join(moduleDirectory, 'services/products.service.ts'), 'utf8'),
    ).resolves.toContain("'/products'")
    await expect(
      readFile(
        join(moduleDirectory, 'components/ProductsDeleteModal.vue'),
        'utf8',
      ),
    ).resolves.toContain('role="alertdialog"')
    const generatedTypes = await readFile(
      join(moduleDirectory, 'types/products.types.ts'),
      'utf8',
    )
    expect(generatedTypes).toContain('name: string')
    expect(generatedTypes).toContain('description: string | null')
    const generatedContents = await readAllFiles(moduleDirectory)
    expect(generatedContents.join('\n')).not.toMatch(
      /\{\{\s*MODULE_[A-Z_]+\s*}}/,
    )
    expect(result.files).toContain('components/ProductsFormModal.vue')
    expect(result.files).not.toContain('views/ProductsFormView.vue')
    await expect(
      readFile(
        join(moduleDirectory, 'components/ProductsFormModal.vue'),
        'utf8',
      ),
    ).resolves.toContain('form="products-form"')
  })

  it('generates page mode with a route-based form and no form modal', async () => {
    const cwd = await createTemporaryDirectory()
    await mkdir(join(cwd, 'src/modules/RH'), { recursive: true })
    const result = await generateModule('RH/Employee', { cwd, mode: 'page' })
    const moduleDirectory = join(cwd, 'src/modules/RH/employees')
    const files = await readdir(join(moduleDirectory, 'components'))

    expect(result.relativeDestination).toBe('src/modules/RH/employees')
    expect(files.sort()).toEqual([
      'EmployeesDeleteModal.vue',
      'EmployeesList.vue',
    ])
    await expect(
      readFile(join(moduleDirectory, 'views/EmployeesFormView.vue'), 'utf8'),
    ).resolves.toContain('updateEmployee')
    await expect(
      readFile(join(moduleDirectory, 'router.ts'), 'utf8'),
    ).resolves.toContain('employees-edit')
    expect(result.files).toContain('components/EmployeesDeleteModal.vue')
    expect(result.files).not.toContain('components/EmployeesFormModal.vue')
    const generatedContents = await readAllFiles(moduleDirectory)
    expect(generatedContents.join('\n')).not.toMatch(
      /\{\{\s*MODULE_[A-Z_]+\s*}}/,
    )
  })

  it('creates missing organizational directories without pluralizing them', async () => {
    const cwd = await createTemporaryDirectory()

    const result = await generateModule('RH/Recruitment/Job', { cwd })

    expect(result.relativeDestination).toBe('src/modules/RH/Recruitment/jobs')
  })

  it('does not overwrite an existing module', async () => {
    const cwd = await createTemporaryDirectory()
    const moduleDirectory = join(cwd, 'src/modules/products')
    await mkdir(moduleDirectory, { recursive: true })
    await import('node:fs/promises').then(({ writeFile }) =>
      writeFile(join(moduleDirectory, 'keep.txt'), 'untouched'),
    )

    await expect(generateModule('Product', { cwd })).rejects.toThrow(
      'O módulo já existe.',
    )
    await expect(
      readFile(join(moduleDirectory, 'keep.txt'), 'utf8'),
    ).resolves.toBe('untouched')
  })

  it('rejects an organizational symlink that escapes the configured modules directory', async () => {
    const cwd = await createTemporaryDirectory()
    const outside = await createTemporaryDirectory()
    const modulesDirectory = join(cwd, 'src/modules')
    await mkdir(modulesDirectory, { recursive: true })
    await symlink(outside, join(modulesDirectory, 'RH'))

    await expect(generateModule('RH/Employee', { cwd })).rejects.toThrow(
      'fora do diretório configurado',
    )
    await expect(readdir(outside)).resolves.toEqual([])
  })
})
