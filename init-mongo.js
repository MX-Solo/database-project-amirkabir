 // MongoDB initialization script
db = db.getSiblingDB('movieDB');

// Create user for the application
db.createUser({
  user: 'movieuser',
  pwd: 'moviepass',
  roles: [
    {
      role: 'readWrite',
      db: 'movieDB'
    }
  ]
});

// Create collections
db.createCollection('movies');

print('MongoDB initialized successfully');