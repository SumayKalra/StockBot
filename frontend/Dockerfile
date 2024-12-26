FROM node:22.11.0-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and lock file first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose port 3000 for the React dev server
EXPOSE 3000

# Run the React dev server (which supports hot reload by default)
CMD ["npm", "start"]