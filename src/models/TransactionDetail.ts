import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransactionDetail extends Document {
  transactionId: Types.ObjectId;
  productId: Types.ObjectId;
  quantity: number;
  subtotal: number;
}

const TransactionDetailSchema = new Schema<ITransactionDetail>(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.TransactionDetail || mongoose.model<ITransactionDetail>('TransactionDetail', TransactionDetailSchema);
