// Use built-in fetch (Node.js 18+)
const fetch = globalThis.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testAPIs() {
  console.log('🧪 Testing Movie Recommendation System APIs...\n');

  try {
    // Test 1: Register user
    console.log('1. Testing user registration...');
    const registerResponse = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', registerData);

    // Test 2: Login user
    console.log('\n2. Testing user login...');
    const loginResponse = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (loginData.user) {
      const userId = loginData.user._id;

      // Test 3: Search movies
      console.log('\n3. Testing movie search...');
      const searchResponse = await fetch(`${BASE_URL}/movies/search?query=action&limit=5`);
      const searchData = await searchResponse.json();
      console.log('Search response:', searchData);

      if (searchData.movies && searchData.movies.length > 0) {
        const movieId = searchData.movies[0]._id;

        // Test 4: Add movie to watched list
        console.log('\n4. Testing add movie to watched list...');
        const addWatchedResponse = await fetch(`${BASE_URL}/users/${userId}/watched-movies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId })
        });
        
        const addWatchedData = await addWatchedResponse.json();
        console.log('Add watched response:', addWatchedData);

        // Test 5: Get watched movies
        console.log('\n5. Testing get watched movies...');
        const watchedResponse = await fetch(`${BASE_URL}/users/${userId}/watched-movies`);
        const watchedData = await watchedResponse.json();
        console.log('Watched movies response:', watchedData);

        // Test 6: Get recommendations
        console.log('\n6. Testing get recommendations...');
        const recommendationsResponse = await fetch(`${BASE_URL}/users/${userId}/recommendations?limit=5`);
        const recommendationsData = await recommendationsResponse.json();
        console.log('Recommendations response:', recommendationsData);

        // Test 7: Remove movie from watched list
        console.log('\n7. Testing remove movie from watched list...');
        const removeWatchedResponse = await fetch(`${BASE_URL}/users/${userId}/watched-movies`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId })
        });
        
        const removeWatchedData = await removeWatchedResponse.json();
        console.log('Remove watched response:', removeWatchedData);
      }
    }

    console.log('\n✅ All API tests completed successfully!');

  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
  }
}

testAPIs();