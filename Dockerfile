FROM ghcr.io/cirruslabs/flutter@sha256:0a9de3b70b5b7b921a346eb2793e363dc22280849a4fd690d9dde99ce1c2b1b8 AS build
WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get
COPY . .
RUN flutter build web --release

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/build/web /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 8080
