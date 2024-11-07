import fs from 'fs';

const DATA_FILE = '../data/data.json'; // Path to the JSON file for storing posts

// Helper function to read data from the JSON file
const readData = () => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading data:", error);
    return [];
  }
};

// Helper function to write data to the JSON file
const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing data:", error);
  }
};

// Get all posts
export const getPosts = async (req, res) => {
  const posts = readData();
  res.json(posts);
};

// Get posts by search (filters by a term in the title or content)
export const getPostsBySearch = async (req, res) => {
  const { searchQuery } = req.query;
  const posts = readData();
  const filteredPosts = posts.filter(
    (post) =>
      post.title.includes(searchQuery) || post.content.includes(searchQuery)
  );
  res.json(filteredPosts);
};

// Get a single post by id
export const getPost = async (req, res) => {
  const { id } = req.params;
  const posts = readData();
  const post = posts.find((p) => p.id === id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  const posts = readData();
  const newPost = { ...req.body, id: Date.now().toString(), likes: 0, comments: [] };
  posts.push(newPost);
  writeData(posts);
  res.status(201).json(newPost);
};

// Update a post by id
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const updatedPost = req.body;
  let posts = readData();
  const index = posts.findIndex((p) => p.id === id);

  if (index !== -1) {
    posts[index] = { ...posts[index], ...updatedPost };
    writeData(posts);
    res.json(posts[index]);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
};

// Delete a post by id
export const deletePost = async (req, res) => {
  const { id } = req.params;
  let posts = readData();
  const newPosts = posts.filter((p) => p.id !== id);

  if (posts.length !== newPosts.length) {
    writeData(newPosts);
    res.json({ message: "Post deleted successfully" });
  } else {
    res.status(404).json({ message: "Post not found" });
  }
};

// Like a post by id
export const likePost = async (req, res) => {
  const { id } = req.params;
  let posts = readData();
  const index = posts.findIndex((p) => p.id === id);

  if (index !== -1) {
    posts[index].likes += 1;
    writeData(posts);
    res.json(posts[index]);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
};

// Comment on a post by id
export const commentPost = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  let posts = readData();
  const index = posts.findIndex((p) => p.id === id);

  if (index !== -1) {
    posts[index].comments.push(comment);
    writeData(posts);
    res.json(posts[index]);
  } else {
    res.status(404).json({ message: "Post not found" });
  }
};
