export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import { ReinsuranceData } from '@/lib/schema';

// Cache for CSV data to avoid re-reading on every request
let csvDataCache: ReinsuranceData[] | null = null;
let lastModified: number | null = null;

/**
 * Parse CSV data and convert to ReinsuranceData format
 */
function parseCSVData(csvContent: string): ReinsuranceData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  console.log('API - CSV parsing:', {
    totalLines: lines.length,
    headers: headers.length,
    sampleHeaders: headers.slice(0, 5)
  });
  
  const data: ReinsuranceData[] = [];
  const yearCounts: Record<string, number> = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',');
    
    // Skip if not enough values
    if (values.length < headers.length) {
      console.log(`API - Skipping row ${i + 1}: insufficient values (${values.length} < ${headers.length})`);
      continue;
    }
    
    try {
      const record: ReinsuranceData = {
        uy: values[2]?.trim() || '', // UY column
        extType: values[4]?.trim() || '', // Ext Type column
        broker: values[11]?.trim() || '', // Broker column
        cedant: values[12]?.trim() || '', // Cedant column
        orgInsuredTrtyName: values[13]?.trim() || '', // Org.Insured/Trty Name column
        maxLiabilityFC: parseFloat(values[16]) || 0, // Max Liability (FC) column
        grossUWPrem: parseFloat(values[17]) || 0, // Gross UW Prem column
        grossBookPrem: parseFloat(values[18]) || 0, // Gross Book Prem column
        grossActualAcq: parseFloat(values[19]) || 0, // Gross Actual Acq. column
        grossPaidClaims: parseFloat(values[20]) || 0, // Gross paid claims column
        grossOsLoss: parseFloat(values[21]) || 0, // Gross os loss column
        countryName: values[10]?.trim() || '', // Country column
        region: values[44]?.trim() || '', // Region column
        hub: values[45]?.trim() || '', // Hub column
        inceptionYear: parseFloat(values[32]) || undefined, // Inception Year column
        inceptionQuarter: values[31]?.trim() || undefined, // Inception Quarter column
        inceptionMonth: values[30]?.trim() || undefined, // Inception Month column
        comDate: values[7]?.trim() || undefined, // Com date column
      };
      
      // Only add valid records (must have UY)
      if (record.uy) {
        data.push(record);
        yearCounts[record.uy] = (yearCounts[record.uy] || 0) + 1;
      } else {
        console.log(`API - Skipping row ${i + 1}: no UY value`);
      }
    } catch (error) {
      console.warn(`API - Error parsing CSV row ${i + 1}:`, error);
      continue;
    }
  }
  
  console.log('API - CSV parsing complete:', {
    totalRecords: data.length,
    yearCounts: yearCounts,
    sampleRecord: data[0]
  });
  
  return data;
}

/**
 * Load CSV data with caching
 */
async function loadCSVData(): Promise<ReinsuranceData[]> {
  // Try multiple possible paths for the CSV file
  const possiblePaths = [
    path.join(process.cwd(), 'Dataset_2019_2021_clean_for_code.csv'),
    path.join(process.cwd(), '..', 'Dataset_2019_2021_clean_for_code.csv'),
    path.join(process.cwd(), '..', '..', 'Dataset_2019_2021_clean_for_code.csv'),
    path.join(process.cwd(), 'src', 'Dataset_2019_2021_clean_for_code.csv'),
    path.join(process.cwd(), 'frontend', 'Dataset_2019_2021_clean_for_code.csv')
  ];
  
  let csvPath = '';
  for (const testPath of possiblePaths) {
    try {
      await fs.stat(testPath);
      csvPath = testPath;
      break;
    } catch {
      // Continue to next path
    }
  }
  
  if (!csvPath) {
    throw new Error(`CSV file not found. Tried paths: ${possiblePaths.join(', ')}`);
  }
  
  try {
    console.log('API - Loading CSV from path:', csvPath);
    console.log('API - Current working directory:', process.cwd());
    const stats = await fs.stat(csvPath);
    const currentModified = stats.mtime.getTime();
    
    // Return cached data if file hasn't changed
    if (csvDataCache && lastModified && currentModified === lastModified) {
      console.log('API - Returning cached data:', csvDataCache.length, 'records');
      return csvDataCache;
    }
    
    // Read and parse CSV file
    console.log('API - Reading CSV file...');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    console.log('API - CSV content length:', csvContent.length);
    
    const data = parseCSVData(csvContent);
    console.log('API - Parsed data:', data.length, 'records');
    
    // Cache the data
    csvDataCache = data;
    lastModified = currentModified;
    
    return data;
  } catch (error) {
    console.error('API - Error loading CSV data:', error);
    return [];
  }
}

/**
 * Shuffle array to get random sample
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Filter data based on query parameters
 */
function filterData(data: ReinsuranceData[], params: URLSearchParams): ReinsuranceData[] {
  let filteredData = [...data];
  
  // Filter by year (UY)
  const year = params.get('year');
  if (year) {
    filteredData = filteredData.filter(record => record.uy === year);
  }
  
  // Filter by country
  const country = params.get('country');
  if (country) {
    filteredData = filteredData.filter(record => 
      record.countryName.toLowerCase().includes(country.toLowerCase())
    );
  }
  
  // Filter by hub
  const hub = params.get('hub');
  if (hub) {
    filteredData = filteredData.filter(record => 
      record.hub.toLowerCase().includes(hub.toLowerCase())
    );
  }
  
  // Filter by region
  const region = params.get('region');
  if (region) {
    filteredData = filteredData.filter(record => 
      record.region.toLowerCase().includes(region.toLowerCase())
    );
  }
  
  // Filter by cedant
  const cedant = params.get('cedant');
  if (cedant) {
    filteredData = filteredData.filter(record => 
      record.cedant.toLowerCase().includes(cedant.toLowerCase())
    );
  }
  
  // Filter by insured
  const insured = params.get('insured');
  if (insured) {
    filteredData = filteredData.filter(record => 
      record.orgInsuredTrtyName.toLowerCase().includes(insured.toLowerCase())
    );
  }
  
  return filteredData;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    console.log('API - GET request:', req.url);
    
    // Get limit parameter
    const limitParam = params.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 2000;
    
    // Check for force reload parameter
    const forceReload = params.get('forceReload') === 'true';
    if (forceReload) {
      csvDataCache = null;
      lastModified = null;
    }
    
    // Load CSV data
    const allData = await loadCSVData();
    console.log('API - Loaded data:', allData.length, 'records');
    
    // Apply filters
    const filteredData = filterData(allData, params);
    console.log('API - Filtered data:', filteredData.length, 'records');
    
    // Shuffle to get representative sample from all years
    const shuffledData = shuffleArray(filteredData);
    
    // Apply limit
    const limitedData = shuffledData.slice(0, limit);
    console.log('API - Limited data:', limitedData.length, 'records');
    
    return NextResponse.json({
      data: limitedData,
      total: filteredData.length,
      returned: limitedData.length,
      filters: {
        year: params.get('year'),
        country: params.get('country'),
        hub: params.get('hub'),
        region: params.get('region'),
        cedant: params.get('cedant'),
        insured: params.get('insured')
      },
      message: `Loaded ${limitedData.length} records from CSV dataset`
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 });
  }
}