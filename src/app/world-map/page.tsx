'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Map,
  Download,
  RefreshCw,
  Loader2,
  Clock,
  Globe,
  Users,
  DollarSign,
  AlertTriangle,
  Target,
  TrendingUp,
  Building,
  BarChart3
} from 'lucide-react';
import { formatKD, formatPct, formatNumber } from '@/lib/format';
import { ChatBot } from '@/components/chat/ChatBot';
import WorldMap from '@/components/charts/WorldMap';

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

interface WorldMapResponse {
  countries: CountryData[];
  total: {
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
  };
}


export default function WorldMapPage() {
  const [worldData, setWorldData] = useState<WorldMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);

  // Load world map data
  useEffect(() => {
    const loadWorldData = async () => {
      setIsLoading(true);
      try {
        console.log('World Map - Loading world data...');
        const response = await fetch('/api/world-map');
        console.log('World Map - API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('World Map - Data loaded:', {
          totalCountries: data.countries?.length || 0,
          totalPolicies: data.total?.policyCount || 0,
          totalPremium: data.total?.premium || 0
        });
        
        setWorldData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('World Map - Failed to load world data:', error);
        setWorldData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorldData();
  }, []);

  const handleRefresh = () => {
    const loadWorldData = async () => {
      setIsLoading(true);
      try {
        console.log('World Map - Refreshing data...');
        const response = await fetch('/api/world-map');
        const data = await response.json();
        setWorldData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('World Map - Failed to refresh data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWorldData();
  };

  // Get color class for ratio metrics
  const getRatioColor = (value: number) => {
    if (value > 100) return 'text-red-600';
    if (value > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get badge variant for ratios
  const getRatioBadgeVariant = (value: number) => {
    if (value > 100) return 'destructive';
    if (value > 80) return 'secondary';
    return 'default';
  };

  // Get country color based on policy count
  const getCountryColor = (policyCount: number, maxPolicies: number) => {
    if (policyCount === 0) return '#e5e7eb'; // Gray for no data
    const intensity = Math.min(policyCount / maxPolicies, 1);
    const hue = 120 - (intensity * 60); // Green to yellow
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Get top countries by policy count
  const topCountries = useMemo(() => {
    if (!worldData?.countries) return [];
    return worldData.countries
      .sort((a, b) => b.policyCount - a.policyCount)
      .slice(0, 10);
  }, [worldData]);

  // Get max policy count for color scaling
  const maxPolicies = useMemo(() => {
    if (!worldData?.countries) return 1;
    return Math.max(...worldData.countries.map(c => c.policyCount));
  }, [worldData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Title */}
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-foreground">World Map</h1>
              <Badge variant="outline" className="text-xs">
                Global Coverage
              </Badge>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>

              {/* Last Updated */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">Loading world map data...</span>
            </div>
          </div>
        )}

        {/* World Map Data */}
        {worldData && !isLoading && (
          <div className="space-y-6">
            {/* Country Count */}
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {worldData.countries?.length || 0} Countries
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Active markets worldwide
              </div>
            </div>

            {/* Interactive World Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    <span>Global Policy Distribution</span>
                    <Badge variant="outline" className="text-xs">
                      Click countries to view details
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {selectedCountry && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCountry(null)}
                      >
                        Clear Selection
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  
                  {/* D3 World Map */}
                  <WorldMap
                    data={worldData.countries || []}
                    onCountryHover={setHoveredCountry}
                    onCountryClick={setSelectedCountry}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hovered Country Quick Info */}
            {hoveredCountry && !selectedCountry && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: getCountryColor(hoveredCountry.policyCount, maxPolicies) }}
                      />
                      <div>
                        <h4 className="font-semibold text-lg">{hoveredCountry.country}</h4>
                        <p className="text-sm text-muted-foreground">Hover for quick details</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{formatNumber(hoveredCountry.policyCount)}</div>
                      <div className="text-sm text-muted-foreground">Policies</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Top Countries Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Top Countries by Policy Count</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-semibold">Rank</th>
                        <th className="text-left py-2 font-semibold">Country</th>
                        <th className="text-right py-2 font-semibold">Policies</th>
                        <th className="text-right py-2 font-semibold">Premium</th>
                        <th className="text-right py-2 font-semibold">Loss Ratio</th>
                        <th className="text-right py-2 font-semibold">Brokers</th>
                        <th className="text-right py-2 font-semibold">Cedants</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCountries.map((country, index) => (
                        <tr key={country.country} className="border-b hover:bg-muted/30">
                          <td className="py-2">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getCountryColor(country.policyCount, maxPolicies) }}
                              />
                              <span className="font-medium">{country.country}</span>
                            </div>
                          </td>
                          <td className="text-right py-2 font-mono text-sm">
                            {formatNumber(country.policyCount)}
                          </td>
                          <td className="text-right py-2 font-mono text-sm">
                            {formatKD(country.premium)}
                          </td>
                          <td className="text-right py-2">
                            <Badge variant={getRatioBadgeVariant(country.lossRatioPct)}>
                              {formatPct(country.lossRatioPct)}
                            </Badge>
                          </td>
                          <td className="text-right py-2 text-sm">
                            {country.brokers.length}
                          </td>
                          <td className="text-right py-2 text-sm">
                            {country.cedants.length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!worldData && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Map className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No World Map Data Available</h3>
            <p className="text-sm mb-4">No country data available for world map visualization</p>
          </div>
        )}
      </div>

      {/* ChatBot */}
      <ChatBot />
    </div>
  );
}
