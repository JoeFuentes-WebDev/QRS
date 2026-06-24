import type { HeroImage } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function listHeroImagesForSeller(
  sellerId: string
): Promise<HeroImage[]> {
  return prisma.heroImage.findMany({
    where: { sellerId },
    orderBy: { order: 'asc' },
  })
}

export async function createHeroImage(
  sellerId: string,
  url: string
): Promise<HeroImage> {
  const last = await prisma.heroImage.findFirst({
    where: { sellerId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const order = (last?.order ?? -1) + 1

  return prisma.heroImage.create({
    data: { sellerId, url, order },
  })
}

export async function deleteHeroImage(
  id: string,
  sellerId: string
): Promise<boolean> {
  const existing = await prisma.heroImage.findFirst({
    where: { id, sellerId },
  })
  if (!existing) return false

  await prisma.heroImage.delete({ where: { id } })
  return true
}

export async function reorderHeroImages(
  sellerId: string,
  orderedIds: string[]
): Promise<HeroImage[]> {
  const existing = await prisma.heroImage.findMany({
    where: { sellerId },
    orderBy: { order: 'asc' },
  })

  const existingIds = new Set(existing.map((image) => image.id))
  if (
    orderedIds.length !== existing.length ||
    orderedIds.some((id) => !existingIds.has(id))
  ) {
    throw new Error('Invalid hero image order')
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.heroImage.update({
        where: { id },
        data: { order: index },
      })
    )
  )

  return listHeroImagesForSeller(sellerId)
}
