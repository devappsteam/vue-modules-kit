#!/usr/bin/env node
import chalk from 'chalk'
import { Command } from 'commander'

import { registerCreateModuleCommand } from './commands/create-module.js'

const program = new Command()

program
  .name('vue-modules-kit')
  .description('Gera módulos padronizados para Vue 3')
  .helpOption('-h, --help', 'exibe ajuda para o comando')
  .helpCommand('help [command]', 'exibe ajuda para o comando')
  .showHelpAfterError('(use --help para ver as opções disponíveis)')
  .configureHelp({
    styleTitle(title) {
      const translations: Record<string, string> = {
        'Usage:': 'Uso:',
        'Arguments:': 'Argumentos:',
        'Options:': 'Opções:',
        'Commands:': 'Comandos:',
      }

      return translations[title] ?? title
    },
  })
  .configureOutput({
    outputError(message, write) {
      const translations: Array<[RegExp, string]> = [
        [/^error:/i, 'Erro:'],
        [/unknown option/i, 'opção desconhecida'],
        [/unknown command/i, 'comando desconhecido'],
        [/missing required argument/i, 'argumento obrigatório ausente'],
        [/too many arguments/i, 'argumentos em excesso'],
      ]

      const translatedMessage = translations.reduce(
        (output, [pattern, translation]) =>
          output.replace(pattern, translation),
        message,
      )

      write(translatedMessage)
    },
  })

registerCreateModuleCommand(program)

try {
  await program.parseAsync(process.argv)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(chalk.red(`Erro: ${message}`))
  process.exitCode = 1
}
