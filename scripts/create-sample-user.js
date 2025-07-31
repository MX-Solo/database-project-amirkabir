const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createSampleUser() {
  const client = new MongoClient('mongodb://admin:password123@mongodb:27017/movieDB?authSource=admin');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('movieDB');
    const usersCollection = db.collection('users');
    
    // Check if sample user already exists
    const existingUser = await usersCollection.findOne({ username: 'ali' });
    if (existingUser) {
      console.log('✅ Sample user already exists');
      return;
    }
    
    // Create sample user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    
    const sampleUser = {
      username: 'ali',
      password: hashedPassword,
      watched_movies: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await usersCollection.insertOne(sampleUser);
    console.log('✅ Sample user created successfully');
    console.log('Username: ali');
    console.log('Password: password123');
    console.log('User ID:', result.insertedId);
    
  } catch (error) {
    console.error('❌ Error creating sample user:', error.message);
  } finally {
    await client.close();
  }
}

createSampleUser();