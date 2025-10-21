import prisma from '../lib/prisma';

async function backfillOrgId(defaultOrgId: string) {
  const orgId = BigInt(defaultOrgId);

  await prisma.product.updateMany({
    where: { org_id: null },
    data: { org_id: orgId },
  });

  await prisma.warehouse.updateMany({
    where: { org_id: null },
    data: { org_id: orgId },
  });

  await prisma.order.updateMany({
    where: { org_id: null },
    data: { org_id: orgId },
  });

  console.log('✅ Backfill complete!');
}

backfillOrgId('1')
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
