import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import User from './models/User.js';
import Post from './models/Post.js';
import configurePassport from './config/passport.js';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: 'process.env' });

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

configurePassport(passport); // Configuring passport

// Session setup
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URL })
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Middleware to set user data
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Multer configuration
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const dataFilePath = path.join('uploads', 'data.json');

// Helper function to read data from the JSON file
const readData = () => {
  if (fs.existsSync(dataFilePath)) {
    const fileData = fs.readFileSync(dataFilePath);
    return JSON.parse(fileData);
  }
  return [];
};

// Helper function to write data to the JSON file
const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// Ensure authenticated middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Route to render the upload page
app.get('/upload', (req, res) => {
  try {
    const files = readData();
    res.render('upload', { files: files, user: req.user });
  } catch (err) {
    console.error('Error rendering upload page:', err);
    res.status(500).send('Server error');
  }
});

app.post('/upload', ensureAuthenticated, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded or file type not allowed.');
  }

  const fileName = req.file.originalname.split('.')[0] + '-' + Date.now() + path.extname(req.file.originalname);
  const filePath = path.join('uploads', fileName);

  try {
    if (req.file.mimetype.startsWith('image/')) {
      await sharp(req.file.buffer).resize(300).toFile(filePath);
    } else {
      fs.writeFileSync(filePath, req.file.buffer);
    }

    const newEntry = {
      topic: req.body.topic,
      link: req.body.link,
      who: req.body.who,
      fileName: fileName
    };

    const data = readData();
    data.push(newEntry);
    writeData(data);

    res.redirect('/upload');
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).send('Error processing file');
  }
});

// Express route to handle search requests
app.get('/search', async (req, res) => {
    const query = req.query.query; // Get the search query from request parameters
    try {
        // Call the searchPosts function to search for posts
        const searchResults = await searchPosts(query);
        res.json(searchResults);
    } catch (error) {
        console.error("Error searching for posts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Route to handle file deletions
app.post('/delete/:fileName', ensureAuthenticated, (req, res) => {
  const fileName = req.params.fileName;

  try {
    const data = readData();
    const fileIndex = data.findIndex(file => file.fileName === fileName);

    if (fileIndex === -1) {
      return res.status(404).send('File not found');
    }

    data.splice(fileIndex, 1);
    writeData(data);

    const filePath = path.join('uploads', fileName);
    fs.unlink(filePath, (err) => {
      if (err) throw err;
      res.redirect('/upload');
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).send('Error deleting file');
  }
});

// Define routes
import routes from './routes/routes.js';
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
