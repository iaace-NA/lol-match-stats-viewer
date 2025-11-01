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

### File Structure

- `index.html` - Main application entry point
- `index.js` - Core application logic and UI management
- `match.js` - Match data processing and normalization
- `queue_groups.js` - Queue configuration and utilities
- `index.css` - Modern, responsive styling
- `example-data/` - Sample data for development and testing
- `docs/arena_augments.json` - from https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json

## License

GNU Affero General Public License v3.0 (AGPL-3.0) - see LICENSE file for details.

## Author

iaace LLC
