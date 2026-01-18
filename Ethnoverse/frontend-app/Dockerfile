# Use Node.js environment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first to leverage cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite default port
EXPOSE 5173

# Run the dev server, exposing to network
CMD ["npm", "run", "dev", "--", "--host"]
