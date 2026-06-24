-- CreateEnum
CREATE TYPE "ShippingModel" AS ENUM ('BAKED_IN', 'SEPARATE');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'FULFILLED', 'REFUNDED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "HeroImage" DROP CONSTRAINT "HeroImage_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_sellerId_fkey";

-- DropIndex
DROP INDEX "Order_sellerId_idx";

-- DropIndex
DROP INDEX "Order_stripeSessionId_idx";

-- DropIndex
DROP INDEX "OrderItem_orderId_idx";

-- DropIndex
DROP INDEX "OrderItem_productId_idx";

-- DropIndex
DROP INDEX "Product_sellerId_category_idx";

-- DropIndex
DROP INDEX "Product_sellerId_idx";

-- DropIndex
DROP INDEX "Product_sellerId_inStock_idx";

-- DropIndex
DROP INDEX "Seller_clerkUserId_idx";

-- DropIndex
DROP INDEX "Seller_customDomain_idx";

-- DropIndex
DROP INDEX "Seller_customDomain_key";

-- DropIndex
DROP INDEX "Seller_email_key";

-- DropIndex
DROP INDEX "Seller_slug_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "buyerName",
DROP COLUMN "buyerPhone",
DROP COLUMN "shippingCity",
DROP COLUMN "shippingCountry",
DROP COLUMN "shippingName",
DROP COLUMN "shippingState",
DROP COLUMN "shippingStreet",
DROP COLUMN "shippingZip",
DROP COLUMN "stripePaymentIntent",
DROP COLUMN "total",
ADD COLUMN     "stripePaymentIntentId" TEXT,
ALTER COLUMN "buyerEmail" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "unitPrice",
ADD COLUMN     "priceSnapshot" INTEGER NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "aiColor",
DROP COLUMN "aiMaterial",
DROP COLUMN "aiSuggestedPrice",
DROP COLUMN "aiTexture",
DROP COLUMN "imagePublicId",
DROP COLUMN "imageUrl",
DROP COLUMN "inStock",
DROP COLUMN "quantity",
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "price" SET DATA TYPE INTEGER,
ALTER COLUMN "category" SET NOT NULL;

-- AlterTable
ALTER TABLE "Seller" DROP COLUMN "billingPeriodStart",
DROP COLUMN "customDomain",
DROP COLUMN "email",
DROP COLUMN "fulfillmentType",
DROP COLUMN "monthlyOrderCount",
DROP COLUMN "phone",
DROP COLUMN "shippoFromCity",
DROP COLUMN "shippoFromEmail",
DROP COLUMN "shippoFromName",
DROP COLUMN "shippoFromPhone",
DROP COLUMN "shippoFromState",
DROP COLUMN "shippoFromStreet",
DROP COLUMN "shippoFromZip",
DROP COLUMN "stripePublishableKey",
DROP COLUMN "stripeSecretKey",
DROP COLUMN "stripeWebhookSecret",
DROP COLUMN "telegramBotToken",
DROP COLUMN "telegramChatId",
ADD COLUMN     "shippingModel" "ShippingModel" NOT NULL DEFAULT 'BAKED_IN',
ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "notificationEmail" SET NOT NULL;

-- DropTable
DROP TABLE "HeroImage";

-- DropEnum
DROP TYPE "FulfillmentType";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
