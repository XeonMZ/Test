FROM composer:2 AS vendor
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist
COPY backend/ ./
RUN composer dump-autoload --optimize --no-dev

FROM php:8.3-fpm-alpine
WORKDIR /var/www/html
RUN apk add --no-cache bash curl git icu-dev oniguruma-dev zip unzip \
  && docker-php-ext-install intl mbstring pdo pdo_mysql
COPY --from=vendor /app ./
RUN mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/framework/testing storage/logs storage/app/public bootstrap/cache \
  && chmod -R 775 storage bootstrap/cache
EXPOSE 9000
CMD ["sh", "-c", "php artisan migrate --force && php-fpm"]
