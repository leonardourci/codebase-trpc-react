FROM node:20-alpine AS build
WORKDIR /app

COPY front-end/package*.json ./
RUN npm ci

COPY front-end/ ./
COPY .env ./.env

RUN npm run build

FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY front-end/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
