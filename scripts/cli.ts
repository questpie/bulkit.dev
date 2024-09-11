import { command, positional, run } from '@drizzle-team/brocli'
import { createPackage } from '@questpie/script/commands/create-package'

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

run([createPackageCommand]) // parse shell arguments and run command
