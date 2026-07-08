FROM php:8.3-fpm-alpine
WORKDIR /var/www/html
RUN apk add --no-cache bash curl git icu-dev oniguruma-dev zip unzip \
  && docker-php-ext-install intl mbstring pdo pdo_mysql
COPY backend/ ./
EXPOSE 9000
CMD ["php-fpm"]
