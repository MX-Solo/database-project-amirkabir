FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --no-optional

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]