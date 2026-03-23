import mongoose, { Schema, Document } from 'mongoose';

export interface ICanvas extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  title: string;
  description?: string;
  canvasData: string; // JSON stringified canvas data
  thumbnail?: string; // Base64 encoded thumbnail
  createdAt: Date;
  updatedAt: Date;
}

const canvasSchema = new Schema<ICanvas>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
      default: 'Untitled Diagram',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    canvasData: {
      type: String,
      required: [true, 'Canvas data is required'],
    },
    thumbnail: {
      type: String,
      maxlength: [5000000, 'Thumbnail is too large'],
    },
  },
  { timestamps: true }
);

// Index for efficient querying
canvasSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ICanvas>('Canvas', canvasSchema);
