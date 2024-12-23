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

type ResponsiveDefaultProps<
  TDesktopComponent extends React.ComponentType<any>,
  TMobileComponent extends React.ComponentType<any>,
> = ResponsiveProps<TDesktopComponent, TMobileComponent>
export function applyResponsiveProps<TProps extends ResponsiveProps<any, any>>(
  props: TProps,
  isDesktop: boolean,
  defaultProps?: ResponsiveDefaultProps<any, any>
) {
  const { desktopProps, mobileProps, ...rest } = props
  const {
    desktopProps: defaultDesktopProps,
    mobileProps: defaultMobileProps,
    ...defaultRest
  } = defaultProps ?? {}
  if (isDesktop) {
    return {
      ...defaultRest,
      ...rest,
      ...defaultDesktopProps,
      ...rest,
      className: cn(
        defaultRest.className,
        rest.className,
        defaultDesktopProps?.className,
        desktopProps?.className
      ),
    }
  }

  return {
    ...defaultRest,
    ...rest,
    ...defaultMobileProps,
    ...rest,
    className: cn(
      defaultRest.className,
      rest.className,
      defaultMobileProps?.className,
      mobileProps?.className
    ),
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
  isProvider = false,
  defaultProps?: ResponsiveDefaultProps<TDesktopComponent, TMobileComponent>
) {
  const Component = (
    isProvider
      ? (props: ResponsiveProps<TDesktopComponent, TMobileComponent>) => {
          const isDesktop = useBreakpoint('sm')

          return (
            <ResponsiveContext.Provider value={isDesktop}>
              {isDesktop ? (
                <DesktopComponent {...applyResponsiveProps(props, isDesktop, defaultProps)} />
              ) : (
                <MobileComponent {...applyResponsiveProps(props, isDesktop, defaultProps)} />
              )}
            </ResponsiveContext.Provider>
          )
        }
      : (props: ResponsiveProps<TDesktopComponent, TMobileComponent>) => {
          const isDesktop = useContext(ResponsiveContext)

          return isDesktop ? (
            <DesktopComponent {...applyResponsiveProps(props, isDesktop, defaultProps)} />
          ) : (
            <MobileComponent {...applyResponsiveProps(props, isDesktop, defaultProps)} />
          )
        }
  ) as React.FC<ResponsiveProps<TDesktopComponent, TMobileComponent>>

  Component.displayName = name

  return Component
}
