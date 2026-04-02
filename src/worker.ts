import { PgBoss } from "pg-boss";

async function main() {
  const boss = new PgBoss(process.env.DATABASE_URL!);

  boss.on("error", (error) => console.error("pg-boss error:", error));

  await boss.start();
  console.log("pg-boss worker started");

  // Register job handlers here as automations are added in later phases
  // Example: await boss.work("create-work-order", async (job) => { ... });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("Shutting down pg-boss worker...");
    await boss.stop();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
