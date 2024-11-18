import { apiServer } from '@bulkit/app/api/api.server'
import { PageDescription } from '@bulkit/app/app/(main)/admin/_components/page-description'
import { Button } from '@bulkit/ui/components/ui/button'
import { PiImages } from 'react-icons/pi'
import { StockProviderForm, StockProviderFormTrigger } from './_components/stock-provider-form'
import { StockProvidersTable } from './components/stock-providers-table'

export default async function StockImagesPage() {
  const initialProviders = await apiServer.admin['stock-image-providers'].index.get()

  if (!initialProviders.data?.length) {
    return (
      <div className='p-6'>
        <PageDescription
          title='Stock Image Providers'
          description='Manage stock image providers to enable users to search and use high-quality images in their content.'
        />
        <div className='flex flex-col items-center justify-center h-[400px] text-center'>
          <PiImages className='w-16 h-16 text-muted-foreground/40' />
          <h3 className='mt-4 text-lg font-medium'>No stock image providers configured</h3>
          <p className='mt-2 text-sm text-muted-foreground max-w-sm'>
            Stock image providers allow users to search and use high-quality images in their posts.
            Add a provider to enable this feature.
          </p>
          <StockProviderForm mode='add'>
            <StockProviderFormTrigger asChild>
              <Button className='mt-6'>Add your first stock provider</Button>
            </StockProviderFormTrigger>
          </StockProviderForm>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <PageDescription
        title='Stock Image Providers'
        description='Manage stock image providers to enable users to search and use high-quality images in their content.'
      />
      <div className='flex justify-end mb-4'>
        <StockProviderForm mode='add'>
          <StockProviderFormTrigger asChild>
            <Button>Add Provider</Button>
          </StockProviderFormTrigger>
        </StockProviderForm>
      </div>
      <StockProvidersTable initialProviders={initialProviders.data} />
    </div>
  )
}
