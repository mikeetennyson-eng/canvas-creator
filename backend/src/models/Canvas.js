import mongoose from 'mongoose';

const canvasSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    canvasData: { type: String }, // Konva stage JSON
    thumbnail: { type: String }, // Base64 thumbnail
  },
  { timestamps: true }
);

const Canvas = mongoose.model('Canvas', canvasSchema);
export default Canvas;
