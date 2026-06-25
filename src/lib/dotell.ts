import { initDotell, type DbClient } from '@joefuentes/dotell'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

console.log('[dotell] building db adapter — prisma client check', {
  pid: process.pid,
  prismaDefined: prisma !== undefined,
  hasAnalyticsEventModel: typeof prisma.analyticsEvent?.create === 'function',
  prismaConstructor: prisma?.constructor?.name,
})

const dotellDb: DbClient = {
  events: {
    create({ data }) {
      return prisma.analyticsEvent.create({
        data: {
          event: data.event,
          userId: data.user_id,
          properties:
            data.properties === null
              ? Prisma.JsonNull
              : (data.properties as Prisma.InputJsonValue),
          context: data.context,
          identityModel: data.identity_model,
        },
      })
    },
  },
}

console.log('[dotell] initDotell invoked at module load (eager, not lazy)', {
  pid: process.pid,
  model: 'authenticated',
  posthogKeyConfigured: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()),
  dbAdapterKeys: Object.keys(dotellDb),
  dbHasEventsCreate: typeof dotellDb.events.create === 'function',
})

export const dotell = initDotell({
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  db: dotellDb,
  model: 'authenticated',
})

console.log('[dotell] initDotell completed', {
  pid: process.pid,
  hasTrack: typeof dotell.track === 'function',
  hasIdentify: typeof dotell.identify === 'function',
})
