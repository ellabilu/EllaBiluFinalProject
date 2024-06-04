import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    applicableTo: {
        type: [String], // Array of strings specifying who this opportunity is applicable to (e.g., 'Students', 'Community Members')
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    uploadedBy: {
        type: String,
        required: true
    },
    tags: {
        type: [String], // Array of strings specifying tags related to the opportunity (e.g., 'Voting', 'Writing', 'Campaign')
        required: true
    },
    description: {
        type: String,
        required: true
    }
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

export default Opportunity;

