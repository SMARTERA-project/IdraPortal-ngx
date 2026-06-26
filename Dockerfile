# Build arguments for version overrides
# Override via: docker build --build-arg NODE_VERSION=x.y.z --build-arg NGINX_VERSION=x.y
ARG NODE_VERSION=24.11.0-alpine
ARG NGINX_VERSION=latest
ARG BUILD_CONFIGURATION=production
ARG BASE_HREF=/IdraPortal/

FROM node:${NODE_VERSION} as builder
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
COPY package-lock.json /app
 
RUN npm install
COPY . /app
RUN npm run build -- --configuration ${BUILD_CONFIGURATION} --base-href ${BASE_HREF}

FROM nginx:${NGINX_VERSION}
EXPOSE 80
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
# Runtime config: regenerates assets/env.js from PORTAL_* env vars at startup.
COPY docker/40-generate-env.sh /docker-entrypoint.d/40-generate-env.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-generate-env.sh \
    && chmod +x /docker-entrypoint.d/40-generate-env.sh
