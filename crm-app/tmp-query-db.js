const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
;(async () => {
  const pos = await p.position.findFirst({ select: { id: true, title: true } })
  const users = await p.user.findMany({ select: { email: true }, take: 5 })
  console.log(JSON.stringify({ pos, users }, null, 2))
  await p.$disconnect()
})().catch(e => { console.error(e.message); process.exit(1) })
