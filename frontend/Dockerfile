FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install static server (for prod only)
RUN npm install -g serve

# Copy source
COPY . .

# Build frontend
RUN npm run dev:build

# Expose frontend port for dev
EXPOSE 3000

# Default to dev server
CMD ["npm", "run", "dev", "--", "--port", "3000", "--host", "0.0.0.0"]