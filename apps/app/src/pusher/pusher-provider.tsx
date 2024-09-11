import { createPusherInstance, type PusherOverrides } from '@questpie/app/pusher/pusher.client'
import type PusherJs from 'pusher-js'
import type { Channel } from 'pusher-js'
import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Context for Pusher instance and connection status
 */
const PusherContext = createContext<{ pusher: PusherJs | null; isConnected: boolean } | null>(null)

/**
 * Provider component for Pusher
 * @param props - Component props
 * @param props.overrides - Pusher configuration overrides
 * @param props.children - Child components
 */
export function PusherProvider(props: { overrides: PusherOverrides; children?: React.ReactNode }) {
  const [pusher, setPusher] = useState<PusherJs | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const pusherInstance = createPusherInstance(props.overrides)
    setPusher(pusherInstance)

    const handleConnectionStateChange = (state: string) => {
      setIsConnected(state === 'connected')
    }

    pusherInstance.connection.bind('state_change', handleConnectionStateChange)

    return () => {
      pusherInstance.connection.unbind('state_change', handleConnectionStateChange)
      pusherInstance.disconnect()
    }
  }, [props.overrides]) // Include props.overrides in the dependency array

  return (
    <PusherContext.Provider value={{ pusher, isConnected }}>
      {props.children}
    </PusherContext.Provider>
  )
}

/**
 * Hook to access the Pusher instance and connection status
 * @returns Object containing Pusher instance and connection status
 * @throws Error if used outside of PusherProvider
 */
export function usePusher() {
  const context = useContext(PusherContext)
  if (!context) {
    throw new Error('usePusher must be used within a PusherProvider')
  }
  return context
}

/**
 * Props for the useSubscription hook
 * @template TMessageData - The type of data received in the message
 */
type UseSubscriptionProps<TMessageData = unknown> = {
  /** The name of the Pusher channel to subscribe to */
  channelName: string
  /** The name of the event to listen for on the channel */
  eventName: string
  /** Callback function to handle received messages */
  onMessage: (data: TMessageData) => void
  /** Whether the subscription is enabled */
  enabled?: boolean
}

/**
 * Hook for subscribing to a Pusher channel and event
 * @template TMessageData - The type of data received in the message
 * @param {UseSubscriptionProps<TMessageData>} props - The subscription configuration
 * @returns {{ error: Error | null }} An object containing any subscription error
 */
export function useSubscription<TMessageData = unknown>({
  channelName,
  eventName,
  onMessage,
  enabled = true, // Add enabled prop with default value true
}: UseSubscriptionProps<TMessageData>): { error: Error | null } {
  const { pusher } = usePusher()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!pusher || !enabled) return // Only subscribe if enabled is true

    try {
      const pusherChannel = pusher.subscribe(channelName)
      setChannel(pusherChannel)
      setError(null)

      return () => {
        pusher.unsubscribe(channelName)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to subscribe to channel'))
    }
  }, [pusher, channelName, enabled]) // Add enabled to dependency array

  useEffect(() => {
    if (channel && enabled) {
      // Only bind if enabled is true
      const eventHandler = (data: TMessageData) => {
        onMessage(data)
      }

      channel.bind(eventName, eventHandler)

      return () => {
        channel.unbind(eventName, eventHandler)
      }
    }
  }, [channel, eventName, onMessage, enabled]) // Add enabled to dependency array

  return { error }
}
