# League of Legends Match Statistics Viewer

A modern, browser-based League of Legends statistics viewer for match-v4/match-v5 details and timeline JSONs. Designed for developers to easily integrate comprehensive match statistics capabilities into their websites.

## Features

- **Cross-Version Compatibility**: Supports both Riot API v4 and v5 match formats
- **Interactive Visualizations**: Dynamic charts and graphs using Plotly.js
- **Responsive Design**: Modern, mobile-friendly interface
- **Serverless Architecture**: Pure client-side application, no backend required
- **Developer Friendly**: Well-documented, modular codebase with TypeScript-style JSDoc
- **Real-time Statistics**: Comprehensive player and team statistics analysis

## Usage

- Specify an encoded URL as query parameter `match` for either a match-v4 or match-v5 by ID JSON
- Specify an encoded URL as query parameter `timeline` for either a match-v4 or match-v5 timeline JSON
- Optional: for development purposes, set query parameter `example` as anything to auto-populate `match` and `timeline`

## Development

The project follows modern JavaScript best practices with:

- ES6+ features and syntax
- Comprehensive JSDoc documentation
- Modular code organization
- Error handling and validation
- Responsive CSS design
- Accessibility considerations
- UI rendered with [lit-html](https://lit.dev/docs/libraries/standalone-templates/) templates (no build step; no web components)

`index.js` is an ES module, so the page must be served over HTTP (e.g. `python3 -m http.server --directory docs`) rather than opened from the file system.

### File Structure

- `index.html` - Main application entry point
- `index.js` - Core application logic and UI management (ES module)
- `lit-html-3.3.3/` - Vendored lit-html (core plus the `repeat` and `live` directives), from the `lit-html` npm package
- `match.js` - Match data processing and normalization
- `queue_groups.js` - Queue configuration and utilities
- `index.css` - Modern, responsive styling
- `example-data/` - Sample data for development and testing
- `docs/arena_augments.json` - from https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json

### Legacy view coverage

`Match` stores match-v5 data and exposes a match-v4 shaped view of it (`participants`, `teams`,
`participantIdentities`, `frames`). `tests/legacy-view-coverage.js` checks that every match-v5 field
is accounted for in that view: represented, with its value compared, deliberately omitted with a
reason, or a listed gap where a legacy field exists but the view leaves it empty. A field Riot adds
fails the check until it gets one of those decisions.

```bash
node tests/legacy-view-coverage.js
node tests/legacy-view-coverage.js match.json timeline.json [...]
```

With no arguments it checks the match-v5 files in `docs/example-data`. Pass match and timeline
pairs (`-` for no timeline) to check other data without committing it.

Each legacy participant's `stats` carries where the player played, as match-v5 position names
(`TOP`, `JUNGLE`, `MIDDLE`, `BOTTOM`, `UTILITY`): `teamPosition` and `individualPosition`, both
match-v5 only. A legacy participant's top-level `role` is reserved for a role predicted by another tool, such
as RoleML, and written over a match-v4 participant's top-level `role`; it is passed through
unchanged. Riot's role is `timeline.role`.

## License

GNU Affero General Public License v3.0 (AGPL-3.0) - see LICENSE file for details.

## Author

iaace LLC
