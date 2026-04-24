# 🏛️ Blockchain Land Registry System - Visual Diagrams

This document contains all the visual diagrams for the project architecture and workflows.

---

## 📐 Development Methodology - SDLC

![SDLC Methodology](file:///C:/Users/Abhijith/.gemini/antigravity/brain/e1615d42-68e7-469a-beda-57558378e6e0/sdlc_methodology_1766740572098.png)

**Agile-Iterative Development Cycle:**
1. Requirements Analysis
2. System Design
3. Smart Contract Development (Blockchain)
4. Backend Development
5. Frontend Development
6. Integration & Testing
7. Deployment
8. Maintenance → Back to Requirements

---

## 🏗️ System Architecture

![System Architecture](file:///C:/Users/Abhijith/.gemini/antigravity/brain/e1615d42-68e7-469a-beda-57558378e6e0/system_architecture_diagram_1766740502108.png)

**6-Layer Architecture:**
- **Client Layer**: Web & Mobile Browsers
- **Presentation Layer**: React Application, Router, State Management
- **Application Layer**: Express.js API, Socket.io, Auth, Chatbot
- **Business Logic Layer**: Land, Transaction, User, Chat, Blockchain Services
- **Data Layer**: MongoDB, GridFS, Redis (Optional)
- **Blockchain Layer**: Ethereum Network, LandRegistry Smart Contract, Ganache
- **External Services**: Email, IPFS, AI APIs

---

## 📋 Land Registration Flow

![Land Registration Flow](file:///C:/Users/Abhijith/.gemini/antigravity/brain/e1615d42-68e7-469a-beda-57558378e6e0/land_registration_flow_1766740525416.png)

**Process Steps:**
1. Admin initiates registration
2. Fill registration form
3. Upload documents & images
4. Validate input
5. Save files to GridFS
6. Create MongoDB record
7. Call smart contract
8. **Register property on blockchain** (immutable)
9. Transaction confirmed
10. Generate QR code
11. Update MongoDB with blockchain data
12. Emit PropertyRegistered event
13. Registration complete ✅

---

## 🤖 AI Chatbot Architecture

![Chatbot Architecture](file:///C:/Users/Abhijith/.gemini/antigravity/brain/e1615d42-68e7-469a-beda-57558378e6e0/chatbot_architecture_1766740551553.png)

**Hybrid Intelligence System:**
- User Input → Chatbot Widget
- Chatbot API → Chatbot Service
- **Intent Recognition** → NLP Filter Extraction
- **5 Specialized Handlers:**
  - Search Handler (MongoDB)
  - Price Handler (MongoDB)
  - Recommendation Handler (MongoDB)
  - Help Handler
  - Stats Handler (MongoDB)
- **AI API Fallback** (Optional)
- Response Generator → Suggestion Engine
- Back to Chatbot Widget

---

## 💰 Land Transfer/Sale Flow

**Note:** This diagram hit capacity limits. Here's the text description:

**Complete Transfer Process:**

1. **Buyer Initiates Purchase**
   - Select land from marketplace
   - Click "Buy Now"
   - Create buy request

2. **Database Recording**
   - Save transaction to MongoDB
   - Status: PENDING

3. **Blockchain Initiation**
   - Call `initiateTransaction()` on smart contract
   - Create pending transaction on blockchain
   - Transaction ID generated

4. **Admin Review**
   - Admin receives notification
   - Reviews transaction details
   - Decision: Approve or Reject

5. **Blockchain Transfer** (If Approved)
   - Call `approveTransaction()` on smart contract
   - **Automatic ownership transfer on blockchain**
   - Remove property from old owner's list
   - Add property to new owner's list
   - Update property owner address
   - Emit `OwnershipTransferred` event

6. **Post-Transfer Actions**
   - Update MongoDB records
   - Generate transfer certificate (PDF)
   - Store certificate hash on blockchain
   - Notify buyer and seller
   - Transfer complete ✅

---

## 🔄 Real-time Chat Flow

**Buyer-Seller Communication:**

1. **Connection**
   - Buyer opens chat
   - Socket.io connection with JWT
   - Server authenticates user

2. **Chat History**
   - Fetch user's chats from MongoDB
   - Load message history
   - Display in chat UI

3. **Messaging**
   - Buyer types message
   - Emit `send_message` event
   - Server saves to MongoDB
   - Server emits to seller (if online)
   - Confirmation sent to buyer

4. **Real-time Delivery**
   - Online users receive instantly
   - Offline users see on next login
   - Read receipts tracked

---

## 🔐 Security Architecture

**Multi-Layer Security:**

1. **Authentication Layer**
   - JWT tokens (7-day expiry)
   - Email verification (OTP)
   - 2FA support
   - Password hashing (Bcrypt)

2. **Authorization Layer**
   - Role-based access control (RBAC)
   - Admin, User, Auditor roles
   - Route-level protection

3. **Blockchain Security**
   - Immutable records
   - Admin-only registration
   - Multi-signature approval
   - Event logging

4. **Data Security**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CORS configuration

---

## 📊 Database Schema Overview

**4 Main Collections:**

### 1. User Collection
- Authentication data
- Role & permissions
- Verification status
- 2FA settings

### 2. Land (DigitizedLand) Collection
- Property details
- Ownership records
- Market information
- Blockchain data
- QR code
- Documents (GridFS)

### 3. Transaction Collection
- Transaction type
- Buyer & seller
- Amount
- Approval status
- Blockchain data
- Certificate

### 4. Chat Collection
- Land reference
- Participants
- Messages array
- Last message
- Timestamps

---

## 🚀 Deployment Architecture

**Production Setup:**

```
┌─────────────────────────────────────┐
│         Load Balancer (Nginx)       │
└─────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼────────┐
│  Frontend      │  │   Backend     │
│  (Vercel/      │  │   (AWS EC2/   │
│   Netlify)     │  │   DigitalOcean)│
└────────────────┘  └───────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐ ┌──────▼────────┐ ┌──────▼────────┐
│   MongoDB      │ │   Ethereum    │ │   External    │
│   Atlas        │ │   Network     │ │   Services    │
│   (Database)   │ │   (Infura/    │ │   (Email,     │
│                │ │    Alchemy)   │ │    IPFS, AI)  │
└────────────────┘ └───────────────┘ └───────────────┘
```

---

## 📈 System Metrics

**Performance Targets:**
- API Response Time: < 200ms
- Blockchain Transaction: < 30s
- Real-time Chat Latency: < 100ms
- Database Query Time: < 50ms
- Page Load Time: < 2s

**Scalability:**
- Concurrent Users: 10,000+
- Lands Registered: 1,000,000+
- Daily Transactions: 10,000+
- Chat Messages: 100,000+/day

---

## 🎯 Key Features Summary

✅ **Blockchain Integration**: Immutable land records on Ethereum
✅ **AI Chatbot**: Hybrid NLP + AI API for property search
✅ **Real-time Chat**: Socket.io buyer-seller communication
✅ **Secure Auth**: JWT + 2FA + Email verification
✅ **Document Management**: GridFS for large files
✅ **QR Verification**: Quick land record verification
✅ **Admin Dashboard**: Complete system oversight
✅ **Transaction Approval**: Multi-signature workflow

---

**Built with ❤️ using React, Node.js, MongoDB, and Ethereum**
