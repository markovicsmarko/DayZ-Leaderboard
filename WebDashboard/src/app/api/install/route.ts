import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const CONFIG_DIR = path.join(process.cwd(), 'config');
const CONFIG_PATH = path.join(CONFIG_DIR, 'database.json');

export async function GET() {
  // Check if already installed
  const installed = fs.existsSync(CONFIG_PATH) || !!process.env.DATABASE_URL;
  const isReadOnly = !!process.env.VERCEL;
  return NextResponse.json({ installed, isReadOnly });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, username, password, database, apiKey } = body;

    if (!host || !port || !username || !database || !apiKey) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
    }

    // Construct the database URL (MySQL by default)
    const databaseUrl = `mysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

    // Test database connection
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    try {
      // Run a simple connection check
      await testPrisma.$queryRaw`SELECT 1`;
    } catch (dbError: any) {
      return NextResponse.json({ 
        error: `Failed to connect to the database. Error: ${dbError.message || dbError}` 
      }, { status: 400 });
    } finally {
      await testPrisma.$disconnect();
    }

    // Attempt to write config locally
    try {
      // Ensure config directory exists
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      // Save configurations to local JSON
      const configData = {
        databaseUrl,
        apiKey,
        installedAt: new Date().toISOString()
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    } catch (fsError: any) {
      console.warn('[SetupWizard] Filesystem is read-only (Vercel). Returning credentials for manual configuration.');
      return NextResponse.json({ 
        isReadOnly: true,
        databaseUrl,
        apiKey,
        error: 'Read-only environment detected. Database connection verified successfully, but we cannot write config files dynamically.' 
      }, { status: 200 }); // Return status 200 so the frontend can handle the successful verification with manual setup info
    }

    // Run Prisma migrations / DB push to create database tables
    try {
      const prismaCmd = 'npx prisma db push --accept-data-loss';
      console.log(`[SetupWizard] Running database push: ${prismaCmd}`);
      
      const { stdout, stderr } = await execPromise(prismaCmd, {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl
        }
      });
      console.log('[SetupWizard] Prisma DB push stdout:', stdout);
      if (stderr) console.error('[SetupWizard] Prisma DB push stderr:', stderr);

    } catch (migrationError: any) {
      console.error('[SetupWizard] Migration error:', migrationError);
      return NextResponse.json({ 
        warning: 'Configuration saved, but failed to automatically create tables. Please run "npx prisma db push" manually on the server.',
        error: migrationError.message
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Database configured and synchronized successfully!' });

  } catch (error: any) {
    console.error('[SetupWizard] Installation error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred during setup.' }, { status: 500 });
  }
}
