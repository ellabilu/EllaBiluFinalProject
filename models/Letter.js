import mongoose from 'mongoose';

const letterSchema = new mongoose.Schema({
    topic: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    who: {
        type: String,
        required: true
    },
    file: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    }
});

const Letter = mongoose.model('Letter', letterSchema);

export default Letter;

