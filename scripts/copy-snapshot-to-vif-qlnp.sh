#!/usr/bin/env bash
# copy-snapshot-to-vif-qlnp.sh
#
# One-shot snapshot of the current working directory into $HOME/vif/qlnp,
# excluding .git and build artifacts. Run from the repo root:
#
#   bash scripts/copy-snapshot-to-vif-qlnp.sh            # actual copy
#   bash scripts/copy-snapshot-to-vif-qlnp.sh --dry-run  # preview only
#   bash scripts/copy-snapshot-to-vif-qlnp.sh --verbose  # rsync -v output
#
# Exits non-zero on any rsync/IO failure so callers can chain confidently.

set -euo pipefail

# --- Config ------------------------------------------------------------------

readonly SCRIPT_NAME="$(basename "$0")"
readonly SOURCE_DIR="$(pwd)"
readonly DEST_DIR="${HOME}/vif/qlnp"

# Patterns rsync should skip. .git is the explicit ask; the rest are
# reproducible build/dependency outputs that bloat the snapshot.
readonly -a EXCLUDES=(
  ".git"
  ".git/"
  "node_modules"
  "node_modules/"
  "bin"
  "bin/"
  "obj"
  "obj/"
  "dist"
  "dist/"
  ".next"
  ".next/"
  ".turbo"
  ".turbo/"
  "*.user"
  "*.suo"
)

# --- Argument parsing -------------------------------------------------------

DRY_RUN=0
VERBOSE=0
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n)  DRY_RUN=1 ;;
    --verbose|-v)  VERBOSE=1 ;;
    --help|-h)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      echo "${SCRIPT_NAME}: unknown argument: ${arg}" >&2
      exit 2
      ;;
  esac
done

# --- Pre-flight checks ------------------------------------------------------

if ! command -v rsync >/dev/null 2>&1; then
  echo "${SCRIPT_NAME}: rsync is required but not installed" >&2
  exit 1
fi

if [[ ! -d "${SOURCE_DIR}/.git" ]]; then
  echo "${SCRIPT_NAME}: warning: source has no .git directory at ${SOURCE_DIR}" >&2
fi

# Build rsync exclude args once so both dry-run and real runs stay in sync.
RSYNC_EXCLUDES=()
for pattern in "${EXCLUDES[@]}"; do
  RSYNC_EXCLUDES+=(--exclude="${pattern}")
done

# --- Execute ----------------------------------------------------------------

# -a  archive (recursive, perms, symlinks, times)
# --delete  NOT used: we never wipe the destination, only add/overwrite.
#            Snapshot accumulates; safe to re-run without losing prior files.
RSYNC_OPTS=(-a --human-readable --stats)
if [[ ${VERBOSE} -eq 1 ]]; then
  RSYNC_OPTS+=(--progress --info=stats2,progress2)
fi

if [[ ${DRY_RUN} -eq 1 ]]; then
  echo "[dry-run] ${SOURCE_DIR} -> ${DEST_DIR} (no files will be written)"
  rsync "${RSYNC_OPTS[@]}" "${RSYNC_EXCLUDES[@]}" --dry-run --chmod=Du+w \
    "${SOURCE_DIR}/" "${DEST_DIR}/"
  echo "[dry-run] complete"
  exit 0
fi

# Create destination parents silently; rsync will ensure the leaf exists.
mkdir -p "${DEST_DIR}"

echo "Copying ${SOURCE_DIR} -> ${DEST_DIR}"
echo "Excluding: ${EXCLUDES[*]}"

# Trailing slash on source copies contents (not the dir itself) into dest.
rsync "${RSYNC_OPTS[@]}" "${RSYNC_EXCLUDES[@]}" --chmod=Du+w \
  "${SOURCE_DIR}/" "${DEST_DIR}/"

# --- Summary ----------------------------------------------------------------

# Count files + measure size at the destination for a clean post-copy report.
file_count=$(find "${DEST_DIR}" -type f | wc -l)
dir_count=$(find "${DEST_DIR}" -type d | wc -l)
total_size=$(du -sh "${DEST_DIR}" 2>/dev/null | cut -f1)

printf '\n--- Snapshot summary ---\n'
printf 'Source:    %s\n' "${SOURCE_DIR}"
printf 'Dest:      %s\n' "${DEST_DIR}"
printf 'Files:     %s\n' "${file_count}"
printf 'Dirs:      %s\n' "${dir_count}"
printf 'Total:     %s\n' "${total_size}"
printf 'Excluded:  %s\n' "${EXCLUDES[*]}"
