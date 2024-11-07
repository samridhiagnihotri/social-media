import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

// Get the current directory name using import.meta.url (needed for ES modules)
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize express app
const app = express();
const PORT = 5000;

// Middleware to parse JSON request bodies
app.use(cors());
app.use(express.json());

// Define paths to data files
const USERS_FILE = join(__dirname, 'data', 'users.json');
const POSTS_FILE = join(__dirname, 'data', 'posts.json');

// Ensure that the 'data' folder and 'users.json', 'posts.json' files exist
const ensureDataFileExists = (filePath) => {
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data'); // Create data folder if not exists
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(filePath === USERS_FILE ? [] : [])); // Create users.json or posts.json if not exists
  }
};

// Read data from a file
const readData = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading data:', err);
    return [];
  }
};

// Write data to a file
const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing data:', err);
  }
};

// Ensure the files exist on server start
ensureDataFileExists(USERS_FILE);
ensureDataFileExists(POSTS_FILE);

// Endpoint for user registration (signup)
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const users = readData(USERS_FILE);
  const existingUser = users.find(user => user.username === username);

  if (existingUser) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword };
    users.push(newUser);
    writeData(USERS_FILE, users);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// Endpoint for user login (signin)
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const users = readData(USERS_FILE);
  const user = users.find(user => user.username === username);

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  try {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.status(200).json({ message: 'User signed in successfully' });
    } else {
      res.status(400).json({ message: 'Invalid password' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error signing in', error: err.message });
  }
});

// Endpoint for retrieving all posts
app.get('/posts', (req, res) => {
  const posts = readData(POSTS_FILE);
  res.status(200).json(posts);
});

// Endpoint for creating a new post
app.post('/posts', (req, res) => {
  const newPost = req.body;

  if (!newPost || !newPost.title || !newPost.content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const posts = readData(POSTS_FILE);
  const postWithId = { ...newPost, id: posts.length + 1, likes: 0, comments: [] }; // Add an id, likes, and comments
  posts.push(postWithId); // Add the new post to the array

  writeData(POSTS_FILE, posts);
  res.status(201).json({ message: 'Post created successfully', post: postWithId });
});

// Endpoint for liking a post
app.post('/posts/:id/like', (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const posts = readData(POSTS_FILE);
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  post.likes += 1; // Increment the like count
  writeData(POSTS_FILE, posts);
  res.status(200).json({ message: 'Post liked successfully', post });
});

// Endpoint for adding a comment to a post
app.post('/posts/:id/comment', (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { comment } = req.body; // The comment text from the body

  if (!comment) {
    return res.status(400).json({ message: 'Comment is required' });
  }

  const posts = readData(POSTS_FILE);
  const post = posts.find(p => p.id === postId);

  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  post.comments.push(comment); // Add the comment to the comments array
  writeData(POSTS_FILE, posts);
  res.status(200).json({ message: 'Comment added successfully', post });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
