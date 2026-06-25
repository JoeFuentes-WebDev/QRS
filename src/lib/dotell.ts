import { initDotell, type DbClient } from '@joefuentes/dotell'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

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

export const dotell = initDotell({
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  db: dotellDb,
  model: 'authenticated',
})
