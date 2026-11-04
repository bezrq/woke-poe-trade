// Rebuilds the fake app from main's current sources before the run (about a
// second). The renderer build is not redone here: run `npx vite build` in
// renderer/ after changing renderer code.
import { execFileSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

export default function globalSetup () {
  const here = path.dirname(fileURLToPath(import.meta.url))
  execFileSync(process.execPath, [path.join(here, '../fake-host/build.mjs')], { stdio: 'inherit' })
}
