#!/bin/bash

# Make scripts executable
chmod +x scripts/docker-build.sh

# Run the Docker container
docker run -p 3000:3000 \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
  -e AWS_REGION=${AWS_REGION} \
  -e DEPLOYMENT_TOPIC_ARN=${DEPLOYMENT_TOPIC_ARN} \
  aws-sso-manager:latest