#!/bin/bash

# Build the Docker image
docker build -t aws-sso-manager:latest .

# Tag the image with a version if provided
if [ ! -z "$1" ]; then
  docker tag aws-sso-manager:latest aws-sso-manager:$1
  echo "Tagged image as aws-sso-manager:$1"
fi

echo "Build complete!"

