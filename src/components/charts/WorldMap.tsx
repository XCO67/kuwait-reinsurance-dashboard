'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { formatKD, formatPct, formatNumber } from '@/lib/format';

interface CountryData {
  country: string;
  policyCount: number;
  premium: number;
  acquisition: number;
  paidClaims: number;
  osLoss: number;
  incurredClaims: number;
  technicalResult: number;
  lossRatioPct: number;
  acquisitionPct: number;
  combinedRatioPct: number;
  brokers: string[];
  cedants: string[];
  regions: string[];
  hubs: string[];
}

interface WorldMapProps {
  data: CountryData[];
  onCountryHover?: (country: CountryData | null) => void;
  onCountryClick?: (country: CountryData | null) => void;
}

export default function WorldMap({ data, onCountryHover, onCountryClick }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const loadingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    country: CountryData;
  } | null>(null);

  // Create a map of country data for quick lookup (memoized)
  const countryDataMap = useMemo(() => {
    const map = new Map<string, CountryData>();
    data.forEach(country => {
      map.set(country.country.toLowerCase(), country);
    });
    return map;
  }, [data]);

  // Get max policy count for color scaling (memoized)
  const maxPolicies = useMemo(() => {
    return Math.max(...data.map(d => d.policyCount));
  }, [data]);

  // Color scale function (memoized)
  const getColor = useMemo(() => {
    return (policyCount: number) => {
      if (policyCount === 0) return '#f8fafc'; // Very light gray for no data
      
      // Create a vibrant color scale from cyan to red based on policy count
      const intensity = Math.min(policyCount / maxPolicies, 1);
      
      if (intensity < 0.1) return '#06b6d4'; // Cyan
      if (intensity < 0.2) return '#0891b2'; // Dark cyan
      if (intensity < 0.3) return '#0ea5e9'; // Sky blue
      if (intensity < 0.4) return '#0284c7'; // Blue
      if (intensity < 0.5) return '#0369a1'; // Dark blue
      if (intensity < 0.6) return '#1d4ed8'; // Indigo
      if (intensity < 0.7) return '#7c3aed'; // Violet
      if (intensity < 0.8) return '#c026d3'; // Purple
      if (intensity < 0.9) return '#e11d48'; // Pink-red
      return '#dc2626'; // Red for highest policy count
    };
  }, [maxPolicies]);

  // Handle zoom and pan with mouse-centered zoom
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(5, zoom * delta));
    
    // Get mouse position relative to SVG
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      const mouseX = event.clientX - svgRect.left;
      const mouseY = event.clientY - svgRect.top;
      
      // Calculate the point in the map coordinates before zoom
      const mapX = (mouseX - pan.x) / zoom;
      const mapY = (mouseY - pan.y) / zoom;
      
      // Calculate new pan to keep the same point under the mouse
      const newPanX = mouseX - mapX * newZoom;
      const newPanY = mouseY - mapY * newZoom;
      
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setZoom(newZoom);
    }
  }, [zoom, pan]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    // Start dragging on any mouse down, but countries will prevent it
    setIsDragging(true);
    setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
    event.preventDefault();
  }, [pan]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDragging) {
      const newPanX = event.clientX - dragStart.x;
      const newPanY = event.clientY - dragStart.y;
      setPan({ x: newPanX, y: newPanY });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const loadWorldMap = async () => {
      if (!svgRef.current || loadingRef.current) return;
      
      loadingRef.current = true;
      setIsLoading(true);

      try {
        // Load world topology data - try multiple sources
        let world;
        try {
          world = await d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
        } catch {
          console.log('First source failed, trying alternative...');
          try {
            world = await d3.json('https://raw.githubusercontent.com/d3/d3.github.io/master/world-110m.v1.json');
          } catch {
            console.log('Second source failed, using fallback...');
            // Fallback to a simple world map
            world = {
              type: "FeatureCollection",
              features: []
            };
          }
        }
        
        if (!world || !(world as { features?: unknown[] }).features) {
          console.error('Failed to load world data');
          setIsLoading(false);
          return;
        }

        // Clear previous content
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current);
        const width = 960;
        const height = 500;

        svg.attr('viewBox', `0 0 ${width} ${height}`);

        // Create projection
        const projection = d3.geoNaturalEarth1()
          .scale(150)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // Create a group for zoom/pan transformations
        const mapGroup = svg.append('g')
          .attr('class', 'map-group');

        // Add zoom and pan event listeners
        svg.on('wheel', handleWheel)
          .on('mousedown', handleMouseDown)
          .on('mousemove', handleMouseMove)
          .on('mouseup', handleMouseUp)
          .on('mouseleave', handleMouseLeave)
          .style('cursor', isDragging ? 'grabbing' : 'grab');

        // Use GeoJSON directly (no need for feature extraction)
        const countries = world;

        // Create country paths
        mapGroup.selectAll('path')
          .data((countries as { features: unknown[] }).features)
          .enter()
          .append('path')
          .attr('d', (d: unknown) => path(d as any)) // eslint-disable-line @typescript-eslint/no-explicit-any
          .attr('fill', (d: unknown) => {
            const data = d as { properties: { NAME?: string; NAME_LONG?: string; name?: string; ADMIN?: string } };
            const countryName = data.properties.NAME || data.properties.NAME_LONG || data.properties.name || data.properties.ADMIN;
            const countryData = countryDataMap.get(countryName?.toLowerCase() || '');
            return countryData ? getColor(countryData.policyCount) : '#f8fafc';
          })
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 0.8)
          .style('cursor', 'pointer')
          .style('transition', 'all 0.2s ease')
          .on('mouseover', function(event, d: unknown) {
            const data = d as { properties: { NAME?: string; NAME_LONG?: string; name?: string; ADMIN?: string } };
            const countryName = data.properties.NAME || data.properties.NAME_LONG || data.properties.name || data.properties.ADMIN;
            const countryData = countryDataMap.get(countryName?.toLowerCase() || '');
            
            if (countryData) {
              // Enhanced highlight on hover
              d3.select(this)
                .attr('stroke', '#1d4ed8')
                .attr('stroke-width', 2.5)
                .style('filter', 'brightness(1.1) drop-shadow(0 0 8px rgba(29, 78, 216, 0.6))');

              // Show tooltip with better positioning
              const [x, y] = d3.pointer(event, svgRef.current);
              setTooltip({
                x: x + 15,
                y: y - 15,
                country: countryData
              });

              onCountryHover?.(countryData);
            }
          })
          .on('mouseout', function() {
            // Remove highlight with smooth transition
            d3.select(this)
              .attr('stroke', '#ffffff')
              .attr('stroke-width', 0.8)
              .style('filter', 'none');

            // Hide tooltip
            setTooltip(null);
            onCountryHover?.(null);
          })
          .on('click', function(event, d: unknown) {
            const data = d as { properties: { NAME?: string; NAME_LONG?: string; name?: string; ADMIN?: string } };
            // Prevent drag when clicking on countries
            event.stopPropagation();
            const countryName = data.properties.NAME || data.properties.NAME_LONG || data.properties.name || data.properties.ADMIN;
            const countryData = countryDataMap.get(countryName?.toLowerCase() || '');
            onCountryClick?.(countryData || null);
          })
          .on('mousedown', function(event) {
            // Prevent drag when clicking on countries
            event.stopPropagation();
            setIsDragging(false);
          });

        // No country labels - only color coding

        setIsLoading(false);
        loadingRef.current = false;
      } catch (error) {
        console.error('Error loading world map:', error);
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadWorldMap();
  }, [data, countryDataMap, maxPolicies, getColor, handleWheel, handleMouseDown, handleMouseMove, isDragging, onCountryClick, onCountryHover]); // Depend on memoized values

  // Apply zoom and pan transformations
  useEffect(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const mapGroup = svg.select('.map-group');
      
      if (mapGroup.node()) {
        mapGroup.attr('transform', `translate(${pan.x}, ${pan.y}) scale(${zoom})`);
      }
    }
  }, [zoom, pan]);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const newPanX = event.clientX - dragStart.x;
        const newPanY = event.clientY - dragStart.y;
        setPan({ x: newPanX, y: newPanY });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => {
            const newZoom = Math.min(5, zoom * 1.2);
            if (svgRef.current) {
              const svgRect = svgRef.current.getBoundingClientRect();
              const centerX = svgRect.width / 2;
              const centerY = svgRect.height / 2;
              
              // Calculate the point in the map coordinates before zoom
              const mapX = (centerX - pan.x) / zoom;
              const mapY = (centerY - pan.y) / zoom;
              
              // Calculate new pan to keep the center point fixed
              const newPanX = centerX - mapX * newZoom;
              const newPanY = centerY - mapY * newZoom;
              
              setZoom(newZoom);
              setPan({ x: newPanX, y: newPanY });
            } else {
              setZoom(newZoom);
            }
          }}
          className="w-8 h-8 bg-background border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          title="Zoom In"
        >
          <span className="text-sm font-bold">+</span>
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(0.5, zoom * 0.8);
            if (svgRef.current) {
              const svgRect = svgRef.current.getBoundingClientRect();
              const centerX = svgRect.width / 2;
              const centerY = svgRect.height / 2;
              
              // Calculate the point in the map coordinates before zoom
              const mapX = (centerX - pan.x) / zoom;
              const mapY = (centerY - pan.y) / zoom;
              
              // Calculate new pan to keep the center point fixed
              const newPanX = centerX - mapX * newZoom;
              const newPanY = centerY - mapY * newZoom;
              
              setZoom(newZoom);
              setPan({ x: newPanX, y: newPanY });
            } else {
              setZoom(newZoom);
            }
          }}
          className="w-8 h-8 bg-background border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          title="Zoom Out"
        >
          <span className="text-sm font-bold">−</span>
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 bg-background border rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          title="Reset View"
        >
          <span className="text-xs">⌂</span>
        </button>
      </div>


      {/* Color Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm rounded-md p-3 text-sm">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Policy Count</div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f8fafc' }}></div>
          <span className="text-xs text-muted-foreground">0</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#06b6d4' }}></div>
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#1d4ed8' }}></div>
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: '#dc2626' }}></div>
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading world map...</span>
          </div>
        </div>
      )}

      {/* Enhanced Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-background/95 backdrop-blur-sm border rounded-xl shadow-2xl p-5 max-w-sm pointer-events-none animate-in fade-in-0 zoom-in-95 duration-200"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 400),
            top: Math.max(tooltip.y - 200, 10),
          }}
        >
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center space-x-3 pb-2 border-b">
              <div 
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: getColor(tooltip.country.policyCount) }}
              />
              <h4 className="font-bold text-lg">{tooltip.country.country}</h4>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Policies</div>
                <div className="font-bold text-lg">{formatNumber(tooltip.country.policyCount)}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-muted-foreground text-xs uppercase tracking-wide">Premium</div>
                <div className="font-bold text-lg">{formatKD(tooltip.country.premium)}</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Loss Ratio</span>
                <span className={`font-semibold ${
                  tooltip.country.lossRatioPct > 100 ? 'text-red-600' :
                  tooltip.country.lossRatioPct > 80 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formatPct(tooltip.country.lossRatioPct)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Combined Ratio</span>
                <span className={`font-semibold ${
                  tooltip.country.combinedRatioPct > 100 ? 'text-red-600' :
                  tooltip.country.combinedRatioPct > 80 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {formatPct(tooltip.country.combinedRatioPct)}
                </span>
              </div>
            </div>

            {/* Partners */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center bg-muted/30 rounded-lg p-2">
                <div className="font-semibold text-lg">{tooltip.country.brokers.length}</div>
                <div className="text-muted-foreground">Brokers</div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-2">
                <div className="font-semibold text-lg">{tooltip.country.cedants.length}</div>
                <div className="text-muted-foreground">Cedants</div>
              </div>
              <div className="text-center bg-muted/30 rounded-lg p-2">
                <div className="font-semibold text-lg">{tooltip.country.regions.length}</div>
                <div className="text-muted-foreground">Regions</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* World Map SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full border rounded-lg bg-muted/10"
        style={{ 
          minHeight: '500px', 
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      />


    </div>
  );
}
