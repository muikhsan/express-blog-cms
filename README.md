# Blog CMS API

A RESTful API for a blog content management system built with TypeScript, Express.js, MongoDB, and Redis with comprehensive features including authentication, analytics, device tracking, and robust security.

## Features

- **User Management & Authentication**
  - JWT-based authentication with Redis token blacklisting
  - Secure logout functionality (tokens invalidated server-side)
  - User registration, login, and logout
  - User CRUD operations with proper access control
  - Data sanitization for secure responses
  - 24-hour automatic token expiration in Redis

- **Article Management**
  - Create, read, update, and delete articles
  - Draft and published status support
  - Author-based access control
  - **Pagination support** with configurable page size
  - Advanced filtering by status and author
  - Content truncation for performance (50 characters preview)
  - Comprehensive TypeScript typing

- **Advanced Page View Analytics**
  - Track article page views with detailed metadata
  - Device detection and IP address tracking
  - User agent parsing for browser/OS analytics
  - Analytics with count and date aggregation
  - Support for filtering by date ranges and articles
  - Daily, weekly, and monthly statistics
  - Comprehensive device analytics dashboard
  - Data sanitization for consistent API responses

- **Security & Performance**
  - Redis-based JWT token blacklisting for secure logout
  - Device fingerprinting and IP tracking
  - Rate limiting and CORS protection
  - Content optimization with truncation
  - Comprehensive input validation and sanitization

- **Enhanced Developer Experience**
  - Comprehensive TypeScript type definitions
  - Data sanitization utilities
  - Structured error handling
  - Pagination metadata in all list responses
  - Docker support with Redis integration

## API Endpoints

### Authentication & Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users` - Get all users (public)
- `GET /api/users/:id` - Get user by ID (public)
- `PATCH /api/users/:id` - Update user (owner only)
- `DELETE /api/users/:id` - Delete user (owner only)

### Articles
- `POST /api/articles` - Create article (auth required)
- `GET /api/articles` - Get articles with pagination (published for public, all for authenticated)
  - Query parameters: `page`, `limit`, `status`, `author`
  - Returns paginated response with metadata
- `GET /api/articles/:id` - Get article by ID
- `PATCH /api/articles/:id` - Update article (author only)
- `DELETE /api/articles/:id` - Delete article (author only)

### Page Views & Analytics
- `POST /api/page-view` - Track page view with device and IP detection (public)
- `GET /api/page-view/count` - Get page view count (auth required)
- `GET /api/page-view/aggregate-date` - Get aggregated page views with device analytics (auth required)

## Installation & Setup

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/muikhsan/express-blog-cms
cd express-blog-cms
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- The API server on port 3000
- MongoDB on port 27017
- Redis on port 6379 (for token blacklisting)
- All services with automatic restart

3. The API will be available at `http://localhost:3000`

### Option 2: Local Development

1. Clone the repository:
```bash
git clone https://github.com/muikhsan/express-blog-cms
cd express-blog-cms
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/express-blog-cms
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

5. Ensure MongoDB and Redis are running locally

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Watch Mode (TypeScript compilation)
```bash
npm run watch
```

### Docker Commands
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## Database & Cache Setup

### With Docker
No additional setup required. MongoDB and Redis will be automatically configured when using `docker-compose up`.

### Local Development
Ensure MongoDB and Redis are running on your system. The application will automatically connect to the database and cache specified in the environment variables.

Install dependencies locally:
- **MongoDB**:
  - macOS: `brew install mongodb-community`
  - Ubuntu: `sudo apt install mongodb`
  - Windows: Download from [MongoDB official site](https://www.mongodb.com/try/download/community)
- **Redis**:
  - macOS: `brew install redis`
  - Ubuntu: `sudo apt install redis-server`
  - Windows: Download from [Redis official site](https://redis.io/download)

## API Usage Examples

### Register a User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

### Get Articles with Pagination
```bash
# Get first page with default limit (10)
curl "http://localhost:3000/api/articles"

# Get specific page with custom limit
curl "http://localhost:3000/api/articles?page=2&limit=5"

# Filter by status with pagination
curl "http://localhost:3000/api/articles?status=published&page=1&limit=20"

# Filter by author with pagination
curl "http://localhost:3000/api/articles?author=user_id_here&page=1&limit=10"
```

**Response format:**
```json
{
  "data": [
    {
      "_id": "article_id",
      "title": "Article Title",
      "content": "Article content...",
      "status": "published",
      "author": {
        "_id": "user_id",
        "name": "Author Name",
        "username": "author_username"
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
### Create Article
```bash
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "title": "My First Article",
    "content": "This is the content of my first article.",
    "status": "published"
  }'
```

### Track Page View with Device Analytics
```bash
curl -X POST http://localhost:3000/api/page-view \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -d '{
    "article": "article_id_here"
  }'
```

### Get Page View Analytics with Device Data
```bash
# Get total count
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/page-view/count"

# Get count for specific article
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/page-view/count?article=article_id"

# Get daily aggregated views with device breakdown
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/page-view/aggregate-date?interval=daily"
```

### Logout (Token Blacklisting)
```bash
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer <jwt_token>"
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse (100 requests per 15 minutes)
- **Input Validation**: Request validation using express-validator
- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Stateless authentication with server-side invalidation
- **Redis Token Blacklisting**: Secure logout with automatic token expiration
- **Device Analytics**: Track user devices and IP addresses for security monitoring
- **Content Sanitization**: Prevent XSS and injection attacks

## Project Structure

```
src/
├── config/
│   └── database.ts      # Database configuration
├── controllers/
│   ├── authController.ts    # Authentication logic
│   ├── articleController.ts # Article CRUD with pagination
│   └── pageViewController.ts # Analytics and tracking
├── middleware/
│   ├── auth.ts          # Authentication middleware
│   └── validation.ts    # Input validation middleware
├── models/
│   ├── User.ts          # User schema
│   ├── Article.ts       # Article schema with author relation
│   └── PageView.ts      # Page view tracking schema
├── routes/
│   ├── users.ts         # User routes
│   ├── articles.ts      # Article routes
│   └── pageViews.ts     # Analytics routes
├── types/
│   └── index.ts         # TypeScript type definitions
├── utils/
│   ├── jwt.ts               # JWT utilities
│   ├── sanitizers.ts        # Data sanitization functions
│   ├── tokenBlacklist.ts    # Redis-based token blacklisting
│   └── deviceDetection.ts   # Device and IP analytics utilities
└── app.ts                   # Application entry point
```

## Technologies Used

## Technologies Used

- **TypeScript**: Type-safe JavaScript with comprehensive type definitions
- **Express.js**: Web framework with custom middleware
- **MongoDB**: Database with Mongoose ODM
- **Redis**: In-memory data store for token blacklisting and caching
- **Docker**: Containerization for easy deployment
- **JWT**: Stateless authentication with server-side invalidation
- **bcryptjs**: Password hashing
- **ua-parser-js**: User agent parsing for device detection
- **express-validator**: Input validation
- **helmet**: Security middleware
- **cors**: Cross-origin support
- **express-rate-limit**: Rate limiting
- **mongoose-delete**: Soft delete functionality

## Key Features Implementation

### Redis-Based Authentication
- JWT token blacklisting for secure logout
- Automatic token expiration (24 hours)
- Server-side token invalidation prevents post-logout access
- Redis persistence with configurable TTL

### Advanced Analytics System
- Device detection using user-agent parsing
- IP address tracking for geographic analytics
- Browser, OS, and device type identification
- Comprehensive page view tracking with metadata

### Content Optimization
- Article content truncation (50 characters + "...")
- Improved API response times
- Efficient database queries with pagination
- Reduced bandwidth usage

### Pagination System
- Configurable page size (default: 10, max: 100)
- Comprehensive pagination metadata
- Efficient MongoDB aggregation pipelines
- Type-safe pagination interfaces

### Data Sanitization
- Consistent API response formatting
- Sensitive data filtering
- Type-safe sanitization functions
- Reusable sanitization utilities

### Type Safety
- Comprehensive TypeScript interfaces
- Request/Response type definitions
- Enhanced development experience
- Compile-time error checking

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | development | No |
| `PORT` | Server port | 3000 | No |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/express-blog-cms | Yes |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 | Yes |
| `JWT_SECRET` | JWT secret key | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d | No |

## Docker Configuration

The project includes Docker support with multi-stage builds and production optimizations:

- **Development**: Use `docker-compose up` for full stack development
- **Production**: Optimized Node.js Alpine image
- **Database**: MongoDB 6 Alpine with persistent storage
- **Cache**: Redis 7 Alpine for token blacklisting and session management
- **Networking**: Internal Docker network for service communication
- **Volumes**: Persistent MongoDB data and Redis storage

## API Response Format

### Standard Response
```json
{
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Paginated Response
```json
{
  "data": [ /* array of items */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 95,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Testing Pagination

### Test Authentication & Security
```bash
# Register and get token
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","username":"testuser","password":"testpass"}'

# Create article with token
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"title":"Test Article","content":"Test content","status":"published"}'

# Logout (blacklist token)
curl -X POST http://localhost:3000/api/users/logout \
  -H "Authorization: Bearer <jwt_token>"

# Try to create article again (should fail)
curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"title":"Should Fail","content":"This should not work"}'
```

### Test Device Analytics
```bash
# Track page view with different user agents
curl -X POST http://localhost:3000/api/page-view \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  -d '{"article":"ARTICLE_ID"}'

curl -X POST http://localhost:3000/api/page-view \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Android 10; Mobile; rv:81.0)" \
  -d '{"article":"ARTICLE_ID"}'

# Get analytics with device breakdown
curl -H "Authorization: Bearer <jwt_token>" \
  "http://localhost:3000/api/page-view/aggregate-date?interval=daily"
```

### Expected Security Behavior
- **Token Blacklisting**: JWT tokens are invalidated server-side upon logout
- **Redis Storage**: Blacklisted tokens stored with 24-hour TTL
- **Device Tracking**: All page views include device and IP information
- **Content Truncation**: Article content limited to 50 characters in list responses

### Expected Pagination Behavior
- **Default values**: `page=1`, `limit=10`
- **Maximum limit**: 100 items per page
- **Minimum values**: `page=1`, `limit=1`
- **Invalid values**: Automatically converted to defaults
- **Empty results**: Returns empty array with pagination metadata

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure TypeScript compilation passes: `npm run build`
6. Test with Docker: `docker-compose up --build`
7. Submit a pull request

## License

This project is licensed under the MIT License.
