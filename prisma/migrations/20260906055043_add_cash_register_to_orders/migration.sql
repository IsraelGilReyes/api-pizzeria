/*
  Warnings:

  - You are about to drop the `CashRegister` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Order` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `CashRegister` DROP FOREIGN KEY `CashRegister_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `CashRegister` DROP FOREIGN KEY `CashRegister_openedById_fkey`;

-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `Order` DROP FOREIGN KEY `Order_userId_fkey`;

-- DropForeignKey
ALTER TABLE `OrderItem` DROP FOREIGN KEY `OrderItem_orderId_fkey`;

-- DropTable
DROP TABLE `CashRegister`;

-- DropTable
DROP TABLE `Order`;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `branchId` INTEGER NOT NULL,
    `cash_register_id` INTEGER NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDIENTE', 'PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_registers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `initialAmount` DECIMAL(10, 2) NOT NULL,
    `generatedAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `totalAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `openedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,
    `openedById` INTEGER NOT NULL,
    `branchId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_cash_register_id_fkey` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_openedById_fkey` FOREIGN KEY (`openedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_registers` ADD CONSTRAINT `cash_registers_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
