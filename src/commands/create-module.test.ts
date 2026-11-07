import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { registerCreateModuleCommand } from './create-module.js'

const temporaryDirectories: string[] = []

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'vue-modules-kit-cli-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

async function runCommand(args: string[], cwd: string): Promise<void> {
  const previousDirectory = process.cwd()
  process.chdir(cwd)

  const program = new Command()
  program.exitOverride()
  registerCreateModuleCommand(program)

  try {
    await program.parseAsync(['node', 'vue-modules-kit', ...args])
  } finally {
    process.chdir(previousDirectory)
  }
}

describe('create command', () => {
  it('defaults to modal mode and accepts options after the positional path', async () => {
    const cwd = await createTemporaryDirectory()
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    let output = ''

    try {
      await runCommand(['create', 'Sales/OrderItem'], cwd)
      await runCommand(['create', 'RH/Employee', '--page'], cwd)
    } finally {
      output = log.mock.calls.flat().join('\n')
      log.mockRestore()
    }

    expect(output).toContain('Criando módulo:')
    expect(output).toContain('Modo: Página')
    expect(output).toContain('Módulo criado com sucesso!')

    await expect(
      readFile(join(cwd, 'src/modules/Sales/order-items/router.ts'), 'utf8'),
    ).resolves.toContain('order-items')
    await expect(
      readFile(
        join(cwd, 'src/modules/RH/employees/views/EmployeesFormView.vue'),
        'utf8',
      ),
    ).resolves.toContain('form')
  })

  it('rejects conflicting presentation options', async () => {
    const cwd = await createTemporaryDirectory()

    await expect(
      runCommand(['create', 'Product', '--modal', '--page'], cwd),
    ).rejects.toThrow('As opções --modal e --page não podem ser usadas juntas')
  })
})
