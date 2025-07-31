const { MongoClient } = require('mongodb');

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/movieDB?authSource=admin';

async function runQueries() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('movieDB');
    const collection = db.collection('movies');

    console.log('\n=== Running MongoDB Queries ===\n');

    // Query 1: Genre Distribution
    console.log('1. Genre Distribution Query:');
    console.log('Counting movies by genre, ordered from most to least:');
    
    const genreDistribution = await collection.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    genreDistribution.forEach(genre => {
      console.log(`   ${genre._id}: ${genre.count} movies`);
    });

    // Query 2: Top Directors
    console.log('\n2. Top Directors Query:');
    console.log('Directors with more than 3 movies and their average rating:');
    
    const topDirectors = await collection.aggregate([
      { $unwind: '$directors' },
      { $group: { 
        _id: '$directors', 
        movieCount: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }},
      { $match: { movieCount: { $gt: 3 } } },
      { $sort: { avgRating: -1 } }
    ]).toArray();

    topDirectors.forEach(director => {
      console.log(`   ${director._id}: ${director.movieCount} movies, avg rating: ${director.avgRating.toFixed(2)}`);
    });

    // Query 3: Actor Connections
    console.log('\n3. Actor Connections Query:');
    console.log('Movies with at least 2 actors in common with "Speech":');
    
    // First, find the "Speech" movie
    const speechMovie = await collection.findOne({ title: { $regex: /speech/i } });
    
    if (speechMovie) {
      console.log(`   Found movie: "${speechMovie.title}" with actors: ${speechMovie.cast.join(', ')}`);
      
      const actorConnections = await collection.aggregate([
        { $match: { title: { $ne: speechMovie.title } } },
        { $addFields: {
          commonActors: {
            $size: {
              $setIntersection: ['$cast', speechMovie.cast]
            }
          }
        }},
        { $match: { commonActors: { $gte: 2 } } },
        { $project: {
          title: 1,
          commonActors: 1,
          cast: 1
        }},
        { $sort: { commonActors: -1 } }
      ]).toArray();

      if (actorConnections.length > 0) {
        actorConnections.forEach(movie => {
          console.log(`   "${movie.title}": ${movie.commonActors} common actors`);
        });
      } else {
        console.log('   No movies found with 2+ common actors');
      }
    } else {
      console.log('   Movie "Speech" not found in database');
    }

  } catch (error) {
    console.error('Error running queries:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the queries
runQueries();