type HeaderProps = {
  title: string
}

export function Header(props: HeaderProps) {
  return (
    <header className='flex w-full justify-between items-center h-20 px-4 bg-background border-b border-border absolute top-0 left-0 right-0 z-20'>
      <h1 className='text-xl font-bold'>{props.title}</h1>
    </header>
  )
}
