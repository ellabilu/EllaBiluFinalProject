import Post from '../models/Post.js';
import User from '../models/User.js';
import Reply from '../models/Reply.js';

// Load posts with replies
export const loadPosts = async (req, res) => {
  try {
    const selectedUserId = req.query.user;
    let query = {};

    if (selectedUserId && selectedUserId !== 'all') {
      query.author = selectedUserId;
    }

    const posts = await Post.find(query)
      .populate('author', 'username')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username' }
      });

    const totalPosts = await Post.countDocuments(query);
    const users = await User.find();

    res.render('posts/index', {
      posts,
      totalPosts,
      users,
      selectedUser: selectedUserId,
      user: req.user ? req.user : null,
    });
  } catch (error) {
    res.status(500).send(error.toString());
  }
};

// Write post form
export const writePost = (req, res) => { 
  res.render('posts/new', { post: null });
}

// Create post
export const createPost = async (req, res) => {
  const { title, content } = req.body;
  try {
    const post = new Post({ title, content, author: req.user._id });
    await post.save();
    res.redirect('/qanda');
  } catch (error) {
    res.status(500).send(error.toString());
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findOneAndDelete({ _id: id });
    res.redirect('/');
  } catch (error) {
    res.status(500).send(error.toString());
  }
};

// Edit post form
export const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).send('Unauthorized');
    }
    res.render('posts/new', { post });
  } catch (error) {
    res.status(500).send(error.toString());
  }
};

// Update post
export const savePost = async (req, res) => {
  const { title, content } = req.body;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).send('Post not found');
    }
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).send('Unauthorized');
    }
    post.title = title;
    post.content = content;
    await post.save();
    res.redirect('/');
  } catch (error) {
    res.status(500).send(error.toString());
  }
};

// Add reply to post
export const addReply = async (req, res) => {
  const { content } = req.body;
  try {
    const reply = new Reply({
      content,
      author: req.user._id,
      post: req.params.postId
    });
    await reply.save();

    const post = await Post.findById(req.params.postId);
    post.replies.push(reply._id);
    await post.save();

    res.redirect('/');
  } catch (error) {
    res.status(500).send(error.toString());
  }
};
