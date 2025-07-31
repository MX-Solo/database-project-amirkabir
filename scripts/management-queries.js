const { MongoClient } = require('mongodb');

async function runManagementQueries() {
  const client = new MongoClient('mongodb://admin:password123@mongodb:27017/movieDB?authSource=admin');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('movieDB');
    const moviesCollection = db.collection('movies');
    
    console.log('\n📊 Running Management Queries...\n');

    // Query 1: Director-Genre Specialization
    console.log('1. 🎭 Director-Genre Specialization Query:');
    const directorGenreSpecialization = await moviesCollection.aggregate([
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

    console.log('Directors specializing in specific genres (>70%):');
    directorGenreSpecialization.forEach(director => {
      console.log(`   ${director._id}: ${director.totalMovies} movies`);
      director.genreStats.forEach(stat => {
        if (stat.percentage >= 70) {
          console.log(`     - ${stat.genre}: ${stat.percentage.toFixed(1)}% (${stat.movieCount} movies, avg: ${stat.avgRating.toFixed(2)})`);
        }
      });
    });

    // Query 2: Actor Collaboration Network
    console.log('\n2. 🤝 Actor Collaboration Network Query:');
    const actorCollaboration = await moviesCollection.aggregate([
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

    console.log('Actors frequently collaborating with Robert Henry:');
    actorCollaboration.forEach(actor => {
      console.log(`   ${actor._id}: ${actor.collaborationCount} collaborations, avg rating: ${actor.avgRating.toFixed(2)}`);
      console.log(`     Movies: ${actor.movies.join(', ')}`);
    });

    // Query 3: Genre Popularity Timeline
    console.log('\n3. 📈 Genre Popularity Timeline Query:');
    const genreTimeline = await moviesCollection.aggregate([
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

    console.log('Genre popularity by decade:');
    let currentDecade = '';
    genreTimeline.forEach(item => {
      if (item._id.decade !== currentDecade) {
        currentDecade = item._id.decade;
        console.log(`\n   ${currentDecade}:`);
      }
      console.log(`     ${item._id.genre}: ${item.movieCount} movies, avg rating: ${item.avgRating.toFixed(2)}`);
    });

    // Query 4: Actor-Director Collaboration
    console.log('\n4. 🎬 Actor-Director Collaboration Query:');
    const actorDirectorCollaboration = await moviesCollection.aggregate([
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

    console.log('Top Actor-Director collaborations (by average rating):');
    actorDirectorCollaboration.forEach(collab => {
      console.log(`   ${collab._id.actor} & ${collab._id.director}: ${collab.collaborationCount} movies, avg rating: ${collab.avgRating.toFixed(2)}`);
      console.log(`     Movies: ${collab.movies.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error running management queries:', error.message);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

runManagementQueries();