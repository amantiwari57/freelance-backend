# Freelance Backend API

This is the backend API for a freelance platform that connects freelancers with clients. It includes functionality for authentication, job posting, proposals, messaging, and more.

## Technologies

- **Runtime**: Bun
- **Framework**: Hono.js
- **Database**: MongoDB (Mongoose)
- **Messaging**: Upstash Redis
- **Real-time Communication**: WebSockets
- **File Storage**: AWS S3

## Getting Started

### Prerequisites

- Bun runtime
- MongoDB
- Upstash Redis account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   bun install
   ```
3. Set up environment variables in a `.env` file:
   ```
   # Server Configuration
   PORT=3000

   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/freelance-db
   
   # Upstash Redis Configuration
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   
   # JWT Secrets
   JWT_SECRET=your_jwt_secret_key
   KAFKA_SECRET=your_secret_key_for_jwt
   
   # AWS S3 Credentials
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=your_aws_region
   AWS_BUCKET_NAME=your_bucket_name
   ```

4. Start the server:
   ```
   bun run src/index.ts
   ```

## API Documentation

### Authentication

#### Sign up

- **URL**: `/signup`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "jwt_token"
  }
  ```

#### Login

- **URL**: `/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
  ```

#### Google Auth

- **URL**: `/auth/google`
- **Method**: `GET`
- **Response**: Redirects to Google authentication

- **URL**: `/auth/google/callback`
- **Method**: `GET`
- **Response**: Redirects with authentication token

#### Forgot Password

- **URL**: `/forgot-password`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Password reset email sent"
  }
  ```

### Profile Management

#### Get Profile

- **URL**: `/profile`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "success": true,
    "profile": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "bio": "...",
      "skills": ["skill1", "skill2"]
    }
  }
  ```

#### Update Profile

- **URL**: `/profile`
- **Method**: `PUT`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Updated bio",
    "skills": ["skill1", "skill2", "skill3"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully"
  }
  ```

### File Upload

- **URL**: `/upload`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: Form data with file
- **Response**:
  ```json
  {
    "success": true,
    "fileUrl": "https://your-s3-bucket.amazonaws.com/path/to/file"
  }
  ```

### Jobs

#### Create Job

- **URL**: `/jobs`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "title": "Job Title",
    "description": "Job Description",
    "budget": 500,
    "skills": ["skill1", "skill2"],
    "duration": "1 month"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "job": {
      "id": "job_id",
      "title": "Job Title",
      "description": "Job Description",
      "budget": 500,
      "skills": ["skill1", "skill2"],
      "duration": "1 month",
      "client": "client_id",
      "createdAt": "timestamp"
    }
  }
  ```

#### Get All Jobs

- **URL**: `/jobs`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search term
  - `skills`: Skills filter (comma-separated)
- **Response**:
  ```json
  {
    "success": true,
    "jobs": [
      {
        "id": "job_id",
        "title": "Job Title",
        "description": "Job Description",
        "budget": 500,
        "skills": ["skill1", "skill2"],
        "duration": "1 month",
        "client": "client_id",
        "createdAt": "timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalItems": 50
    }
  }
  ```

#### Get Job by ID

- **URL**: `/jobs/:id`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "success": true,
    "job": {
      "id": "job_id",
      "title": "Job Title",
      "description": "Job Description",
      "budget": 500,
      "skills": ["skill1", "skill2"],
      "duration": "1 month",
      "client": "client_id",
      "createdAt": "timestamp"
    }
  }
  ```

### Proposals

#### Submit Proposal

- **URL**: `/proposals`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "jobId": "job_id",
    "coverLetter": "Cover letter content",
    "bidAmount": 450,
    "estimatedDuration": "3 weeks"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "proposal": {
      "id": "proposal_id",
      "job": "job_id",
      "freelancer": "user_id",
      "coverLetter": "Cover letter content",
      "bidAmount": 450,
      "estimatedDuration": "3 weeks",
      "status": "pending",
      "createdAt": "timestamp"
    }
  }
  ```

#### Get All Proposals for a Job

- **URL**: `/proposals/job/:jobId`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "success": true,
    "proposals": [
      {
        "id": "proposal_id",
        "job": "job_id",
        "freelancer": {
          "id": "user_id",
          "firstName": "John",
          "lastName": "Doe",
          "skills": ["skill1", "skill2"]
        },
        "coverLetter": "Cover letter content",
        "bidAmount": 450,
        "estimatedDuration": "3 weeks",
        "status": "pending",
        "createdAt": "timestamp"
      }
    ]
  }
  ```

#### Get All Proposals by User

- **URL**: `/proposals/user`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "success": true,
    "proposals": [
      {
        "id": "proposal_id",
        "job": {
          "id": "job_id",
          "title": "Job Title",
          "description": "Job Description",
          "budget": 500
        },
        "coverLetter": "Cover letter content",
        "bidAmount": 450,
        "estimatedDuration": "3 weeks",
        "status": "pending",
        "createdAt": "timestamp"
      }
    ]
  }
  ```

### Messages

#### Send Message

- **URL**: `/message/send`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "receiverId": "user_id",
    "content": "Message content",
    "messageType": "text",
    "files": ["file_url1", "file_url2"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Message queued successfully!"
  }
  ```

#### Get Conversation Messages

- **URL**: `/message/conversation/:conversationId`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "success": true,
    "messages": [
      {
        "id": "message_id",
        "conversationId": "conversation_id",
        "sender": {
          "id": "user_id",
          "name": "John Doe",
          "email": "user@example.com"
        },
        "content": "Message content",
        "messageType": "text",
        "files": ["file_url1"],
        "status": "sent",
        "createdAt": "timestamp"
      }
    ]
  }
  ```

#### Get All Conversations

- **URL**: `/message/conversations`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {token}`
- **Response**:
  ```json
  {
    "success": true,
    "conversations": [
      {
        "_id": "conversation_id",
        "participants": [
          {
            "_id": "user_id",
            "firstName": "John",
            "lastName": "Doe",
            "image": "profile_image_url"
          },
          {
            "_id": "user_id2",
            "firstName": "Jane",
            "lastName": "Smith",
            "image": "profile_image_url"
          }
        ],
        "lastMessage": {
          "_id": "message_id",
          "content": "Last message content",
          "createdAt": "timestamp"
        }
      }
    ]
  }
  ```

### WebSocket Connection

Real-time messaging is handled through WebSocket connections:

- **URL**: `/ws?token=jwt_token`
- **Protocol**: WebSocket
- **Authentication**: JWT token as query parameter

### Agreements

- **URL**: `/agreements/create`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  ```json
  {
    "jobId": "job_id",
    "freelancerId": "freelancer_id",
    "terms": "Agreement terms",
    "paymentAmount": 450,
    "duration": "3 weeks"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "agreement": {
      "id": "agreement_id",
      "job": "job_id",
      "client": "client_id",
      "freelancer": "freelancer_id",
      "terms": "Agreement terms",
      "paymentAmount": 450,
      "duration": "3 weeks",
      "status": "pending",
      "createdAt": "timestamp"
    }
  }
  ```

## Real-time Messaging Architecture

The application uses Upstash Redis for real-time messaging:

1. Messages are published to Redis lists using the `publishMessage` function
2. A periodic polling mechanism checks for new messages in Redis lists
3. When a message is received, it's saved to the database and sent to relevant users via WebSockets
4. WebSocket connections are authenticated using JWT tokens
5. WebSocket clients receive real-time updates for new messages

## Error Handling

All API endpoints return standardized error responses with appropriate HTTP status codes:

```json
{
  "error": "Error message"
}
```

Common status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid or missing authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
