# Sahaay Troubleshooting Guide

This guide helps you resolve common issues when setting up and using the Sahaay voice assistant application.

## Table of Contents

- [Setup Issues](#setup-issues)
- [API Key Problems](#api-key-problems)
- [Camera and Microphone Issues](#camera-and-microphone-issues)
- [Audio Playback Problems](#audio-playback-problems)
- [Network and CORS Issues](#network-and-cors-issues)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)
- [Development Issues](#development-issues)
- [Production Deployment Issues](#production-deployment-issues)

## Setup Issues

### Node.js Version Compatibility

**Problem:** Application fails to start with Node.js version errors.

**Solution:**
```bash
# Check your Node.js version
node --version

# Should be 18.0.0 or higher
# If not, install Node.js 18+ from https://nodejs.org/
```

**Alternative:** Use Node Version Manager (nvm):
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js 18
nvm install 18
nvm use 18
```

### Package Installation Failures

**Problem:** `npm install` fails with permission or dependency errors.

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still failing, try with legacy peer deps
npm install --legacy-peer-deps
```

### Port Already in Use

**Problem:** "Port 3001 is already in use" or "Port 5173 is already in use".

**Solution:**
```bash
# Find and kill process using the port
# On macOS/Linux:
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Alternative:** Change ports in configuration:
- Backend: Update `PORT` in `.env`
- Frontend: Update `VITE_API_BASE_URL` and use `npm run dev -- --port 3000`

## API Key Problems

### Invalid Murf.ai API Key

**Problem:** "Invalid API key" or "Unauthorized" errors from Murf TTS service.

**Symptoms:**
- TTS requests fail
- Console shows 401 or 403 errors
- Audio responses not generated

**Solution:**
1. Verify API key in `.env` file:
   ```bash
   # Check if key is set correctly (no quotes, no spaces)
   cat backend/.env | grep MURF_API_KEY
   ```

2. Test API key manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.murf.ai/v1/voices
   ```

3. Check Murf.ai dashboard:
   - Verify key is active
   - Check usage quotas
   - Ensure billing is up to date

### OpenAI API Key Issues

**Problem:** Scene description or general Q&A not working.

**Symptoms:**
- Vision analysis fails
- General questions return errors
- Console shows OpenAI API errors

**Solution:**
1. Verify API key format:
   ```bash
   # OpenAI keys start with 'sk-'
   echo $OPENAI_API_KEY | head -c 10
   ```

2. Test API access:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. Check OpenAI dashboard:
   - Verify key permissions
   - Check usage limits
   - Ensure sufficient credits

### Environment Variables Not Loading

**Problem:** Environment variables are not being read.

**Solution:**
1. Verify `.env` file location:
   ```bash
   # Should be in backend/ and frontend/ directories
   ls -la backend/.env
   ls -la frontend/.env
   ```

2. Check file format:
   ```bash
   # No spaces around = sign
   # No quotes unless needed
   MURF_API_KEY=your_key_here
   ```

3. Restart servers after changing `.env` files.

## Camera and Microphone Issues

### Permission Denied

**Problem:** Browser doesn't request or denies camera/microphone permissions.

**Solution:**
1. **Chrome:**
   - Click the camera/microphone icon in address bar
   - Select "Always allow"
   - Refresh the page

2. **Firefox:**
   - Go to Settings > Privacy & Security > Permissions
   - Find Camera and Microphone
   - Remove blocked sites

3. **Safari:**
   - Safari > Preferences > Websites
   - Select Camera/Microphone
   - Set to "Allow"

### HTTPS Required

**Problem:** Camera/microphone access blocked due to insecure connection.

**Solution:**
1. **Development:** Use `localhost` (already secure)
2. **Production:** Ensure HTTPS is enabled
3. **Testing:** Use Chrome flags for insecure origins:
   ```
   chrome://flags/#unsafely-treat-insecure-origin-as-secure
   ```

### Camera Not Detected

**Problem:** No camera devices found.

**Solution:**
1. Check device connections
2. Test camera in other applications
3. Try different browsers
4. Check browser console for detailed errors:
   ```javascript
   navigator.mediaDevices.enumerateDevices()
     .then(devices => console.log(devices))
   ```

### Audio Recording Issues

**Problem:** Voice input not working or poor quality.

**Solution:**
1. Check microphone permissions
2. Test microphone in browser:
   ```javascript
   navigator.mediaDevices.getUserMedia({ audio: true })
     .then(stream => console.log('Microphone working'))
     .catch(err => console.error('Microphone error:', err))
   ```
3. Adjust microphone levels in system settings
4. Try external microphone if built-in doesn't work

## Audio Playback Problems

### No Audio Output

**Problem:** TTS responses generated but no sound plays.

**Solution:**
1. Check browser audio settings
2. Verify system volume levels
3. Test with different audio formats
4. Check browser console for audio errors
5. Try different browsers

### Audio Format Not Supported

**Problem:** "Audio format not supported" errors.

**Solution:**
1. Check supported formats in browser:
   ```javascript
   const audio = new Audio();
   console.log('MP3:', audio.canPlayType('audio/mpeg'));
   console.log('WAV:', audio.canPlayType('audio/wav'));
   ```

2. Update Murf TTS configuration to use supported format
3. Add audio format fallbacks in code

### Distorted or Choppy Audio

**Problem:** Audio plays but quality is poor.

**Solution:**
1. Check network connection speed
2. Reduce audio quality in Murf settings
3. Clear browser cache
4. Try different TTS voice
5. Check system audio drivers

## Network and CORS Issues

### CORS Policy Errors

**Problem:** Frontend can't connect to backend API.

**Symptoms:**
- "Access to fetch blocked by CORS policy"
- API requests fail from browser
- Network tab shows CORS errors

**Solution:**
1. Verify `FRONTEND_URL` in backend `.env`:
   ```bash
   # Should match frontend URL exactly
   FRONTEND_URL=http://localhost:5173
   ```

2. Check backend CORS configuration:
   ```javascript
   // Should allow frontend origin
   app.use(cors({
     origin: process.env.FRONTEND_URL
   }));
   ```

3. Ensure both servers are running on correct ports

### API Connection Refused

**Problem:** Frontend can't reach backend API.

**Solution:**
1. Verify backend is running:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. Check `VITE_API_BASE_URL` in frontend `.env`
3. Verify firewall settings
4. Check network connectivity

### Slow API Responses

**Problem:** API requests take too long to complete.

**Solution:**
1. Check external API status (Murf, OpenAI)
2. Monitor network latency
3. Optimize image sizes before upload
4. Implement request timeouts
5. Add loading indicators

## Performance Issues

### High Memory Usage

**Problem:** Application uses excessive memory.

**Solution:**
1. **Frontend:**
   - Clear browser cache
   - Close unused tabs
   - Reduce image resolution
   - Implement image compression

2. **Backend:**
   - Monitor Node.js memory usage
   - Implement garbage collection
   - Optimize image processing
   - Add memory limits

### Slow Image Processing

**Problem:** Scene description or OCR takes too long.

**Solution:**
1. Compress images before upload:
   ```javascript
   // Resize image to max 800px width
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
   // ... compression logic
   ```

2. Optimize backend processing:
   - Use smaller image sizes for analysis
   - Implement caching for similar images
   - Add request queuing

3. Check external API performance

### Battery Drain on Mobile

**Problem:** App drains battery quickly on mobile devices.

**Solution:**
1. Reduce camera frame rate
2. Implement sleep mode when inactive
3. Optimize haptic feedback usage
4. Use efficient audio codecs
5. Minimize background processing

## Browser Compatibility

### Unsupported Browser Features

**Problem:** Features not working in certain browsers.

**Solution:**
1. **Check feature support:**
   ```javascript
   // MediaDevices API
   if (!navigator.mediaDevices) {
     console.error('MediaDevices not supported');
   }
   
   // Vibration API
   if (!navigator.vibrate) {
     console.error('Vibration not supported');
   }
   ```

2. **Implement fallbacks:**
   - Alternative recording methods
   - Visual feedback instead of haptic
   - Different audio formats

### Safari-Specific Issues

**Problem:** Features work in Chrome/Firefox but not Safari.

**Solution:**
1. Use WebKit-specific prefixes
2. Handle Safari's stricter security policies
3. Test audio autoplay policies
4. Use compatible audio formats (MP3, AAC)

### Mobile Browser Issues

**Problem:** Features don't work on mobile browsers.

**Solution:**
1. Test on actual devices, not just desktop browser dev tools
2. Handle touch events properly
3. Optimize for mobile viewport
4. Consider mobile-specific limitations

## Development Issues

### TypeScript Compilation Errors

**Problem:** TypeScript build fails with type errors.

**Solution:**
1. Update TypeScript definitions:
   ```bash
   npm install --save-dev @types/node @types/react
   ```

2. Check `tsconfig.json` configuration
3. Fix type mismatches in code
4. Use type assertions carefully

### Hot Reload Not Working

**Problem:** Changes don't reflect automatically during development.

**Solution:**
1. **Vite (Frontend):**
   ```bash
   # Restart dev server
   npm run dev
   ```

2. **Nodemon (Backend):**
   ```bash
   # Check nodemon configuration
   npm run dev
   ```

3. Clear browser cache
4. Check file watchers aren't blocked by antivirus

### Test Failures

**Problem:** Unit or integration tests failing.

**Solution:**
1. **Run tests individually:**
   ```bash
   # Frontend
   npm test -- --run ComponentName.test.tsx
   
   # Backend
   npm test -- ServiceName.test.ts
   ```

2. **Check test environment:**
   - Verify test setup files
   - Check mock configurations
   - Ensure test data is available

3. **Update snapshots if needed:**
   ```bash
   npm test -- --update-snapshots
   ```

## Production Deployment Issues

### Build Failures

**Problem:** Production build fails.

**Solution:**
1. **Check build logs:**
   ```bash
   npm run build 2>&1 | tee build.log
   ```

2. **Common fixes:**
   - Remove unused imports
   - Fix TypeScript errors
   - Optimize bundle size
   - Check environment variables

### Environment Variable Issues in Production

**Problem:** App works locally but fails in production.

**Solution:**
1. **Verify all required variables are set:**
   ```bash
   # Check deployment platform settings
   # Ensure no typos in variable names
   ```

2. **Frontend variables must start with `VITE_`**
3. **Backend variables should not be exposed to frontend**

### HTTPS Certificate Issues

**Problem:** SSL/TLS certificate errors in production.

**Solution:**
1. Verify certificate is valid and not expired
2. Check certificate chain
3. Use Let's Encrypt for free certificates
4. Configure proper redirects (HTTP to HTTPS)

### Performance Issues in Production

**Problem:** App is slow in production environment.

**Solution:**
1. **Enable compression:**
   ```javascript
   app.use(compression());
   ```

2. **Optimize assets:**
   - Minify JavaScript/CSS
   - Compress images
   - Use CDN for static files

3. **Monitor performance:**
   - Set up logging
   - Use APM tools
   - Monitor external API response times

## Getting Additional Help

### Debugging Steps

1. **Check browser console** for JavaScript errors
2. **Check network tab** for failed requests
3. **Check server logs** for backend errors
4. **Test API endpoints** individually with curl or Postman
5. **Verify environment variables** are loaded correctly

### Useful Commands

```bash
# Check if services are running
curl http://localhost:3001/api/health
curl http://localhost:5173

# View logs
# Frontend: Check browser console
# Backend: Check terminal output

# Test API endpoints
curl -X POST http://localhost:3001/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "test", "language": "en"}'
```

### When to Seek Help

If you've tried the solutions above and still have issues:

1. **Gather information:**
   - Browser version and OS
   - Node.js version
   - Error messages (full stack traces)
   - Steps to reproduce the issue

2. **Check existing issues** in the project repository

3. **Create a detailed bug report** with:
   - Environment details
   - Expected vs actual behavior
   - Reproduction steps
   - Error logs

### Emergency Contacts

For critical production issues:
- Check service status pages (Murf.ai, OpenAI)
- Monitor external API quotas and limits
- Have backup API keys ready
- Implement graceful degradation for service failures