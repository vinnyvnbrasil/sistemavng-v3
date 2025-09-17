#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  try {
    log(`\n${description}...`, 'cyan');
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    log(`✅ ${description} completed successfully`, 'green');
    return output;
  } catch (error) {
    log(`❌ Error during ${description}:`, 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

function checkEnvironment() {
  log('🔍 Checking environment...', 'blue');
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('⚠️  .env.local file not found. Please create it from .env.example', 'yellow');
    log('Copy .env.example to .env.local and fill in your actual values', 'yellow');
  }
  
  // Check if package.json exists
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found. Are you in the right directory?', 'red');
    process.exit(1);
  }
  
  log('✅ Environment check passed', 'green');
}

function buildProject() {
  log('\n🏗️  Building project...', 'blue');
  
  // Install dependencies
  execCommand('npm install', 'Installing dependencies');
  
  // Run type check
  execCommand('npm run type-check', 'Running type check');
  
  // Run linting
  execCommand('npm run lint', 'Running linter');
  
  // Build project
  execCommand('npm run build', 'Building project');
  
  log('✅ Build completed successfully', 'green');
}

function deployToVercel() {
  log('\n🚀 Deploying to Vercel...', 'blue');
  
  try {
    // Check if Vercel CLI is installed
    execSync('vercel --version', { encoding: 'utf8' });
  } catch (error) {
    log('⚠️  Vercel CLI not found. Installing...', 'yellow');
    execCommand('npm install -g vercel', 'Installing Vercel CLI');
  }
  
  // Deploy to Vercel
  execCommand('vercel --prod', 'Deploying to Vercel');
  
  log('✅ Deployment to Vercel completed', 'green');
}

function setupSupabase() {
  log('\n🗄️  Setting up Supabase...', 'blue');
  
  try {
    // Check if Supabase CLI is installed
    execSync('supabase --version', { encoding: 'utf8' });
  } catch (error) {
    log('⚠️  Supabase CLI not found. Please install it manually:', 'yellow');
    log('npm install -g supabase', 'yellow');
    log('or visit: https://supabase.com/docs/guides/cli', 'yellow');
    return;
  }
  
  // Check if supabase is initialized
  const supabasePath = path.join(process.cwd(), 'supabase');
  if (!fs.existsSync(supabasePath)) {
    execCommand('supabase init', 'Initializing Supabase');
  }
  
  // Link to remote project (if configured)
  try {
    execCommand('supabase status', 'Checking Supabase status');
  } catch (error) {
    log('⚠️  Supabase not linked to remote project', 'yellow');
    log('Run: supabase link --project-ref YOUR_PROJECT_REF', 'yellow');
  }
  
  // Push migrations
  try {
    execCommand('supabase db push', 'Pushing database migrations');
  } catch (error) {
    log('⚠️  Could not push migrations. Make sure Supabase is properly configured', 'yellow');
  }
  
  // Deploy edge functions
  try {
    execCommand('supabase functions deploy', 'Deploying edge functions');
  } catch (error) {
    log('⚠️  Could not deploy edge functions', 'yellow');
  }
  
  log('✅ Supabase setup completed', 'green');
}

function updateGitHub() {
  log('\n📝 Updating GitHub repository...', 'blue');
  
  try {
    // Add all changes
    execCommand('git add .', 'Adding changes to git');
    
    // Commit changes
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    execCommand(`git commit -m "Deploy: ${timestamp}"`, 'Committing changes');
    
    // Push to main branch
    execCommand('git push origin main', 'Pushing to GitHub');
    
    log('✅ GitHub repository updated', 'green');
  } catch (error) {
    log('⚠️  Could not update GitHub repository', 'yellow');
    log('Make sure you have git configured and the repository is set up', 'yellow');
  }
}

function main() {
  log('🚀 Starting automated deployment process...', 'bright');
  log('==========================================', 'bright');
  
  const args = process.argv.slice(2);
  const skipBuild = args.includes('--skip-build');
  const skipVercel = args.includes('--skip-vercel');
  const skipSupabase = args.includes('--skip-supabase');
  const skipGit = args.includes('--skip-git');
  
  try {
    // Check environment
    checkEnvironment();
    
    // Build project
    if (!skipBuild) {
      buildProject();
    } else {
      log('⏭️  Skipping build step', 'yellow');
    }
    
    // Deploy to Vercel
    if (!skipVercel) {
      deployToVercel();
    } else {
      log('⏭️  Skipping Vercel deployment', 'yellow');
    }
    
    // Setup Supabase
    if (!skipSupabase) {
      setupSupabase();
    } else {
      log('⏭️  Skipping Supabase setup', 'yellow');
    }
    
    // Update GitHub
    if (!skipGit) {
      updateGitHub();
    } else {
      log('⏭️  Skipping GitHub update', 'yellow');
    }
    
    log('\n🎉 Deployment completed successfully!', 'green');
    log('==========================================', 'bright');
    log('Your application should now be live on Vercel', 'green');
    log('Database and edge functions are deployed to Supabase', 'green');
    log('Changes have been committed to GitHub', 'green');
    
  } catch (error) {
    log('\n❌ Deployment failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('🚀 Sistema VNG - Automated Deployment Script', 'bright');
  log('============================================', 'bright');
  log('\nUsage: node scripts/deploy.js [options]', 'cyan');
  log('\nOptions:', 'cyan');
  log('  --skip-build     Skip the build process', 'yellow');
  log('  --skip-vercel    Skip Vercel deployment', 'yellow');
  log('  --skip-supabase  Skip Supabase setup', 'yellow');
  log('  --skip-git       Skip GitHub update', 'yellow');
  log('  --help, -h       Show this help message', 'yellow');
  log('\nExamples:', 'cyan');
  log('  node scripts/deploy.js                    # Full deployment', 'green');
  log('  node scripts/deploy.js --skip-build       # Skip build step', 'green');
  log('  node scripts/deploy.js --skip-vercel      # Skip Vercel deployment', 'green');
  process.exit(0);
}

// Run the main function
main();