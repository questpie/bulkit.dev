import type { TransactionLike } from '@bulkit/api/db/db.client'
import {
  channelsTable,
  organizationsTable,
  plansTable,
  postMetricsHistoryTable,
  postsTable,
  reelPostsTable,
  regularPostsTable,
  resourcesTable,
  scheduledPostsTable,
  socialMediaIntegrationsTable,
  subscriptionsTable,
  userOrganizationsTable,
  usersTable,
  type InsertChannel,
  type InsertSocialMediaIntegration,
} from '@bulkit/api/db/db.schema'
import { createSeeder } from '@bulkit/seed/index'
import type { PostType } from '@bulkit/shared/constants/db.constants'
import { getIsoDateString } from '@bulkit/shared/utils/date'
import { appLogger } from '@bulkit/shared/utils/logger'
import { addDays } from 'date-fns'

export const demo01Seeder = createSeeder({
  name: 'demo-01',
  options: {
    once: false,
  },
  async seed(db: TransactionLike) {
    // Create demo user
    const userId = 'usr_demo123'
    await db.insert(usersTable).values({
      id: userId,
      email: 'demo@example.com',
      name: 'Alex Thompson',
    })

    // Create demo organization
    const orgId = 'org_demo123'
    await db.insert(organizationsTable).values({
      id: orgId,
      name: 'Growth Metrics Pro',
    })

    // Link user to organization
    await db.insert(userOrganizationsTable).values({
      id: 'usrorg_demo123',
      userId: userId,
      organizationId: orgId,
      role: 'owner',
    })

    const demoPlan = await db
      .insert(plansTable)
      .values({
        id: 'demo-plan',
        displayName: 'Demo Plan',
        maxChannels: 10,
        maxPosts: 100,
        maxPostsPerMonth: 1000,
        monthlyAICredits: 1000,
        order: 0,
        allowedPlatforms: null,
        features: [],
        highlightFeatures: [],
      })
      .onConflictDoNothing({
        target: plansTable.id,
      })

    const subscription = await db.insert(subscriptionsTable).values({
      id: 'sub_demo123',
      organizationId: orgId,
      planId: 'demo-plan',
      status: 'active',
    })

    // Create social media integrations
    const integrations: InsertSocialMediaIntegration[] = [
      {
        id: 'int_fb123',
        platform: 'facebook',
        platformAccountId: 'fb_mock_123',
        accessToken: 'mock_fb_token',
        organizationId: orgId,
      },
      {
        id: 'int_x123',
        platform: 'x',
        platformAccountId: 'x_mock_123',
        accessToken: 'mock_x_token',
        organizationId: orgId,
      },
      {
        id: 'int_yt123',
        platform: 'youtube',
        platformAccountId: 'yt_mock_123',
        accessToken: 'mock_yt_token',
        organizationId: orgId,
      },
      {
        id: 'int_ig123',
        platform: 'instagram',
        platformAccountId: 'ig_mock_123',
        accessToken: 'mock_ig_token',
        organizationId: orgId,
      },
    ]

    await db.insert(socialMediaIntegrationsTable).values(integrations)

    // Create channels
    const channels: InsertChannel[] = [
      {
        id: 'ch_fb123',
        name: 'Growth Metrics Pro',
        platform: 'facebook',
        handle: 'growthmetricspro',
        imageUrl: 'https://i.pravatar.cc/150?u=growthmetrics',
        organizationId: orgId,
        socialMediaIntegrationId: 'int_fb123',
      },
      {
        id: 'ch_x123',
        name: 'Growth Metrics',
        platform: 'x',
        handle: 'growthmetrics',
        imageUrl: 'https://i.pravatar.cc/150?u=growthmetricspro1',
        organizationId: orgId,
        socialMediaIntegrationId: 'int_x123',
      },
      {
        id: 'ch_yt123',
        name: 'Growth Metrics Pro TV',
        platform: 'youtube',
        handle: 'growthmetricspro',
        imageUrl: 'https://i.pravatar.cc/150?u=growthmetrics',
        organizationId: orgId,
        socialMediaIntegrationId: 'int_yt123',
      },
      {
        id: 'ch_ig123',
        name: 'Growth Metrics',
        platform: 'instagram',
        handle: 'growthmetrics',
        imageUrl: 'https://i.pravatar.cc/150?u=growthmetrics2',
        organizationId: orgId,
        socialMediaIntegrationId: 'int_ig123',
      },
    ]

    await db.insert(channelsTable).values(channels)

    // Create 20 posts of different types
    const postTypes: PostType[] = ['post', 'reel', 'thread', 'story']
    const postTopics = [
      'Top 10 Marketing Trends for 2024',
      'How AI is Transforming Digital Marketing',
      'Social Media Strategy Guide',
      'Content Marketing Best Practices',
      'SEO Tips for Developers',
      'Maximizing ROI with Social Media',
      'Email Marketing Strategies',
      'Influencer Marketing Guide',
      'Video Content Best Practices',
      'Data-Driven Marketing Decisions',
      'Brand Building on Social Media',
      'Customer Engagement Tactics',
      'Growth Hacking Tips',
      'Digital Marketing Analytics',
      'Content Creation Workshop',
      'Social Media ROI Optimization',
      'B2B Marketing Strategies',
      'Lead Generation Techniques',
      'Mobile Marketing Trends',
      'Marketing Automation Tips',
    ]

    for (let i = 0; i < 50; i++) {
      const postId = `post_${i}`
      const postType = postTypes[i % postTypes.length]!

      const isPublished = Math.random() > 0.5
      const publishedAt = addDays(new Date(), -Math.floor(Math.random() * 30))
      publishedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
      const scheduledAt = addDays(new Date(), Math.floor(Math.random() * 14))
      scheduledAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

      await db.insert(postsTable).values({
        id: postId,
        name: postTopics[i % postTopics.length]!,
        status: isPublished ? 'published' : 'scheduled',
        scheduledAt: isPublished ? publishedAt.toISOString() : scheduledAt.toISOString(),
        organizationId: orgId,
        type: postType,
      })

      // Create type-specific post content
      if (postType === 'post') {
        await db.insert(regularPostsTable).values({
          id: `regpost_${i}`,
          postId: postId,
          text: `Exciting insights about ${postTopics[i % postTopics.length]}! #marketing #growth`,
        })
      } else if (postType === 'reel') {
        const resourceUrl = `https://example.com/fake-video-${i}.mp4`
        await db.insert(resourcesTable).values({
          id: `res_${i}`,
          location: resourceUrl,
          type: 'video',
          isExternal: true,
          organizationId: orgId,
        })

        await db.insert(reelPostsTable).values({
          id: `reel_${i}`,
          postId: postId,
          description: `Quick tips about ${postTopics[i % postTopics.length]}`,
          resourceId: `res_${i}`, // Would need to create resources too
        })
      }
      // Randomly select channels for this post
      const shuffledChannels = [...channels].sort(() => Math.random() - 0.5)
      const selectedChannels = shuffledChannels.slice(
        0,
        Math.floor(Math.random() * channels.length + 1)
      )

      // Create scheduled posts for each selected channel
      for (const channel of selectedChannels) {
        const scheduledPost = await db
          .insert(scheduledPostsTable)
          .values({
            id: `schpost_${i}_${channel.id}`,
            postId: postId,
            channelId: channel.id!,
            publishedAt: isPublished ? publishedAt.toISOString() : null,
            status: isPublished ? 'published' : 'scheduled',
          })
          .returning()
          .then((r) => r[0]!)

        // If published, generate daily metrics from publish date until now
        if (isPublished) {
          const days = Math.floor(
            (new Date().getTime() - publishedAt.getTime()) / (1000 * 3600 * 24)
          )
          const metrics = {
            impressions: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            clicks: 0,
            reach: 0,
          }

          for (let day = 0; day <= days; day++) {
            const date = addDays(publishedAt, day)
            metrics.impressions = Math.floor(Math.random() * 1000)
            metrics.likes = Math.floor(Math.random() * 100)
            metrics.comments = Math.floor(Math.random() * 20)
            metrics.shares = Math.floor(Math.random() * 10)
            metrics.clicks = Math.floor(Math.random() * 10)
            metrics.reach = Math.floor(Math.random() * 2000)

            await db.insert(postMetricsHistoryTable).values({
              id: `metrics_${scheduledPost.id}_${getIsoDateString(date)}`,
              scheduledPostId: scheduledPost.id,
              createdAt: date.toISOString(),
              ...metrics,
            })
          }
        }
      }
    }

    appLogger.info('Demo data seeded successfully')
  },
})
