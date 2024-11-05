const { readData, writeData } = require('../utils');

exports.createPost = (req, res) => {
    const { content, visibility } = req.body;

    if (!content) {
        return res.status(400).json({ message: 'Content is required.' });
    }

    const posts = readData('posts.json');
    
    const newPost = { 
        id: Date.now().toString(), // Use string for ID
        content, 
        author: req.user._id, 
        visibility: visibility || 'public',
        comments: [], 
        likes: 0 
    };
    
    posts.push(newPost);
    writeData('posts.json', posts);

    res.status(201).json({ message: 'Post created successfully.', post: newPost });
};

// Get posts based on visibility
exports.getPosts = (req, res) => {
    const posts = readData('posts.json');
    const userId = req.user._id;

    // Filter posts: show public posts or private posts by the current user
    const visiblePosts = posts.filter(post => 
        post.visibility === 'public' || post.author === userId
    );

    res.json({ posts: visiblePosts });
};

// Comment on a post
exports.commentOnPost = (req, res) => {
    const { postId } = req.params;
    const { comment } = req.body;

    if (!comment) {
        return res.status(400).json({ message: 'Comment cannot be empty.' });
    }

    const posts = readData('posts.json');
    const post = posts.find(p => p.id === postId);

    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.visibility === 'private' && post.author !== req.user._id) {
        return res.status(403).json({ message: 'Not authorized to comment on this post.' });
    }

    post.comments.push({ id: Date.now().toString(), comment, author: req.user._id });
    writeData('posts.json', posts);

    res.json({ message: 'Comment added successfully.', post });
};

// Like a post
exports.likePost = (req, res) => {
    const { postId } = req.params;

    const posts = readData('posts.json');
    const post = posts.find(p => p.id === postId);

    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.visibility === 'private' && post.author !== req.user._id) {
        return res.status(403).json({ message: 'Not authorized to like this post.' });
    }

    post.likes += 1;
    writeData('posts.json', posts);

    res.json({ message: 'Post liked successfully.', post });
};
