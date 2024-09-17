import type { Config } from 'tailwindcss'
import tailwindConfig from '../../packages/ui/tailwind.config'

export default {
  ...tailwindConfig,
  content: [
    ...tailwindConfig.content,
    './**/*.{html,js,jsx,ts,tsx,mdx}',
    '../../packages/ui/src/**/*.{html,js,jsx,ts,tsx,mdx}',
    '../../packages/app/src/**/*.{html,js,jsx,ts,tsx,mdx}',
  ],
  plugins: [...tailwindConfig.plugins],
} satisfies Config
