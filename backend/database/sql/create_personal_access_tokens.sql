-- =====================================================================
-- SJT — Tabel personal_access_tokens (Laravel Sanctum)
--
-- Gunakan HANYA jika kamu ingin membuat tabel ini langsung di MySQL
-- tanpa menjalankan `php artisan migrate`.
--
-- CARA PALING DISARANKAN tetap: `php artisan migrate --seed --force`
-- karena itu membuat SEMUA tabel + data awal. File ini hanya menambal
-- satu tabel yang menyebabkan error login.
--
-- Cara pakai di Railway:
--   Buka service MySQL → tab "Data" / "Query", atau connect via CLI:
--     mysql -h mysql.railway.internal -u root -p railway < create_personal_access_tokens.sql
-- =====================================================================

CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` VARCHAR(255) NOT NULL,
  `tokenable_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `token` VARCHAR(64) NOT NULL,
  `abilities` TEXT NULL,
  `last_used_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Setelah menjalankan ini, catat migrasinya sebagai "sudah jalan" agar
-- `php artisan migrate` berikutnya tidak mencoba membuatnya lagi.
-- (Abaikan bila kamu tidak memakai artisan sama sekali.)
INSERT IGNORE INTO `migrations` (`migration`, `batch`)
VALUES ('2026_07_04_000001_create_personal_access_tokens_table', 1);
