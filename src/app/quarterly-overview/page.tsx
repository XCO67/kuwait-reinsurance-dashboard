'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  ChevronDown,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { formatKD, formatPct, formatNumber } from '@/lib/format';
import { ChatBot } from '@/components/chat/ChatBot';

interface QuarterlyData {
  quarter: number;
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
}

interface QuarterlyResponse {
  year: number;
  quarters: Record<number, QuarterlyData>;
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

interface FilterState {
  country: string[];
  hub: string[];
  region: string[];
  cedant: string[];
  broker: string[];
  insured: string[];
}

export default function QuarterlyOverviewPage() {
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('2021');
  const [availableYears, setAvailableYears] = useState<string[]>(['2019', '2020', '2021']);
  const [filterOptions, setFilterOptions] = useState<{
    country: string[];
    hub: string[];
    region: string[];
    cedant: string[];
    broker: string[];
    insured: string[];
  }>({
    country: [],
    hub: [],
    region: [],
    cedant: [],
    broker: [],
    insured: []
  });
  const [filters, setFilters] = useState<FilterState>({
    country: [],
    hub: [],
    region: [],
    cedant: [],
    broker: [],
    insured: []
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load dimensions for filter options
  useEffect(() => {
    const loadDimensions = async () => {
      try {
        console.log('Quarterly Overview - Loading dimensions...');
        const response = await fetch('/api/dimensions');
        const data = await response.json();
        console.log('Quarterly Overview - Dimensions loaded:', {
          countries: data.countries?.length || 0,
          hubs: data.hubs?.length || 0,
          regions: data.regions?.length || 0,
          cedants: data.cedants?.length || 0,
          brokers: data.brokers?.length || 0,
          insured: data.insureds?.length || 0,
          years: data.years?.length || 0
        });
        setFilterOptions({
          country: data.countries || [],
          hub: data.hubs || [],
          region: data.regions || [],
          cedant: data.cedants || [],
          broker: data.brokers || [],
          insured: data.insureds || []
        });
        setAvailableYears(data.years || []);
      } catch (error) {
        console.error('Quarterly Overview - Failed to load dimensions:', error);
      }
    };
    loadDimensions();
  }, []);

  // Load quarterly data when year changes
  useEffect(() => {
    const loadQuarterlyData = async () => {
      if (!selectedYear) return;
      
      setIsLoading(true);
      try {
        console.log('Quarterly Overview - Loading data for year:', selectedYear);
        const params = new URLSearchParams({
          year: selectedYear
        });

        const response = await fetch(`/api/quarterly?${params.toString()}`);
        console.log('Quarterly Overview - API response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Quarterly Overview - Data loaded:', {
          year: data.year,
          totalPolicies: data.total?.policyCount || 0,
          totalPremium: data.total?.premium || 0,
          quartersWithData: Object.keys(data.quarters || {}).length
        });
        
        setQuarterlyData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Quarterly Overview - Failed to load quarterly data:', error);
        setQuarterlyData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuarterlyData();
  }, [selectedYear]);

  const handleYearChange = (year: string) => {
    console.log('Quarterly Overview - Year changed to:', year);
    setSelectedYear(year);
  };

  const handleRefresh = () => {
    if (selectedYear) {
      const loadQuarterlyData = async () => {
        setIsLoading(true);
        try {
          console.log('Quarterly Overview - Refreshing data for year:', selectedYear);
          const params = new URLSearchParams({
            year: selectedYear
          });

          const response = await fetch(`/api/quarterly?${params.toString()}`);
          const data = await response.json();
          setQuarterlyData(data);
          setLastUpdated(new Date());
        } catch (error) {
          console.error('Quarterly Overview - Failed to refresh data:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadQuarterlyData();
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof FilterState, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      country: [],
      hub: [],
      region: [],
      cedant: [],
      broker: [],
      insured: []
    });
  };


  const getQuarterName = (quarter: number) => {
    const names = ['', 'Q1', 'Q2', 'Q3', 'Q4'];
    return names[quarter] || `Q${quarter}`;
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

  // Calculate trend indicators

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Title */}
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-foreground">Quarterly Overview</h1>
              <Badge variant="outline" className="text-xs">
                {selectedYear}
              </Badge>
              {Object.values(filters).flat().length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {Object.values(filters).flat().length} filters active
                </Badge>
              )}
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center space-x-4">
              {/* Year Selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">Year:</span>
                  <Select value={selectedYear} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-32 bg-primary/5 border-primary/20">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year} className="font-medium">
                          <div className="flex items-center space-x-2">
                            <span>{year}</span>
                            <Badge variant="outline" className="text-xs">
                              {year === '2019' ? '1,075 policies' : 
                               year === '2020' ? '1,165 policies' : 
                               year === '2021' ? '1,049 policies' : ''}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

      {/* Filter Bar */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          {/* Desktop Filters */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Country Filter */}
            <div className="min-w-[120px]">
              <Select
                value={filters.country.length > 0 ? filters.country[0] : 'all'}
                onValueChange={(value) => 
                  handleFilterChange('country', value === 'all' ? [] : [value])
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {filterOptions.country.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hub Filter */}
            <div className="min-w-[100px]">
              <Select
                value={filters.hub.length > 0 ? filters.hub[0] : 'all'}
                onValueChange={(value) => 
                  handleFilterChange('hub', value === 'all' ? [] : [value])
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Hub" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hubs</SelectItem>
                  {filterOptions.hub.map(hub => (
                    <SelectItem key={hub} value={hub}>
                      {hub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region Filter */}
            <div className="min-w-[100px]">
              <Select
                value={filters.region.length > 0 ? filters.region[0] : 'all'}
                onValueChange={(value) => 
                  handleFilterChange('region', value === 'all' ? [] : [value])
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {filterOptions.region.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </Button>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="md:hidden flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
              {Object.values(filters).some(arr => arr.length > 0) && (
                <Badge variant="secondary" className="text-xs">
                  {Object.values(filters).reduce((acc, arr) => acc + arr.length, 0)} active
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isFilterDrawerOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Drawer */}
        {isFilterDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t bg-muted/50 p-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Country Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Select
                  value={filters.country.length > 0 ? filters.country[0] : ""}
                  onValueChange={(value) => handleFilterChange('country', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    {filterOptions.country.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hub Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Hub</label>
                <Select
                  value={filters.hub.length > 0 ? filters.hub[0] : ""}
                  onValueChange={(value) => handleFilterChange('hub', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hub" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Hubs</SelectItem>
                    {filterOptions.hub.map(hub => (
                      <SelectItem key={hub} value={hub}>
                        {hub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Region</label>
                <Select
                  value={filters.region.length > 0 ? filters.region[0] : ""}
                  onValueChange={(value) => handleFilterChange('region', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Regions</SelectItem>
                    {filterOptions.region.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {Object.values(filters).flat().length} active filters
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsFilterDrawerOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Year Navigation Bar */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm font-medium text-muted-foreground">Quick Year Navigation:</span>
              {availableYears.map((year) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleYearChange(year)}
                  className="min-w-[100px] flex items-center space-x-2"
                >
                  <span className="font-medium">{year}</span>
                  <Badge variant="secondary" className="text-xs">
                    {year === '2019' ? '1,075' : 
                     year === '2020' ? '1,165' : 
                     year === '2021' ? '1,049' : ''}
                  </Badge>
                </Button>
              ))}
              <div className="text-xs text-muted-foreground ml-4">
                Click any year to view quarterly breakdown
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
              <span className="text-muted-foreground">Loading quarterly data for {selectedYear}...</span>
            </div>
          </div>
        )}

        {/* Quarterly Data Table */}
        {quarterlyData && !isLoading && (
          <div className="space-y-6">
            {/* Year Indicator */}
            <div className="mb-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-6 h-6 text-primary" />
                      <div>
                        <h2 className="text-2xl font-bold text-primary">Year {selectedYear}</h2>
                        <p className="text-sm text-muted-foreground">
                          Quarterly Performance Analysis
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Policies</div>
                      <div className="text-3xl font-bold text-primary">
                        {formatNumber(quarterlyData.total?.policyCount || 0)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Gross Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatKD(quarterlyData.total?.premium || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Loss Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <span className={getRatioColor(quarterlyData.total?.lossRatioPct || 0)}>
                      {formatPct(quarterlyData.total?.lossRatioPct || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Combined Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <span className={getRatioColor(quarterlyData.total?.combinedRatioPct || 0)}>
                      {formatPct(quarterlyData.total?.combinedRatioPct || 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quarterly Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Quarterly Performance Breakdown</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Quarter</TableHead>
                        <TableHead className="text-right font-semibold">Policies</TableHead>
                        <TableHead className="text-right font-semibold">Gross Premium</TableHead>
                        <TableHead className="text-right font-semibold">Acquisition Cost</TableHead>
                        <TableHead className="text-right font-semibold">Acq. Cost %</TableHead>
                        <TableHead className="text-right font-semibold">Incurred Claims</TableHead>
                        <TableHead className="text-right font-semibold">Loss Ratio</TableHead>
                        <TableHead className="text-right font-semibold">Technical Result</TableHead>
                        <TableHead className="text-right font-semibold">Combined Ratio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[1, 2, 3, 4].map((quarter) => {
                        const data = quarterlyData.quarters?.[quarter];
                        if (!data) return null;
                        
                        return (
                          <TableRow key={quarter} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                  {quarter}
                                </span>
                                <span>{getQuarterName(quarter)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatNumber(data.policyCount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatKD(data.premium)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatKD(data.acquisition)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={getRatioColor(data.acquisitionPct)}>
                                {formatPct(data.acquisitionPct)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatKD(data.incurredClaims)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={getRatioBadgeVariant(data.lossRatioPct)}>
                                {formatPct(data.lossRatioPct)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-mono text-sm ${data.technicalResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatKD(data.technicalResult)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={getRatioBadgeVariant(data.combinedRatioPct)}>
                                {formatPct(data.combinedRatioPct)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      
                      {/* Total Row */}
                      {quarterlyData.total && (
                        <TableRow className="bg-muted/50 font-semibold border-t-2">
                          <TableCell className="font-medium text-primary">
                            TOTAL
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(quarterlyData.total.policyCount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatKD(quarterlyData.total.premium)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatKD(quarterlyData.total.acquisition)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={getRatioColor(quarterlyData.total.acquisitionPct)}>
                              {formatPct(quarterlyData.total.acquisitionPct)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatKD(quarterlyData.total.incurredClaims)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={getRatioBadgeVariant(quarterlyData.total.lossRatioPct)}>
                              {formatPct(quarterlyData.total.lossRatioPct)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`font-mono ${quarterlyData.total.technicalResult >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {formatKD(quarterlyData.total.technicalResult)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={getRatioBadgeVariant(quarterlyData.total.combinedRatioPct)}>
                              {formatPct(quarterlyData.total.combinedRatioPct)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Data State */}
        {!quarterlyData && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Quarterly Data Available</h3>
            <p className="text-sm mb-4">No quarterly data available for the selected year</p>
            <div className="text-xs text-muted-foreground">
              <p>Selected year: {selectedYear}</p>
              <p>Available years: {availableYears.join(', ')}</p>
            </div>
          </div>
        )}
      </div>

      {/* ChatBot */}
      <ChatBot />
    </div>
  );
}