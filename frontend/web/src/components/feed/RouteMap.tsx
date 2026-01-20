import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/context/ThemeContext';

interface RouteMapProps {
    coordinates: [number, number][]; // [longitude, latitude]
    className?: string;
    interactive?: boolean;
}

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

export default function RouteMap({ coordinates, className = '', interactive = false }: RouteMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const { theme } = useTheme();
    const currentStyle = useRef<string>('');

    useEffect(() => {
        if (!mapContainer.current || coordinates.length === 0) return;

        const style = theme.mode === 'dark'
            ? `https://api.maptiler.com/maps/019b1d6d-f87f-771b-88b8-776fa8f37312/style.json?key=${MAPTILER_KEY}`
            : `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_KEY}`;

        const addLayers = (targetMap: maplibregl.Map) => {
            if (targetMap.getSource('route')) return;

            targetMap.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates,
                    },
                },
            });

            targetMap.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': theme.colors.primary,
                    'line-width': 4,
                    'line-opacity': 0.8,
                },
            });

            // Fit bounds
            const bounds = coordinates.reduce((acc, coord) => {
                return acc.extend(coord);
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

            targetMap.fitBounds(bounds, {
                padding: 20,
                animate: false,
            });
        };

        if (!map.current) {
            currentStyle.current = style;
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: style,
                interactive: interactive,
                attributionControl: false,
            });

            map.current.on('load', () => {
                if (!map.current) return;
                addLayers(map.current);
            });
        } else {
            // If style changed, we need to set it and re-add layers
            if (currentStyle.current !== style) {
                currentStyle.current = style;
                map.current.setStyle(style);

                // Wait for new style to load before re-adding layers
                map.current.once('styledata', () => {
                    if (!map.current) return;
                    addLayers(map.current);
                });
            } else {
                // Just update coordinates if they changed
                const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
                if (source) {
                    source.setData({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates,
                        },
                    });
                }

                // Update line color
                if (map.current.getLayer('route')) {
                    map.current.setPaintProperty('route', 'line-color', theme.colors.primary);
                }
            }
        }

        return () => {
            // No cleanup here to keep the map instance alive between re-renders
        };
    }, [coordinates, theme.mode, theme.colors.primary, interactive]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={mapContainer}
            className={`w-full h-full ${className}`}
            style={{ overflow: 'hidden' }}
        />
    );
}
