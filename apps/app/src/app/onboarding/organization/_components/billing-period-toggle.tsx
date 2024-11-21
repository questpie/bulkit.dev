import { ToggleGroup, ToggleGroupItem } from '@bulkit/ui/components/ui/toggle-group'

type BillingPeriodToggleProps = {
  value: 'monthly' | 'annual'
  onChange: (value: 'monthly' | 'annual') => void
}

export function BillingPeriodToggle(props: BillingPeriodToggleProps) {
  return (
    <div className='flex flex-col items-center gap-2'>
      <h3 className='text-lg font-medium'>Billing Period</h3>
      <ToggleGroup
        defaultValue='monthly'
        type='single'
        value={props.value}
        onValueChange={(value) => {
          if (value) {
            props.onChange(value as 'monthly' | 'annual')
          }
        }}
        className='inline-flex items-center  h-10 rounded-lg border-none bg-muted p-0'
      >
        <ToggleGroupItem
          value='monthly'
          size='sm'
          variant='outline'
          className='data-[state=on]:bg-primary w-24 rounded-e-none text-center h-full'
        >
          Monthly
        </ToggleGroupItem>
        <ToggleGroupItem
          value='annual'
          size='sm'
          variant='outline'
          className='rounded-s-none data-[state=on]:bg-primary w-24 text-center h-full '
        >
          Annual
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
