# --- Base Stage: Build the React App ---
FROM node:24.0-alpine AS build

# Upgrade packages inside container
RUN apk add --no-cache --upgrade && apk upgrade --available

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

# --- Final Stage: Serve with NGINX ---
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
