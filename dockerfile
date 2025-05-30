# Stage 1: Build the NestJS application (This part prepares your app for running)
# We start with an official Node.js image. "20-alpine" means Node.js version 20, using a tiny Linux base.
FROM node:20-alpine AS build

# Set the working directory inside the container. All commands after this will run in /app.
WORKDIR /app

# Copy your package.json and package-lock.json files.
# This is done early to use Docker's caching. If these files don't change,
# Docker won't re-run 'npm install', making future builds faster.
COPY package*.json ./

# Install all project dependencies (including development dependencies for building).
RUN npm install

# Copy all your other project files into the container.
COPY . .

# Build your NestJS application for production. This creates the 'dist' folder.
RUN npm run build

# Stage 2: Create the final, small production image (This part makes the container ready to deploy)
# We start from a fresh, clean Node.js image again. This keeps the final container small.
FROM node:20-alpine

# Set the working directory again.
WORKDIR /app

# Copy only the essential files from the 'build' stage:
# - The compiled JavaScript output ('dist' folder)
# - Only the production 'node_modules' (no development tools)
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
# If your app needs other folders like 'public' or 'assets', add them here:
# COPY --from=build /app/public ./public

# Tell Docker that your application inside the container will listen on port 3000.
# This is just for documentation; actual port mapping happens in docker-compose.yml.
EXPOSE 3000

# Set an environment variable inside the container to indicate it's a production environment.
ENV NODE_ENV=production

# This is the command that will run when the container starts.
# It executes your NestJS production start script.
CMD ["npm", "run", "start:prod"]