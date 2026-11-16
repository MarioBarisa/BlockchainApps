import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('../node_modules/hardhat/dist/src/cli.js', import.meta.url))
const child = spawn(process.execPath, [cli, 'node', '--hostname', '127.0.0.1'], {
  stdio: ['inherit', 'pipe', 'pipe'],
})

// Hardhatov pocetni ispis filtriramo prije prikaza, bez zapisivanja u datoteku.
for (const stream of [child.stdout, child.stderr]) {
  createInterface({ input: stream }).on('line', (line) => {
    if (!line.includes('Private Key:')) console.log(line)
  })
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}
child.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
child.on('close', (code) => { process.exitCode = code ?? 0 })
