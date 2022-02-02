const mongoose = require('mongoose'); 
const Models = require('./models.js');
const Movies = Models.Movie;
const Users = Models.User; 
const Genres = Models.Genre; 
const Directors = Models.Director; 
 mongoose.connect('mongodb://localhost:27017/myFlexDB', 
  {useNewUrlParser: true, useUnifiedTopology: true}); 


  // mongoose.connect(process.env.CONNECTION_URI,  
  // {useNewUrlParser: true, useUnifiedTopology: true});  
const express = require('express');
const { check, validationResult } = require('express-validator');

bodyParser = require('body-parser'),
  uuid = require('uuid');
const app = express();
      app.use(bodyParser.urlencoded({ extended: true }));
      const cors = require('cors');
      app.use(cors());
      /*
      only certain origins will be given access 
      let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
      app.use(cors({
        origin: (origin, callback) => {
          if(!origin) return callback(null, true); 
          if(allowedOrigins.indexOf(origin)=== -1) {
            let message = 'The CORS policy for this application doesnt allow 
            acces from origin' + origin; 
            return callback(new Error(message), false); 
          }
          return callback(null, true); 
        }
      })); 
       */
      let auth = require('./auth')(app);
      const passport = require('passport');
      require('./passport'); 
      morgan = require('morgan');
      app.use(morgan('common'));
      app.use(bodyParser.json());

// GET requests 
app.get('/', (req, res) => {
  res.send('Welcome to my movie club!');
});

app.get('/documentation', (req, res) => {                  
  res.sendFile('public/documentation.html', { root: __dirname });
});
// Get a list of all movies 
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Get the data about a single movie, by title 
app.get('/Movies/:Title', passport.authenticate('jwt', {session:false}) ,(req, res) => {
  Movies.findOne({Title: req.params.Title})
  .then((movie) => {
    res.json(movie);
  }).catch((err) => {
    console.error(err); 
    res.status(500).send('Error: ' + err); 
  }); 
}); 

// add new movie 
app.post("/movies", passport.authenticate('jwt', {session:false}) ,(req, res)=> {
  Movies.findOne({Title: req.body.Title})
  .then((movie)=> {
    if(movie) {
      return res.status(400).send(req.body.Title + " already exists")
    } else {
      Movies.create( {
        Title: req.body.Title,
        Description: req.body.Description
      })
      .then((movie) => {
        res.status(201).json(movie);
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error " + error);
      })
    }
  })
})

// delete a movie by ID 
app.delete('/movies/:MovieID', passport.authenticate('jwt', {session:false}) ,(req, res) => {
  Movies.findOneAndRemove({
    MovieID: req.params.MovieID
  })
  .then((movie) => {
    if(!movie){
      res.status(400).send(req.params.MovieID + ' was not found '); 
    } else {
      res.status(200).send(req.params.MovieID + ' was deleted.'); 
    }
  }).catch((err) => {
    console.error(err); 
    res.status(500).send('Error: ' + err); 
  }); 
});

// Get JSON genre Info when looking for a sprecific genre

app.get('/Genres/:Title',passport.authenticate('jwt', {session:false}) , (req, res) => {
  Genres.findOne({Title: req.params.Title})
  .then((genre) => {
    res.json(genre.Description);
  }).catch((err) => {
    console.error(err); 
    res.status(500).send('Error: ' + err); 
  }); 
}); 


// Get info on director when looking for  a sprecific director 
app.get("/directors/:Title" , passport.authenticate('jwt', {session:false}) , (req,res) => {
  Directors.findOne({
    Title: req.params.Title
  }).then((director) => {
    res.json(director);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send("Error: " + err);
  });
}); 
// Create new user 

app.post('/users',
 
  [
    check('Username', 'Username is required').isLength({min: 5}),
    check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email', 'Email does not appear to be valid').isEmail()
  ], (req, res) => {

  // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username }) // Search to see if a user with the requested username already exists
      .then((user) => {
        if (user) {
          //If the user is found, send a response that it already exists
          return res.status(400).send(req.body.Username + ' already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            })
            .then((user) => { res.status(201).json(user) })
            .catch((error) => {
              console.error(error);
              res.status(500).send('Error: ' + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });
  });

  // Get All users 

  app.get('/users',passport.authenticate('jwt', {session:false}) , (req, res) => {
    Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      res.status(500).send('Error: ' + err); 
    }); 
  }); 
  // Get a users by username 

  app.get('/users/:Username',passport.authenticate('jwt', {session:false}) , (req, res) => {
    Users.findOne({Username: req.params.Username})
    .then((user) => {
      res.json(user);
    }).catch((err) => {
      console.error(err); 
      res.status(500).send('Error: ' + err); 
    }); 
  }); 

  // update user's info, by username

  app.put('/users/:Username',passport.authenticate('jwt', {session:false}) , (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true },
    (err, updatedUser) => {
      if(err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
  });

  // Add a movie to a user's list of favorites 
  app.post('/users/:Username/movies/:movieId', passport.authenticate('jwt', {session:false}) , (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username},
      {
        $push: {FavoriteMovies: req.params.movieId}
      },
      {new: true},
      (err, updatedUser) => {
        if(err) {
          console.error(err);
          res.status(500).send('Error: ' + err); 
        } else {
          res.json(updatedUser); 
        }
      }
      ); 
  }); 

 // delete a movie from user's list of favorites
  app.delete('/users/:Username/movies/:movieId', passport.authenticate('jwt', {session:false}) , (req, res) => {
    Users.findOneAndUpdate({Username: req.params.Username},
      {
        $pull: {FavoriteMovies: req.params.movieId}
      },
      {new: true},
      (err, updatedUser) => {
        if(err) {
          console.error(err);
          res.status(500).send('Error: ' + err); 
        } else {
          res.json(updatedUser); 
        }
      }
      ); 
  }); 
 


  // Delete a user by username 

  app.delete('/users/:Username', passport.authenticate('jwt', {session:false}) , (req, res) => {
    Users.findOneAndRemove({
      Username: req.params.Username
    })
    .then((user) => {
      if(!user){
        res.status(400).send(req.params.Username + ' was not found '); 
      } else {
        res.status(200).send(req.params.Username + ' was deleted.'); 
      }
    }).catch((err) => {
      console.error(err); 
      res.status(500).send('Error: ' + err); 
    }); 
  });



  // create myLogger  
let myLogger = (req, res, next)=> {
  console.log(req.url);
  next();
};
app.use(myLogger);

app.get('/secreturl', (req,res)=> {
  res.send('this is super top content');
});

app.use(express.static('public'));

//Create an error-handling middleware function 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke'); 
})
// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});