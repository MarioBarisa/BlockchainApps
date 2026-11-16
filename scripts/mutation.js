import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const contractPath = new URL('../contracts/ProofNews.sol', import.meta.url)
const cliPath = new URL('../node_modules/hardhat/dist/src/cli.js', import.meta.url)
const original = readFileSync(contractPath, 'utf8')
const guard = 'require(msg.sender == registry, "Samo registar moze izdati token");'
if (original.split(guard).length !== 2) {
  throw new Error('Mutacija zahtijeva tocno jednu izvornu provjeru ovlasti minta')
}

function runTests(label) {
  console.log(`\n${label}`)
  const result = spawnSync(process.execPath, [fileURLToPath(cliPath), 'test'], {
    cwd: new URL('../', import.meta.url),
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0' },
  })
  if (result.error) throw result.error
  const output = result.stdout + result.stderr
  process.stdout.write(output)
  return { status: result.status, output }
}

if (runTests('1. Izvorni ugovor mora proci sve testove').status !== 0) {
  throw new Error('Pocetni testovi ne prolaze; mutacija nije izvedena')
}

let mutationDetected = false
try {
  writeFileSync(contractPath, original.replace(guard, `// ${guard}`))
  const result = runTests('2. Bez require provjere test K6 mora pasti')
  mutationDetected = result.status === 1 && /\d+ failing/.test(result.output) && /K6: samo povezani registar moze izdati token:/.test(result.output)
} finally {
  writeFileSync(contractPath, original)
}

const restored = runTests('3. Vraceni ugovor mora ponovno proci sve testove')
if (restored.status !== 0) throw new Error('Testovi nakon vracanja ugovora ne prolaze')
if (!mutationDetected) throw new Error('Nije dokazan ocekivani pad testa K6')
console.log('\nMutacijska provjera uspjela: K6 otkriva uklonjenu zastitu; izvorni ugovor je vracen.')
