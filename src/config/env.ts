import dotenv from 'dotenv';

dotenv.config();

interface RequiredEnvVars {
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  MONGODB_URI: string;
  STRIPE_SECRET_KEY: string;
}

const validateEnvironmentVariables = (): RequiredEnvVars => {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET', 
    'MONGODB_URI',
    'STRIPE_SECRET_KEY'
  ];

  const missingVars: string[] = [];
  const weakSecrets: string[] = [];

  requiredVars.forEach(envVar => {
    const value = process.env[envVar];
    if (!value) {
      missingVars.push(envVar);
    } else if (envVar.includes('SECRET') || envVar.includes('KEY')) {
      // Check for weak default values
      if (value.includes('your-secret-key') || value.includes('your-refresh-secret-key') || value.length < 32) {
        weakSecrets.push(envVar);
      }
    }
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(envVar => console.error(`  - ${envVar}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  if (weakSecrets.length > 0) {
    console.error('❌ Weak or default secrets detected:');
    weakSecrets.forEach(envVar => console.error(`  - ${envVar}: Use a strong, unique secret`));
    console.error('\n💡 Generate strong secrets with: openssl rand -base64 32');
    process.exit(1);
  }

  console.log('✅ All environment variables validated successfully');

  return {
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
    MONGODB_URI: process.env.MONGODB_URI!,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  };
};

export const env = validateEnvironmentVariables();