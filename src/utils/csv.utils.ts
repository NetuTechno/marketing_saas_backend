// Required headers to validate
export const requiredCsvHeaders = [
  'Warehouse Code',
  'Ship To Name',
  'Ship To State',
  'Phone Number',
  'SKU',
  'Order Place Date',
  'Order ID',
];

// Map CSV column names to Prisma Model keys
export const csvToModelMap: Record<string, string> = {
  'Order ID': 'orderId',
  'Warehouse Code': 'warehouseCode',
  'Ship To Name': 'shipToName',
  'Ship To State': 'shipToState',
  'Phone Number': 'phoneNumber',
  'SKU': 'sku',
  'Order Place Date': 'orderPlaceDate',
};

export const normalizeDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  // Amazon format usually comes as "14-Aug-2026, 1:04:12 pm IST"
  // JS Date cannot parse " IST" correctly, so we strip it out.
  const cleanedDateStr = dateStr.replace(' IST', '').trim();
  const date = new Date(cleanedDateStr);
  return isNaN(date.getTime()) ? null : date;
};
