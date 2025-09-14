import { defineConfig } from '@lingui/cli'
import { formatter } from '@lingui/format-json'

export default defineConfig({
    locales: ['ru', 'en'],
    sourceLocale: 'ru',
    format: formatter({ style: 'minimal' }),
    catalogs: [{ path: 'src/locales/{locale}/messages', include: ['src'] }],
    fallbackLocales: {
        ru: 'en',
        default: 'ru'
    }
})
