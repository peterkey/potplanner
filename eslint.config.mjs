import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override react version to a fixed string to avoid eslint-plugin-react
  // calling context.getFilename() which was removed in ESLint 9 flat config.
  {
    settings: {
      react: {
        version: '19.2.3',
      },
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
