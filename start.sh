 #!/bin/bash

echo "🎬 Starting Movie Recommendation System..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🐳 Building and starting containers..."
docker-compose up --build -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 30

# Check if data loading is needed
echo "🔍 Checking data status..."
docker-compose exec app npm run init-data

echo ""
echo "🎉 System is ready!"
echo ""
echo "📋 Access points:"
echo "   🌐 Web Interface: http://localhost:3000"
echo "   📊 API: http://localhost:3000/api"
echo "   🗄️  MongoDB: localhost:27017"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Run queries: docker-compose exec app npm run queries"
echo ""
echo "📚 Documentation: README.md"