import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { BillsService } from "../services/bills.service";

const airtimeSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  network: z.enum(["MTN", "AIRTEL", "GLO", "9MOBILE"], {
    error: "Network must be one of: MTN, AIRTEL, GLO, 9MOBILE",
  }),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than zero"),
});

export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  async vendAirtime(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { phoneNumber, network, amount } = airtimeSchema.parse(req.body);
      const orgId = req.params.orgId as string;

      const payout = await this.billsService.vendAirtime(
        orgId,
        phoneNumber,
        network,
        amount,
      );

      res.status(200).json({
        success: true,
        data: {
          amount: payout.amount,
          network,
          phoneNumber,
          reference: payout.transferRef,
          message: `₦${payout.amount.toLocaleString()} ${network} airtime sent to ${phoneNumber} successfully`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBillsHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const orgId = req.params.orgId as string;
      const history = await this.billsService.getBillsHistory(orgId);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
}
