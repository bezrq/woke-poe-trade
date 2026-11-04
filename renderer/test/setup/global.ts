// Builds public/data/*/*.index.bin (normally done by the vite plugin at
// dev/build start), so the item/stat lookups work under vitest.
import { makeIndexFiles } from '../../src/assets/make-index-files.mjs'

export default function setup () {
  makeIndexFiles()
}
