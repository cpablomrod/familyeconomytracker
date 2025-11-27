import mongoose, { Schema, Model } from 'mongoose';

export interface IIncomeEntry {
  source: string;
  amount: number;
}

export interface IMonthlyIncome {
  _id?: string;
  familyId: string;
  month: number; // 1-12
  year: number;
  incomes: IIncomeEntry[];
  totalIncome: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyIncomeSchema = new Schema<IMonthlyIncome>({
  familyId: {
    type: String,
    required: [true, 'Family ID is required'],
    index: true,
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
  },
  incomes: {
    type: [{
      source: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
    }],
    default: [],
  },
  totalIncome: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for familyId, month, and year (should be unique per family per month/year)
MonthlyIncomeSchema.index({ familyId: 1, month: 1, year: 1 }, { unique: true });

// Update totalIncome before saving
MonthlyIncomeSchema.pre('save', function(next) {
  this.totalIncome = this.incomes.reduce((sum, income) => sum + income.amount, 0);
  this.updatedAt = new Date();
  next();
});

const MonthlyIncome: Model<IMonthlyIncome> = mongoose.models.MonthlyIncome || mongoose.model<IMonthlyIncome>('MonthlyIncome', MonthlyIncomeSchema);

export default MonthlyIncome;
