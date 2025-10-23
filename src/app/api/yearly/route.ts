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
    } catch (error) {
      // Continue to next path
    }
  }
  
  if (!csvPath) {
    throw new Error(`CSV file not found. Tried paths: ${possiblePaths.join(', ')}`);
  }

  console.log('Yearly API - Loading CSV from path:', csvPath);
  console.log('Yearly API - Current working directory:', process.cwd());

  // Check if we need to reload data
  const stats = await fs.stat(csvPath);
  const currentModified = stats.mtime.getTime();
  
  if (csvDataCache && lastModified && currentModified <= lastModified) {
    console.log('Yearly API - Returning cached data:', csvDataCache.length, 'records');
    return csvDataCache;
  }

  console.log('Yearly API - Reading CSV file...');
  const csvContent = await fs.readFile(csvPath, 'utf-8');
  console.log('Yearly API - CSV content length:', csvContent.length);

  const data = parseCSVData(csvContent);
  csvDataCache = data;
  lastModified = currentModified;
  
  console.log('Yearly API - Parsed data:', data.length, 'records');
  return data;
}

// Parse CSV data with proper column mapping
function parseCSVData(csvContent: string): ReinsuranceData[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  console.log('Yearly API - CSV parsing:', {
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

  console.log('Yearly API - Column indices:', {
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
      console.log(`Yearly API - Skipping row ${i + 1}: insufficient values (${values.length} < ${headers.length})`);
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

    if (record.uy) {
      data.push(record);
      yearCounts[record.uy] = (yearCounts[record.uy] || 0) + 1;
    } else {
      console.log(`Yearly API - Skipping row ${i + 1}: no UY value`);
    }
  }

  console.log('Yearly API - CSV parsing complete:', {
    totalRecords: data.length,
    yearCounts: yearCounts,
    sampleRecord: data[0]
  });

  return data;
}

export async function GET(req: Request) {
  try {
    console.log('Yearly API - GET request:', req.url);

    const allData = await loadCSVData();
    console.log('Yearly API - Loaded data:', allData.length, 'records');

    // Group data by year
    const yearlyGroups: Record<number, ReinsuranceData[]> = {
      2019: [],
      2020: [],
      2021: []
    };

    allData.forEach(record => {
      // Get year from UY or inceptionYear
      let year = record.inceptionYear;
      if (!year && record.uy) {
        const uyYear = parseInt(record.uy);
        if (!isNaN(uyYear) && uyYear >= 2019 && uyYear <= 2021) {
          year = uyYear;
        }
      }
      
      if (year && yearlyGroups[year]) {
        yearlyGroups[year].push(record);
      }
    });

    console.log('Yearly API - Yearly groups:', {
      2019: yearlyGroups[2019].length,
      2020: yearlyGroups[2020].length,
      2021: yearlyGroups[2021].length
    });

    // Calculate yearly metrics
    const years: Record<number, any> = {};
    let totalPolicyCount = 0;
    let totalPremium = 0;
    let totalAcquisition = 0;
    let totalPaidClaims = 0;
    let totalOsLoss = 0;

    // Process each year (2019-2021)
    const yearOrder = [2019, 2020, 2021];
    yearOrder.forEach(year => {
      const yearData = yearlyGroups[year];
      
      // Core measures (numeric; coerce to number)
      const policyCount = yearData.length;
      const premium = yearData.reduce((sum, record) => sum + (record.grossUWPrem || 0), 0);
      const acquisition = yearData.reduce((sum, record) => sum + (record.grossActualAcq || 0), 0);
      const paidClaims = yearData.reduce((sum, record) => sum + (record.grossPaidClaims || 0), 0);
      const osLoss = yearData.reduce((sum, record) => sum + (record.grossOsLoss || 0), 0);
      
      // Derived measures
      const incurredClaims = paidClaims + osLoss;
      const technicalResult = premium - incurredClaims - acquisition;
      
      // Ratio calculations with guard against division by zero
      const lossRatioPct = premium > 0 ? (incurredClaims / premium) * 100 : 0;
      const acquisitionPct = premium > 0 ? (acquisition / premium) * 100 : 0;
      const combinedRatioPct = lossRatioPct + acquisitionPct;

      years[year] = {
        year,
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
      years,
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

    console.log('Yearly API - Final result:', {
      totalYears: Object.keys(years).length,
      totalPolicies: result.total.policyCount,
      totalPremium: result.total.premium,
      yearsWithData: Object.keys(years).filter(y => years[parseInt(y)].policyCount > 0).length
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Yearly API - Error:', error);
    return NextResponse.json({ error: 'Failed to fetch yearly data' }, { status: 500 });
  }
}

