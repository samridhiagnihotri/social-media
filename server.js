import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const DATA_FILE = './data/data.json'; // or the appropriate path to your data file

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
// GET /posts - Retrieve all posts
app.get('/posts', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ message: 'Error reading posts data' });
      }
  
      const posts = JSON.parse(data || '[]');
      res.status(200).json(posts);
    });
  });
  
  // POST /posts - Create a new post
  app.post('/posts', (req, res) => {
    const newPost = req.body;
  
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        res.status(500).send({ message: 'Error reading posts data' });
        return;
      }
  
      let posts = [];
      try {
        posts = JSON.parse(data);  // Parse the JSON data from file
        if (!Array.isArray(posts)) {  // Ensure it's an array
          posts = [];
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        posts = [];  // Fallback to an empty array if parsing fails
      }
  
      const postWithId = { ...newPost, id: posts.length + 1 };
      posts.push(postWithId);  // Add the new post to the array
  
      // Save the updated posts array back to the file
      fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), (writeError) => {
        if (writeError) {
          console.error("Error writing file:", writeError);
          res.status(500).send({ message: 'Error saving posts data' });
          return;
        }
  
        res.status(201).json(postWithId);  // Return the newly created post with an ID
      });
    });
  });
  
  // POST /posts/:id/like - Like a post
  app.post('/posts/:id/like', (req, res) => {
    const postId = parseInt(req.params.id, 10);
  
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ message: 'Error reading posts data' });
      }
  
      const posts = JSON.parse(data || '[]');
      const post = posts.find(p => p.id === postId);
  
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      post.likes += 1; // Increment the like count
  
      // Save the updated posts back to the file
      fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error saving post' });
        }
        res.status(200).json({ message: 'Post liked successfully', post });
      });
    });
  });
  
  // POST /posts/:id/comment - Add a comment to a post
  app.post('/posts/:id/comments', (req, res) => {
    const postId = parseInt(req.params.id);  // Assuming the post ID is an integer
    const { comment, parentId } = req.body;
  
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return res.status(500).send({ message: 'Error reading posts data' });
      }
  
      let posts = [];
      try {
        posts = JSON.parse(data);
        if (!Array.isArray(posts)) {
          posts = [];
        }
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        posts = [];  // Fallback to an empty array if parsing fails
      }
  
      const post = posts.find(p => p.id === postId);  // Find the post by ID
      if (!post) {
        return res.status(404).send({ message: 'Post not found' });
      }
  
      // Initialize comments array if it doesn't exist
      if (!Array.isArray(post.comments)) {
        post.comments = [];
      }
  
      // Add the new comment
      const newComment = { id: post.comments.length + 1, comment, parentId: parentId || null };
      post.comments.push(newComment);
  
      // Save the updated posts back to the file
      fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), (writeError) => {
        if (writeError) {
          console.error("Error writing file:", writeError);
          return res.status(500).send({ message: 'Error saving posts data' });
        }
  
        res.status(201).json(newComment);  // Return the newly added comment
      });
    });
  });
  app.delete('/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send({ message: 'Error reading posts data' });
    }
    let posts = [];
    try {
      posts = JSON.parse(data);
    } catch (parseError) {
      posts = [];
    }

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return res.status(404).send({ message: 'Post not found' });
    }

    // Remove the post
    posts.splice(postIndex, 1);

    fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), (writeError) => {
      if (writeError) {
        return res.status(500).send({ message: 'Error saving posts data' });
      }
      res.status(200).send({ message: 'Post deleted successfully' });
    });
  });
});

  
  // Server setup
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
