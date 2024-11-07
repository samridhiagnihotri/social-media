import jwt from 'jsonwebtoken';

// Middleware function to authenticate users
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }

    const isCustomAuth = token.length < 500; // Determine if the token is custom (JWT) or from Google OAuth
    let decodedData;

    if (token && isCustomAuth) {
      // Custom authentication
      decodedData = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decodedData?.id;
    } else {
      // Google OAuth token
      decodedData = jwt.decode(token);
      req.userId = decodedData?.sub;
    }

    next(); // Continue to the next middleware/route
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;
