import { createApp, watch } from 'vue'
import App from './web/App.vue'
import * as I18n from './web/i18n'
import * as Data from './assets/data'
import { initConfig, AppConfig } from './web/Config'
import { Host } from './web/background/IPC'
import { perfMark, perfTimeAsync } from './web/woke/shared/perf'

;(async function () {
  await perfTimeAsync('Startup: load settings', initConfig())
  // woke: these three don't depend on each other, so load them side by side.
  const [i18nPlugin] = await Promise.all([
    perfTimeAsync('Startup: load translations', I18n.init(AppConfig().language)),
    perfTimeAsync('Startup: load item + stat data', Data.init(AppConfig().language)),
    perfTimeAsync('Startup: connect to app', Host.init())
  ])

  watch(() => AppConfig().language, async () => {
    await Data.loadForLang(AppConfig().language)
    await I18n.loadLang(AppConfig().language)
  })

  createApp(App)
    .use(i18nPlugin)
    .mount('#app')
  perfMark('App mounted')
})()
