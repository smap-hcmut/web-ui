#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${HARBOR_REGISTRY:-registry.tantai.dev}"
PROJECT="${HARBOR_PROJECT:-smap}"
IMAGE_NAME="smap-ui"
TAG="${1:-$(date +%y%m%d-%H%M%S)}"

FULL_IMAGE="${REGISTRY}/${PROJECT}/${IMAGE_NAME}:${TAG}"
LATEST_IMAGE="${REGISTRY}/${PROJECT}/${IMAGE_NAME}:latest"

echo "Building ${FULL_IMAGE} ..."
docker build --platform linux/amd64 -t "${FULL_IMAGE}" -t "${LATEST_IMAGE}" .

echo "Pushing ${FULL_IMAGE} ..."
docker push "${FULL_IMAGE}"
docker push "${LATEST_IMAGE}"

echo "Done: ${FULL_IMAGE}"
