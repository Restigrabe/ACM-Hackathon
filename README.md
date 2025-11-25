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

---

## GeoMOS API Documentation

All API requests are proxied through the local server at `http://localhost:3000/api/*` to avoid CORS issues.

### Base Information

**API Version**: v1
**Base URL**: `http://localhost:3000/api/v1`
**Coordinate System**: EPSG:2056 (Swiss LV95)
**Date Format**: ISO 8601 (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)

---

### 1. Projects

```http
GET /api/v1/projectsjson
```

Returns list of all GeoMOS projects where Web API is activated.

---

### 2. Monitoring Points

#### Get All Points in Project
```http
GET /api/v1/projects/{projectId}/pointsjson
```

Returns all monitoring points with their reference coordinates (Easting, Northing, Height in EPSG:2056).

---

### 3. Measurement Results (Primary Data Source)

#### Get Results by Time Range
```http
GET /api/v1/projects/{projectId}/resultsjson?starttime={start}&endtime={end}
```

**Description**: Returns processed displacement results for all points in the specified time period. This is the main endpoint for monitoring movements over time.

**Example**:
```http
GET /api/v1/projects/5/resultsjson?starttime=2025-10-20&endtime=2025-10-31
```

**Response Example**:
```json
{
  "ApiStatusCode": 0,
  "ApiStatusMessage": "Ok",
  "Results": [
    {
      "Id": 12345,
      "PointId": 101,
      "Epoch": "2025-10-25T14:30:00Z",
      "EpochLocal": "2025-10-25T15:30:00",
      "Easting": 2660123.458,
      "Northing": 1190234.565,
      "Height": 285.120,
      "EastingDiff": 0.002,
      "NorthingDiff": -0.002,
      "HeightDiff": -0.003,
      "LongitudinalDisplacement": 0.0028,
      "TransverseDisplacement": 0.0014,
      "HeightDisplacement": -0.003,
      "Type": 1
    }
  ]
}
```

**Critical Fields for Movement Detection**:

| Field | Unit | Description |
|-------|------|-------------|
| `Epoch` | ISO 8601 | Measurement timestamp (UTC) |
| `EpochLocal` | ISO 8601 | Measurement timestamp (local time) |
| `Easting`, `Northing`, `Height` | meters | Current absolute coordinates |
| `EastingDiff` | meters | Displacement from reference in East-West direction |
| `NorthingDiff` | meters | Displacement from reference in North-South direction |
| `HeightDiff` | meters | Vertical displacement from reference (negative = settlement) |
| `LongitudinalDisplacement` | meters | Movement along monitoring profile line |
| `TransverseDisplacement` | meters | Movement perpendicular to profile line |
| `HeightDisplacement` | meters | Combined vertical movement indicator |
| `Type` | enum | Result type (1=automatic, 2=manual, etc.) |

**Important Notes**:
- All displacement values are in **meters** (multiply by 1000 for millimeters)
- Negative `HeightDiff` indicates settlement (downward movement)
- Reference point is typically the first measurement or a manually set baseline
- Typical monitoring precision: ±1-2mm for geodetic monitoring

#### Get Results by Specific Points
```http
GET /api/v1/projects/{projectId}/points/{pointIds}/resultsjson?starttime={start}&endtime={end}
```

**Description**: Returns results for specific monitoring points only.

**Example**:
```http
GET /api/v1/projects/5/points/134219468,134219461/resultsjson?starttime=2025-10-20&endtime=2025-10-31
```

**Use Case**: Filter data when you only want to analyze specific points instead of all points in the project.

---


## API Response Codes

All endpoints return an `ApiStatusCode` field:

| Code | Status | Description |
|------|--------|-------------|
| 0 | Ok | Request successful |
| 1 | Error | General error occurred |
| 2 | NoData | No data found for specified parameters |
| 3 | InvalidParameter | Invalid request parameters |
| 4 | Unauthorized | API key invalid or Web API not activated for project |

---

## Time Range Parameters

Most endpoints accept optional `starttime` and `endtime` parameters:
- **Format**: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss`
- **If omitted**: Returns latest available data
- **Time zone**: UTC in `Epoch` field, local time in `EpochLocal`

**Examples**:
- Last 7 days: `?starttime=2025-10-18&endtime=2025-10-25`
- Specific time: `?starttime=2025-10-25T00:00:00&endtime=2025-10-25T23:59:59`
- All data: omit parameters

---

## Additional Resources

- **Full API Documentation**: See `apidoc/` folder for complete reference
- **Coordinate System**: [Swiss LV95 (EPSG:2056)](https://epsg.io/2056)

---

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
