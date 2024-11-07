import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const DATA_FILE = '../data/data.json'; // Path to the JSON file for storing user data

// Helper function to read data from the JSON file
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return []; // Return an empty array if the file doesn't exist or is unreadable
  }
};

// Helper function to write data to the JSON file
const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

export const authenticate = async (req, res) => {
  const { firstName, lastName, confirmPassword, email, password, action } = req.body;

  try {
    const users = readData();
    const existingUser = users.find((user) => user.email === email);

    if (action === 'signup') {
      // Signup Logic
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = {
        id: Date.now().toString(),
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
      };

      users.push(newUser);
      writeData(users);

      const token = jwt.sign({ email: newUser.email, id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.status(201).json({ result: newUser, token });

    } else if (action === 'signin') {
      // Signin Logic
      if (!existingUser) {
        return res.status(404).json({ message: 'User does not exist' });
      }

      const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

      if (!isPasswordCorrect) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ email: existingUser.email, id: existingUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return res.status(200).json({ result: existingUser, token });
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};
