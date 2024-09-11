import type { BoilerPlateTemplate } from '@bulkit/script/utils/boilerplate-parser'

export const PACKAGE_TEMPLATE: BoilerPlateTemplate = {
  'package.json': `{
  "name": "@bulkit/{{name}}",
  "module": "src/index.ts",
  "files": ["src"],
  "type": "module",
  "devDependencies": {
    "@types/bun": "latest"
  },
  "peerDependencies": {
    "typescript": "^5.0.0"
  }
}
  `,
  '.npmignore': 'src',

  'tsconfig.json': `{
  "extends": "../../tsconfig.base.json",
  "include": ["../**/src/**/*"],
}
  `,
  src: {
    'index.ts': 'export {};',
  },
}
