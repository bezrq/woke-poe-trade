// Problems shown on the toolkit health icon, which appears only while
// something is wrong. Modules report a line under their own key and clear it
// (null) when it's fixed.
import { shallowReactive } from 'vue'

export const healthProblems = shallowReactive(new Map<string, string>())

export function reportProblem (key: string, text: string | null) {
  if (text) {
    if (healthProblems.get(key) !== text) healthProblems.set(key, text)
  } else if (healthProblems.has(key)) {
    healthProblems.delete(key)
  }
}
