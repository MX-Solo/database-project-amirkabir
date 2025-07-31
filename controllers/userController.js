const User = require('../models/User');
const RecommendationEngine = require('../services/RecommendationEngine');

class UserController {
  constructor(db) {
    this.userModel = new User(db);
    this.recommendationEngine = new RecommendationEngine(db);
  }

  // Register new user
  async register(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await this.userModel.createUser(username, password);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: 'User created successfully',
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await this.userModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await this.userModel.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Add movie to watched list
  async addWatchedMovie(req, res) {
    try {
      const { userId } = req.params;
      const { movieId } = req.body;

      if (!movieId) {
        return res.status(400).json({ error: 'Movie ID is required' });
      }

      const success = await this.userModel.addWatchedMovie(userId, movieId);
      
      if (success) {
        res.json({ message: 'Movie added to watched list' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Remove movie from watched list
  async removeWatchedMovie(req, res) {
    try {
      const { userId } = req.params;
      const { movieId } = req.body;

      if (!movieId) {
        return res.status(400).json({ error: 'Movie ID is required' });
      }

      const success = await this.userModel.removeWatchedMovie(userId, movieId);
      
      if (success) {
        res.json({ message: 'Movie removed from watched list' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get watched movies
  async getWatchedMovies(req, res) {
    try {
      const { userId } = req.params;
      const watchedMovies = await this.recommendationEngine.getWatchedMovies(userId);
      
      res.json({ watchedMovies });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get recommendations
  async getRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 20 } = req.query;

      const recommendations = await this.recommendationEngine.getRecommendations(userId, parseInt(limit));
      
      res.json({ recommendations });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Search movies
  async searchMovies(req, res) {
    try {
      const { query } = req.query;
      const { limit = 20 } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const movies = await this.recommendationEngine.searchMovies(query, parseInt(limit));
      
      res.json({ movies });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UserController;