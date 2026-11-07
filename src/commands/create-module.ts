import chalk from 'chalk'
import { Command } from 'commander'

import { ModuleKitError } from '../core/errors.js'
import { generateModule } from '../core/generator.js'

interface CreateModuleCommandOptions {
  readonly modal?: boolean
  readonly page?: boolean
}

export function registerCreateModuleCommand(program: Command): void {
  program
    .command('create')
    .helpOption('-h, --help', 'exibe ajuda para o comando')
    .description('Cria um módulo Vue a partir dos modelos incluídos')
    .argument('<modulePath>', 'nome do módulo ou caminho hierárquico')
    .option('--modal', 'cria o formulário em uma janela modal')
    .option('--page', 'cria o formulário em uma página')
    .action(async (modulePath: string, options: CreateModuleCommandOptions) => {
      if (options.modal && options.page) {
        throw new ModuleKitError(
          'As opções --modal e --page não podem ser usadas juntas.',
        )
      }

      const mode = options.page ? 'page' : 'modal'

      try {
        const generated = await generateModule(modulePath, { mode })
        const displayName = modulePath.split('/').at(-1) ?? modulePath
        const moduleLabel = displayName
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .replace(/[-_]+/g, ' ')

        console.log(chalk.bold('\nVue Modules Kit'))
        console.log(`\nCriando módulo: ${chalk.cyan(moduleLabel)}`)
        if (modulePath.includes('/')) {
          console.log(
            `Diretório organizacional: ${chalk.cyan(modulePath.split('/').slice(0, -1).join('/'))}`,
          )
        }
        console.log(`Modo: ${mode === 'modal' ? 'Modal' : 'Página'}\n`)

        for (const file of generated.files) {
          console.log(`${chalk.green('✓')} Gerando ${file}`)
        }

        console.log(chalk.green('\nMódulo criado com sucesso!'))
        console.log(`\nLocal: ${generated.relativeDestination}\n`)
      } catch (error) {
        if (error instanceof ModuleKitError) {
          throw error
        }
        throw new ModuleKitError(
          `Não foi possível criar o módulo: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    })
}
