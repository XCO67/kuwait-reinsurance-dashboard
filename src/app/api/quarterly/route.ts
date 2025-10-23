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

  console.log('Quarterly API - Loading CSV from path:', csvPath);
  console.log('Quarterly API - Current working directory:', process.cwd());

  // Check if we need to reload data
  const stats = await fs.stat(csvPath);
  const currentModified = stats.mtime.getTime();
  
  if (csvDataCache && lastModified && currentModified <= lastModified) {
    console.log('Quarterly API - Returning cached data:', csvDataCache.length, 'records');
    return csvDataCache;
  }

  console.log('Quarterly API - Reading CSV file...');
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  console.log('Quarterly API - CSV content length:', csvContent.length);

  const data = parseCSVData(csvContent);
  csvDataCache = data;
  lastModified = currentModified;
  
  console.log('Quarterly API - Parsed data:', data.length, 'records');
  return data;
}

// Parse CSV data with proper column mapping
function parseCSVData(csvContent: string): ReinsuranceData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  console.log('Quarterly API - CSV parsing:', {
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

  console.log('Quarterly API - Column indices:', {
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
  const yearCounts: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length < headers.length) {
      console.log(`Quarterly API - Skipping row ${i + 1}: insufficient values (${values.length} < ${headers.length})`);
      continue;
    }

    // Safe numeric parsing with fallback to 0
    const safeParseFloat = (value: string): number => {
      if (!value || value.trim() === '') return 0;
      const cleaned = value.replace(/[,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    const safeParseInt = (value: string): number | undefined => {
      if (!value || value.trim() === '') return undefined;
      const cleaned = value.replace(/[,\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? undefined : Math.floor(parsed);
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
      inceptionYear: safeParseInt(values[inceptionYearIndex] || ''),
      inceptionQuarter: values[inceptionQuarterIndex] || '',
      inceptionMonth: values[inceptionMonthIndex] || '',
      comDate: values[comDateIndex] || ''
    };

    if (record.uy) {
      data.push(record);
      yearCounts[record.uy] = (yearCounts[record.uy] || 0) + 1;
    } else {
      console.log(`Quarterly API - Skipping row ${i + 1}: no UY value`);
    }
  }

  console.log('Quarterly API - CSV parsing complete:', {
    totalRecords: data.length,
    yearCounts: yearCounts,
    sampleRecord: data[0]
  });

  return data;
}

// Time normalization according to spec
function normalizeTimeData(record: ReinsuranceData): { year: number; quarter: string } | null {

  // 1. Get year from multiple sources
  let year = record.inceptionYear;
  
  // Fallback to UY if inceptionYear is not available
  if (!year && record.uy) {
    const uyYear = parseInt(record.uy);
    if (!isNaN(uyYear) && uyYear >= 2019 && uyYear <= 2021) {
      year = uyYear;
    }
  }
  
  // Ensure year is in valid range
  if (!year || year < 2019 || year > 2021) {
    return null;
  }

  // 2. Normalize Inception Quarter to Q1-Q4
  let quarter = record.inceptionQuarter?.trim().toUpperCase();
  
  // If quarter is missing or numeric (1-4), derive from month
  if (!quarter || /^[1-4]$/.test(quarter)) {
    const month = record.inceptionMonth?.trim().toUpperCase();
    
    if (month) {
      // Normalize month to ALL-CAPS 3-letter format
      const monthMap: Record<string, string> = {
        'JAN': 'JAN', 'FEB': 'FEB', 'MAR': 'MAR', 'APR': 'APR', 'MAY': 'MAY', 'JUN': 'JUN',
        'JUL': 'JUL', 'AUG': 'AUG', 'SEP': 'SEP', 'OCT': 'OCT', 'NOV': 'NOV', 'DEC': 'DEC',
        'JANUARY': 'JAN', 'FEBRUARY': 'FEB', 'MARCH': 'MAR', 'APRIL': 'APR', 'JUNE': 'JUN',
        'JULY': 'JUL', 'AUGUST': 'AUG', 'SEPTEMBER': 'SEP', 'OCTOBER': 'OCT', 'NOVEMBER': 'NOV', 'DECEMBER': 'DEC'
      };
      
      const normalizedMonth = monthMap[month] || month;
      
      // Derive quarter from month
      if (['JAN', 'FEB', 'MAR'].includes(normalizedMonth)) {
        quarter = 'Q1';
      } else if (['APR', 'MAY', 'JUN'].includes(normalizedMonth)) {
        quarter = 'Q2';
      } else if (['JUL', 'AUG', 'SEP'].includes(normalizedMonth)) {
        quarter = 'Q3';
      } else if (['OCT', 'NOV', 'DEC'].includes(normalizedMonth)) {
        quarter = 'Q4';
      }
    }
    
    // If still no quarter and we have a numeric value, convert it
    if (!quarter && record.inceptionQuarter && /^[1-4]$/.test(record.inceptionQuarter)) {
      quarter = `Q${record.inceptionQuarter}`;
    }
    
    // Last resort: try to derive from Com Date
    if (!quarter && record.comDate) {
      try {
        const date = new Date(record.comDate);
        const month = date.getMonth() + 1; // 1-12
        const quarterNum = Math.ceil(month / 3);
        quarter = `Q${quarterNum}`;
      } catch {
        // Ignore invalid dates
      }
    }
  }
  
  // Validate quarter is Q1-Q4
  if (!quarter || !/^Q[1-4]$/.test(quarter)) {
    return null;
  }
  
  return { year, quarter };
}


export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const year = url.searchParams.get("year");
    
    // If no year is provided, process all years
    if (!year) {
      console.log('Quarterly API - No year specified, processing all years');
    }

    console.log('Quarterly API - GET request:', req.url);
    console.log('Quarterly API - Requested year:', year);

    const allData = await loadCSVData();
    console.log('Quarterly API - Loaded data:', allData.length, 'records');

    // Apply time normalization and filter by year
    const normalizedData = allData
      .map(record => {
        const timeData = normalizeTimeData(record);
        if (!timeData) return null;
        
        return {
          ...record,
          normalizedYear: timeData.year,
          normalizedQuarter: timeData.quarter
        };
      })
      .filter(record => {
        if (record === null) return false;
        // If no year specified, include all records
        if (!year) return true;
        // Otherwise, filter by specific year
        return record.normalizedYear === parseInt(year);
      });

    console.log('Quarterly API - Normalized data for year', year || 'all', ':', normalizedData.length, 'records');
    
    // Debug: Show sample of normalized data
    if (normalizedData.length > 0) {
      console.log('Quarterly API - Sample normalized records:', normalizedData.slice(0, 3).map(r => r ? ({
        uy: r.uy,
        normalizedYear: r.normalizedYear,
        normalizedQuarter: r.normalizedQuarter,
        inceptionYear: r.inceptionYear,
        inceptionQuarter: r.inceptionQuarter,
        inceptionMonth: r.inceptionMonth
      }) : null).filter(Boolean));
    } else {
      // Debug: Show why no data is being normalized
      console.log('Quarterly API - No normalized data found. Sample of raw data:');
      const sampleData = allData.slice(0, 5).map(r => ({
        uy: r.uy,
        inceptionYear: r.inceptionYear,
        inceptionQuarter: r.inceptionQuarter,
        inceptionMonth: r.inceptionMonth
      }));
      console.log('Quarterly API - Sample raw records:', sampleData);
    }

    // Group data by quarter according to spec
    const quarterlyGroups: Record<string, ReinsuranceData[]> = {
      'Q1': [],
      'Q2': [],
      'Q3': [],
      'Q4': []
    };

    normalizedData.forEach(record => {
      if (record) {
        const quarter = record.normalizedQuarter;
        if (quarterlyGroups[quarter]) {
          quarterlyGroups[quarter].push(record);
        }
      }
    });

    console.log('Quarterly API - Quarterly groups:', {
      Q1: quarterlyGroups['Q1'].length,
      Q2: quarterlyGroups['Q2'].length,
      Q3: quarterlyGroups['Q3'].length,
      Q4: quarterlyGroups['Q4'].length
    });

    // Calculate quarterly metrics according to spec
    const quarters: Record<number, {
      quarter: number;
      year: number;
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
    }> = {};
    let totalPolicyCount = 0;
    let totalPremium = 0;
    let totalAcquisition = 0;
    let totalPaidClaims = 0;
    let totalOsLoss = 0;

    // Process each quarter (Q1-Q4)
    const quarterOrder = ['Q1', 'Q2', 'Q3', 'Q4'];
    quarterOrder.forEach((quarterKey, index) => {
      const quarterNum = index + 1;
      const quarterData = quarterlyGroups[quarterKey];
      
      // Core measures (numeric; coerce to number)
      const policyCount = quarterData.length;
      const premium = quarterData.reduce((sum, record) => sum + (record.grossUWPrem || 0), 0);
      const acquisition = quarterData.reduce((sum, record) => sum + (record.grossActualAcq || 0), 0);
      const paidClaims = quarterData.reduce((sum, record) => sum + (record.grossPaidClaims || 0), 0);
      const osLoss = quarterData.reduce((sum, record) => sum + (record.grossOsLoss || 0), 0);
      
      // Derived measures
      const incurredClaims = paidClaims + osLoss;
      const technicalResult = premium - incurredClaims - acquisition;
      
      // Ratio calculations with guard against division by zero
      const lossRatioPct = premium > 0 ? (incurredClaims / premium) * 100 : 0;
      const acquisitionPct = premium > 0 ? (acquisition / premium) * 100 : 0;
      const combinedRatioPct = lossRatioPct + acquisitionPct;

      quarters[quarterNum] = {
        quarter: quarterNum,
        year: year ? parseInt(year) : 0,
        policyCount,
        premium,
        acquisition,
        paidClaims,
        osLoss,
        incurredClaims,
        technicalResult,
        lossRatioPct,
        acquisitionPct,
        combinedRatioPct
      };

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
      year: year ? parseInt(year) : 'all',
      quarters,
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

    console.log('Quarterly API - Final result:', {
      year: result.year,
      totalPolicies: result.total.policyCount,
      totalPremium: result.total.premium,
      quartersWithData: Object.keys(quarters).filter(q => quarters[parseInt(q)].policyCount > 0).length
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Quarterly API - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch quarterly data' }, { status: 500 });
  }
}
