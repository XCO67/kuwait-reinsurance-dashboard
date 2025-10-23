export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from 'fs';
import path from 'path';
import { ReinsuranceData } from '@/lib/schema';

// Cache for CSV data
let csvDataCache: ReinsuranceData[] | null = null;
let lastModified: number | null = null;

// Load CSV data with caching
async function loadCSVData(): Promise<ReinsuranceData[]> {
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

  console.log('World Map API - Loading CSV from path:', csvPath);
  console.log('World Map API - Current working directory:', process.cwd());

  // Check if we need to reload data
  const stats = await fs.stat(csvPath);
  const currentModified = stats.mtime.getTime();
  
  if (csvDataCache && lastModified && currentModified <= lastModified) {
    console.log('World Map API - Returning cached data:', csvDataCache.length, 'records');
    return csvDataCache;
  }

  console.log('World Map API - Reading CSV file...');
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  console.log('World Map API - CSV content length:', csvContent.length);

  const data = parseCSVData(csvContent);
  csvDataCache = data;
  lastModified = currentModified;
  
  console.log('World Map API - Parsed data:', data.length, 'records');
  return data;
}

// Parse CSV data with proper column mapping
function parseCSVData(csvContent: string): ReinsuranceData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  console.log('World Map API - CSV parsing:', {
    totalLines: lines.length,
    headers: headers.length,
    sampleHeaders: headers.slice(0, 10)
  });

  // Find column indices by header names
  const getColumnIndex = (headerName: string): number => {
    const index = headers.findIndex(h => h.toLowerCase().includes(headerName.toLowerCase()));
    return index >= 0 ? index : -1;
  };

  const uyIndex = getColumnIndex('UY');
  const extTypeIndex = getColumnIndex('Ext Type');
  const brokerIndex = getColumnIndex('Broker');
  const cedantIndex = getColumnIndex('Cedant');
  const orgInsuredIndex = getColumnIndex('Org.Insured/Trty Name');
  const maxLiabilityIndex = getColumnIndex('Max Liability');
  const grossUWPremIndex = getColumnIndex('Gross UW Prem');
  const grossBookPremIndex = getColumnIndex('Gross Book Prem');
  const grossActualAcqIndex = getColumnIndex('Gross Actual Acq');
  const grossPaidClaimsIndex = getColumnIndex('Gross paid claims');
  const grossOsLossIndex = getColumnIndex('Gross os loss');
  const countryIndex = getColumnIndex('Country');
  const regionIndex = getColumnIndex('Region');
  const hubIndex = getColumnIndex('Hub');
  const inceptionYearIndex = getColumnIndex('Inception Year');
  const inceptionQuarterIndex = getColumnIndex('Inception Quarter');
  const inceptionMonthIndex = getColumnIndex('Inception Month');
  const comDateIndex = getColumnIndex('Com date');

  console.log('World Map API - Column indices:', {
    uy: uyIndex,
    extType: extTypeIndex,
    broker: brokerIndex,
    cedant: cedantIndex,
    orgInsured: orgInsuredIndex,
    grossUWPrem: grossUWPremIndex,
    grossActualAcq: grossActualAcqIndex,
    grossPaidClaims: grossPaidClaimsIndex,
    grossOsLoss: grossOsLossIndex,
    country: countryIndex,
    region: regionIndex,
    hub: hubIndex,
    inceptionYear: inceptionYearIndex,
    inceptionQuarter: inceptionQuarterIndex,
    inceptionMonth: inceptionMonthIndex,
    comDate: comDateIndex
  });

  const data: ReinsuranceData[] = [];
  const countryCounts: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length < headers.length) {
      console.log(`World Map API - Skipping row ${i + 1}: insufficient values (${values.length} < ${headers.length})`);
      continue;
    }

    // Safe numeric parsing with fallback to 0
    const safeParseFloat = (value: string): number => {
      if (!value || value.trim() === '') return 0;
      const cleaned = value.replace(/[,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const safeParseInt = (value: string): number | null => {
      if (!value || value.trim() === '') return null;
      const cleaned = value.replace(/[,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : Math.floor(parsed);
    };

    const record: ReinsuranceData = {
      uy: values[uyIndex] || '',
      extType: values[extTypeIndex] || '',
      broker: values[brokerIndex] || '',
      cedant: values[cedantIndex] || '',
      orgInsuredTrtyName: values[orgInsuredIndex] || '',
      maxLiabilityFC: safeParseFloat(values[maxLiabilityIndex]),
      grossUWPrem: safeParseFloat(values[grossUWPremIndex]),
      grossBookPrem: safeParseFloat(values[grossBookPremIndex]),
      grossActualAcq: safeParseFloat(values[grossActualAcqIndex]),
      grossPaidClaims: safeParseFloat(values[grossPaidClaimsIndex]),
      grossOsLoss: safeParseFloat(values[grossOsLossIndex]),
      countryName: values[countryIndex] || '',
      region: values[regionIndex] || '',
      hub: values[hubIndex] || '',
      inceptionYear: safeParseInt(values[inceptionYearIndex]),
      inceptionQuarter: values[inceptionQuarterIndex] || '',
      inceptionMonth: values[inceptionMonthIndex] || '',
      comDate: values[comDateIndex] || ''
    };

    if (record.uy && record.countryName) {
      data.push(record);
      countryCounts[record.countryName] = (countryCounts[record.countryName] || 0) + 1;
    } else {
      console.log(`World Map API - Skipping row ${i + 1}: no UY or country value`);
    }
  }

  console.log('World Map API - CSV parsing complete:', {
    totalRecords: data.length,
    countryCounts: Object.keys(countryCounts).length,
    sampleRecord: data[0]
  });

  return data;
}

export async function GET(req: Request) {
  try {
    console.log('World Map API - GET request:', req.url);

    const allData = await loadCSVData();
    console.log('World Map API - Loaded data:', allData.length, 'records');

    // Group data by country
    const countryGroups: Record<string, ReinsuranceData[]> = {};

    allData.forEach(record => {
      if (record.countryName) {
        if (!countryGroups[record.countryName]) {
          countryGroups[record.countryName] = [];
        }
        countryGroups[record.countryName].push(record);
      }
    });

    console.log('World Map API - Country groups:', {
      totalCountries: Object.keys(countryGroups).length,
      sampleCountries: Object.keys(countryGroups).slice(0, 5)
    });

    // Calculate country metrics
    const countries: Array<{
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
    }> = [];
    let totalPolicyCount = 0;
    let totalPremium = 0;
    let totalAcquisition = 0;
    let totalPaidClaims = 0;
    let totalOsLoss = 0;

    // Process each country
    Object.entries(countryGroups).forEach(([countryName, countryData]) => {
      // Core measures
      const policyCount = countryData.length;
      const premium = countryData.reduce((sum, record) => sum + (record.grossUWPrem || 0), 0);
      const acquisition = countryData.reduce((sum, record) => sum + (record.grossActualAcq || 0), 0);
      const paidClaims = countryData.reduce((sum, record) => sum + (record.grossPaidClaims || 0), 0);
      const osLoss = countryData.reduce((sum, record) => sum + (record.grossOsLoss || 0), 0);
      
      // Derived measures
      const incurredClaims = paidClaims + osLoss;
      const technicalResult = premium - incurredClaims - acquisition;
      
      // Ratio calculations with guard against division by zero
      const lossRatioPct = premium > 0 ? (incurredClaims / premium) * 100 : 0;
      const acquisitionPct = premium > 0 ? (acquisition / premium) * 100 : 0;
      const combinedRatioPct = lossRatioPct + acquisitionPct;

      // Get unique brokers, cedants, regions, hubs
      const brokers = [...new Set(countryData.map(r => r.broker).filter(b => b && b.trim()))];
      const cedants = [...new Set(countryData.map(r => r.cedant).filter(c => c && c.trim()))];
      const regions = [...new Set(countryData.map(r => r.region).filter(r => r && r.trim()))];
      const hubs = [...new Set(countryData.map(r => r.hub).filter(h => h && h.trim()))];

      countries.push({
        country: countryName,
        policyCount,
        premium,
        acquisition,
        paidClaims,
        osLoss,
        incurredClaims,
        technicalResult,
        lossRatioPct,
        acquisitionPct,
        combinedRatioPct,
        brokers,
        cedants,
        regions,
        hubs
      });

      // Accumulate totals
      totalPolicyCount += policyCount;
      totalPremium += premium;
      totalAcquisition += acquisition;
      totalPaidClaims += paidClaims;
      totalOsLoss += osLoss;
    });

    // Calculate totals
    const totalIncurredClaims = totalPaidClaims + totalOsLoss;
    const totalTechnicalResult = totalPremium - totalIncurredClaims - totalAcquisition;
    const totalLossRatioPct = totalPremium > 0 ? (totalIncurredClaims / totalPremium) * 100 : 0;
    const totalAcquisitionPct = totalPremium > 0 ? (totalAcquisition / totalPremium) * 100 : 0;
    const totalCombinedRatioPct = totalLossRatioPct + totalAcquisitionPct;

    const result = {
      countries,
      total: {
        policyCount: totalPolicyCount,
        premium: totalPremium,
        acquisition: totalAcquisition,
        paidClaims: totalPaidClaims,
        osLoss: totalOsLoss,
        incurredClaims: totalIncurredClaims,
        technicalResult: totalTechnicalResult,
        lossRatioPct: totalLossRatioPct,
        acquisitionPct: totalAcquisitionPct,
        combinedRatioPct: totalCombinedRatioPct
      }
    };

    console.log('World Map API - Final result:', {
      totalCountries: countries.length,
      totalPolicies: result.total.policyCount,
      totalPremium: result.total.premium,
      topCountries: countries.slice(0, 5).map(c => ({ country: c.country, policies: c.policyCount }))
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('World Map API - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch world map data' }, { status: 500 });
  }
}


