const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import controllers
const UserController = require('./controllers/userController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/movieDB?authSource=admin';
let db;
let userController;

async function connectDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('movieDB');
    userController = new UserController(db);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Movie Recommendation System API',
    endpoints: {
      // User Management
      'POST /api/users/register': 'Register new user',
      'POST /api/users/login': 'Login user',
      'POST /api/users/:userId/watched-movies': 'Add movie to watched',
      'DELETE /api/users/:userId/watched-movies': 'Remove movie from watched',
      'GET /api/users/:userId/watched-movies': 'Get watched movies',
      'GET /api/users/:userId/recommendations': 'Get personalized recommendations',
      
      // Search
      'GET /api/movies/search?query=...': 'Search movies',
      
      // General APIs
      'GET /api/movies': 'Get all movies',
      'GET /api/movies/genre/:genre': 'Get movies by genre',
      'GET /api/movies/director/:director': 'Get movies by director',
      'GET /api/movies/actor/:actor': 'Get movies by actor',
      'GET /api/stats/genres': 'Get genre distribution',
      'GET /api/stats/directors': 'Get top directors',
      'GET /api/recommendations/:movieId': 'Get movie recommendations',
      
      // Management Queries
      'GET /api/management/director-specialization': 'Director-genre specialization',
      'GET /api/management/actor-collaboration': 'Actor collaboration network',
      'GET /api/management/genre-timeline': 'Genre popularity timeline',
      'GET /api/management/actor-director': 'Actor-director collaboration'
    }
  });
});

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, director, actor } = req.query;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    if (genre) {
      filter.genres = { $in: [genre] };
    }
    if (director) {
      filter.directors = { $in: [director] };
    }
    if (actor) {
      filter.cast = { $in: [actor] };
    }

    const movies = await db.collection('movies')
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('movies').countDocuments(filter);

    res.json({
      movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movies by genre
app.get('/api/movies/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const movies = await db.collection('movies')
      .find({ genres: { $in: [genre] } })
      .limit(50)
      .toArray();
    
    res.json({ genre, movies, count: movies.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movies by director
app.get('/api/movies/director/:director', async (req, res) => {
  try {
    const { director } = req.params;
    const movies = await db.collection('movies')
      .find({ directors: { $in: [director] } })
      .limit(50)
      .toArray();
    
    res.json({ director, movies, count: movies.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movies by actor
app.get('/api/movies/actor/:actor', async (req, res) => {
  try {
    const { actor } = req.params;
    const movies = await db.collection('movies')
      .find({ cast: { $in: [actor] } })
      .limit(50)
      .toArray();
    
    res.json({ actor, movies, count: movies.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get genre distribution
app.get('/api/stats/genres', async (req, res) => {
  try {
    const genreStats = await db.collection('movies').aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    res.json({ genreDistribution: genreStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top directors
app.get('/api/stats/directors', async (req, res) => {
  try {
    const directorStats = await db.collection('movies').aggregate([
      { $unwind: '$directors' },
      { $group: { 
        _id: '$directors', 
        movieCount: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }},
      { $match: { movieCount: { $gt: 3 } } },
      { $sort: { avgRating: -1 } }
    ]).toArray();
    
    res.json({ topDirectors: directorStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Management APIs
app.post('/api/users/register', async (req, res) => {
  await userController.register(req, res);
});

app.post('/api/users/login', async (req, res) => {
  await userController.login(req, res);
});

app.post('/api/users/:userId/watched-movies', async (req, res) => {
  await userController.addWatchedMovie(req, res);
});

app.delete('/api/users/:userId/watched-movies', async (req, res) => {
  await userController.removeWatchedMovie(req, res);
});

app.get('/api/users/:userId/watched-movies', async (req, res) => {
  await userController.getWatchedMovies(req, res);
});

// Recommendation APIs
app.get('/api/users/:userId/recommendations', async (req, res) => {
  await userController.getRecommendations(req, res);
});

// Search API
app.get('/api/movies/search', async (req, res) => {
  await userController.searchMovies(req, res);
});

// Management Queries APIs
app.get('/api/management/director-specialization', async (req, res) => {
  try {
    const result = await db.collection('movies').aggregate([
      { $unwind: '$genres' },
      { $unwind: '$directors' },
      { $group: {
        _id: { director: '$directors', genre: '$genres' },
        movieCount: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }},
      { $group: {
        _id: '$_id.director',
        genreStats: {
          $push: {
            genre: '$_id.genre',
            movieCount: '$movieCount',
            avgRating: '$avgRating'
          }
        },
        totalMovies: { $sum: '$movieCount' }
      }},
      { $addFields: {
        genreStats: {
          $map: {
            input: '$genreStats',
            as: 'stat',
            in: {
              genre: '$$stat.genre',
              movieCount: '$$stat.movieCount',
              avgRating: '$$stat.avgRating',
              percentage: { $multiply: [{ $divide: ['$$stat.movieCount', '$totalMovies'] }, 100] }
            }
          }
        }
      }},
      { $match: {
        'genreStats.percentage': { $gte: 70 }
      }},
      { $sort: { totalMovies: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({ directorSpecialization: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/management/actor-collaboration', async (req, res) => {
  try {
    const result = await db.collection('movies').aggregate([
      { $match: { cast: { $in: ['Robert Henry'] } } },
      { $unwind: '$cast' },
      { $match: { cast: { $ne: 'Robert Henry' } } },
      { $group: {
        _id: '$cast',
        collaborationCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        movies: { $push: '$title' }
      }},
      { $sort: { collaborationCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({ actorCollaboration: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/management/genre-timeline', async (req, res) => {
  try {
    const result = await db.collection('movies').aggregate([
      { $addFields: {
        decade: {
          $concat: [
            { $toString: { $multiply: [{ $floor: { $divide: ['$release_year', 10] } }, 10] } },
            's'
          ]
        }
      }},
      { $unwind: '$genres' },
      { $group: {
        _id: { decade: '$decade', genre: '$genres' },
        movieCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        totalVotes: { $sum: '$votes' }
      }},
      { $sort: { '_id.decade': 1, movieCount: -1 } }
    ]).toArray();

    res.json({ genreTimeline: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/management/actor-director', async (req, res) => {
  try {
    const result = await db.collection('movies').aggregate([
      { $unwind: '$directors' },
      { $unwind: '$cast' },
      { $group: {
        _id: { director: '$directors', actor: '$cast' },
        collaborationCount: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        movies: { $push: '$title' }
      }},
      { $match: { collaborationCount: { $gte: 2 } } },
      { $sort: { avgRating: -1 } },
      { $limit: 10 }
    ]).toArray();

    res.json({ actorDirectorCollaboration: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get movie recommendations (original)
app.get('/api/recommendations/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const movie = await db.collection('movies').findOne({ _id: movieId });
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    // Find movies with similar genres and actors
    const recommendations = await db.collection('movies').aggregate([
      { $match: { _id: { $ne: movieId } } },
      { $addFields: {
        genreSimilarity: {
          $size: {
            $setIntersection: ['$genres', movie.genres]
          }
        },
        actorSimilarity: {
          $size: {
            $setIntersection: ['$cast', movie.cast]
          }
        }
      }},
      { $match: {
        $or: [
          { genreSimilarity: { $gt: 0 } },
          { actorSimilarity: { $gt: 0 } }
        ]
      }},
      { $addFields: {
        similarityScore: {
          $add: [
            { $multiply: ['$genreSimilarity', 2] },
            '$actorSimilarity'
          ]
        }
      }},
      { $sort: { similarityScore: -1 } },
      { $limit: 10 },
      { $project: {
        title: 1,
        genres: 1,
        rating: 1,
        similarityScore: 1
      }}
    ]).toArray();

    res.json({ 
      originalMovie: movie.title,
      recommendations 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if data exists in MongoDB
async function checkAndLoadData() {
  try {
    const db = client.db('movieDB');
    const collection = db.collection('movies');
    
    const count = await collection.countDocuments();
    console.log(`📊 Movies in database: ${count}`);
    
    if (count === 0) {
      console.log('🔄 No movies found. Loading data...');
      
      // Import and run the analyze-and-load script
      const { execSync } = require('child_process');
      try {
        execSync('node analyze-and-load.js', { stdio: 'inherit' });
        console.log('✅ Data loaded successfully');
      } catch (error) {
        console.log('⚠️  Could not load data automatically. You can run: npm run init-data');
      }
    } else {
      console.log('✅ Movies already loaded in database');
    }
  } catch (error) {
    console.log('⚠️  Could not check database. You can run: npm run init-data');
  }
}

// Start server
async function startServer() {
  await connectDB();
  
  // Check and load data if needed
  await checkAndLoadData();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Web Interface: http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`🗄️  MongoDB: localhost:27017`);
  });
}

startServer();