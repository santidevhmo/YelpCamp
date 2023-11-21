
const express = require('express');
const path = require('path'); // Requiring it to make the views path absolute
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate'); // Requiring it to be able to use the layout.ejs file
const Joi = require('joi'); // Schema validation library
const { campgroundSchema } = require('./JOI_schemas.js'); // Requiring the campgroundSchema from the JOI_schemas.js file
const { reviewSchema } = require('./JOI_schemas.js'); // Requiring the reviewSchema from the JOI_schemas.js file
const methodOverride = require('method-override'); // Requiring it to be able to use the PUT and DELETE methods in the form
const Campground = require('./models/campground'); // Requiring the Campground model
const Review = require('./models/review'); // Requiring the Review model
const ExpressError = require('./helpers/ExpressError'); // Requiring the appError function
const catchAsync = require('./helpers/catchAsync'); // Requiring the catchAsync function
const review = require('./models/review');
// ./ means the file is in the same directory as the current file
// ../ means the file is in the parent directory of the current file

// Creating the DB and connecting to it
// (This line is connecting to a MongoDB database named "yelp-camp". If this database does not exist, MongoDB will create it when the first set of data (or "document") is written into the database.)
mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Event listener for if we have an error in the connection to the MongoDB database
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
// Event listener for if we have a successful connection to the MongoDB database
mongoose.connection.once('open', () => {
    console.log('Database connected');
});

const app = express();

//
app.engine('ejs', ejsMate);
// Setting up the view engine for EJS to work
app.set('view engine', 'ejs');
// Setting up the views path to be absolute
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse the body of the POST request (without it, req.body is empty)
app.use(express.urlencoded({ extended: true }));
// Middleware to override the POST request to a PUT (Update) or DELETE request
app.use(methodOverride('_method')); // Forms only send GET or POST requests, so we need this middleware to override the POST request to a PUT (Update) or DELETE request

// JOI Schema Validation Middleware
const validateCampground = (req, res, next) => {
    
    const { error } = campgroundSchema.validate(req.body);
    // (If the input is valid, then the error will be undefined.)

    if (error) {
        const errorMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(errorMsg, 400)
    } else {
        next();
    }

};

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const errorMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(errorMsg, 400)
    } else {
        next();
    }
};

// Handling the Home page route
app.get('/', (req, res) => {
    res.render('home');
});

// Handling the 'Campgrund' page route
// GET request to display all campgrounds in DB
app.get('/campgrounds', catchAsync(async (req, res) => {

   const campgrounds =  await Campground.find({});
   res.render('campgrounds/catalogue', { campgrounds });

}));

// Handling the path to add a new campground : Render template
// (The response is sent to the route '/campgrounds')
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/addCampground');
});

// Handling the path to add a new campground : POST request catch
app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {

    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);

}));


// Handling the path for the individual campground page
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews'); // Explanation of the use of populate() in Notion Page "‘Populating’ in MongoDB"
    res.render('campgrounds/singleCampground', { campground });
}));

// Handling the path for the editing of a specific campground
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground });
}));

// Handling the path for updating a specific campground by ID
// (This handler works thanks to the method-override middleware)
app.put('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {
        title: req.body.campground.title,
        location: req.body.campground.location,
        price: req.body.campground.price
    });
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Handling the path for deleting a specific campground by ID
// (This handler works thanks to the method-override middleware)
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

// Submit a review & save review to the Models and DB Handler
app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Delete a review Handler
app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(req.params.reviewId);
    res.redirect(`/campgrounds/${id}`);
}));

app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404));
});

// Error handler middleware : all next() calls with an error will be handled by this middleware
app.use((err, req, res, next) => {
    
    const { statusCode = 500, message = 'Something went wrong!' } = err;;

    if (!err.message) err.message = 'Oh no, something went wrong!' // Default error message

    res.status(statusCode).render('error', { err });

});

// // Test route for seeding the DB
// app.get('/makecampground', async (req, res) => {

//     // Seeding the DB with a new campground
//     const camp = new Campground({
//         title: 'My Backyard',
//         description: 'Cheap camping!'
//     });

//     // We use await to pause the execution of this async function until the DB has saved the new campground
//     await camp.save();
//     // 👇 This line runs until the await from above finishes
//     res.send(camp);

// });

// Opening up the server to listen on port 3000
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});