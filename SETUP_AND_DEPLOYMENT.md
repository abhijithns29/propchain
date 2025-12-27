## 🚀 Setup & Installation

### Prerequisites
- **Node.js** >= 16.x
- **MongoDB** >= 5.x (running locally or cloud)
- **Ganache** or **Hardhat Network** for blockchain
- **Git**

### Environment Variables

Create `.env` files in both root and `server/` directories:

**Root `.env`:**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Server `.env`:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/land-registry
DB_NAME=land-registry

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Blockchain
CONTRACT_ADDRESS=0x420F7bA728AD6f0a95281adB1bE902f2BfF47fF5
PRIVATE_KEY=your-private-key-from-ganache
BLOCKCHAIN_NETWORK=http://127.0.0.1:7545

# Optional: AI APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Optional: IPFS
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### Installation Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd blockchain-land-registry

# 2. Install dependencies
npm install

# 3. Set up environment files
npm run setup

# 4. Start Ganache (in separate terminal)
ganache-cli -p 7545

# 5. Compile and deploy smart contracts
npm run blockchain:compile
npm run blockchain:deploy:ganache

# 6. Seed admin account
npm run db:seed

# 7. Start backend server (in separate terminal)
cd server
node server.js

# 8. Start frontend dev server
npm run dev
```

### Default Admin Credentials
```
Email: admin@landregistry.gov
Password: admin123
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

---

## 📁 Project Structure

```
blockchain-land-registry/
├── contracts/                    # Solidity smart contracts
│   └── LandRegistry.sol         # Main land registry contract
│
├── scripts/                      # Deployment & utility scripts
│   ├── deploy.js                # Contract deployment
│   ├── seed-admin.js            # Create admin user
│   └── reset-db.js              # Database reset
│
├── server/                       # Backend (Express.js)
│   ├── config/                  # Configuration files
│   │   ├── blockchain.js        # Blockchain connection
│   │   ├── database.js          # MongoDB connection
│   │   ├── email.js             # Email service config
│   │   ├── gridfs.js            # GridFS setup
│   │   └── socket.js            # Socket.io setup
│   │
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js              # User model
│   │   ├── DigitizedLand.js     # Land model
│   │   ├── Transaction.js       # Transaction model
│   │   ├── Chat.js              # Chat model
│   │   └── AuditLog.js          # Audit log model
│   │
│   ├── routes/                  # API routes
│   │   ├── auth.js              # Authentication routes
│   │   ├── lands.js             # Land management routes
│   │   ├── transactions.js      # Transaction routes
│   │   ├── chat.js              # Chat routes
│   │   ├── chatbotRoutes.js     # Chatbot API routes
│   │   └── twoFactorRoutes.js   # 2FA routes
│   │
│   ├── middleware/              # Express middleware
│   │   └── auth.js              # JWT authentication
│   │
│   ├── utils/                   # Utility functions
│   │   ├── chatbotService.js    # Chatbot logic
│   │   ├── emailService.js      # Email utilities
│   │   ├── pdfGenerator.js      # Certificate generation
│   │   └── qrGenerator.js       # QR code generation
│   │
│   └── server.js                # Main server file
│
├── src/                          # Frontend (React + TypeScript)
│   ├── components/              # React components
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── Marketplace.tsx      # Property marketplace
│   │   ├── ChatbotWidget.tsx    # AI chatbot widget
│   │   ├── RealtimeChat.tsx     # Real-time chat
│   │   ├── LandDetailPage.tsx   # Land details view
│   │   ├── LandMarketplace.tsx  # Marketplace listings
│   │   └── UserProfile.tsx      # User profile
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── useAuth.tsx          # Authentication hook
│   │
│   ├── services/                # API service layer
│   │   └── api.ts               # Axios API client
│   │
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts             # Shared types
│   │
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Entry point
│
├── artifacts/                    # Compiled smart contracts
├── cache/                        # Hardhat cache
├── .env                          # Frontend environment variables
├── .env.example                  # Example env file
├── hardhat.config.js             # Hardhat configuration
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
└── vite.config.ts                # Vite configuration
```

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management with 7-day expiry
- **Password Hashing**: Bcrypt with salt rounds
- **Role-Based Access Control (RBAC)**: Admin, User, Auditor roles
- **Email Verification**: OTP-based email confirmation
- **Two-Factor Authentication**: Email OTP for sensitive operations

### Data Security
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Mongoose ODM protection
- **XSS Protection**: React's built-in escaping
- **CORS Configuration**: Restricted origins
- **Rate Limiting**: API request throttling (recommended)

### Blockchain Security
- **Immutable Records**: Blockchain-backed land records
- **Admin-Only Registration**: Only admins can register land
- **Transaction Approval**: Admin approval required for ownership transfer
- **Event Logging**: All blockchain events logged

### File Upload Security
- **File Type Validation**: Only images and PDFs allowed
- **File Size Limits**: Max 10MB per file
- **GridFS Storage**: Secure file storage in MongoDB
- **Virus Scanning**: Recommended for production

---

## 🧪 Testing

### Manual Testing Checklist

**Authentication:**
- [ ] User registration with email verification
- [ ] Login with valid/invalid credentials
- [ ] Password reset flow
- [ ] 2FA enable/disable
- [ ] JWT token expiry handling

**Land Management:**
- [ ] Admin can register land
- [ ] Land appears in marketplace
- [ ] QR code verification works
- [ ] Image upload and display
- [ ] Land details page loads correctly

**Chatbot:**
- [ ] Search for cheapest lands
- [ ] Search by location
- [ ] Get price statistics
- [ ] Recommendations work
- [ ] Chat history persists
- [ ] User-specific chat isolation

**Real-time Chat:**
- [ ] Send/receive messages
- [ ] Message history loads
- [ ] Online/offline status
- [ ] Multiple chat threads

**Transactions:**
- [ ] Initiate purchase
- [ ] Admin approval workflow
- [ ] Ownership transfer on blockchain
- [ ] Certificate generation

---

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**2. Blockchain Connection Error**
```
Error: could not detect network
```
**Solution**: Start Ganache and update `CONTRACT_ADDRESS` in `.env`

**3. Email Not Sending**
```
Error: Invalid login
```
**Solution**: 
- Enable "Less secure app access" in Gmail
- Or use App Password for Gmail

**4. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill the process using the port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

**5. Chatbot Not Responding**
- Check backend server is running
- Verify JWT token is valid
- Check browser console for errors
- Ensure MongoDB connection is active

---

## 📈 Performance Optimization

### Frontend
- **Code Splitting**: React.lazy() for route-based splitting
- **Image Optimization**: Compress images before upload
- **Caching**: Service workers for offline support
- **Bundle Size**: Tree-shaking with Vite

### Backend
- **Database Indexing**: Indexed fields for faster queries
- **Connection Pooling**: MongoDB connection pool
- **Caching**: Redis for frequently accessed data (recommended)
- **Compression**: Gzip compression for API responses

### Blockchain
- **Gas Optimization**: Efficient Solidity code
- **Batch Operations**: Group multiple transactions
- **Event Indexing**: Index blockchain events

---

## 🚀 Deployment

### Production Checklist
- [ ] Update all environment variables
- [ ] Use production MongoDB instance
- [ ] Deploy smart contracts to mainnet/testnet
- [ ] Configure HTTPS/SSL
- [ ] Set up reverse proxy (Nginx)
- [ ] Enable rate limiting
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (PM2, New Relic)
- [ ] Configure backup strategy
- [ ] Enable error logging (Sentry)

### Recommended Hosting
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: AWS EC2, DigitalOcean, Heroku
- **Database**: MongoDB Atlas
- **Blockchain**: Infura, Alchemy (Ethereum mainnet/testnet)

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Contributors

- **Development Team**: [Your Team Name]
- **Blockchain Integration**: [Name]
- **AI Chatbot**: [Name]
- **UI/UX Design**: [Name]

---

## 📞 Support

For issues and questions:
- **Email**: support@landregistry.com
- **GitHub Issues**: [Repository Issues URL]
- **Documentation**: [Documentation URL]

---

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Integration with government land records
- [ ] Automated property valuation (AI/ML)
- [ ] Virtual property tours (360° images)
- [ ] Payment gateway integration
- [ ] Auction system for properties
- [ ] Smart contract upgrades
- [ ] IPFS integration for all documents

---

**Built with ❤️ using React, Node.js, MongoDB, and Ethereum**
