
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campgroundSchema = new Schema({

    title: {
        type: String,
        required: true
    },
    price: {
        type: Number
    },
    image: {
        type: String
    },
    description: {
        type: String
    },
    location: {
        type: String
    },
    reviews : [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

// After-delete middleware for the campground model
campgroundSchema.post('findOneAndDelete', async function (doc) {

    // Delete all reviews associated with the deleted campground
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
});

module.exports = mongoose.model('Campground', campgroundSchema);