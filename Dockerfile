# Use Ubuntu as base image for compatibility with apt-based installations
FROM ubuntu:22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Set environment variables for tool versions
ENV GITHUB_CLI_VERSION=2.62.0
ENV BUILDKITE_MCP_SERVER_VERSION=0.5.2
ENV NODE_VERSION=20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    sudo \
    git \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN node --version && npm --version

# Set working directory
WORKDIR /workspace

# Copy package files first for better layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy TypeScript configuration and source files
COPY tsconfig.json ./
COPY scripts ./scripts
COPY prompts ./prompts
COPY mcp.json ./

# Build TypeScript files
RUN npm run build

# GitHub CLI, Linear CLI, and Buildkite MCP server will be installed
# by the claude.sh script at runtime to ensure we get the latest versions
# and to keep the image size smaller.

# Set the default command (can be overridden)
CMD ["/bin/bash"]
