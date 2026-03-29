import mongoose from 'mongoose';

const canvasSchema = new mongoose.Schema(
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

export default mongoose.model('Canvas', canvasSchema);
