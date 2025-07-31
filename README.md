
# Movie Recommendation System with MongoDB and Docker

This project is a movie recommendation system that uses MongoDB to manage movie data and runs using Docker.

## Features

- **Hierarchical data modeling**: Uses MongoDB’s document model  
- **Array processing**: Native handling of genres, directors, and cast  
- **Complex queries**: Recommendation logic written in single queries  
- **High performance**: Efficient reading of nested documents  

## Project Structure

```

├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── movies.json
├── init-mongo.js
├── scripts/
│   ├── load-movies.js
│   └── queries.js
└── README.md

````

## Installation & Running

### 1. Run with Docker Compose

```bash
# Build and run the containers
docker-compose up --build

# Run in background
docker-compose up -d --build
````

### 2. Load Data (Automatically)

The system loads movie data automatically. For manual loading:

```bash
# Manually load movie data
docker-compose exec app npm run init-data
```

### 3. Run Sample Queries

```bash
# Execute sample queries
docker-compose exec app npm run queries
```

## Core Queries

1. **Genre Distribution**: Count of movies per genre, sorted from most to least
2. **Top Directors**: Find directors with more than 3 movies and show their average rating
3. **Actor Connections**: Find movies that share at least 2 actors with the movie "Speech"

## API Endpoints

### User Management

* `POST /api/users/register` – Register a new user
* `POST /api/users/login` – User login
* `POST /api/users/:userId/watched-movies` – Add a movie to watched list
* `DELETE /api/users/:userId/watched-movies` – Remove a movie from watched list
* `GET /api/users/:userId/watched-movies` – Get user's watched movies

### Recommendation Engine

* `GET /api/users/:userId/recommendations` – Get personalized recommendations
* `GET /api/movies/search?query=...` – Search for movies

### Management Queries

* `GET /api/management/director-specialization` – Director-to-genre specialization
* `GET /api/management/actor-collaboration` – Actor collaboration network
* `GET /api/management/genre-timeline` – Genre popularity timeline
* `GET /api/management/actor-director` – Actor-director collaborations

### Public APIs

* `GET /` – API info
* `GET /api/movies` – Get all movies
* `GET /api/movies/genre/:genre` – Get movies by genre
* `GET /api/movies/director/:director` – Get movies by director
* `GET /api/movies/actor/:actor` – Get movies by actor
* `GET /api/stats/genres` – Genre statistics
* `GET /api/stats/directors` – Director statistics
* `GET /api/recommendations/:movieId` – Get recommendations for a specific movie

## Accessing MongoDB

```bash
# Connect to MongoDB inside the container
docker-compose exec mongodb mongosh -u admin -p password123

# Or from the host machine
mongosh "mongodb://admin:password123@localhost:27017/movieDB?authSource=admin"
```

## Sample Data

### Sample Movie Document

```json
{
  "_id": ObjectId("684f1025116872a7ed50eb67"),
  "title": "Order traditional",
  "genres": ["Fantasy"],
  "release_year": 2013,
  "directors": ["Amy Sims", "Melissa Foster"],
  "cast": [
    "Ruben Yang",
    "Debbie Phillips",
    "Bradley Chavez",
    "Sheila Diaz",
    "Michael Lyons",
    "John Mooney MD"
  ],
  "rating": 7.4,
  "votes": 991252,
  "description": "Task lay century great move perform..."
}
```

### Sample User Document

A sample user with username `ali` and password `password123`:

```json
{
  "_id": ObjectId("684f1f9e7139700c2fb28410"),
  "username": "ali",
  "password": "hashed_password",
  "watched_movies": [
    ObjectId("684f1025116872a7ed510214"),
    ObjectId("684f1025116872a7ed50f8bb"),
    ObjectId("684f1025116872a7ed50ec9f")
  ],
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

## Container Management

```bash
# Stop services
docker-compose down

# Remove everything including volumes
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f mongodb
```

## Ports

* **3000**: Node.js Application
* **27017**: MongoDB

## Environment Variables

```env
MONGODB_URI=mongodb://admin:password123@mongodb:27017/movieDB?authSource=admin
PORT=3000
```

```

---

Let me know if you want the README in a `.md` file or if there are other parts of the project you want improved!
```
