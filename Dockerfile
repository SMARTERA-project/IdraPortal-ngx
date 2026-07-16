# Build arguments for version overrides
# Override via: docker build --build-arg NODE_VERSION=x.y.z --build-arg NGINX_VERSION=x.y
ARG NODE_VERSION=24.11.0-alpine
ARG NGINX_VERSION=latest
ARG BUILD_CONFIGURATION=production
ARG BASE_HREF=/IdraPortal/

FROM node:${NODE_VERSION} AS builder
# Re-declare the build args inside this stage. ARGs declared before the first
# FROM are only in scope for FROM interpolation, NOT inside a build stage. Without
# these lines ${BUILD_CONFIGURATION} and ${BASE_HREF} are empty here, so the build
# silently falls back to --base-href "/" and the app breaks under /IdraPortal/.
# Declaring them without a value inherits the global defaults above.
ARG BUILD_CONFIGURATION
ARG BASE_HREF
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
 
RUN npm install
COPY . /app
# Guard against an empty BASE_HREF (e.g. `--build-arg BASE_HREF=`): an empty
# --base-href produces `<base href>` and breaks asset resolution on deep routes.
RUN npm run build -- --configuration ${BUILD_CONFIGURATION} --base-href "${BASE_HREF:-/}"

FROM nginx:${NGINX_VERSION}
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
# Runtime config: regenerates assets/env.js from PORTAL_* env vars at startup.
COPY docker/40-generate-env.sh /docker-entrypoint.d/40-generate-env.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-generate-env.sh \
    && chmod +x /docker-entrypoint.d/40-generate-env.sh
