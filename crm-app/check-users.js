const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany();
  console.log('=== USERS IN DATABASE ===');
  if (users.length === 0) {
    console.log('NO USERS FOUND!');
  } else {
    users.forEach(u => console.log('Email:', u.email, '| Name:', u.name));
  }
  await p.$disconnect();
}

main();
