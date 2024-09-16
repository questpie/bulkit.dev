import { useBreakpoint } from '@bulkit/ui/hooks/use-breakpoint'
import { cn } from '@bulkit/ui/lib'
import { createContext, useContext, type ComponentProps, type PropsWithChildren } from 'react'

export type ResponsiveProps<
  TDesktopComponent extends React.ComponentType<any>,
  TMobileComponent extends React.ComponentType<any>,
  TCommonProps = ComponentProps<TDesktopComponent> & ComponentProps<TMobileComponent>,
> = Omit<TCommonProps, 'desktopProps' | 'mobileProps'> & {
  desktopProps?: ComponentProps<TDesktopComponent>
  mobileProps?: ComponentProps<TMobileComponent>
}

const ResponsiveContext = createContext<boolean>(false)

export function applyResponsiveProps<TProps extends ResponsiveProps<any, any>>(
  props: TProps,
  isDesktop: boolean
) {
  if (isDesktop) {
    return {
      ...props,
      ...(props.desktopProps ?? {}),
      className: cn(props.className, (props.desktopProps as any)?.className),
    }
  }

  return {
    ...props,
    ...props.mobileProps,
    className: cn(props.className, (props.mobileProps as any)?.className),
  }
}

function FallbackComponent(props: PropsWithChildren) {
  return <>{props.children}</>
}

export function createResponsiveComponent<
  TDesktopComponent extends React.ComponentType<any>,
  TMobileComponent extends React.ComponentType<any>,
>(
  name: string,
  DesktopComponent: TDesktopComponent = FallbackComponent as any,
  MobileComponent: TMobileComponent = FallbackComponent as any,
  isProvider = false
) {
  const Component = (
    isProvider
      ? (props: ResponsiveProps<TDesktopComponent, TMobileComponent>) => {
          const isDesktop = useBreakpoint('sm')

          return (
            <ResponsiveContext.Provider value={isDesktop}>
              {isDesktop ? (
                <DesktopComponent {...applyResponsiveProps(props, isDesktop)} />
              ) : (
                <MobileComponent {...applyResponsiveProps(props, isDesktop)} />
              )}
            </ResponsiveContext.Provider>
          )
        }
      : (props: ResponsiveProps<TDesktopComponent, TMobileComponent>) => {
          const isDesktop = useContext(ResponsiveContext)

          return isDesktop ? (
            <DesktopComponent {...applyResponsiveProps(props, isDesktop)} />
          ) : (
            <MobileComponent {...applyResponsiveProps(props, isDesktop)} />
          )
        }
  ) as React.FC<ResponsiveProps<TDesktopComponent, TMobileComponent>>

  Component.displayName = name

  return Component
}
