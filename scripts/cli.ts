import { boolean, command, positional, run } from '@drizzle-team/brocli'
import { createPackage } from '@bulkit/script/commands/create-package'
import { release } from '@bulkit/script/commands/release'

const createPackageCommand = command({
  name: 'create:package',
  desc: 'Create a new package',
  options: {
    name: positional().desc('The name of the package to create').required(),
  },
  handler: async (opts) => {
    return await createPackage({
      name: opts.name,
      type: 'package',
    })
  },
})

const releaseCommand = command({
  name: 'release',
  desc: 'Release a new version of the packages',
  options: {
    next: boolean().desc('Release a next version').default(false),
  },
  handler: async (opts) => {
    return await release({ next: opts.next })
  },
})

run([createPackageCommand, releaseCommand]) // parse shell arguments and run command
