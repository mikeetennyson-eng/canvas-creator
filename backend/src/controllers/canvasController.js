import Canvas from '../models/Canvas.js';

export const saveCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { _id, title, canvasData, thumbnail } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let canvas;

    if (_id) {
      // Update existing canvas
      canvas = await Canvas.findOneAndUpdate(
        { _id, userId },
        { title, canvasData, thumbnail },
        { new: true }
      );

      if (!canvas) {
        return res.status(404).json({ message: 'Canvas not found' });
      }
    } else {
      // Create new canvas
      canvas = await Canvas.create({
        userId,
        title,
        canvasData,
        thumbnail,
      });
    }

    res.status(200).json({ message: 'Canvas saved', canvas });
  } catch (error) {
    console.error('[Canvas Save] Error:', error);
    res.status(500).json({ message: 'Failed to save canvas' });
  }
};

export const getCanvases = async (req, res) => {
  try {
    const userId = req.user.id;

    const canvases = await Canvas.find({ userId }).sort({ updatedAt: -1 });

    res.status(200).json({ message: 'Canvases retrieved', canvases });
  } catch (error) {
    console.error('[Canvas List] Error:', error);
    res.status(500).json({ message: 'Failed to fetch canvases' });
  }
};

export const getCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const canvas = await Canvas.findOne({ _id: id, userId });

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found' });
    }

    res.status(200).json({ message: 'Canvas retrieved', canvas });
  } catch (error) {
    console.error('[Canvas Get] Error:', error);
    res.status(500).json({ message: 'Failed to fetch canvas' });
  }
};

export const deleteCanvas = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const canvas = await Canvas.findOneAndDelete({ _id: id, userId });

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found' });
    }

    res.status(200).json({ message: 'Canvas deleted', canvas });
  } catch (error) {
    console.error('[Canvas Delete] Error:', error);
    res.status(500).json({ message: 'Failed to delete canvas' });
  }
};
