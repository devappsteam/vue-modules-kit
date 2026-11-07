import { cp, mkdir, chmod } from 'node:fs/promises'

await mkdir('dist/templates', { recursive: true })
await cp('src/templates', 'dist/templates', { recursive: true })
await chmod('dist/cli.js', 0o755)
