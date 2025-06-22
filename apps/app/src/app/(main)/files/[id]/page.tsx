import { apiServer } from '@bulkit/app/api/api.server'
import { FilesPageClient } from '../files-page-client'
import { notFound } from 'next/navigation'

export default async function FolderPage(props: {
  params: Promise<{ id: string }>
}) {
  const params = await props.params

  // Fetch folder contents and breadcrumbs on the server
  const [contentsResult, breadcrumbsResult] = await Promise.allSettled([
    apiServer.folders({ id: params.id }).contents.get({
      query: { includeSubfolders: true, includeItems: true },
    }),
    apiServer.folders({ id: params.id }).breadcrumbs.get(),
  ])

  // Check if folder exists
  if (contentsResult.status === 'rejected' || contentsResult.value.error) {
    notFound()
  }

  const breadcrumbs = breadcrumbsResult.status === 'fulfilled' ? breadcrumbsResult.value.data : []

  return (
    <FilesPageClient
      initialContents={contentsResult.value.data || null}
      currentFolderId={params.id}
      initialBreadcrumbs={breadcrumbs}
    />
  )
}
