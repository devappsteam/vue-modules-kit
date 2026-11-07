export class ModuleKitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ErroVueModulesKit'
  }
}
