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
- ✅ Accounts on chosen deployment platforms

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

### Production Environment Variables

#### Backend (.env)

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# API Keys
MURF_API_KEY=your_production_murf_key
OPENAI_API_KEY=your_production_openai_key

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com

# Emergency Configuration
EMERGENCY_WEBHOOK_URL=https://your-emergency-webhook.com
EMERGENCY_PHONE_NUMBER=+1234567890

# Optional: Database (if added later)
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional: Redis (for caching)
REDIS_URL=redis://user:pass@host:port
```

#### Frontend (.env)

```bash
# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.com

# App Configuration
VITE_APP_NAME=Sahaay
VITE_DEFAULT_LANGUAGE=en

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

### Security Considerations

1. **Never commit `.env` files** to version control
2. **Use different API keys** for development and production
3. **Rotate API keys** regularly
4. **Monitor API usage** to detect unusual activity
5. **Set up rate limiting** to prevent abuse

## Domain and SSL Setup

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