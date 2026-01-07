import { db } from './index';
import { users } from './schema/users';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seed() {
  const silent = process.argv.includes('--silent');

  if (!silent) {
    console.log('🌱 Checking admin user...');
  }

  const rootEmail = process.env.ROOT_USER_EMAIL;
  const rootPassword = process.env.ROOT_USER_PASSWORD;
  const rootName = process.env.ROOT_USER_NAME;

  if (!rootEmail || !rootPassword || !rootName) {
    if (!silent) {
      console.error('❌ Missing ROOT_USER environment variables!');
      console.error('Please set ROOT_USER_EMAIL, ROOT_USER_PASSWORD, and ROOT_USER_NAME in .env.local');
    }
    process.exit(1);
  }

  try {
    // Check if ANY admin exists (Option 2)
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.role, 'admin'),
    });

    if (existingAdmin) {
      // Admin already exists - don't create another one
      if (!silent) {
        console.log(`✅ Admin user already exists: ${existingAdmin.email}`);
      }
      process.exit(0);
    }

    // No admin found - check if database is empty (Option 4)
    const allUsers = await db.query.users.findMany();

    if (allUsers.length === 0) {
      // Database is empty - safe to create root admin
      if (!silent) {
        console.log('📊 Database is empty, creating root admin...');
      }
    } else {
      // Database has users but no admin - create root admin
      if (!silent) {
        console.log('⚠️  No admin found, creating root admin...');
      }
    }

    // Create root admin from ENV
    const passwordHash = await bcrypt.hash(rootPassword, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email: rootEmail,
        passwordHash,
        name: rootName,
        role: 'admin',
      })
      .returning();

    console.log('✅ Root admin created!');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Role: ${newUser.role}`);

    process.exit(0);
  } catch (error) {
    if (!silent) {
      console.error('❌ Seed error:', error);
    }
    process.exit(1);
  }
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
