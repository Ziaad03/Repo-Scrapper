# Build a small production image for the backend
FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install production deps
COPY package.json package-lock.json* ./
RUN npm ci --production --ignore-scripts

# Copy the rest of the repo
COPY . .

ENV NODE_ENV=production
EXPOSE 4000

# Run the backend server (server.js reads PORT from env)
CMD ["node", "Backend/server.js"]
