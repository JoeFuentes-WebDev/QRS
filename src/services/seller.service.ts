import { prisma } from '@/lib/prisma'

export async function getSellerByClerkId(clerkUserId: string) {
  return prisma.seller.findUnique({
    where: { clerkUserId },
  })
}

export async function updateSellerStripeConnect(
  sellerId: string,
  data: {
    stripeConnectAccountId?: string
    stripeConnectOnboarded?: boolean
  }
) {
  return prisma.seller.update({
    where: { id: sellerId },
    data,
  })
}

export async function updateSellerNotificationEmail(
  sellerId: string,
  notificationEmail: string
) {
  return prisma.seller.update({
    where: { id: sellerId },
    data: { notificationEmail },
  })
}

export async function updateSellerPhone(
  sellerId: string,
  sellerPhone: string | null
) {
  return prisma.seller.update({
    where: { id: sellerId },
    data: { sellerPhone },
  })
}

export async function updateSellerPostcardCta(
  sellerId: string,
  postcardCta: string | null
) {
  return prisma.seller.update({
    where: { id: sellerId },
    data: { postcardCta },
  })
}

export async function getSellerById(sellerId: string) {
  return prisma.seller.findUnique({
    where: { id: sellerId },
  })
}

export async function getSellerByTelegramChatId(telegramChatId: string) {
  return prisma.seller.findFirst({
    where: { telegramChatId },
  })
}

export async function updateSellerTelegramChatId(
  sellerId: string,
  telegramChatId: string
) {
  return prisma.seller.update({
    where: { id: sellerId },
    data: { telegramChatId },
  })
}
