import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// We only have two actual apps, worker is derived from api
const MAIN_APPS = ['api', 'app'] as const
type App = (typeof MAIN_APPS)[number]

// Separate Docker org and image names
const DOCKER_ORG = 'questpie'
const DOCKER_IMAGES = {
  api: ['bulkitdev-api', 'bulkitdev-worker'],
  app: ['bulkitdev-app'],
} as const

type ReleaseOptions = {
  next?: boolean
}

async function execCommand(command: string) {
  try {
    execSync(command, { stdio: 'inherit' })
  } catch (error) {
    console.error(`Failed to execute command: ${command}`)
    throw error
  }
}

async function createAppTags() {
  for (const app of MAIN_APPS) {
    const packagePath = path.resolve(process.cwd(), 'apps', app, 'package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
    const version = packageJson.version

    // Create tags without Docker org prefix
    for (const imageName of DOCKER_IMAGES[app]) {
      const tagName = `${imageName}/v${version}`
      try {
        await execCommand(`git tag -a ${tagName} -m "Release ${imageName} ${version}"`)
        console.log(`Created tag ${tagName}`)
      } catch (error) {
        console.error(`Failed to create tag ${tagName}:`, error)
        throw error
      }
    }
  }
}

async function cleanupInternalTags() {
  // Get all tags that were just created
  const tags = execSync('git tag --points-at HEAD').toString().trim().split('\n')

  // Remove any tags that don't match our expected format
  for (const tag of tags) {
    if (!tag.startsWith('bulkitdev-')) {
      try {
        await execCommand(`git tag -d ${tag}`)
        console.log(`Removed internal tag: ${tag}`)
      } catch (error) {
        console.error(`Failed to remove tag ${tag}:`, error)
      }
    }
  }
}

export async function release(opts: ReleaseOptions = {}) {
  try {
    // Create changeset
    await execCommand('bun changeset')

    // Version packages
    if (opts.next) {
      await execCommand('bun changeset version --snapshot next')
    } else {
      await execCommand('bun changeset version')
    }

    // Git operations
    await execCommand('git add .')
    await execCommand(`git commit -m "chore: version packages${opts.next ? ' (next)' : ''}"`)

    // Create tags matching Docker image structure
    await createAppTags()

    // Clean up any internal package tags
    await cleanupInternalTags()

    // Push changes and tags
    await execCommand('git push')
    await execCommand('git push --tags')

    console.log('Release completed successfully!')
  } catch (error) {
    console.error('Release failed:', error)
    process.exit(1)
  }
}
