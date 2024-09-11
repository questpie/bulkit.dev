export type ParsedCommand = {
  name: string;
  args: Record<string, string[]>;
  baseArg?: string;
};

export function getParsedCommand(argsInput: string[]) {
  const result: ParsedCommand = {
    name: argsInput[0],
    args: {},
    baseArg: undefined,
  };

  let currArgName: string | undefined;
  for (let i = 1; i < argsInput.length; i++) {
    const currArg = argsInput[i];

    if (currArg.startsWith("--")) {
      if (currArgName) {
        throw new Error(`No value for ${currArgName} provided`);
      }

      // TODO: add regex
      const argName = currArg.replace("--", "");
      currArgName = argName;
      continue;
    }

    if (currArg.startsWith("-")) {
      if (currArgName) {
        throw new Error(`No value for ${currArgName} provided`);
      }

      // TODO: add regex
      const argName = currArg.replace("-", "");
      currArgName = argName;
      continue;
    }

    if (currArgName) {
      if (!result.args[currArgName]) {
        result.args[currArgName] = [];
      }
      result.args[currArgName].push(currArg);
    }

    if (!currArgName && result.baseArg) {
      throw new Error("You've already provided base argument");
    }

    result.baseArg = currArg;
  }

  return result;
}
