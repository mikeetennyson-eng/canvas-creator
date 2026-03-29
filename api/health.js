export default async function handler(req, res) {
  try {
    res.status(200).json({ message: 'Server is running', timestamp: new Date() });
  } catch (error) {
    console.error('[Health] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
