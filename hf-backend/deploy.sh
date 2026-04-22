#!/usr/bin/env bash
# Deploy Oxinto Node.js backend to Hugging Face Spaces
# Usage: bash deploy.sh
# Requires: git, huggingface-cli  (pip install huggingface_hub)
set -euo pipefail

# ── EDIT THIS ─────────────────────────────────────────────────────────────────
HF_USERNAME="ahn009"
SPACE_NAME="Oxinto-Backend"
# ─────────────────────────────────────────────────────────────────────────────

HF_REPO="https://huggingface.co/spaces/${HF_USERNAME}/${SPACE_NAME}"
WORK_DIR="/tmp/oxinto-backend-hf-deploy"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Deploying Oxinto Node.js backend to HF Spaces..."

# Authenticate
if [ -z "${HF_TOKEN:-}" ]; then
  huggingface-cli whoami || { echo "Run: huggingface-cli login"; exit 1; }
fi

# Clone or update HF Space repo
if [ -d "$WORK_DIR/.git" ]; then
  git -C "$WORK_DIR" pull
else
  rm -rf "$WORK_DIR"
  GIT_LFS_SKIP_SMUDGE=1 git clone "$HF_REPO" "$WORK_DIR"
fi

# Copy backend files
cp "$SCRIPT_DIR/Dockerfile"  "$WORK_DIR/Dockerfile"
cp "$SCRIPT_DIR/README.md"   "$WORK_DIR/README.md"
cp "$ROOT_DIR/package.json"  "$WORK_DIR/package.json"
cp "$ROOT_DIR/package-lock.json" "$WORK_DIR/package-lock.json" 2>/dev/null || true
rsync -av --delete "$ROOT_DIR/src/" "$WORK_DIR/src/"

# Commit and push
cd "$WORK_DIR"
git add -A
git commit -m "Deploy Oxinto backend $(date '+%Y-%m-%d %H:%M')" || echo "Nothing to commit."
git push

echo ""
echo "Done!"
echo "  Space URL : $HF_REPO"
echo "  API URL   : https://${HF_USERNAME}-$(echo $SPACE_NAME | tr '[:upper:]' '[:lower:]').hf.space"
