# Use the official Bun image
FROM oven/bun:1.0.35

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose the port your app runs on
ENV PORT=3000
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"] 