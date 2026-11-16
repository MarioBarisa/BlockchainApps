import { readFileSync } from 'node:fs'
import { transpileModule, ScriptTarget, ModuleKind } from 'typescript'

// Izvorni TypeScript ucitavamo bez dodatnog testnog frameworka.
export function moduleUrl(file, aliases = {}) {
  let source = readFileSync(new URL(file, import.meta.url), 'utf8')
  source = source.replace(/from '([^']+)'/g, (_, name) => `from '${aliases[name] ?? import.meta.resolve(name)}'`)
  const js = transpileModule(source, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.ESNext } }).outputText
  return `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
}

