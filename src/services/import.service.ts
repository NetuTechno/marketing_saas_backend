import { parse } from 'csv-parse/sync';
import { prisma } from '../config/prisma';
import { requiredCsvHeaders, csvToModelMap, normalizeDate } from '../utils/csv.utils';
import { Prisma } from '@prisma/client';

export const importOrdersFromCsv = async (csvBuffer: Buffer) => {
  // Parse CSV
  const records: any[] = parse(csvBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true, // Handle UTF-8 BOM
  });

  if (records.length === 0) {
    throw new Error('CSV is empty');
  }

  // Validate headers from the first record
  const headers = Object.keys(records[0]);
  const missingHeaders = requiredCsvHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`);
  }

  const validOrders = [];
  let failedRows = 0;
  
  // To handle duplicates within the CSV itself
  const seenUniqueKeys = new Set<string>();
  let duplicateRows = 0;

  for (const record of records) {
    try {
      const orderId = record['Order ID'];
      const sku = record['SKU'];
      
      if (!orderId || !sku) {
        if (failedRows === 0) console.log('❌ Failed: Missing Order ID or SKU.', { orderId, sku, record });
        failedRows++;
        continue; // Skip invalid rows missing core identifiers
      }

      const uniqueKey = `${orderId}_${sku}`;
      if (seenUniqueKeys.has(uniqueKey)) {
        duplicateRows++;
        continue;
      }

      const orderPlaceDateStr = record['Order Place Date'];
      const orderPlaceDate = normalizeDate(orderPlaceDateStr);

      if (!orderPlaceDate) {
        if (failedRows === 0) console.log('❌ Failed: Invalid Date.', { orderPlaceDateStr });
        failedRows++;
        continue;
      }

      seenUniqueKeys.add(uniqueKey);

      validOrders.push({
        orderId,
        warehouseCode: record['Warehouse Code'] || '',
        shipToName: record['Ship To Name'] || '',
        shipToState: record['Ship To State'] || '',
        phoneNumber: record['Phone Number'] || '',
        sku,
        orderPlaceDate,
      });
    } catch (err) {
      failedRows++;
    }
  }

  let importedRows = 0;

  if (validOrders.length > 0) {
    // Insert into DB using createMany with skipDuplicates
    const result = await prisma.order.createMany({
      data: validOrders,
      skipDuplicates: true,
    });
    
    importedRows = result.count;
    
    // The ones that were skipped by DB because they already exist are also duplicates
    duplicateRows += (validOrders.length - importedRows);
  }

  return {
    totalRows: records.length,
    importedRows,
    duplicateRows,
    failedRows,
  };
};
