import User from '../models/User.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import express from 'express';
import Opportunity from '../models/Opportunity.js';
const router = express.Router();

export const home = async (req, res) => {
  res.render('home', {title: 'Node Template'});
};

export const about = async (req, res) => {
  res.render('about', {title: 'About'});
};

export const opps = async (req, res) => {
    try {
        let opportunities = await Opportunity.find();

        // Check if there's a search query
        const { search } = req.query;
        if (search) {
            // Filter opportunities based on search query
            opportunities = opportunities.filter(opportunity => 
                opportunity.name.toLowerCase().includes(search.toLowerCase()) ||
                opportunity.organization.toLowerCase().includes(search.toLowerCase()) ||
                opportunity.description.toLowerCase().includes(search.toLowerCase()) ||
                opportunity.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
            );
        }

        res.render('opportunities', { opps: opportunities });
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        res.status(500).send('Server error');
    }
};

export const lettersubmit = async (req, res) => {
    try {
        // handle letter submission logic
        res.redirect('/letters');
    } catch (error) {
        res.status(500).send('Error submitting letter');
    }
};

router.get('/opportunities', (req, res) => {
    res.json(opportunities);
});

// Route to search opportunities by name
router.get('/opportunities/search', (req, res) => {
    const searchQuery = req.query.name.toLowerCase();
    const filteredOpportunities = opportunities.filter(opportunity => 
        opportunity.name.toLowerCase().includes(searchQuery)
    );
    res.json(filteredOpportunities);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // Allow PDF files
    } else {
        cb(null, false); // Reject non-PDF files
    }
};
const upload = multer({ storage: storage, fileFilter: fileFilter });

const processUpload = upload.single('fileInput'); // Multer middleware for single file upload

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded or file type not allowed.');
  }

  console.log(req.file.originalname);
  const fileName = req.file.originalname.split('.')[0] + '-' + Date.now() + path.extname(req.file.originalname);
  const filePath = path.join(uploadDir, fileName);
  console.log(filePath);
  const fileUrl = req.file ? `/uploads/${req.file.fileName}` :'';

  try {
    await sharp(req.file.buffer)
      .resize(300)
      .toFile(filePath);
    
    

    console.log('file uploaded!');
    res.redirect('/');
  } catch (error) {
      res.status(500).send('Error processing file' + error);
  }
};

export { processUpload, uploadFile };