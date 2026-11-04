import { AppConfig } from '@/web/Config'
import { parseChatLine } from './parse-chat'

export function handleLine (line: string) {
  parseChatLine(line, AppConfig().language)
}
