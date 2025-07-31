const fs = require('fs');
const { MongoClient } = require('mongodb');

async function analyzeAndLoad() {
  console.log('🔍 Analyzing and loading movies data...');
  
  try {
    // Read the file
    const data = fs.readFileSync('./movies.json', 'utf8');
    console.log('📊 File size:', data.length, 'characters');
    
    // Analyze the structure
    const lines = data.trim().split('\n');
    console.log('📝 Number of lines:', lines.length);
    
    // Parse movies with progress
    console.log('\n🔍 Parsing movies...');
    const movies = [];
    let errorCount = 0;
    let successCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        try {
          const movie = JSON.parse(line);
          movies.push(movie);
          successCount++;
          
          // Show progress every 500 movies
          if (successCount % 500 === 0) {
            console.log(`📈 Processed ${successCount} movies...`);
          }
          
          // Show first successful movie
          if (successCount === 1) {
            console.log('\n✅ First movie sample:');
            console.log('Title:', movie.title);
            console.log('Year:', movie.release_year);
            console.log('Genres:', movie.genres);
            console.log('Rating:', movie.rating);
          }
        } catch (error) {
          errorCount++;
          // Only show first few errors
          if (errorCount <= 3) {
            console.log(`❌ Error parsing line ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    console.log(`\n📊 Parsing Results:`);
    console.log(`✅ Successfully parsed: ${successCount} movies`);
    console.log(`❌ Failed to parse: ${errorCount} lines`);
    
    if (movies.length > 0) {
      console.log('\n🚀 Loading movies into MongoDB...');
      
      const client = new MongoClient('mongodb://admin:password123@mongodb:27017/movieDB?authSource=admin');
      await client.connect();
      console.log('✅ Connected to MongoDB');
      
      const db = client.db('movieDB');
      const collection = db.collection('movies');
      
      // Check if data already exists
      const existingCount = await collection.countDocuments();
      if (existingCount > 0) {
        console.log(`📊 Found ${existingCount} existing movies in database`);
        console.log('✅ Data already loaded, skipping...');
        await client.close();
        return;
      }
      
      // Clear existing data (just in case)
      await collection.deleteMany({});
      console.log('🗑️  Cleared existing data');
      
      // Insert movies
      const result = await collection.insertMany(movies);
      console.log(`✅ Inserted ${result.insertedCount} movies`);
      
      // Verify
      const count = await collection.countDocuments();
      console.log(`📊 Total movies in database: ${count}`);
      
      // Show sample
      const sample = await collection.findOne();
      console.log('\n🎬 Sample from database:');
      console.log('Title:', sample.title);
      console.log('Year:', sample.release_year);
      console.log('Rating:', sample.rating);
      console.log('Genres:', sample.genres);
      
      await client.close();
      console.log('🔌 Disconnected from MongoDB');
      console.log('\n🎉 Data loading completed successfully!');
    } else {
      console.log('❌ No movies to load');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeAndLoad();