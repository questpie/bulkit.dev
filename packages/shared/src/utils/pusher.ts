type ExtractParams<T extends string> = T extends `${string}{{${infer Param}}}${infer Rest}`
  ? Param | ExtractParams<Rest>
  : never

type Params<T extends string> = { [K in ExtractParams<T>]: string }

/**
 * Generates a channel name by replacing placeholders in the template with provided parameters.
 * @param {T} template - A string template with placeholders in the format {{paramName}}.
 * @param {Params<T>} params - An object containing values for the placeholders.
 * @returns {string} The generated channel name with placeholders replaced by actual values.
 */
export function getChannelName<T extends string>(template: T, params: Params<T>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key as keyof Params<T>])
}

/**
 * Parses a channel name to extract parameters based on the provided template.
 * @param {T} template - A string template with placeholders in the format {{paramName}}.
 * @param {string} channelName - The actual channel name to parse.
 * @returns {Params<T> | null} An object with extracted parameters, or null if the channel name doesn't match the template.
 */
export function parseChannelName<T extends string>(
  template: T,
  channelName: string
): Params<T> | null {
  const regex = new RegExp(`^${template.replace(/\{\{(\w+)\}\}/g, '(?<$1>[^-]+)')}$`)
  const match = channelName.match(regex)
  return match ? (match.groups as Params<T>) : null
}
/**
 * Checks if a given channel name matches the provided template.
 * @param {string} template - A string template with placeholders in the format {{paramName}}.
 * @param {string} channelName - The actual channel name to check against the template.
 * @returns {boolean} True if the channel name matches the template, false otherwise.
 */
export function doesMatchChannel(template: string, channelName: string): boolean {
  const regex = new RegExp(`^${template.replace(/\{\{(\w+)\}\}/g, '(?<$1>[^-]+)')}$`)
  return channelName.match(regex) !== null
}
