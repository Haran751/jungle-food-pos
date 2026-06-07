import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  kasirId: Types.ObjectId;
  totalPrice: number;
  payment: number;
  change: number;
  details: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    kasirId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalPrice: { type: Number, required: true },
    payment: { type: Number, required: true },
    change: { type: Number, required: true },
    details: [{ type: Schema.Types.ObjectId, ref: 'TransactionDetail' }],
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
