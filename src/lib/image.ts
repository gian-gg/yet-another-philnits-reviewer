/**
 * Resolve a question image path to its final URL.
 *
 * If `NEXT_PUBLIC_IMAGE_BASE_URL` is set (e.g. a jsDelivr URL pinned to a tag),
 * paths are served from that origin. Otherwise the path is returned as-is and
 * Next serves it from `public/`. This keeps JSONs portable and lets local dev
 * work with no env config.
 *
 * Example base URL:
 *   https://cdn.jsdelivr.net/gh/<user>/<assets-repo>@<tag>
 */

const BASE = "https://cdn.jsdelivr.net/gh/gian-gg/yapr-assets@v2"

export function resolveImageUrl(path: string): string {
  if (!BASE) return path
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`
}

/**
 * True when images are served from a remote origin.
 * Use this to opt out of `next/image` optimization since the source assets
 * are already pre-encoded AVIFs at their final dimensions.
 */
export const IS_REMOTE_IMAGE_HOST = BASE.length > 0
