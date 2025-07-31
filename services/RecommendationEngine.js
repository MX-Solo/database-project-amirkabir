const { ObjectId } = require('mongodb');

class RecommendationEngine {
  constructor(db) {
    this.moviesCollection = db.collection('movies');
    this.usersCollection = db.collection('users');
  }

  // Calculate user preferences based on watched movies
  async calculateUserPreferences(userId) {
    try {
      const user = await this.usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user || !user.watched_movies || user.watched_movies.length === 0) {
        return { genres: {}, directors: {}, actors: {} };
      }

      // Get watched movies
      const watchedMovies = await this.moviesCollection.find({
        _id: { $in: user.watched_movies }
      }).toArray();

      // Calculate preferences
      const preferences = {
        genres: {},
        directors: {},
        actors: {}
      };

      watchedMovies.forEach(movie => {
        // Count genres
        if (movie.genres) {
          movie.genres.forEach(genre => {
            preferences.genres[genre] = (preferences.genres[genre] || 0) + 1;
          });
        }

        // Count directors
        if (movie.directors) {
          movie.directors.forEach(director => {
            preferences.directors[director] = (preferences.directors[director] || 0) + 1;
          });
        }

        // Count actors
        if (movie.cast) {
          movie.cast.forEach(actor => {
            preferences.actors[actor] = (preferences.actors[actor] || 0) + 1;
          });
        }
      });

      // Normalize weights (sum = 1.0)
      const normalizeWeights = (weights) => {
        const total = Object.values(weights).reduce((sum, count) => sum + count, 0);
        if (total === 0) return weights;
        
        const normalized = {};
        Object.keys(weights).forEach(key => {
          normalized[key] = weights[key] / total;
        });
        return normalized;
      };

      return {
        genres: normalizeWeights(preferences.genres),
        directors: normalizeWeights(preferences.directors),
        actors: normalizeWeights(preferences.actors)
      };
    } catch (error) {
      throw error;
    }
  }

  // Get movie recommendations for user
  async getRecommendations(userId, limit = 20) {
    try {
      const user = await this.usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new Error('User not found');
      }

      const preferences = await this.calculateUserPreferences(userId);
      const watchedMovieIds = user.watched_movies || [];

      // Get all movies except watched ones
      const allMovies = await this.moviesCollection.find({
        _id: { $nin: watchedMovieIds }
      }).toArray();

      // Calculate scores for each movie
      const scoredMovies = allMovies.map(movie => {
        let genreScore = 0;
        let directorScore = 0;
        let actorScore = 0;

        // Calculate genre score
        if (movie.genres) {
          movie.genres.forEach(genre => {
            genreScore += preferences.genres[genre] || 0;
          });
        }

        // Calculate director score
        if (movie.directors) {
          movie.directors.forEach(director => {
            directorScore += preferences.directors[director] || 0;
          });
        }

        // Calculate actor score
        if (movie.cast) {
          movie.cast.forEach(actor => {
            actorScore += preferences.actors[actor] || 0;
          });
        }

        // Calculate total score
        const totalScore = 
          (genreScore * 0.4) +
          (directorScore * 0.25) +
          (actorScore * 0.15) +
          ((movie.rating || 0) / 20) +
          (Math.log10(movie.votes || 1) / 100);

        return {
          _id: movie._id,
          title: movie.title,
          genres: movie.genres,
          directors: movie.directors,
          cast: movie.cast,
          rating: movie.rating,
          votes: movie.votes,
          release_year: movie.release_year,
          totalScore: totalScore
        };
      });

      // Sort by score and limit results
      const recommendations = scoredMovies
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      throw error;
    }
  }

  // Search movies by title (case-insensitive)
  async searchMovies(query, limit = 20) {
    try {
      const movies = await this.moviesCollection.find({
        title: { $regex: query, $options: 'i' }
      })
      .limit(limit)
      .toArray();

      return movies;
    } catch (error) {
      throw error;
    }
  }

  // Get watched movies for user
  async getWatchedMovies(userId) {
    try {
      const user = await this.usersCollection.findOne({ _id: new ObjectId(userId) });
      if (!user || !user.watched_movies) {
        return [];
      }

      const watchedMovies = await this.moviesCollection.find({
        _id: { $in: user.watched_movies }
      }).toArray();

      return watchedMovies;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RecommendationEngine;