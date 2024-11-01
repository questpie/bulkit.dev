import { injectDatabase } from '@bulkit/api/db/db.client'
import { postMetricsHistoryTable, scheduledPostsTable } from '@bulkit/api/db/db.schema'
import { ioc, iocResolve } from '@bulkit/api/ioc'
import { jobFactory } from '@bulkit/api/jobs/job-factory'
import { UnrecoverableError } from '@bulkit/jobs/job-factory'
import { Type } from '@sinclair/typebox'
import { PlaywrightCrawler } from 'crawlee'
import { eq } from 'drizzle-orm'
import { chromium } from 'playwright-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

// Add stealth plugin to Playwright
chromium.use(StealthPlugin())

export const tweetActivityScraperJob = jobFactory.createJob({
  name: 'tweet-activity-scraper',
  schema: Type.Object({
    scheduledPostId: Type.String(),
  }),

  handler: async (job) => {
    const container = iocResolve(ioc.use(injectDatabase))

    const scheduledPost = await container.db.query.scheduledPostsTable.findFirst({
      where: eq(scheduledPostsTable.id, job.data.scheduledPostId),
    })

    if (!scheduledPost) {
      throw new UnrecoverableError(
        `Scheduled post with id ${job.data.scheduledPostId} does not exist`
      )
    }

    const tweetUrl = scheduledPost.externalUrl

    if (!tweetUrl) {
      throw new UnrecoverableError(
        `Scheduled post with id ${job.data.scheduledPostId} does not have an external url assigned to it`
      )
    }

    let tweetData: any

    const proxyListUrl = process.env.PROXY_LIST_URL
    let proxyConfiguration: any

    if (proxyListUrl) {
      proxyConfiguration = {
        proxyUrls: [proxyListUrl],
      }
    }

    const crawler = new PlaywrightCrawler({
      launchContext: {
        launcher: chromium,
      },
      proxyConfiguration,
      async requestHandler({ page }) {
        await page.goto(tweetUrl)

        // Wait for the tweet content to load
        await page.waitForSelector('div[aria-label]', { timeout: 10000 })

        // Extract tweet stats
        tweetData = await page.evaluate(() => {
          const statsContainer = document.querySelector('div[aria-label]')
          if (!statsContainer) return null

          const statsText = statsContainer.getAttribute('aria-label') || ''
          const stats = statsText
            .split(',')
            .map((s) => Number.parseInt(s.match(/\d+/)?.[0] || '0', 10))

          return {
            replies: stats[0] || 0,
            retweets: stats[1] || 0,
            likes: stats[2] || 0,
            views: stats[4] || 0, // Assuming views is the 5th number
          }
        })

        if (!tweetData) {
          throw new Error(`Failed to extract tweet data from ${tweetUrl}`)
        }
      },
    })

    await crawler.run([tweetUrl])

    if (!tweetData) {
      throw new Error(`Failed to scrape tweet data for ${tweetUrl}`)
    }

    // Store the scraped data in the database
    await container.db.insert(postMetricsHistoryTable).values({
      scheduledPostId: job.data.scheduledPostId,
      likes: tweetData.likes,
      shares: tweetData.retweets,
      comments: tweetData.replies,
      impressions: tweetData.views,
      reach: 0, // Twitter doesn't provide this data publicly
      clicks: 0, // Twitter doesn't provide this data publicly
    })

    return tweetData
  },
})
