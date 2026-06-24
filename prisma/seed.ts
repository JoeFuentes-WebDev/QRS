import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TEST_SELLER = {
  clerkUserId: 'seed-test-placeholder',
  storeName: 'Test Shop',
  slug: 'test-seller',
  notificationEmail: 'test@qrs.dev',
}

async function main() {
  const seller = await prisma.seller.upsert({
    where: { slug: TEST_SELLER.slug },
    update: {
      storeName: TEST_SELLER.storeName,
      notificationEmail: TEST_SELLER.notificationEmail,
    },
    create: TEST_SELLER,
  })

  console.log(`Seed complete: seller "${seller.slug}" (${seller.id})`)
  console.log('Products: 0 (fresh test data)')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
