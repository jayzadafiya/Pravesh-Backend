import { ITransaction } from "../interfaces/transaction.interface";
import transactionModel from "../models/Transaction.model";
import { createOne } from "../utils/helper";

class transactionService {
  addTransaction = async (transaction: ITransaction) => {
    return await createOne(transactionModel, transaction);
  };
}

export const TransactionService = new transactionService();
