// Single source of truth for the site origin and global identity. The literal
// origin lives here and nowhere else — astro.config.mjs feeds it to `Astro.site`
// and the feed generators (collect.ts) import it directly. See issue #36.
export const SITE_URL = "https://ogsfrompoly.com";
export const SITE_TITLE = "ogsfrompoly";
export const SITE_DESCRIPTION = "We measure who is actually skilled on Polymarket.";
