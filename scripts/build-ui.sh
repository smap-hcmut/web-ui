#!/bin/bash

# SMAP UI - Build and Push Script
# Usage: ./build-ui.sh [build-push|deploy|login|help]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REGISTRY="${HARBOR_REGISTRY:-registry.tantai.dev}"
PROJECT="smap"
SERVICE="smap-ui"
DOCKERFILE="Dockerfile"
PLATFORM="${PLATFORM:-linux/amd64}"
DEPLOY_MANIFEST="${DEPLOY_MANIFEST:-../smap-deploy/services/smap-ui/deployment.yaml}"
K8S_CONTEXT="${K8S_CONTEXT:-homelab}"
K8S_NAMESPACE="${K8S_NAMESPACE:-smap}"

# Harbor credentials (set HARBOR_USERNAME and HARBOR_PASSWORD in ~/.zshrc)
HARBOR_USER="${HARBOR_USERNAME:?HARBOR_USERNAME is not set. Export it in ~/.zshrc}"
HARBOR_PASS="${HARBOR_PASSWORD:?HARBOR_PASSWORD is not set. Export it in ~/.zshrc}"

# Helper functions
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# Ensure we run from project root (scripts/../)
cd "$(dirname "$0")/.."

# Generate image tag with timestamp
generate_tag() {
    date +"%y%m%d-%H%M%S"
}

# Get full image name
get_image_name() {
    local tag="${1:-$(generate_tag)}"
    echo "${REGISTRY}/${PROJECT}/${SERVICE}:${tag}"
}

# Login to Harbor registry
login() {
    info "Logging into Harbor registry: $REGISTRY"
    echo "$HARBOR_PASS" | docker login "$REGISTRY" -u "$HARBOR_USER" --password-stdin
    success "Logged in successfully"
}

# Build and push image using buildx (required for cross-platform Node.js builds)
build_and_push() {
    if ! command -v docker &>/dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    if [ ! -f "$DOCKERFILE" ]; then
        error "Dockerfile not found: $DOCKERFILE"
        exit 1
    fi

    if [ ! -f "package.json" ]; then
        error "package.json not found — not in smap-ui root?"
        exit 1
    fi

    # Ensure logged in
    login

    local tag
    tag=$(generate_tag)
    local image_name
    image_name=$(get_image_name "$tag")
    local latest_name
    latest_name=$(get_image_name latest)

    info "Registry:   $REGISTRY"
    info "Image:      $image_name"
    info "Platform:   $PLATFORM"
    info "Dockerfile: $DOCKERFILE"
    echo ""

    # Node.js apps cannot be cross-compiled natively like Go;
    # use docker buildx with QEMU emulation for the target platform.
    info "Building image for $PLATFORM (via docker buildx)..."
    docker buildx build \
        --platform "$PLATFORM" \
        --tag "$image_name" \
        --tag "$latest_name" \
        --file "$DOCKERFILE" \
        --push \
        --progress=plain \
        .

    success "Image built and pushed successfully!"
    echo ""
    info "Tagged images:"
    echo "  - $image_name"
    echo "  - $latest_name"
    echo ""
    info "To deploy, update the image tag in the manifest and apply:"
    echo "  sed -i '' \"s|${REGISTRY}/${PROJECT}/${SERVICE}:.*|${image_name}|\" $DEPLOY_MANIFEST"
    echo "  kubectl apply -f $DEPLOY_MANIFEST --context $K8S_CONTEXT -n $K8S_NAMESPACE"
    echo ""
    # Export tag for use by deploy command
    echo "$tag"
}

# Full deploy: build-push + update manifest + kubectl apply + rollout
deploy() {
    if [ ! -f "$DEPLOY_MANIFEST" ]; then
        error "Deployment manifest not found: $DEPLOY_MANIFEST"
        exit 1
    fi

    if ! command -v kubectl &>/dev/null; then
        error "kubectl is not installed"
        exit 1
    fi

    # Build and push; capture the tag from the last line of output
    info "=== Phase 1: Build & Push ==="
    local tag
    tag=$(build_and_push | tee /dev/stderr | tail -1)

    local image_name
    image_name=$(get_image_name "$tag")

    echo ""
    info "=== Phase 2: Update manifest ==="
    info "Manifest: $DEPLOY_MANIFEST"
    info "New tag:  $tag"

    # Replace the image line in the manifest (macOS-compatible sed)
    sed -i '' "s|${REGISTRY}/${PROJECT}/${SERVICE}:.*|${image_name}|" "$DEPLOY_MANIFEST"
    success "Manifest updated → $image_name"

    echo ""
    info "=== Phase 3: kubectl apply ==="
    kubectl apply -f "$DEPLOY_MANIFEST" --context "$K8S_CONTEXT" -n "$K8S_NAMESPACE"

    echo ""
    info "=== Phase 4: Rollout status ==="
    kubectl rollout status deployment/"$SERVICE" \
        -n "$K8S_NAMESPACE" \
        --context "$K8S_CONTEXT" \
        --timeout=300s

    echo ""
    success "Deploy complete! Running image: $image_name"
}

# Show help
show_help() {
    cat <<EOF
${GREEN}SMAP UI - Build and Push Script${NC}

Usage: $0 [command]

Commands:
    build-push    Build and push Docker image (default)
    deploy        build-push + update manifest + kubectl apply + rollout status
    login         Login to Harbor registry
    help          Show this help

Examples:
    $0                # Build and push
    $0 build-push     # Build and push
    $0 deploy         # Full deploy cycle
    $0 login          # Login to Harbor

Configuration:
    Registry:   $REGISTRY
    Project:    $PROJECT
    Service:    $SERVICE
    Platform:   $PLATFORM
    Dockerfile: $DOCKERFILE
    Manifest:   $DEPLOY_MANIFEST
    K8s context: $K8S_CONTEXT ($K8S_NAMESPACE)

Image Format:
    ${REGISTRY}/${PROJECT}/${SERVICE}:YYMMDD-HHMMSS
    ${REGISTRY}/${PROJECT}/${SERVICE}:latest

Environment Variables:
    HARBOR_REGISTRY     Registry URL (default: registry.tantai.dev)
    HARBOR_USERNAME     Registry username
    HARBOR_PASSWORD     Registry password
    PLATFORM            Build platform (default: linux/amd64)
    DEPLOY_MANIFEST     Path to deployment.yaml (default: ../smap-deploy/services/smap-ui/deployment.yaml)
    K8S_CONTEXT         kubectl context (default: homelab)
    K8S_NAMESPACE       Kubernetes namespace (default: smap)

Notes:
    - Uses docker buildx (QEMU emulation) because Node.js cannot be
      cross-compiled natively like Go.
    - Builds Next.js in standalone output mode — requires next.config
      to have output: 'standalone'.

EOF
}

# Main
case "${1:-build-push}" in
    build-push)
        build_and_push
        ;;
    deploy)
        deploy
        ;;
    login)
        login
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
