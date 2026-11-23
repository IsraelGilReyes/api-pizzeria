/*
  Warnings:

  - Added the required column `address` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_name` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders` ADD COLUMN `address` VARCHAR(191) NOT NULL,
    ADD COLUMN `customer_name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('ADMIN_GENERAL', 'GERENTE', 'CAJERO', 'COCINA', 'REPARTIDOR') NOT NULL DEFAULT 'CAJERO';
