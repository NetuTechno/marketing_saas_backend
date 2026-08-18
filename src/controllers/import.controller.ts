import { Request, Response, NextFunction } from 'express';
import { importOrdersFromCsv } from '../services/import.service';
import { sendSuccess } from '../utils/api-response';

export const importOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      const error: any = new Error('No CSV file uploaded');
      error.status = 400;
      throw error;
    }

    const result = await importOrdersFromCsv(req.file.buffer);

    res.status(200).json(sendSuccess('CSV imported successfully', result));
  } catch (error) {
    // Check for our custom header error to send 400 Bad Request
    if (error instanceof Error && error.message.includes('Missing required CSV columns')) {
      (error as any).status = 400;
    }
    next(error);
  }
};
