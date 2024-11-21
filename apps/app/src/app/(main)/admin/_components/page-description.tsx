type PageDescriptionProps = {
  title: string
  description: string
}

export function PageDescription({ title, description }: PageDescriptionProps) {
  return (
    <div className='mb-6'>
      <h1 className='text-2xl font-bold'>{title}</h1>
      <p className='text-sm text-muted-foreground mt-1'>{description}</p>
    </div>
  )
}
