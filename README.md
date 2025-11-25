# GeoMOS OpenLayers Map

A TypeScript-based web application for visualizing GeoMOS monitoring points on an interactive OpenLayers map using the Swiss coordinate system EPSG:2056 (LV95).

## Features

- **Interactive Map**: OpenStreetMap base layer with OpenLayers
- **Swiss Coordinate System**: Full support for EPSG:2056 (LV95)
- **Real-time Data**: Loads monitoring points from GeoMOS API
- **Interactive Popups**: Click on points to view detailed information
- **Displacement Visualization**: Shows height, easting, and northing differences
- **CORS Proxy**: Node.js backend proxy to bypass CORS restrictions
- **TypeScript**: Fully typed codebase for better maintainability
- **Modern Build**: esbuild for fast compilation and bundling

## Project Structure

```
.
├── src/
│   ├── map.ts          # OpenLayers map implementation
│   └── server.ts       # Node.js proxy server
├── build.js            # esbuild configuration
├── index.html          # Main HTML page
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── README.md          # This file
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd geoinfo-minihackathon
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development

Build and start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production

1. Build the project:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## API Endpoints

### Proxy Endpoint
- **Path**: `/api/*`
- **Description**: Proxies requests to `https://geomos.geoinfo.ch/*` with CORS headers

### Example
```
GET /api/v1/projects/5/resultsjson?starttime=2025-10-20&endtime=2025-10-31
```

## Data Structure

The application fetches monitoring data from the GeoMOS API with the following structure:

```typescript
interface GeoMOSResult {
    Id: number;
    PointId: number;
    Epoch: string;
    Easting: number;
    Northing: number;
    Height: number;
    EastingDiff: number;
    NorthingDiff: number;
    HeightDiff: number;
    Type: number;
    EpochLocal: string;
    LongitudinalDisplacement: number;
    TransverseDisplacement: number;
    HeightDisplacement: number;
}
```

## Map Features

- **Projection**: EPSG:2056 (Swiss LV95 coordinate system)
- **Base Layer**: OpenStreetMap tiles (automatically reprojected)
- **Point Styling**: Red circles with white borders
- **Auto-zoom**: Automatically fits map extent to loaded points
- **Click Interaction**: Displays popup with point details:
  - Point ID
  - Epoch (timestamp)
  - Height
  - Height difference (mm)
  - Easting difference (mm)
  - Northing difference (mm)

## Technologies

- **TypeScript**: Type-safe JavaScript
- **OpenLayers**: Interactive map library (v10.3.1)
- **Proj4**: Coordinate projection library (v2.9.2)
- **esbuild**: Fast JavaScript bundler
- **Node.js**: Backend server runtime
- **OpenStreetMap**: Base map tiles

## Scripts

- `npm run build` - Build both client and server
- `npm start` - Start the production server
- `npm run dev` - Build and start in one command

## Configuration

### Coordinate System (EPSG:2056)
The Swiss LV95 coordinate system is defined in `src/map.ts`:
```typescript
proj4.defs('EPSG:2056', '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs +type=crs');
```

### Server Port
Default port is `3000`. Modify in `src/server.ts`:
```typescript
const PORT = 3000;
```

### API Base URL
The GeoMOS API base URL is configured in `src/server.ts`:
```typescript
const API_BASE = 'https://geomos.geoinfo.ch';
```

## Build Output

After running `npm run build`, the following files are generated in `dist/`:
- `bundle.js` - Client-side JavaScript bundle
- `bundle.js.map` - Source map for client bundle
- `server.js` - Server-side JavaScript
- `server.js.map` - Source map for server
- `index.html` - HTML page

## Troubleshooting

### CORS Errors
If you encounter CORS errors, ensure the proxy server is running and you're accessing the app through `http://localhost:3000`, not by opening `index.html` directly.

### Map Not Loading
1. Check browser console for errors
2. Verify the GeoMOS API is accessible
3. Ensure the date range in the API request contains data

### Points Not Displaying
1. Verify API response contains results
2. Check that coordinates are in EPSG:2056 format
3. Look for JavaScript errors in browser console

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
