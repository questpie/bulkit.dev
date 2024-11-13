import { AI_TEXT_PROVIDER_TYPES } from '@bulkit/shared/modules/app/app-constants'
import { Button } from '@bulkit/ui/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bulkit/ui/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@bulkit/ui/components/ui/form'
import { Input } from '@bulkit/ui/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@bulkit/ui/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  name: z.enum(AI_TEXT_PROVIDER_TYPES),
  model: z.string().min(1),
  apiKey: z.string().min(1),
})

type FormValues = z.infer<typeof formSchema>

type AIProviderFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: FormValues) => Promise<void>
  defaultValues?: Partial<FormValues>
  mode?: 'add' | 'edit'
}

export function AIProviderForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = 'add',
}: AIProviderFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: 'anthropic',
      model: '',
      apiKey: '',
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit' : 'Add'} AI Provider</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={mode === 'edit'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a provider' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AI_TEXT_PROVIDER_TYPES.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='model'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter model name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='apiKey'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input
                      type='password'
                      placeholder={mode === 'edit' ? 'Enter new API key' : 'Enter API key'}
                      {...field}
                    />
                  </FormControl>
                  {mode === 'edit' && (
                    <p className='text-xs text-muted-foreground'>
                      Leave empty to keep the current API key
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full'>
              {mode === 'edit' ? 'Update' : 'Save'} Provider
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
