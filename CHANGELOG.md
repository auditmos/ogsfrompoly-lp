# [1.15.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.14.2...v1.15.0) (2026-07-10)


### Features

* **og:** social cards — brand default + build-time statement cards ([0573696](https://github.com/auditmos/ogsfrompoly-lp/commit/0573696bfdefe4fe938aa4d0080724eab6891da6))

## [1.14.2](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.14.1...v1.14.2) (2026-07-10)


### Bug Fixes

* **build:** force content-layer rebuild so local deploys can't ship a stale parse ([05bce8c](https://github.com/auditmos/ogsfrompoly-lp/commit/05bce8c0df2b9c5fd86706204707130c01d73ea0)), closes [#39](https://github.com/auditmos/ogsfrompoly-lp/issues/39)

## [1.14.1](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.14.0...v1.14.1) (2026-07-09)


### Bug Fixes

* **statements:** consume schema as the one guard and unify same-date ordering ([30a7395](https://github.com/auditmos/ogsfrompoly-lp/commit/30a7395341306f97ab6438b5cacd03b8f88954a0)), closes [#38](https://github.com/auditmos/ogsfrompoly-lp/issues/38)

# [1.14.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.13.0...v1.14.0) (2026-07-09)


### Features

* **http:** cache feed, .md, and HTML responses at the edge ([66e190b](https://github.com/auditmos/ogsfrompoly-lp/commit/66e190b81f1a0aff178fd0de9f4ab78f5fc9f21d)), closes [#37](https://github.com/auditmos/ogsfrompoly-lp/issues/37)

# [1.13.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.12.0...v1.13.0) (2026-07-09)


### Features

* **seo:** emit canonical + Open Graph/Twitter meta from a single site origin ([fe9629b](https://github.com/auditmos/ogsfrompoly-lp/commit/fe9629b0a3daefde172e61f57aa6e40fea631722)), closes [#36](https://github.com/auditmos/ogsfrompoly-lp/issues/36)

# [1.12.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.11.4...v1.12.0) (2026-07-09)


### Features

* **feeds:** add static pages to sitemap and RSS channel metadata ([5820f4e](https://github.com/auditmos/ogsfrompoly-lp/commit/5820f4e6b0c29b6eaab1eae3a80a43cc20cab36d)), closes [#35](https://github.com/auditmos/ogsfrompoly-lp/issues/35)

## [1.11.4](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.11.3...v1.11.4) (2026-07-09)


### Bug Fixes

* gate /dev/preview behind dev-only env check ([#34](https://github.com/auditmos/ogsfrompoly-lp/issues/34)) ([3f825b0](https://github.com/auditmos/ogsfrompoly-lp/commit/3f825b0f6e2b055ab75c3a1dff6b3eedffb69a8d))

## [1.11.3](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.11.2...v1.11.3) (2026-07-09)


### Bug Fixes

* reject calendar-impossible dates and duplicate categories in statement schema ([133a898](https://github.com/auditmos/ogsfrompoly-lp/commit/133a8982a5a5f1663750895c0b71d0ccd0aaaaf3)), closes [#33](https://github.com/auditmos/ogsfrompoly-lp/issues/33)

## [1.11.2](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.11.1...v1.11.2) (2026-07-09)


### Bug Fixes

* cap top-wallet contribution share at ±100% ([#47](https://github.com/auditmos/ogsfrompoly-lp/issues/47)) ([588e94c](https://github.com/auditmos/ogsfrompoly-lp/commit/588e94c4a5dc9bb29e6f62a45ee8ea71dd1ce9bc)), closes [#31](https://github.com/auditmos/ogsfrompoly-lp/issues/31)
* correct USD formatter edge cases ([#32](https://github.com/auditmos/ogsfrompoly-lp/issues/32)) ([18f22dd](https://github.com/auditmos/ogsfrompoly-lp/commit/18f22dd3f72ec640f66494537e46bdb99707d798))

## [1.11.1](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.11.0...v1.11.1) (2026-07-09)


### Bug Fixes

* populate statement top-wallet tables via hypothetical-PnL ranking ([#46](https://github.com/auditmos/ogsfrompoly-lp/issues/46)) ([57746f7](https://github.com/auditmos/ogsfrompoly-lp/commit/57746f7b5f8f38e073cdfe4defa2baeb636231b3)), closes [#44](https://github.com/auditmos/ogsfrompoly-lp/issues/44) [poly-track#181](https://github.com/poly-track/issues/181) [poly-track#218](https://github.com/poly-track/issues/218) [#30](https://github.com/auditmos/ogsfrompoly-lp/issues/30)

# [1.11.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.10.6...v1.11.0) (2026-07-09)


### Features

* add consumer-side statement data sanity lint ([#30](https://github.com/auditmos/ogsfrompoly-lp/issues/30)) ([#45](https://github.com/auditmos/ogsfrompoly-lp/issues/45)) ([1e66fd2](https://github.com/auditmos/ogsfrompoly-lp/commit/1e66fd21f0c14dd51d5dda6992443eebc1703f34)), closes [#26](https://github.com/auditmos/ogsfrompoly-lp/issues/26) [#26](https://github.com/auditmos/ogsfrompoly-lp/issues/26) [#26](https://github.com/auditmos/ogsfrompoly-lp/issues/26)

## [1.10.6](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.10.5...v1.10.6) (2026-07-09)


### Bug Fixes

* regenerate 5 statements with correct hit_rate after warehouse refresh ([#44](https://github.com/auditmos/ogsfrompoly-lp/issues/44)) ([12e5282](https://github.com/auditmos/ogsfrompoly-lp/commit/12e5282cc5ffb9ba67e85dd9cb4c4d28f9f84478))

## [1.10.5](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.10.4...v1.10.5) (2026-07-08)


### Bug Fixes

* gate published statements on operator scaffolding lint ([#29](https://github.com/auditmos/ogsfrompoly-lp/issues/29)) ([c1e2187](https://github.com/auditmos/ogsfrompoly-lp/commit/c1e21873bdc607014f2c9fb64598f595b2d04527))

## [1.10.4](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.10.3...v1.10.4) (2026-07-08)


### Bug Fixes

* serialize statement frontmatter into .md routes ([#28](https://github.com/auditmos/ogsfrompoly-lp/issues/28)) ([e4088e0](https://github.com/auditmos/ogsfrompoly-lp/commit/e4088e0af1766928546563186a12cc31300eaa82))

## [1.10.3](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.10.2...v1.10.3) (2026-07-08)


### Bug Fixes

* render monthly P&L block on statement pages ([#27](https://github.com/auditmos/ogsfrompoly-lp/issues/27)) ([7a54730](https://github.com/auditmos/ogsfrompoly-lp/commit/7a54730350bda660b6560168b08e54e4b68562b4))

## [1.10.2](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.10.1...v1.10.2) (2026-06-03)


### Bug Fixes

* **statements:** align top-wallets bucket and share scales ([3ed6d24](https://github.com/auditmos/ogsfrompoly-lp/commit/3ed6d2458636392154426506388baa348e0294b1))

## [1.10.1](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.10.0...v1.10.1) (2026-06-03)


### Bug Fixes

* **statements:** align top-wallets columns with fixed widths ([753d366](https://github.com/auditmos/ogsfrompoly-lp/commit/753d366e24ec4e4f56d3071638d05e36fceecc03))

# [1.10.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.9.0...v1.10.0) (2026-06-03)


### Features

* **statements:** vertical wallet list with bucketed PnL + share columns ([a379d8b](https://github.com/auditmos/ogsfrompoly-lp/commit/a379d8bdfbd0b245b0d0c350605b2100e16d3fab))

# [1.9.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.8.0...v1.9.0) (2026-06-03)


### Features

* **site:** statements index + long-form detail + llms discovery ([3e93654](https://github.com/auditmos/ogsfrompoly-lp/commit/3e936541e1692f3e19ba582c3f98ed69db28a811))

# [1.8.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.7.1...v1.8.0) (2026-06-02)


### Features

* **methodology:** refresh public methodology and llms index ([dbe4e40](https://github.com/auditmos/ogsfrompoly-lp/commit/dbe4e40ca195f3fbbd140fe88d61351b99b9a14a))

## [1.7.1](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.7.0...v1.7.1) (2026-06-01)


### Bug Fixes

* **nav:** replace template favicon, add global header/footer nav, statement empty-state ([89461dd](https://github.com/auditmos/ogsfrompoly-lp/commit/89461dd9ab74d1519a75571bc5023b6c2b0fa7ac))

# [1.7.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.6.0...v1.7.0) (2026-06-01)


### Features

* **schema-freeze:** SCHEMA_VERSION export, draft fence, body-disclosure invariant, statement skeletons ([8532780](https://github.com/auditmos/ogsfrompoly-lp/commit/8532780c20ad18f0e44e8f156592c1ed999dd717)), closes [#10](https://github.com/auditmos/ogsfrompoly-lp/issues/10)

# [1.6.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.5.0...v1.6.0) (2026-06-01)


### Features

* **methodology:** /methodology page citing source papers, skill test, disclosure policy ([9484c32](https://github.com/auditmos/ogsfrompoly-lp/commit/9484c3249abed0dd342c91bb64e74b38fc947542)), closes [#9](https://github.com/auditmos/ogsfrompoly-lp/issues/9)

# [1.5.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.4.0...v1.5.0) (2026-06-01)


### Features

* **homepage:** hero, install snippet, latest-statement teaser, footer ([57ada9b](https://github.com/auditmos/ogsfrompoly-lp/commit/57ada9be938e8f82c8b33397cebab296073f6be5)), closes [#8](https://github.com/auditmos/ogsfrompoly-lp/issues/8)

# [1.4.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.3.0...v1.4.0) (2026-05-31)


### Features

* **brand:** tokens + component primitives (display heading, install snippet, statement card/table) ([3a4ca71](https://github.com/auditmos/ogsfrompoly-lp/commit/3a4ca71a921a4dc6bec1450fb747cacf58ea61af))

# [1.3.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.2.0...v1.3.0) (2026-05-31)


### Features

* **deploy:** production deploy + Cloudflare Web Analytics beacon ([3798a5d](https://github.com/auditmos/ogsfrompoly-lp/commit/3798a5dcb0338e3ad88f0b041fb8836fc5431ce4)), closes [#6](https://github.com/auditmos/ogsfrompoly-lp/issues/6)

# [1.2.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.1.0...v1.2.0) (2026-05-31)


### Features

* **feeds:** generate rss.xml, llms.txt, sitemap.xml from content collections ([1cbde0e](https://github.com/auditmos/ogsfrompoly-lp/commit/1cbde0ec6bc6e99acc0f49e01a32539364f3007c)), closes [#4](https://github.com/auditmos/ogsfrompoly-lp/issues/4)

# [1.1.0](https://github.com/auditmos/ogsfrompoly-lp/compare/v1.0.0...v1.1.0) (2026-05-31)


### Features

* **routing:** dual-format serving for content collections ([7a8ff61](https://github.com/auditmos/ogsfrompoly-lp/commit/7a8ff6158ff4f8de6ecf7c595caa4972028029d3))

# 1.0.0 (2026-05-31)


### Features

* **content:** statement collection schema + placeholder fixture ([a4fea9d](https://github.com/auditmos/ogsfrompoly-lp/commit/a4fea9d36919ee85f8f28994ece18c232e409b75)), closes [#2](https://github.com/auditmos/ogsfrompoly-lp/issues/2)

# [1.1.0](https://github.com/auditmos/astro-on-cf/compare/v1.0.0...v1.1.0) (2026-05-25)


### Features

* **lint:** enable Biome noFloatingPromises rule ([#2](https://github.com/auditmos/astro-on-cf/issues/2)) ([14cc774](https://github.com/auditmos/astro-on-cf/commit/14cc774e76351128e8789174b0d45993493e4d1f))

# 1.0.0 (2026-05-19)


### Features

* align template with Auditmos Cloudflare baseline ([81b8cc2](https://github.com/auditmos/astro-on-cf/commit/81b8cc20cc6edde94cdc437a72f0a946963d917f))
