FROM node:20-bullseye-slim

# Set work directory
WORKDIR /app

# Install Node.js dependencies
COPY package.json package-lock.json /app/
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# Copy project
COPY . /app/

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]