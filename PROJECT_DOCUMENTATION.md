# 🏛️ Blockchain Land Registry System

## 📋 Table of Contents
- [Overview](#overview)
- [Development Methodology](#development-methodology)
- [System Design & Architecture](#system-design--architecture)
- [Technology Stack](#technology-stack)
- [Core Features](#core-features)
- [System Flowcharts](#system-flowcharts)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Setup & Installation](#setup--installation)
- [Project Structure](#project-structure)
- [Security Features](#security-features)

---

## 🎯 Overview

A comprehensive blockchain-based land registry system that digitizes land records, enables secure property transactions, and provides a marketplace for buying/selling land. The system combines traditional web technologies with blockchain for immutability and transparency.

### Key Highlights
- **Blockchain Integration**: Ethereum smart contracts for immutable land records
- **AI-Powered Chatbot**: Hybrid rule-based NLP + optional AI API for property search
- **Real-time Communication**: Socket.io-based chat between buyers and sellers
- **Secure Authentication**: JWT + 2FA with email OTP
- **Document Management**: GridFS for storing land documents and images
- **QR Code Verification**: Quick land record verification via QR scanning

---

## 📐 Development Methodology

### Software Development Life Cycle (SDLC)

This project follows an **Agile-Iterative** development approach with blockchain integration:

```mermaid
graph LR
    A[Requirements Analysis] --> B[System Design]
    B --> C[Smart Contract Development]
    C --> D[Backend Development]
    D --> E[Frontend Development]
    E --> F[Integration & Testing]
    F --> G[Deployment]
    G --> H[Maintenance]
    H --> A
    
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#bbf,stroke:#333,stroke-width:2px
```

### Development Phases

#### **Phase 1: Requirements & Planning**
- ✅ Identified stakeholders (Admin, Users, Auditors)
- ✅ Defined functional requirements
- ✅ Blockchain feasibility analysis
- ✅ Technology stack selection

#### **Phase 2: System Architecture Design**
- ✅ Microservices architecture planning
- ✅ Database schema design
- ✅ Smart contract specification
- ✅ API endpoint design
- ✅ Security architecture

#### **Phase 3: Smart Contract Development**
- ✅ Solidity contract creation
- ✅ Unit testing with Hardhat
- ✅ Gas optimization
- ✅ Security audit
- ✅ Deployment scripts

#### **Phase 4: Backend Development**
- ✅ Express.js server setup
- ✅ MongoDB integration
- ✅ Blockchain service layer
- ✅ Authentication & authorization
- ✅ RESTful API development
- ✅ Socket.io real-time features

#### **Phase 5: Frontend Development**
- ✅ React + TypeScript setup
- ✅ Component architecture
- ✅ State management
- ✅ UI/UX design implementation
- ✅ Responsive design

#### **Phase 6: Integration & Testing**
- ✅ End-to-end testing
- ✅ Blockchain integration testing
- ✅ Security testing
- ✅ Performance optimization

#### **Phase 7: Deployment & Maintenance**
- ✅ Local deployment (Ganache)
- 🔄 Production deployment (planned)
- 🔄 Continuous monitoring
- 🔄 Bug fixes & updates

### Design Principles

1. **Separation of Concerns**
   - Frontend, Backend, Blockchain as independent layers
   - Modular component design
   - Service-oriented architecture

2. **Security First**
   - Blockchain immutability
   - JWT authentication
   - Input validation
   - Role-based access control

3. **Scalability**
   - Stateless backend design
   - Database indexing
   - Efficient blockchain queries
   - Caching strategies

4. **User Experience**
   - Intuitive UI/UX
   - Real-time feedback
   - AI-powered assistance
   - Responsive design

5. **Maintainability**
   - Clean code practices
   - Comprehensive documentation
   - Version control (Git)
   - Modular architecture

---

## 🏗️ System Design & Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser]
        MOBILE[Mobile Browser]
    end
    
    subgraph "Presentation Layer"
        REACT[React Application]
        ROUTER[React Router]
        STATE[State Management]
    end
    
    subgraph "Application Layer"
        API[Express.js API Server]
        SOCKET[Socket.io Server]
        AUTH[Authentication Service]
        CHATBOT[Chatbot Service]
    end
    
    subgraph "Business Logic Layer"
        LAND[Land Service]
        TRANS[Transaction Service]
        USER[User Service]
        CHAT[Chat Service]
        BLOCKCHAIN_SVC[Blockchain Service]
    end
    
    subgraph "Data Layer"
        MONGO[(MongoDB)]
        GRIDFS[(GridFS)]
        CACHE[(Redis - Optional)]
    end
    
    subgraph "Blockchain Layer"
        ETH[Ethereum Network]
        CONTRACT[LandRegistry Contract]
        GANACHE[Ganache/Hardhat]
    end
    
    subgraph "External Services"
        EMAIL[Email Service]
        IPFS[IPFS - Optional]
        AI[AI APIs - Optional]
    end
    
    WEB --> REACT
    MOBILE --> REACT
    REACT --> ROUTER
    REACT --> STATE
    REACT --> API
    REACT --> SOCKET
    
    API --> AUTH
    API --> CHATBOT
    API --> LAND
    API --> TRANS
    API --> USER
    API --> CHAT
    
    LAND --> BLOCKCHAIN_SVC
    TRANS --> BLOCKCHAIN_SVC
    
    LAND --> MONGO
    TRANS --> MONGO
    USER --> MONGO
    CHAT --> MONGO
    
    LAND --> GRIDFS
    
    BLOCKCHAIN_SVC --> ETH
    ETH --> CONTRACT
    ETH --> GANACHE
    
    AUTH --> EMAIL
    LAND --> IPFS
    CHATBOT --> AI
    
    style CONTRACT fill:#f9f,stroke:#333,stroke-width:3px
    style BLOCKCHAIN_SVC fill:#bbf,stroke:#333,stroke-width:2px
    style MONGO fill:#9f9,stroke:#333,stroke-width:2px
```

### Detailed Component Architecture

```mermaid
graph TB
    subgraph "Frontend Components"
        APP[App.tsx]
        DASH[Dashboard]
        MARKET[Marketplace]
        LAND_DETAIL[Land Detail Page]
        CHATBOT_WIDGET[Chatbot Widget]
        CHAT_UI[Real-time Chat]
        AUTH_UI[Auth Components]
        
        APP --> DASH
        APP --> MARKET
        APP --> LAND_DETAIL
        DASH --> CHATBOT_WIDGET
        MARKET --> CHATBOT_WIDGET
        DASH --> CHAT_UI
    end
    
    subgraph "Backend Routes"
        AUTH_ROUTE[/api/auth/*]
        LAND_ROUTE[/api/lands/*]
        TRANS_ROUTE[/api/transactions/*]
        CHAT_ROUTE[/api/chats/*]
        BOT_ROUTE[/api/chatbot/*]
        
        AUTH_ROUTE --> AUTH_CTRL[Auth Controller]
        LAND_ROUTE --> LAND_CTRL[Land Controller]
        TRANS_ROUTE --> TRANS_CTRL[Transaction Controller]
        CHAT_ROUTE --> CHAT_CTRL[Chat Controller]
        BOT_ROUTE --> BOT_CTRL[Chatbot Controller]
    end
    
    subgraph "Data Models"
        USER_MODEL[User Model]
        LAND_MODEL[Land Model]
        TRANS_MODEL[Transaction Model]
        CHAT_MODEL[Chat Model]
    end
    
    subgraph "Smart Contract"
        SC[LandRegistry.sol]
        SC_PROP[Property Struct]
        SC_TRANS[Transaction Struct]
        SC_FUNCS[Functions]
        
        SC --> SC_PROP
        SC --> SC_TRANS
        SC --> SC_FUNCS
    end
    
    LAND_CTRL --> LAND_MODEL
    TRANS_CTRL --> TRANS_MODEL
    CHAT_CTRL --> CHAT_MODEL
    AUTH_CTRL --> USER_MODEL
    
    LAND_CTRL --> SC
    TRANS_CTRL --> SC
    
    style SC fill:#f9f,stroke:#333,stroke-width:3px
```

### Data Flow Diagram - Land Registration

```mermaid
flowchart TD
    START([Admin Initiates Land Registration])
    INPUT[Fill Registration Form]
    UPLOAD[Upload Documents & Images]
    VALIDATE{Validate Input}
    
    SAVE_FILES[Save Files to GridFS]
    CREATE_MONGO[Create MongoDB Record]
    CALL_BC[Call Smart Contract]
    BC_REGISTER[registerProperty on Blockchain]
    BC_CONFIRM{Transaction Confirmed?}
    
    GEN_QR[Generate QR Code]
    UPDATE_MONGO[Update MongoDB with Blockchain Data]
    EMIT_EVENT[Emit PropertyRegistered Event]
    SUCCESS([Registration Complete])
    ERROR([Show Error])
    
    START --> INPUT
    INPUT --> UPLOAD
    UPLOAD --> VALIDATE
    
    VALIDATE -->|Valid| SAVE_FILES
    VALIDATE -->|Invalid| ERROR
    
    SAVE_FILES --> CREATE_MONGO
    CREATE_MONGO --> CALL_BC
    CALL_BC --> BC_REGISTER
    BC_REGISTER --> BC_CONFIRM
    
    BC_CONFIRM -->|Yes| GEN_QR
    BC_CONFIRM -->|No| ERROR
    
    GEN_QR --> UPDATE_MONGO
    UPDATE_MONGO --> EMIT_EVENT
    EMIT_EVENT --> SUCCESS
    
    style BC_REGISTER fill:#f9f,stroke:#333,stroke-width:2px
    style BC_CONFIRM fill:#bbf,stroke:#333,stroke-width:2px
```

### Data Flow Diagram - Land Transfer/Sale

```mermaid
flowchart TD
    START([Buyer Initiates Purchase])
    SELECT[Select Land from Marketplace]
    INITIATE[Click Buy Now]
    CREATE_REQ[Create Buy Request]
    
    MONGO_TRANS[Save Transaction to MongoDB]
    BC_INIT[Call initiateTransaction on Blockchain]
    BC_PENDING{Transaction Created?}
    
    NOTIFY_ADMIN[Notify Admin for Approval]
    ADMIN_REVIEW{Admin Reviews}
    
    APPROVE[Admin Approves]
    BC_APPROVE[Call approveTransaction on Blockchain]
    BC_TRANSFER{Ownership Transferred?}
    
    UPDATE_OWNER[Update Property Owner in Blockchain]
    UPDATE_MONGO[Update MongoDB Records]
    GEN_CERT[Generate Transfer Certificate]
    NOTIFY_PARTIES[Notify Buyer & Seller]
    
    SUCCESS([Transfer Complete])
    REJECT([Transaction Rejected])
    ERROR([Error Occurred])
    
    START --> SELECT
    SELECT --> INITIATE
    INITIATE --> CREATE_REQ
    
    CREATE_REQ --> MONGO_TRANS
    MONGO_TRANS --> BC_INIT
    BC_INIT --> BC_PENDING
    
    BC_PENDING -->|Success| NOTIFY_ADMIN
    BC_PENDING -->|Failed| ERROR
    
    NOTIFY_ADMIN --> ADMIN_REVIEW
    
    ADMIN_REVIEW -->|Approve| APPROVE
    ADMIN_REVIEW -->|Reject| REJECT
    
    APPROVE --> BC_APPROVE
    BC_APPROVE --> BC_TRANSFER
    
    BC_TRANSFER -->|Success| UPDATE_OWNER
    BC_TRANSFER -->|Failed| ERROR
    
    UPDATE_OWNER --> UPDATE_MONGO
    UPDATE_MONGO --> GEN_CERT
    GEN_CERT --> NOTIFY_PARTIES
    NOTIFY_PARTIES --> SUCCESS
    
    style BC_INIT fill:#f9f,stroke:#333,stroke-width:2px
    style BC_APPROVE fill:#f9f,stroke:#333,stroke-width:2px
    style BC_TRANSFER fill:#bbf,stroke:#333,stroke-width:2px
```

### System Integration Block Diagram

```mermaid
block-beta
    columns 3
    
    block:FRONTEND:3
        columns 3
        F1["React App"]
        F2["Components"]
        F3["Services"]
    end
    
    space:3
    
    block:MIDDLEWARE:3
        columns 3
        M1["JWT Auth"]
        M2["CORS"]
        M3["Validation"]
    end
    
    space:3
    
    block:BACKEND:3
        columns 3
        B1["Express API"]
        B2["Socket.io"]
        B3["Services"]
    end
    
    space:3
    
    block:DATA:3
        columns 3
        D1["MongoDB"]
        D2["GridFS"]
        D3["Cache"]
    end
    
    block:BLOCKCHAIN:3
        columns 3
        BC1["Ethers.js"]
        BC2["Smart Contract"]
        BC3["Ganache"]
    end
    
    FRONTEND --> MIDDLEWARE
    MIDDLEWARE --> BACKEND
    BACKEND --> DATA
    BACKEND --> BLOCKCHAIN
    
    style BC2 fill:#f9f,stroke:#333,stroke-width:3px
```

### Chatbot Architecture

```mermaid
graph TB
    USER[User Input]
    WIDGET[Chatbot Widget]
    API[Chatbot API]
    SERVICE[Chatbot Service]
    
    INTENT[Intent Recognition]
    NLP[NLP Filter Extraction]
    
    SEARCH[Search Handler]
    PRICE[Price Handler]
    RECOMMEND[Recommendation Handler]
    HELP[Help Handler]
    STATS[Stats Handler]
    
    DB[(MongoDB)]
    AI[AI API - Optional]
    
    RESPONSE[Response Generator]
    SUGGESTIONS[Suggestion Engine]
    
    USER --> WIDGET
    WIDGET --> API
    API --> SERVICE
    
    SERVICE --> INTENT
    INTENT --> NLP
    
    NLP --> SEARCH
    NLP --> PRICE
    NLP --> RECOMMEND
    NLP --> HELP
    NLP --> STATS
    
    SEARCH --> DB
    PRICE --> DB
    RECOMMEND --> DB
    STATS --> DB
    
    SERVICE -.->|Fallback| AI
    
    SEARCH --> RESPONSE
    PRICE --> RESPONSE
    RECOMMEND --> RESPONSE
    HELP --> RESPONSE
    STATS --> RESPONSE
    AI -.-> RESPONSE
    
    RESPONSE --> SUGGESTIONS
    SUGGESTIONS --> WIDGET
    
    style INTENT fill:#bbf,stroke:#333,stroke-width:2px
    style NLP fill:#bfb,stroke:#333,stroke-width:2px
```

### Real-time Chat Architecture

```mermaid
sequenceDiagram
    participant B as Buyer Client
    participant S as Socket.io Server
    participant M as MongoDB
    participant Seller as Seller Client
    
    B->>S: Connect with JWT
    S->>S: Authenticate user
    S->>M: Fetch user's chats
    M-->>S: Return chat list
    S-->>B: Emit chat list
    
    B->>S: Join chat room (chatId)
    S->>M: Fetch chat history
    M-->>S: Return messages
    S-->>B: Emit chat history
    
    B->>S: Send message
    S->>M: Save message
    M-->>S: Confirm saved
    S-->>B: Emit message_sent
    S-->>Seller: Emit new_message (if online)
    
    Note over S,Seller: Real-time delivery
```

---

---

## 💻 Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |
| **Socket.io Client** | Real-time communication |
| **React Router** | Client-side routing |
| **Leaflet** | Interactive maps |
| **QRCode** | QR code generation |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **Socket.io** | WebSocket server |
| **JWT** | Authentication |
| **Bcrypt** | Password hashing |
| **Multer** | File uploads |
| **GridFS** | Large file storage |
| **Nodemailer** | Email service |

### Blockchain
| Technology | Purpose |
|------------|---------|
| **Solidity ^0.8.19** | Smart contract language |
| **Hardhat** | Development environment |
| **Ethers.js** | Ethereum library |
| **Ganache** | Local blockchain |

### AI & Optional Services
| Technology | Purpose |
|------------|---------|
| **Rule-based NLP** | Primary chatbot logic |
| **OpenAI API** | Optional AI fallback |
| **Google Gemini** | Optional AI fallback |
| **IPFS** | Optional decentralized storage |

---

## ✨ Core Features

### 1. **User Management**
- Multi-role authentication (Admin, User, Auditor)
- JWT-based session management
- Two-factor authentication (2FA) via email OTP
- Email verification for new accounts
- Password reset functionality

### 2. **Land Registry**
- Digital land record creation and management
- Blockchain-backed immutability
- QR code generation for quick verification
- Document upload (images, PDFs)
- Land classification (Agricultural, Residential, Commercial, Industrial)
- Geo-location mapping

### 3. **Marketplace**
- Browse available properties
- Advanced search and filtering
- Price-based sorting
- Land type filtering
- Location-based search
- Favorite/wishlist functionality

### 4. **AI Chatbot Assistant**
- **Hybrid Architecture**: Rule-based NLP + optional AI API
- **7 Built-in Intents**:
  - `SEARCH_LANDS`: Find properties by criteria
  - `PRICE_INQUIRY`: Get price statistics
  - `RECOMMENDATION`: AI-powered suggestions
  - `LOCATION_QUERY`: Location-based search
  - `HELP`: User assistance
  - `STATS`: Market statistics
  - `COMPARISON`: Compare properties
- User-specific chat history
- Contextual suggestions
- Interactive land cards with "View Details" buttons
- Persistent chat across sessions

### 5. **Real-time Communication**
- Socket.io-powered chat system
- Buyer-seller messaging
- Land-specific chat threads
- Message history persistence
- Online/offline status indicators

### 6. **Transaction Management**
- Blockchain-recorded transactions
- Admin approval workflow
- Transaction history tracking
- Digital certificate generation
- Ownership transfer records

### 7. **Admin Dashboard**
- User verification management
- Land record approval
- Transaction oversight
- Audit log viewing
- System statistics

---

## 📊 System Flowcharts

### User Registration & Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    participant E as Email Service

    U->>F: Submit Registration Form
    F->>B: POST /api/auth/register
    B->>DB: Check if user exists
    alt User exists
        DB-->>B: User found
        B-->>F: Error: Email already registered
        F-->>U: Show error message
    else New user
        DB-->>B: User not found
        B->>DB: Create user (unverified)
        B->>E: Send verification email with OTP
        E-->>U: Email with OTP
        B-->>F: Success: Check email
        F-->>U: Show OTP input form
        U->>F: Enter OTP
        F->>B: POST /api/auth/verify-email
        B->>DB: Verify OTP & activate account
        DB-->>B: Account activated
        B-->>F: Success + JWT token
        F-->>U: Redirect to dashboard
    end
```

### Land Registration Flow

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as MongoDB
    participant BC as Blockchain
    participant IPFS as IPFS (Optional)

    A->>F: Fill land registration form
    F->>B: POST /api/lands/register (with files)
    B->>B: Validate admin role
    B->>DB: Upload images to GridFS
    DB-->>B: Image hashes
    alt IPFS enabled
        B->>IPFS: Upload documents
        IPFS-->>B: IPFS hash
    end
    B->>BC: Call registerProperty()
    BC-->>B: Transaction receipt + Property ID
    B->>DB: Save land record
    DB-->>B: Land document
    B->>B: Generate QR code
    B-->>F: Success + Land details
    F-->>A: Show success message
```

### Property Search via Chatbot Flow

```mermaid
sequenceDiagram
    participant U as User
    participant CW as Chatbot Widget
    participant B as Backend
    participant CS as Chatbot Service
    participant DB as MongoDB
    participant AI as AI API (Optional)

    U->>CW: "Show cheapest lands"
    CW->>B: POST /api/chatbot/message
    B->>CS: processMessage()
    CS->>CS: Recognize intent: SEARCH_LANDS
    CS->>CS: Extract filters: {sortBy: 'price-asc'}
    CS->>DB: Land.find().sort({price: 1})
    DB-->>CS: Land documents
    alt Lands found
        CS-->>B: {type: 'search_results', data: lands}
        B-->>CW: Response with land cards
        CW-->>U: Display interactive cards
        U->>CW: Click "View Full Details"
        CW->>F: Navigate to land details page
    else No lands found
        CS-->>B: {type: 'text', message: 'No lands found'}
        B-->>CW: Error message
        CW-->>U: Show suggestions
    end
    
    Note over CS,AI: If intent not recognized
    CS->>AI: Send query to AI API
    AI-->>CS: AI-generated response
    CS-->>B: AI response
```

### Real-time Chat Flow

```mermaid
sequenceDiagram
    participant B as Buyer
    participant FC as Frontend (Buyer)
    participant S as Socket.io Server
    participant FS as Frontend (Seller)
    participant Seller as Seller
    participant DB as MongoDB

    B->>FC: Open chat with seller
    FC->>S: socket.connect()
    S->>DB: Fetch chat history
    DB-->>S: Previous messages
    S-->>FC: Emit 'chat_history'
    FC-->>B: Display messages
    
    B->>FC: Type and send message
    FC->>S: Emit 'send_message'
    S->>DB: Save message
    S->>FS: Emit 'new_message' (if online)
    FS-->>Seller: Show notification + message
    S-->>FC: Emit 'message_sent' confirmation
    FC-->>B: Show message as sent
```

### Land Purchase Transaction Flow

```mermaid
sequenceDiagram
    participant B as Buyer
    participant F as Frontend
    participant API as Backend API
    participant DB as MongoDB
    participant BC as Blockchain
    participant A as Admin

    B->>F: Click "Buy Now"
    F->>API: POST /api/transactions/initiate
    API->>DB: Create transaction record
    API->>BC: Call initiateTransaction()
    BC-->>API: Transaction ID
    API-->>F: Pending transaction
    F-->>B: "Transaction pending approval"
    
    Note over A: Admin reviews transaction
    A->>F: Approve transaction
    F->>API: POST /api/transactions/approve
    API->>BC: Call approveTransaction()
    BC->>BC: Transfer ownership
    BC-->>API: Success
    API->>DB: Update land owner
    API->>DB: Generate certificate
    API-->>F: Transaction approved
    F-->>B: "Purchase complete!"
```

---

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: Enum ['USER', 'ADMIN', 'AUDITOR'],
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  verificationStatus: Enum ['PENDING', 'VERIFIED', 'REJECTED'],
  isEmailVerified: Boolean,
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  emailOTP: {
    code: String,
    expiresAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Land (DigitizedLand) Collection
```javascript
{
  _id: ObjectId,
  surveyNumber: String (unique, indexed),
  assetId: String (unique),
  landType: Enum ['AGRICULTURAL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'],
  area: {
    acres: Number,
    guntas: Number,
    sqft: Number
  },
  village: String,
  taluka: String,
  district: String (indexed),
  state: String,
  pincode: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  currentOwner: ObjectId (ref: 'User', indexed),
  previousOwners: [ObjectId],
  status: Enum ['AVAILABLE', 'FOR_SALE', 'SOLD', 'DISPUTED'],
  verificationStatus: Enum ['PENDING', 'VERIFIED', 'REJECTED'],
  marketInfo: {
    isForSale: Boolean (indexed),
    askingPrice: Number (indexed),
    description: String,
    features: [String],
    nearbyAmenities: [String],
    images: [String], // GridFS file IDs
    virtualTourUrl: String,
    listedAt: Date,
    listedDate: Date
  },
  documents: {
    propertyDeed: String, // GridFS file ID
    taxReceipts: [String],
    surveyDocuments: [String]
  },
  blockchainData: {
    propertyId: Number,
    transactionHash: String,
    blockNumber: Number
  },
  qrCode: String, // Base64 encoded QR
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Collection
```javascript
{
  _id: ObjectId,
  landId: ObjectId (ref: 'DigitizedLand', indexed),
  participants: [ObjectId] (ref: 'User', indexed),
  messages: [{
    sender: ObjectId (ref: 'User'),
    content: String,
    timestamp: Date,
    read: Boolean
  }],
  lastMessage: {
    content: String,
    timestamp: Date,
    sender: ObjectId
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction Collection
```javascript
{
  _id: ObjectId,
  landId: ObjectId (ref: 'DigitizedLand'),
  from: ObjectId (ref: 'User'),
  to: ObjectId (ref: 'User'),
  transactionType: Enum ['REGISTRATION', 'SALE', 'TRANSFER', 'RENT'],
  amount: Number,
  status: Enum ['PENDING', 'APPROVED', 'REJECTED'],
  approvedBy: ObjectId (ref: 'User'),
  blockchainData: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: Number
  },
  certificate: {
    certificateId: String,
    pdfHash: String, // GridFS file ID
    issuedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/verify-email` | Verify email with OTP | No |
| POST | `/api/auth/resend-otp` | Resend verification OTP | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/enable-2fa` | Enable 2FA | Yes |
| POST | `/api/auth/verify-2fa` | Verify 2FA code | Yes |

### Land Management Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/lands/register` | Register new land | Yes | Admin |
| GET | `/api/lands` | Get all lands | Yes | Any |
| GET | `/api/lands/:id` | Get land by ID | Yes | Any |
| PUT | `/api/lands/:id` | Update land details | Yes | Admin/Owner |
| DELETE | `/api/lands/:id` | Delete land record | Yes | Admin |
| POST | `/api/lands/:id/list` | List land for sale | Yes | Owner |
| PUT | `/api/lands/:id/unlist` | Remove from marketplace | Yes | Owner |
| GET | `/api/lands/marketplace` | Get marketplace listings | Yes | Any |
| POST | `/api/lands/:id/verify` | Verify land via QR | Yes | Any |

### Chatbot Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chatbot/message` | Send message to chatbot | Yes |
| GET | `/api/chatbot/suggestions` | Get contextual suggestions | Yes |
| GET | `/api/chatbot/stats` | Get chatbot usage stats | Yes |

### Chat Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/chats` | Get user's chats | Yes |
| GET | `/api/chats/:id` | Get specific chat | Yes |
| POST | `/api/chats` | Create new chat | Yes |
| POST | `/api/chats/:id/messages` | Send message | Yes |
| PUT | `/api/chats/:id/read` | Mark messages as read | Yes |

### Transaction Endpoints

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/api/transactions/initiate` | Initiate transaction | Yes | Owner |
| GET | `/api/transactions` | Get all transactions | Yes | Admin |
| GET | `/api/transactions/:id` | Get transaction details | Yes | Any |
| POST | `/api/transactions/:id/approve` | Approve transaction | Yes | Admin |
| POST | `/api/transactions/:id/reject` | Reject transaction | Yes | Admin |
| GET | `/api/transactions/certificate/:id` | Download certificate | Yes | Any |

### Socket.io Events

| Event | Direction | Description | Data |
|-------|-----------|-------------|------|
| `connection` | Client → Server | Establish connection | - |
| `join_chat` | Client → Server | Join chat room | `{chatId}` |
| `send_message` | Client → Server | Send message | `{chatId, content}` |
| `new_message` | Server → Client | Receive new message | `{message}` |
| `message_sent` | Server → Client | Confirm message sent | `{messageId}` |
| `chat_history` | Server → Client | Load chat history | `{messages[]}` |
| `user_online` | Server → Client | User came online | `{userId}` |
| `user_offline` | Server → Client | User went offline | `{userId}` |
| `disconnect` | Client → Server | Close connection | - |

---mermaid
graph TB
    subgraph "Frontend Layer"
        A[React + TypeScript + Vite]
        A1[Dashboard]
        A2[Marketplace]
        A3[AI Chatbot Widget]
        A4[Real-time Chat]
        A5[Land Details]
        A --> A1
        A --> A2
        A --> A3
        A --> A4
        A --> A5
    end

    subgraph "Backend Layer"
        B[Express.js Server]
        B1[REST API Routes]
        B2[Socket.io Server]
        B3[Authentication Middleware]
        B4[File Upload Handler]
        B --> B1
        B --> B2
        B --> B3
        B --> B4
    end

    subgraph "Data Layer"
        C[MongoDB Database]
        C1[User Collection]
        C2[Land Collection]
        C3[Transaction Collection]
        C4[Chat Collection]
        C5[GridFS Storage]
        C --> C1
        C --> C2
        C --> C3
        C --> C4
        C --> C5
    end

    subgraph "Blockchain Layer"
        D[Ethereum Network]
        D1[LandRegistry Smart Contract]
        D2[Hardhat/Ganache]
        D --> D1
        D --> D2
    end

    subgraph "External Services"
        E1[Email Service - Nodemailer]
        E2[IPFS - Optional]
        E3[AI APIs - Optional]
    end

    A --> B
    B --> C
    B --> D
    B --> E1
    B --> E2
    B --> E3
