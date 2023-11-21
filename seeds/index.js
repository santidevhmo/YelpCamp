
/* 

Why do we create another index.js file in the seeds folder?
Why do we re-connect to the mongoDB? Why don't we do this in the first index.js or app.js file we made?

   The reason for creating a separate file for seeding the database is mainly for organization and separation of concerns.
   In a larger application, you might have many different types of data that you want to seed into your database. If you put all of this in your main index.js or app.js file, it could become quite large and difficult to manage.

*/

const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers'); // In seed helpers, we are exporting these objects with module.exports
const Campground = require('../models/campground'); // Requiring the Campground model

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


// A random combination of 1 place + 1 descriptor from our seedHelpers.js file
const sample = (Array) => Array[Math.floor(Math.random() * Array.length)];

// Function for seeding the DB
const seedDB = async () => {

    // Empty the DB before seeding it
    await Campground.deleteMany({});

    // Seeding the DB with a 1000 new campgrounds from our data files (cities.js and seedHelpers.js)
    for (let i = 0; i < 50; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            image: "https://source.unsplash.com/random/?camping",
            description: "lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos",
            price: price
        });

        await camp.save();
    }

};

// Running our seeding function
seedDB()
    .then(() => {
        // Closing our MongoDB connection so that we don't have to CTRL + C every time to stop the server
        mongoose.connection.close();
    });