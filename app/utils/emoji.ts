import type { CustomEmoji } from '#shared/types/timeline'

// Matches :shortcode: — Mastodon shortcodes use letters, digits, and underscores.
const SHORTCODE_RE = /:([a-zA-Z0-9_]+):/g

/**
 * Replace `:shortcode:` tokens in Mastodon HTML content with inline `<img>` tags.
 * Only replaces shortcodes present in the provided emojis array.
 * Emoji URLs are validated to start with `https://` to prevent injection.
 */
export function resolveCustomEmoji(content: string, emojis: CustomEmoji[]): string {
  if (!emojis.length) return content

  const map = new Map(emojis.map(e => [e.shortcode, e]))

  return content.replace(SHORTCODE_RE, (match, code: string) => {
    const emoji = map.get(code)
    if (!emoji) return match
    if (!emoji.url.startsWith('https://')) return match

    return `<img src="${emoji.url}" alt=":${code}:" title=":${code}:" class="custom-emoji" loading="lazy" />`
  })
}
