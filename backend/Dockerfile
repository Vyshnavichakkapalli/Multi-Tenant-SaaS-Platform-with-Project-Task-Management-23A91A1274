FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose backend port
EXPOSE 5000

# Run migrations + seeds, then start server
# CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]
