import { ITransaction } from "../interfaces/transaction.interface";
import transactionModel from "../models/Transaction.model";
import { createOne } from "../utils/helper";

class transactionService {
  addTransaction = async (transaction: ITransaction) => {
    return await createOne(transactionModel, transaction);
  };

  updateTransactionStatus = async (
    orderId: string,
    status: "process" | "paid" | "failed"
  ) => {
    try {
      const transaction = await transactionModel.findOneAndUpdate(
        { orderId: orderId },
        { status: status },
        { new: true }
      );

      return transaction;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  };

  getTransactionByOrderId = async (orderId: string) => {
    try {
      const transaction = await transactionModel.findOne({
        orderId: orderId,
      });

      return transaction;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  };
}

export const TransactionService = new transactionService();
