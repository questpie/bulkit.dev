import type PusherServer from 'pusher'
import type PusherClient from 'pusher-js'

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

export function createChannel<
  T extends string,
  P extends Record<string, any> = Record<string, any>,
>(template: T) {
  return {
    /**
     * Checks if a given channel name matches the template.
     * @param {string} channelName - The actual channel name to check against the template.
     * @returns {boolean} True if the channel name matches the template, false otherwise.
     */
    match: (channelName: string): boolean => {
      return doesMatchChannel(template, channelName)
    },

    /**
     * Parses a channel name to extract parameters based on the template.
     * @param {string} channelName - The actual channel name to parse.
     * @returns {Params<T> | null} An object with extracted parameters, or null if the channel name doesn't match the template.
     */
    parse: (channelName: string): Params<T> | null => {
      return parseChannelName(template, channelName)
    },

    /**
     * Generates a channel name by replacing placeholders in the template with provided parameters.
     * @param {Params<T>} params - An object containing values for the placeholders.
     * @returns {string} The generated channel name with placeholders replaced by actual values.
     */
    format: (params: Params<T>): string => {
      return getChannelName(template, params)
    },

    /**
     * Triggers an event on the channel with type-safe payload.
     * @param {Pusher} pusher - The Pusher instance.
     * @param {Params<T>} params - An object containing values for the placeholders.
     * @param {K} eventName - The name of the event to trigger.
     * @param {P[K]} data - The payload data for the event.
     */
    trigger: async <K extends keyof P>(
      pusher: PusherClient | PusherServer,
      params: Params<T>,
      eventName: K,
      data: P[K]
    ): Promise<boolean> => {
      const channelName = getChannelName(template, params)

      if ('trigger' in pusher) {
        const sent = await pusher.trigger(channelName, eventName as string, data)
        return sent.ok
      }

      const sent = pusher.channel(channelName).trigger(eventName as string, data)
      return sent
    },

    /**
     * Returns a listener function for a specific event on the channel.
     * @param {PusherClient} pusher - The Pusher client instance.
     * @param {Params<T>} params - An object containing values for the placeholders.
     * @param {K} eventName - The name of the event to listen for.
     * @returns {(callback: (data: P[K]) => void) => void} A function that takes a callback to handle the event data.
     */
    createSubscription: <K extends keyof P>(opts: {
      params: Params<T>
      eventName: K
      onMessage: (data: P[K]) => void
      enabled?: boolean
    }) => {
      return {
        channelName: getChannelName(template, opts.params),
        eventName: opts.eventName,
        onMessage: opts.onMessage,
        enabled: opts.enabled,
      }
    },

    $events: <E extends Record<string, any>>() => {
      return createChannel<T, E>(template)
    },
  }
}
