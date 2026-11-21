// Robot Limpiador Automático (Inactividad de 7 días)
const purgeInactiveUsers = () => {
  console.log('[Cron Job] Ejecutando escaneo de seguridad: Buscando cuentas sin actividad en los últimos 7 días...');
  
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);

  // Simulación de consulta a base de datos:
  // DB.users.deleteMany({ lastLogin: { $lt: thresholdDate } });
  
  console.log('[Cron Job] Limpieza completada. Cuentas purgadas con éxito.');
};

module.exports = { purgeInactiveUsers };