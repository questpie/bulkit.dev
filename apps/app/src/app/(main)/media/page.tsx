import { apiServer } from '@bulkit/app/api/api.server'
import { MediaEmptyState } from './_components/media-empty-state'
import { MediaPageHeader } from './_components/media-header'
import { MediaTable } from './_components/media-table'

export default async function MediaPage() {
  const initialResources = await apiServer.resources.index.get({
    query: {
      limit: 25,
      cursor: 0,
    },
  })

  if (!initialResources.data?.data.length) {
    return <MediaEmptyState />
  }

  return (
    <div className='flex flex-col'>
      <MediaPageHeader />
      <MediaTable initialResources={initialResources.data} />
    </div>
  )
}
