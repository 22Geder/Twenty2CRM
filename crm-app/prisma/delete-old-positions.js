const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Starting cleanup of old positions...')

  // Find the Logistiker employer
  const logistikerEmployer = await prisma.employer.findFirst({
    where: { name: 'לוגיסטקר' }
  })

  if (!logistikerEmployer) {
    console.log('❌ Logistiker employer not found')
    return
  }

  console.log(`✅ Found Logistiker employer: ${logistikerEmployer.id}`)

  // Find positions that are NOT from Logistiker
  const oldPositions = await prisma.position.findMany({
    where: {
      employerId: {
        not: logistikerEmployer.id
      }
    },
    select: { id: true }
  })

  const oldPositionIds = oldPositions.map(p => p.id)
  console.log(`📋 Found ${oldPositionIds.length} old positions to delete`)

  if (oldPositionIds.length > 0) {
    // Delete related records first
    const deletedInterviews = await prisma.interview.deleteMany({
      where: { positionId: { in: oldPositionIds } }
    })
    console.log(`✅ Deleted ${deletedInterviews.count} related interviews`)

    const deletedApplications = await prisma.application.deleteMany({
      where: { positionId: { in: oldPositionIds } }
    })
    console.log(`✅ Deleted ${deletedApplications.count} related applications`)

    // Now delete the positions
    const deleteResult = await prisma.position.deleteMany({
      where: {
        id: { in: oldPositionIds }
      }
    })
    console.log(`✅ Deleted ${deleteResult.count} old positions`)
  }

  // Delete all employers that are NOT Logistiker
  const deleteEmployers = await prisma.employer.deleteMany({
    where: {
      id: {
        not: logistikerEmployer.id
      }
    }
  })

  console.log(`✅ Deleted ${deleteEmployers.count} old employers`)

  // Show remaining positions
  const remainingPositions = await prisma.position.count()
  console.log(`\n📊 Total positions remaining: ${remainingPositions}`)

  const positions = await prisma.position.findMany({
    select: {
      title: true,
      location: true
    }
  })

  console.log('\n📋 Current positions:')
  positions.forEach((pos, idx) => {
    console.log(`${idx + 1}. ${pos.title} - ${pos.location}`)
  })

  console.log('\n🎉 Cleanup completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
