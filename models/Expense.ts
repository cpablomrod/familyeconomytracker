import mongoose, { Schema, Model } from 'mongoose';

export interface IExpense {
  _id?: string;
  familyId: string;
  date: string; // Store as YYYY-MM-DD string to avoid timezone issues
  amount: number;
  category: string;
  subcategory?: string;
  description: string;
  createdAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  familyId: {
    type: String,
    required: [true, 'Family ID is required'],
    index: true,
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['food', 'gasoline', 'clothing', 'utilities', 'restaurants', 'travelling', 'leisure', 'appliances', 'home-renovations', 'medicine', 'vehicles'],
  },
  subcategory: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
