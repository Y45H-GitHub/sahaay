# Sahaay Deployment Guide

This guide provides step-by-step instructions for deploying the Sahaay voice assistant application to various cloud platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Environment Configuration](#environment-configuration)
- [Domain and SSL Setup](#domain-and-ssl-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

Before deploying, ensure you have:

- ✅ Murf.ai API key with sufficient credits
- ✅ OpenAI API key with appropriate permissions
- ✅ Git repository with your code
- ✅ Domain name (optional but recommended)
- ✅ Accounts on chosen deployment platforms (Vercel, Railway, etc.)
- ✅ Node.js 18+ installed locally for testing
- ✅ All environment variables configured and tested locally

## Frontend Deployment

### Option 1: Vercel (Recommended)

Vercel provides excellent support for React applications with automatic deployments.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Prepare Frontend

```bash
cd frontend
npm run build
```

#### Step 3: Deploy

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Step 4: Configure Environment Variables

In Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
VITE_API_BASE_URL=https://your-backend-url.com
VITE_APP_NAME=Sahaay
VITE_DEFAULT_LANGUAGE=en
```

#### Step 5: Configure Build Settings

In `vercel.json` (create in frontend directory):

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Option 2: Netlify

#### Step 1: Build and Deploy

```bash
cd frontend
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod --dir=dist
```

#### Step 2: Configure Environment Variables

In Netlify dashboard:
1. Go to Site settings > Environment variables
2. Add your environment variables

#### Step 3: Configure Redirects

Create `frontend/public/_redirects`:

```
/*    /index.html   200
```

### Option 3: AWS S3 + CloudFront

#### Step 1: Build Application

```bash
cd frontend
npm run build
```

#### Step 2: Create S3 Bucket

```bash
aws s3 mb s3://your-sahaay-frontend-bucket
```

#### Step 3: Upload Files

```bash
aws s3 sync dist/ s3://your-sahaay-frontend-bucket --delete
```

#### Step 4: Configure S3 for Static Hosting

```bash
aws s3 website s3://your-sahaay-frontend-bucket \
  --index-document index.html \
  --error-document index.html
```

#### Step 5: Set up CloudFront Distribution

Create CloudFront distribution pointing to your S3 bucket for better performance and HTTPS support.

## Backend Deployment

### Option 1: Railway (Recommended)

Railway provides simple deployment for Node.js applications.

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Prepare Backend

```bash
cd backend
npm run build
```

#### Step 3: Deploy

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Step 4: Configure Environment Variables

In Railway dashboard:
1. Go to your project
2. Navigate to "Variables" tab
3. Add all required environment variables:

```
NODE_ENV=production
PORT=3001
MURF_API_KEY=your_murf_api_key
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=https://your-frontend-url.vercel.app
EMERGENCY_WEBHOOK_URL=your_webhook_url
```

#### Step 5: Configure Start Command

In `package.json`, ensure you have:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

### Option 2: Render

#### Step 1: Connect Repository

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" > "Web Service"
3. Connect your Git repository

#### Step 2: Configure Service

- **Name**: sahaay-backend
- **Environment**: Node
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm start`

#### Step 3: Set Environment Variables

Add all required environment variables in Render dashboard.

### Option 3: Heroku

#### Step 1: Install Heroku CLI

```bash
# Install Heroku CLI
# Follow instructions at https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Create Heroku App

```bash
cd backend
heroku create your-sahaay-backend
```

#### Step 3: Configure Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set MURF_API_KEY=your_murf_api_key
heroku config:set OPENAI_API_KEY=your_openai_api_key
heroku config:set FRONTEND_URL=https://your-frontend-url.vercel.app
```

#### Step 4: Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Option 4: DigitalOcean App Platform

#### Step 1: Create App

1. Go to DigitalOcean App Platform
2. Create new app from GitHub repository

#### Step 2: Configure Build

- **Source Directory**: `/backend`
- **Build Command**: `npm run build`
- **Run Command**: `npm start`

#### Step 3: Set Environment Variables

Add all required environment variables in the app settings.

## Environment Configuration

## Production Environment Configuration

### Environment Variables Checklist

#### Backend Production Variables (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# API Keys (REQUIRED)
MURF_API_KEY=your_production_murf_key_here
OPENAI_API_KEY=your_production_openai_key_here

# CORS Configuration (CRITICAL)
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Emergency Configuration
EMERGENCY_WEBHOOK_URL=https://your-emergency-webhook.com
EMERGENCY_PHONE_NUMBER=+1234567890

# Optional: Caching
REDIS_URL=redis://user:pass@host:port

# Optional: Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional: Monitoring
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=info
```

#### Frontend Production Variables (.env)

```bash
# API Configuration (REQUIRED)
VITE_API_BASE_URL=https://your-backend-domain.railway.app

# App Configuration
VITE_APP_NAME=Sahaay
VITE_DEFAULT_LANGUAGE=en

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=your_frontend_sentry_dsn

# Optional: Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_OFFLINE_MODE=true
```

### Platform-Specific Configuration

#### Railway Backend Configuration

1. **Connect Repository**:
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Build Settings**:
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "cd backend && npm install && npm run build"
     },
     "deploy": {
       "startCommand": "cd backend && npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. **Set Environment Variables**:
   - Go to project → Variables tab
   - Add all backend environment variables
   - Enable "Encrypt" for sensitive values

4. **Configure Custom Domain** (optional):
   - Go to Settings → Domains
   - Add custom domain
   - Update DNS CNAME record

#### Vercel Frontend Configuration

1. **Deploy Configuration** (`vercel.json`):
   ```json
   {
     "builds": [
       {
         "src": "frontend/package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "frontend/dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ],
     "functions": {
       "frontend/src/**/*.ts": {
         "runtime": "@vercel/node@3"
       }
     }
   }
   ```

2. **Build Configuration**:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `cd frontend && npm install`

3. **Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add all VITE_ prefixed variables
   - Set different values for Preview/Production

### Security Configuration

#### SSL/TLS Setup

Most platforms provide automatic SSL, but verify:

```bash
# Test SSL configuration
curl -I https://your-domain.com
# Should return: HTTP/2 200

# Test SSL grade
curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com" | jq '.endpoints[0].grade'
```

#### Security Headers Verification

```bash
# Check security headers
curl -I https://your-domain.com | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"
```

#### API Key Rotation Strategy

1. **Monthly Rotation**:
   ```bash
   # Script for key rotation
   #!/bin/bash
   
   # Generate new keys
   NEW_MURF_KEY="new_key_here"
   NEW_OPENAI_KEY="new_key_here"
   
   # Update in deployment platform
   railway variables set MURF_API_KEY=$NEW_MURF_KEY
   railway variables set OPENAI_API_KEY=$NEW_OPENAI_KEY
   
   # Deploy with new keys
   railway up
   ```

2. **Emergency Key Revocation**:
   - Keep backup keys ready
   - Document revocation process
   - Test key switching procedure

### Performance Configuration

#### CDN Setup

For static assets, configure CDN:

```javascript
// In vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  base: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.your-domain.com/' 
    : '/'
});
```

#### Caching Headers

```javascript
// Backend caching configuration
app.use((req, res, next) => {
  if (req.path.includes('/api/')) {
    // API responses - no cache
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (req.path.includes('/static/')) {
    // Static assets - long cache
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});
```

### Monitoring Configuration

#### Health Checks

```javascript
// Comprehensive health check
app.get('/api/health', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: {}
  };

  try {
    // Check external services
    const services = [
      { name: 'murf', check: () => checkMurfAPI() },
      { name: 'openai', check: () => checkOpenAIAPI() }
    ];

    for (const service of services) {
      try {
        const isHealthy = await Promise.race([
          service.check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        checks.dependencies[service.name] = isHealthy ? 'healthy' : 'unhealthy';
      } catch (error) {
        checks.dependencies[service.name] = 'unhealthy';
      }
    }

    const allHealthy = Object.values(checks.dependencies)
      .every(status => status === 'healthy');
    
    checks.status = allHealthy ? 'healthy' : 'degraded';
    res.status(allHealthy ? 200 : 503).json(checks);
  } catch (error) {
    checks.status = 'unhealthy';
    checks.error = error.message;
    res.status(503).json(checks);
  }
});
```

#### Logging Configuration

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sahaay-backend' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Deployment Verification Checklist

After deployment, verify:

- [ ] **Frontend loads** at production URL
- [ ] **Backend health check** returns 200 OK
- [ ] **CORS headers** allow frontend domain
- [ ] **API endpoints** respond correctly
- [ ] **TTS service** generates audio
- [ ] **Vision service** processes images
- [ ] **OCR service** extracts text
- [ ] **Emergency endpoint** works
- [ ] **SSL certificate** is valid
- [ ] **Security headers** are present
- [ ] **Performance** meets requirements (<5s response times)
- [ ] **Error handling** works correctly
- [ ] **Monitoring** is active

### Rollback Procedure

In case of deployment issues:

1. **Immediate Rollback**:
   ```bash
   # Railway
   railway rollback

   # Vercel
   vercel --prod --rollback
   ```

2. **Environment Variable Rollback**:
   ```bash
   # Restore previous environment variables
   railway variables set MURF_API_KEY=$OLD_MURF_KEY
   ```

3. **DNS Rollback** (if using custom domain):
   - Update DNS records to previous deployment
   - Wait for propagation (up to 24 hours)

4. **Communication**:
   - Update status page
   - Notify users if necessary
   - Document incident for post-mortem

## CORS and Security Settings

### CORS Configuration

The backend is configured with specific CORS settings for security:

```javascript
// Current CORS configuration in backend/src/index.ts
app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? ['http://localhost:5173', 'http://localhost:5174', process.env.FRONTEND_URL || ''].filter(url => url !== '')
        : process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
```

#### Production CORS Setup

1. **Set FRONTEND_URL environment variable** in your backend deployment:
   ```bash
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

2. **For multiple domains** (staging + production):
   ```javascript
   origin: process.env.NODE_ENV === 'production'
       ? [process.env.FRONTEND_URL, process.env.STAGING_URL].filter(Boolean)
       : ['http://localhost:5173', 'http://localhost:5174']
   ```

3. **Verify CORS headers** after deployment:
   ```bash
   curl -H "Origin: https://your-frontend-domain.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: X-Requested-With" \
        -X OPTIONS \
        https://your-backend-domain.com/api/health
   ```

### Security Headers

Add security headers to your backend:

```javascript
// Add to backend/src/index.ts
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.murf.ai https://api.openai.com;"
  );
  
  next();
});
```

### API Key Security

1. **Never expose API keys** in frontend code
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** (monthly recommended)
4. **Monitor API usage** for unusual patterns
5. **Set up rate limiting**:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

### File Upload Security

Current configuration allows up to 10MB uploads:

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

For production, consider:
- File type validation
- Virus scanning
- Temporary file cleanup
- Storage limits per user

## Performance Optimization Tips

### Frontend Optimization

#### 1. Bundle Size Optimization

```bash
# Analyze bundle size
cd frontend
npm run build
npx vite-bundle-analyzer dist
```

**Optimization strategies:**
- Use dynamic imports for large components
- Implement code splitting by route
- Remove unused dependencies
- Use tree shaking

```javascript
// Example: Lazy load components
const CameraCapture = lazy(() => import('./components/CameraCapture'));
const AudioPlayer = lazy(() => import('./components/AudioPlayer'));
```

#### 2. Image Optimization

```javascript
// Compress images before upload
const compressImage = (file, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};
```

#### 3. Caching Strategy

```javascript
// Service worker for caching
// Create public/sw.js
const CACHE_NAME = 'sahaay-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
```

#### 4. Audio Optimization

```javascript
// Preload audio for better UX
const preloadAudio = (url) => {
  const audio = new Audio();
  audio.preload = 'auto';
  audio.src = url;
  return audio;
};

// Use Web Audio API for better performance
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
```

### Backend Optimization

#### 1. Response Compression

```javascript
const compression = require('compression');

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));
```

#### 2. API Response Caching

```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache TTS responses
const getCachedTTS = (text, language) => {
  const key = `tts_${text}_${language}`;
  return cache.get(key);
};

const setCachedTTS = (text, language, audioUrl) => {
  const key = `tts_${text}_${language}`;
  cache.set(key, audioUrl);
};
```

#### 3. Database Connection Pooling (if using database)

```javascript
// For PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 4. Request Optimization

```javascript
// Batch similar requests
const batchRequests = (requests, batchSize = 5) => {
  const batches = [];
  for (let i = 0; i < requests.length; i += batchSize) {
    batches.push(requests.slice(i, i + batchSize));
  }
  return batches;
};

// Implement request queuing for external APIs
const Queue = require('bull');
const ttsQueue = new Queue('TTS processing');

ttsQueue.process(async (job) => {
  const { text, language } = job.data;
  return await murfTTSService.convertToSpeech(text, language);
});
```

### CDN and Edge Optimization

#### 1. Cloudflare Setup

```javascript
// Cloudflare Workers for edge computing
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Cache static assets
  if (request.url.includes('/static/')) {
    return caches.default.match(request);
  }
  
  // Forward API requests
  return fetch(request);
}
```

#### 2. Image CDN Integration

```javascript
// Use Cloudinary or similar for image optimization
const cloudinary = require('cloudinary').v2;

const optimizeImage = (imageUrl) => {
  return cloudinary.url(imageUrl, {
    quality: 'auto',
    fetch_format: 'auto',
    width: 800,
    height: 600,
    crop: 'limit'
  });
};
```

### Monitoring and Performance Metrics

#### 1. Performance Monitoring

```javascript
// Add performance timing
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // Send to monitoring service
    if (duration > 1000) {
      console.warn(`Slow request: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};

app.use(performanceMiddleware);
```

#### 2. Health Check Enhancements

```javascript
// Enhanced health check with dependencies
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    dependencies: {}
  };
  
  try {
    // Check Murf API
    const murfStatus = await checkMurfAPI();
    health.dependencies.murf = murfStatus ? 'healthy' : 'unhealthy';
    
    // Check OpenAI API
    const openaiStatus = await checkOpenAIAPI();
    health.dependencies.openai = openaiStatus ? 'healthy' : 'unhealthy';
    
    // Check overall status
    const allHealthy = Object.values(health.dependencies).every(status => status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';
    
    res.status(allHealthy ? 200 : 503).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503).json(health);
  }
});
```

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery.yml
config:
  target: 'https://your-backend-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/api/health"

# Run load test
artillery run artillery.yml
```

## Domain and SSL Setup

### Custom Domain Configuration

#### For Vercel Frontend

1. **Add Domain in Dashboard**:
   - Go to project settings in Vercel dashboard
   - Navigate to "Domains" tab
   - Click "Add" and enter your domain
   - Choose domain type (apex domain or subdomain)

2. **Configure DNS Records**:
   ```bash
   # For apex domain (example.com)
   A record: @ → 76.76.19.61
   
   # For subdomain (app.example.com)  
   CNAME record: app → cname.vercel-dns.com
   ```

3. **Verify Domain**:
   ```bash
   # Check DNS propagation
   dig your-domain.com
   nslookup your-domain.com
   ```

#### For Railway Backend

1. **Add Custom Domain**:
   - Go to project settings in Railway dashboard
   - Navigate to "Domains" tab
   - Click "Custom Domain"
   - Enter your API subdomain (e.g., api.yourdomain.com)

2. **Configure DNS**:
   ```bash
   # Add CNAME record
   CNAME record: api → your-project.up.railway.app
   ```

3. **Update Environment Variables**:
   ```bash
   # Update CORS settings
   FRONTEND_URL=https://yourdomain.com
   ```

### SSL Certificate Management

#### Automatic SSL (Recommended)

Most platforms provide automatic SSL:

- **Vercel**: Automatic Let's Encrypt certificates
- **Railway**: Automatic SSL for custom domains
- **Netlify**: Automatic SSL with one-click setup

#### Manual SSL Setup (Advanced)

For custom server deployments:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### SSL Verification

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check SSL grade
curl -s "https://api.ssllabs.com/api/v3/analyze?host=yourdomain.com" | jq '.endpoints[0].grade'

# Verify HTTPS redirect
curl -I http://yourdomain.com
# Should return: HTTP/1.1 301 Moved Permanently
```

### DNS Configuration Best Practices

#### DNS Records Setup

```bash
# Complete DNS configuration
A     @           76.76.19.61                    # Apex domain to Vercel
CNAME api         your-project.up.railway.app    # API subdomain to Railway
CNAME www         yourdomain.com                 # WWW redirect
TXT   @           "v=spf1 include:_spf.google.com ~all"  # SPF record
```

#### DNS Security

```bash
# Enable DNSSEC (if supported by registrar)
# Add CAA records for certificate authority authorization
CAA   @   0 issue "letsencrypt.org"
CAA   @   0 issuewild "letsencrypt.org"
CAA   @   0 iodef "mailto:admin@yourdomain.com"
```

#### 1. API Usage Monitoring

```javascript
// Track API usage
const apiUsageTracker = {
  murf: 0,
  openai: 0,
  daily_limit: {
    murf: 1000,
    openai: 10000
  }
};

const trackAPIUsage = (service, tokens = 1) => {
  apiUsageTracker[service] += tokens;
  
  if (apiUsageTracker[service] > apiUsageTracker.daily_limit[service] * 0.8) {
    console.warn(`${service} usage at 80% of daily limit`);
  }
};
```

#### 2. Intelligent Caching

```javascript
// Cache expensive operations
const expensiveOperationCache = new Map();

const getCachedResult = async (key, operation, ttl = 3600000) => {
  const cached = expensiveOperationCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.result;
  }
  
  const result = await operation();
  expensiveOperationCache.set(key, {
    result,
    timestamp: Date.now()
  });
  
  return result;
};
```

### Custom Domain Configuration

#### For Vercel

1. Go to project settings in Vercel dashboard
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

#### For Railway

1. Go to project settings in Railway dashboard
2. Navigate to "Domains"
3. Add custom domain
4. Configure DNS CNAME record

### SSL Certificate

Most platforms (Vercel, Netlify, Railway) provide automatic SSL certificates. For custom setups:

1. **Let's Encrypt** (free):
   ```bash
   certbot --nginx -d yourdomain.com
   ```

2. **Cloudflare** (free tier available):
   - Add your domain to Cloudflare
   - Enable SSL/TLS encryption

## Monitoring and Maintenance

### Health Checks

Set up health check endpoints:

```javascript
// Backend health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

### Logging

Implement structured logging:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Monitoring Services

Consider using:

- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry, Bugsnag
- **Performance monitoring**: New Relic, DataDog
- **Log aggregation**: LogRocket, Papertrail

### Backup Strategy

1. **Code**: Ensure code is backed up in Git repository
2. **Environment variables**: Keep secure backup of production variables
3. **User data**: If storing user data, implement regular backups
4. **API keys**: Keep backup keys in secure location

### Update Process

1. **Test changes** in development environment
2. **Deploy to staging** environment first
3. **Run automated tests** against staging
4. **Deploy to production** during low-traffic periods
5. **Monitor** for issues after deployment

### Performance Optimization

#### Frontend Optimization

1. **Bundle analysis**:
   ```bash
   npm run build -- --analyze
   ```

2. **Image optimization**:
   - Use WebP format when possible
   - Implement lazy loading
   - Compress images before upload

3. **Caching**:
   - Set appropriate cache headers
   - Use service workers for offline support

#### Backend Optimization

1. **Response compression**:
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Request caching**:
   ```javascript
   const redis = require('redis');
   const client = redis.createClient(process.env.REDIS_URL);
   ```

3. **Database optimization** (if using database):
   - Add appropriate indexes
   - Use connection pooling
   - Implement query optimization

### Scaling Considerations

#### Horizontal Scaling

- Use load balancers
- Implement stateless architecture
- Use external session storage (Redis)

#### Vertical Scaling

- Monitor resource usage
- Upgrade server specifications as needed
- Optimize memory usage

#### CDN Integration

- Use CDN for static assets
- Cache API responses when appropriate
- Implement edge computing for better performance

### Disaster Recovery

1. **Backup procedures**:
   - Regular code backups
   - Environment configuration backups
   - Database backups (if applicable)

2. **Recovery procedures**:
   - Document recovery steps
   - Test recovery procedures regularly
   - Have rollback plan ready

3. **Communication plan**:
   - Status page for users
   - Internal communication channels
   - Escalation procedures

## Cost Optimization

### API Usage Monitoring

1. **Murf.ai**: Monitor TTS usage and costs
2. **OpenAI**: Track token usage and implement caching
3. **Cloud services**: Monitor compute and bandwidth usage

### Cost-Saving Strategies

1. **Implement caching** for frequently requested data
2. **Optimize image sizes** to reduce processing costs
3. **Use free tiers** effectively
4. **Monitor and alert** on unusual usage patterns

## Troubleshooting Deployment Issues

### Common Issues

1. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json
   - Check for TypeScript errors

2. **Environment variable issues**:
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure frontend variables start with VITE_

3. **CORS issues**:
   - Verify FRONTEND_URL matches actual frontend URL
   - Check CORS configuration in backend

4. **SSL certificate issues**:
   - Verify domain DNS configuration
   - Check certificate expiration
   - Ensure proper redirects (HTTP to HTTPS)

### Debugging Steps

1. **Check deployment logs** for error messages
2. **Test API endpoints** individually
3. **Verify environment variables** are loaded correctly
4. **Check external service status** (Murf.ai, OpenAI)
5. **Monitor resource usage** (CPU, memory, bandwidth)

This deployment guide should help you successfully deploy the Sahaay application to production. Remember to test thoroughly in a staging environment before deploying to production.