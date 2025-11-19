import mongoose, { Schema, Model } from 'mongoose';

export interface IIncomeStream {
  source: string;
  amount: number;
}

export interface IFixedPayment {
  name: string;
  amount: number;
}

export interface IProperty {
  name: string;
  value: number;
  monthlyPayment?: number;
}

export interface ILoan {
  name: string;
  monthlyAmount: number;
  endDate: Date;
}

export interface IEconomicTarget {
  description: string;
  targetAmount: number;
}

export interface IFamily {
  _id?: string;
  name: string;
  email: string;
  password: string;
  members: number;
  ages: number[];
  genders?: string[]; // 'male', 'female', or 'other'
  incomeStreams?: IIncomeStream[];
  fixedPayments?: IFixedPayment[];
  properties?: IProperty[];
  loans?: ILoan[];
  economicTargets?: IEconomicTarget[];
  createdAt: Date;
}

const FamilySchema = new Schema<IFamily>({
  name: {
    type: String,
    required: [true, 'Family name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  members: {
    type: Number,
    required: [true, 'Number of members is required'],
    min: 1,
  },
  ages: {
    type: [Number],
    required: [true, 'Ages are required'],
  },
  genders: {
    type: [String],
    default: [],
  },
  incomeStreams: {
    type: [{
      source: { type: String, required: true },
      amount: { type: Number, required: true },
    }],
    default: [],
  },
  fixedPayments: {
    type: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true },
    }],
    default: [],
  },
  properties: {
    type: [{
      name: { type: String, required: true },
      value: { type: Number, required: true },
      monthlyPayment: { type: Number },
    }],
    default: [],
  },
  loans: {
    type: [{
      name: { type: String, required: true },
      monthlyAmount: { type: Number, required: true },
      endDate: { type: Date, required: true },
    }],
    default: [],
  },
  economicTargets: {
    type: [{
      description: { type: String, required: true },
      targetAmount: { type: Number, required: true },
    }],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Family: Model<IFamily> = mongoose.models.Family || mongoose.model<IFamily>('Family', FamilySchema);

export default Family;
