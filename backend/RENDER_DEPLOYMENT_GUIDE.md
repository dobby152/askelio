# Askelio Backend - Render.com Deployment Guide

## Environment Variables Setup

### 1. Copy Environment Variables
Use the variables from `backend/render-env-vars.txt` and add them to your Render.com service:

1. Go to [Render.com Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to **Environment** tab
4. Add each variable from the file

### 2. Database Configuration ✅

**Database password has been configured!**

The `DATABASE_URL` in `render-env-vars.txt` now contains the correct password:
```
postgresql://postgres:dZws6gN5HA7FFdq@db.nfmjqnojvjjapszgwcfd.supabase.co:5432/postgres
```

### 3. Ready for Deployment
All environment variables are now ready to be copied to Render.com.

## Project Information
- **Supabase Project**: askelio-auth
- **Project ID**: nfmjqnojvjjapszgwcfd
- **Region**: eu-central-1
- **Database Host**: db.nfmjqnojvjjapszgwcfd.supabase.co
- **Database Version**: PostgreSQL 17.4.1

## Security Notes
- Mark sensitive variables as "secret" in Render.com if the option is available
- Never commit the actual database password to version control
- The service role key is highly sensitive - treat it as a secret

## Build Configuration

### Python Version
- **File**: `backend/runtime.txt`
- **Version**: Python 3.11.9 (compatible with all dependencies)

### Build Command Options

**Option 1: Minimal deployment (recommended for initial setup)**
```bash
pip install --upgrade pip && pip install -r requirements-minimal.txt
```

**Option 2: Full deployment (after minimal works)**
```bash
./render-build.sh
```

**Option 3: Manual command**
```bash
pip install --upgrade pip && pip install -r requirements.txt
```

### Start Command
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Deployment Steps

1. **Push updated code** to your GitHub repository
2. **In Render.com dashboard**:
   - Build Command: `./render-build.sh`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Python Version: Will use `runtime.txt` (3.11.9)
3. **Add environment variables** from `render-env-vars.txt`
4. **Deploy**

## Verification
After setting up the environment variables:
1. Deploy your service on Render.com
2. Check the logs for any connection errors
3. Test API endpoints to ensure database connectivity

## Troubleshooting

### Build Issues

**PaddlePaddle/EasyOCR errors (current issue)**
- These ML libraries have Python 3.13 compatibility issues
- **Solution**: Use `requirements-minimal.txt` for initial deployment
- **Alternative**: Wait for library updates or use Python 3.11

**Pillow errors**
- Fixed by using Python 3.11.9 and updated requirements.txt

**Version conflicts**
- All dependencies now use flexible version ranges

### Runtime Issues
- If database connection fails, double-check the DATABASE_URL format
- Ensure all required environment variables are set
- Check Render.com logs for specific error messages

### Common Fixes
1. **For immediate deployment**: Use `requirements-minimal.txt`
2. **Make build script executable**: `chmod +x render-build.sh`
3. **If build fails**: Try manual build command
4. **Python version**: Render.com ignores `runtime.txt`, uses Python 3.13 by default

### Deployment Strategy
1. **Phase 1**: Deploy with `requirements-minimal.txt` to get basic API running
2. **Phase 2**: Add OCR libraries one by one after confirming basic deployment works
3. **Phase 3**: Full feature deployment once all compatibility issues are resolved
