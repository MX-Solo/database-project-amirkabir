const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

class User {
  constructor(db) {
    this.collection = db.collection('users');
  }

  // Create new user
  async createUser(username, password) {
    try {
      // Check if user already exists
      const existingUser = await this.collection.findOne({ username });
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user document
      const user = {
        username,
        password: hashedPassword,
        watched_movies: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await this.collection.insertOne(user);
      return { ...user, _id: result.insertedId };
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  async findByUsername(username) {
    try {
      return await this.collection.findOne({ username });
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  async findById(userId) {
    try {
      return await this.collection.findOne({ _id: new ObjectId(userId) });
    } catch (error) {
      throw error;
    }
  }

  // Add movie to watched list
  async addWatchedMovie(userId, movieId) {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $addToSet: { watched_movies: new ObjectId(movieId) },
          $set: { updated_at: new Date() }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Remove movie from watched list
  async removeWatchedMovie(userId, movieId) {
    try {
      const result = await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { 
          $pull: { watched_movies: new ObjectId(movieId) },
          $set: { updated_at: new Date() }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get watched movies
  async getWatchedMovies(userId) {
    try {
      const user = await this.findById(userId);
      return user ? user.watched_movies : [];
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;