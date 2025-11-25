import "ol/ol.css";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import Map from "ol/Map";
import { get as getProjection } from "ol/proj";
import { register } from "ol/proj/proj4";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import { Circle, Fill, Stroke, Style } from "ol/style";
import View from "ol/View";
import proj4 from "proj4";
import LineString from "ol/geom/LineString";

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

interface GeoMOSResponse {
    ApiStatusCode: number;
    ApiStatusMessage: string;
    Results: GeoMOSResult[];
}

// Define EPSG:2056 (Swiss LV95 coordinate system)
proj4.defs("EPSG:2056", "+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs +type=crs");
register(proj4);

const projection = getProjection("EPSG:2056");
if (projection) {
    projection.setExtent([2485071.58, 1074261.72, 2837119.8, 1299941.79]);
}

// Create base layer (OSM)
const baseLayer = new TileLayer({
    source: new OSM(),
});

// Create vector source and layer for points
const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({
    source: vectorSource,
     style: (feature) => {
        const geom = feature.getGeometry();

        // Punkt (aktueller Messpunkt)
        if (geom instanceof Point) {
            return new Style({
                image: new Circle({
                    radius: 6,
                    fill: new Fill({ color: "rgba(184, 8, 38, 0.6)" }),
                    stroke: new Stroke({ color: "white", width: 2 }),
                }),
            });
        }

        // Linie (Verschiebungsvektor)
        return new Style({
            stroke: new Stroke({
                color: "black",
                width: 2,
            }),
        });
    },
});

// Create map
const map = new Map({
    target: "map",
    layers: [baseLayer, vectorLayer],
    view: new View({
        projection: projection!,
        center: [2660000, 1190000],
        zoom: 8,
    }),
});

const WARNING_THRESHOLD_MM = 10;   // 10 mm
const ALARM_THRESHOLD_MM = 20;    // 20 mm

function getAlarmLevel(result: GeoMOSResult): 'none' | 'warning' | 'alarm'{
    const vertMm = Math.abs(result.HeightDiff * 1000);
    const horizMm = Math.sqrt(
        result.EastingDiff * result.EastingDiff +
        result.NorthingDiff * result.NorthingDiff
    ) * 1000;

    const maxMm = Math.max(vertMm, horizMm);

    if (maxMm >= ALARM_THRESHOLD_MM) return 'alarm';
    if (maxMm >= WARNING_THRESHOLD_MM) return 'warning';
    return 'none';
}

function getMaxDisplacementMm(result: GeoMOSResult): number {
  const vertMm = Math.abs(result.HeightDiff * 1000);
  const horizMm = Math.sqrt(
    result.EastingDiff * result.EastingDiff +
    result.NorthingDiff * result.NorthingDiff
  ) * 1000;
  return Math.max(vertMm, horizMm);
}


// Fetch and display features
async function loadFeatures(): Promise<void> {
    try {
        const response = await fetch("/api/v1/projects/5/resultsjson?starttime=2025-10-20&endtime=2025-10-31");
        const data: GeoMOSResponse = await response.json();

        if (data.ApiStatusCode === 0 && data.Results) {
            const features: Feature[] = [];

            for (const result of data.Results) {
                // 1) Aktueller Punkt (verschobene Position)
                const currentCoord: [number, number] = [result.Easting, result.Northing];

                // 2) Referenzpunkt (ursprüngliche Lage)
                const refCoord: [number, number] = [
                    result.Easting - result.EastingDiff * 1000,
                    result.Northing - result.NorthingDiff * 1000,
                ];

                // 3) Feature: aktueller Punkt (für Popup etc.)
                const pointFeature = new Feature({
                    geometry: new Point(currentCoord),
                    id: result.Id,
                    pointId: result.PointId,
                    epoch: result.Epoch,
                    height: result.Height,
                    eastingDiff: result.EastingDiff,
                    northingDiff: result.NorthingDiff,
                    heightDiff: result.HeightDiff,
                });

                // 4) Feature: Verschiebungs-Linie (Original → aktuell)
                const displacementFeature = new Feature({
                    geometry: new LineString([refCoord, currentCoord]),
                    pointId: result.PointId,
                    epoch: result.Epoch,
                });

                // beide Features sammeln
                features.push(pointFeature, displacementFeature);
            }

            // Alle Features zur Karte hinzufügen
            vectorSource.addFeatures(features);

            // Zoom auf alle Features
            if (features.length > 0) {
                map.getView().fit(vectorSource.getExtent(), {
                    padding: [50, 50, 50, 50],
                    maxZoom: 16,
                });
            }

            // Anzeige der Anzahl Monitoring-Punkte (nicht Features!)
            const featureCountEl = document.getElementById("feature-count");
            if (featureCountEl) {
                featureCountEl.textContent = `Loaded ${features.length / 2} monitoring points`;
            }
        } else {
            const featureCountEl = document.getElementById("feature-count");
            if (featureCountEl) {
                featureCountEl.textContent = "Error loading data";
            }
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        const featureCountEl = document.getElementById("feature-count");
        if (featureCountEl) {
            featureCountEl.textContent = "Failed to load data";
        }
    }
}

// Add popup on click
const popup = document.createElement("div");
popup.className = "ol-popup";
popup.style.cssText = "position: absolute; background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: none; max-width: 250px; font-size: 12px;";
document.body.appendChild(popup);

map.on("click", function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
        return feature;
    });

    if (feature) {
        const geometry = feature.getGeometry();
        if (geometry instanceof Point) {
            const coords = geometry.getCoordinates();
            const pixel = map.getPixelFromCoordinate(coords);

            const pointId = feature.get("pointId");
            const epoch = feature.get("epoch");
            const height = feature.get("height");
            const heightDiff = feature.get("heightDiff");
            const eastingDiff = feature.get("eastingDiff");
            const northingDiff = feature.get("northingDiff");

            popup.innerHTML = `
                <strong>Point ID:</strong> ${pointId}<br>
                <strong>Epoch:</strong> ${new Date(epoch).toLocaleString()}<br>
                <strong>Height:</strong> ${height.toFixed(3)} m<br>
                <strong>Height Diff:</strong> ${(heightDiff * 1000).toFixed(2)} mm<br>
                <strong>Easting Diff:</strong> ${(eastingDiff * 1000).toFixed(2)} mm<br>
                <strong>Northing Diff:</strong> ${(northingDiff * 1000).toFixed(2)} mm
            `;
            popup.style.left = pixel[0] + "px";
            popup.style.top = (pixel[1] - 15) + "px";
            popup.style.display = "block";
        }
    } else {
        popup.style.display = "none";
    }
});

// Load features on startup
loadFeatures();
