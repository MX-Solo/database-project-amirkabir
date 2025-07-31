const fs = require('fs');
const { MongoClient } = require('mongodb');

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/movieDB?authSource=admin';

async function loadMovies() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('movieDB');
    const collection = db.collection('movies');

    // Read the movies.json file (JSON Lines format)
    console.log('Reading movies.json file...');
    const data = fs.readFileSync('./movies.json', 'utf8');
    console.log('File size:', data.length, 'characters');
    
    // Parse JSON Lines format (each line is a separate JSON object)
    const lines = data.trim().split('\n');
    console.log('Number of lines:', lines.length);
    
    const movies = [];
    let errorCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const movie = JSON.parse(line);
          movies.push(movie);
        } catch (parseError) {
          console.error(`Error parsing line ${i + 1}:`, parseError.message);
          errorCount++;
        }
      }
    }
    
    console.log(`Successfully parsed ${movies.length} movies`);
    if (errorCount > 0) {
      console.log(`Failed to parse ${errorCount} lines`);
    }

    // Clear existing data
    await collection.deleteMany({});
    console.log('Cleared existing movies collection');

    // Insert movies using insertMany
    const result = await collection.insertMany(movies);
    console.log(`Successfully inserted ${result.insertedCount} movies`);

    // Verify insertion
    const count = await collection.countDocuments();
    console.log(`Total movies in database: ${count}`);

    // Show a sample document
    const sample = await collection.findOne();
    console.log('Sample movie document:');
    console.log(JSON.stringify(sample, null, 2));

  } catch (error) {
    console.error('Error loading movies:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
loadMovies();