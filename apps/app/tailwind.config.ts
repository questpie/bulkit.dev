import type { Config } from 'tailwindcss'
import tailwindConfig from '../../packages/ui/tailwind.config'

export default {
  ...tailwindConfig,
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{html,js,jsx,ts,tsx,mdx}'],
  plugins: [...tailwindConfig.plugins],
} satisfies Config
