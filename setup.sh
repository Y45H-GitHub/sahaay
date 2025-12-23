#!/bin/bash

# Sahaay Voice Assistant Setup Script
# This script helps you set up the development environment quickly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18 or higher"
        return 1
    fi
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating backend .env file..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your API keys before running the application"
    else
        print_success "Backend .env file already exists"
    fi
    
    # Run tests to verify setup
    print_status "Running backend tests..."
    if npm test; then
        print_success "Backend tests passed"
    else
        print_warning "Some backend tests failed. This might be due to missing API keys."
    fi
    
    cd ..
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating frontend .env file..."
        cp .env.example .env
        print_success "Frontend .env file created with default values"
    else
        print_success "Frontend .env file already exists"
    fi
    
    # Run tests to verify setup
    print_status "Running frontend tests..."
    if npm test; then
        print_success "Frontend tests passed"
    else
        print_warning "Some frontend tests failed"
    fi
    
    cd ..
}

# Function to create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Create package.json in root for convenience
    if [ ! -f package.json ]; then
        cat > package.json << 'EOF'
{
  "name": "sahaay",
  "version": "1.0.0",
  "description": "Voice-first accessibility assistant",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "start": "npm run start:backend",
    "start:backend": "cd backend && npm start",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF
        print_success "Root package.json created"
        
        # Install concurrently for running both servers
        npm install
    fi
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting Sahaay Voice Assistant..."
echo "Backend will be available at: http://localhost:3001"
echo "Frontend will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""
npm run dev
EOF
    chmod +x start.sh
    print_success "Start script created (./start.sh)"
}

# Function to verify API keys
verify_api_keys() {
    print_status "Checking API key configuration..."
    
    # Check backend .env
    if [ -f backend/.env ]; then
        if grep -q "your_murf_api_key_here" backend/.env; then
            print_warning "Murf API key not configured in backend/.env"
        else
            print_success "Murf API key appears to be configured"
        fi
        
        if grep -q "your_openai_api_key_here" backend/.env; then
            print_warning "OpenAI API key not configured in backend/.env"
        else
            print_success "OpenAI API key appears to be configured"
        fi
    fi
}

# Function to display next steps
show_next_steps() {
    echo ""
    print_success "Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Configure your API keys in backend/.env:"
    echo "   - Get Murf API key from: https://murf.ai/"
    echo "   - Get OpenAI API key from: https://platform.openai.com/"
    echo ""
    echo "2. Start the development servers:"
    echo "   ./start.sh"
    echo "   OR"
    echo "   npm run dev"
    echo ""
    echo "3. Open your browser and navigate to:"
    echo "   Frontend: http://localhost:5173"
    echo "   Backend API: http://localhost:3001/api/health"
    echo ""
    echo "4. Grant camera and microphone permissions when prompted"
    echo ""
    echo "For troubleshooting, see TROUBLESHOOTING.md"
    echo "For deployment instructions, see DEPLOYMENT.md"
    echo ""
}

# Main setup function
main() {
    echo "=============================================="
    echo "    Sahaay Voice Assistant Setup Script"
    echo "=============================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        print_error "Please install Node.js 18 or higher and run this script again"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm and run this script again"
        exit 1
    fi
    
    if ! command_exists git; then
        print_warning "git is not installed. You may need it for version control"
    fi
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "This script must be run from the root directory of the Sahaay project"
        exit 1
    fi
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Create convenience scripts
    create_startup_scripts
    
    # Verify API keys
    verify_api_keys
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@"