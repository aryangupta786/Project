const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
//const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create a post
router.post('/',  upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    const newPost = new Post({
      image: {
        url: req.file.path,
        publicId: req.file.filename
      },
      caption: req.body.caption,
      location: req.body.location,
      tags: JSON.parse(req.body.tags),
      user: req.user._id
    });

    const savedPost = await newPost.save();
    
    await savedPost.populate('user', 'name avatar');
    
    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts
router.get('/',  async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a post
router.delete('/:id',  async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(post.image.publicId);
    
    await post.remove();
    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;