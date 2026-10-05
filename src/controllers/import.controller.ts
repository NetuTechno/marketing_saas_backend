import { Request, Response, NextFunction } from 'express';
import { importOrdersFromCsv } from '../services/import.service';
import { sendSuccess } from '../utils/api-response';

export const importOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      const error: any = new Error('No CSV files uploaded');
      error.status = 400;
      throw error;
    }

    const overallResult = {
      total: 0,
      imported: 0,
      duplicates: 0,
      failed: 0
    };

    for (const file of files) {
      const result = await importOrdersFromCsv(file.buffer);
      overallResult.total += result.total;
      overallResult.imported += result.imported;
      overallResult.duplicates += result.duplicates;
      overallResult.failed += result.failed;
    }

    res.status(200).json(sendSuccess('CSV files imported successfully', overallResult));
  } catch (error) {
    // Check for our custom header error to send 400 Bad Request
    if (error instanceof Error && error.message.includes('Missing required CSV columns')) {
      (error as any).status = 400;
    }
    next(error);
  }
};
