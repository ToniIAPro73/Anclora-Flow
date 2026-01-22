import { query as dbQuery } from "../database/config.js";

/**
 * JOB: Monitor de Vencimientos
 * Frecuencia recomendada: Ejecución diaria (ej. 08:00 AM)
 * Propósito: Detectar trials que expiran y suscripciones a renovar para enviar notificaciones.
 */

async function checkExpiringTrials() {
  console.log("🔍 [JOB] Iniciando verificación de trials expirando...");

  try {
    // 1. Consultar vista SQL para trials críticos (<= 2 días) o advertencia (<= 7 días)
    // Nota: La vista 'expiring_customer_trials' ya contiene la lógica de negocio de fechas
    const query = `
      SELECT * FROM expiring_customer_trials 
      WHERE urgency_level IN ('critical', 'warning')
      ORDER BY urgency_level DESC, trial_end_date ASC;
    `;

    const result = await dbQuery(query);
    const trials = result.rows;

    if (trials.length === 0) {
      console.log("✅ [JOB] No hay trials próximos a vencer hoy.");
    } else {
      console.log(`⚠️ [JOB] Se encontraron ${trials.length} trials en riesgo:`);

      for (const trial of trials) {
        const urgencyIcon = trial.urgency_level === "critical" ? "🔴" : "🟡";

        // Simulación de envío de email
        // En producción: await emailService.sendTrialExpirationWarning(trial.client_email, trial);
        console.log(
          `   ${urgencyIcon} [${trial.urgency_level.toUpperCase()}] Cliente: ${trial.client_name} | Plan: ${trial.plan_name}`,
        );
        console.log(
          `      -> Expira en: ${trial.days_until_trial_ends} días (${new Date(trial.trial_end_date).toLocaleDateString()})`,
        );
        console.log(`      -> Acción: Enviar email a ${trial.client_email}`);
      }
    }
  } catch (error) {
    console.error("❌ [JOB] Error verificando trials:", error);
  }
}

async function checkUpcomingInvoices() {
  console.log("\n🔍 [JOB] Iniciando verificación de próximas facturas...");

  try {
    // 2. Consultar facturación próxima (3 días antes para aviso)
    const query = `
      SELECT * FROM upcoming_invoicing 
      WHERE days_until_billing <= 3 AND days_until_billing >= 0
      ORDER BY days_until_billing ASC;
    `;

    const result = await dbQuery(query);
    const invoices = result.rows;

    if (invoices.length === 0) {
      console.log("✅ [JOB] No hay renovaciones inminentes (3 días).");
    } else {
      console.log(
        `💰 [JOB] Se encontraron ${invoices.length} renovaciones próximas:`,
      );

      for (const inv of invoices) {
        // Simulación de lógica de facturación
        console.log(
          `   📅 Cliente: ${inv.client_name} | Importe: ${inv.amount}€`,
        );
        console.log(
          `      -> Cargo programado para: ${new Date(inv.next_billing_date).toLocaleDateString()}`,
        );

        if (inv.auto_invoice) {
          console.log(`      -> [AUTO] Se generará factura automáticamente.`);
        } else {
          console.log(`      -> [MANUAL] Requiere intervención manual.`);
        }
      }
    }
  } catch (error) {
    console.error("❌ [JOB] Error verificando facturas:", error);
  }
}

async function run() {
  console.log("================================================");
  console.log("🚀 ANCLORA FLOW - SUBSCRIPTION MONITOR");
  console.log("================================================\n");

  await checkExpiringTrials();
  await checkUpcomingInvoices();

  console.log("\n================================================");
  console.log("🏁 Job finalizado.");

  // Cerrar conexión para que el script termine
  // (Dependiendo de la implementación de db client, puede requerir db.end() o similar)
  process.exit(0);
}

// Ejecutar si se llama directamente
run().catch((err) => {
  console.error("Error fatal en el job:", err);
  process.exit(1);
});
