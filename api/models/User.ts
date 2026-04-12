import mongoose, { Schema, Document } from 'mongoose';
// @ts-ignore
import bcrypt from 'bcryptjs';
// @ts-ignore
import validator from 'validator';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  isTourShown: boolean;
  activeSessionId?: string;
  previousSessionId?: string;
  takeoverRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot be more than 50 characters'],
      match: [/^[a-zA-Z\s]*$/, 'Name can only contain letters and spaces'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      sparse: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      ],
    },
    isTourShown: {
      type: Boolean,
      default: false,
    },
    activeSessionId: {
      type: String,
      default: null,
    },
    previousSessionId: {
      type: String,
      default: null,
    },
    takeoverRequestedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
