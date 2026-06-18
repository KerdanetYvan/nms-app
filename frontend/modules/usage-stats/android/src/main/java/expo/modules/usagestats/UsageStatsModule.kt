package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.usagestats.MonitoringService
import java.util.Calendar

class UsageStatsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("UsageStats")

    Function("checkPermission") {
      val context = appContext.reactContext ?: return@Function false
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          android.os.Process.myUid(),
          context.packageName
        )
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          android.os.Process.myUid(),
          context.packageName
        )
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("openPermissionSettings") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      }
    }

    AsyncFunction("getAppUsage") { packageName: String, startTime: Long, endTime: Long ->
      val context = appContext.reactContext ?: return@AsyncFunction 0L
      val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
      stats?.filter { it.packageName == packageName }
        ?.sumOf { it.totalTimeInForeground } ?: 0L
    }

    AsyncFunction("getAppsUsage") { packageNames: List<String>, startTime: Long, endTime: Long ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyMap<String, Long>()
      val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
      packageNames.associateWith { name ->
        stats?.filter { it.packageName == name }?.sumOf { it.totalTimeInForeground } ?: 0L
      }
    }

    AsyncFunction("getAllAppsUsage") { startTime: Long, endTime: Long ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any>>()
      val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
      stats?.filter { it.totalTimeInForeground > 0 }
        ?.map { mapOf("packageName" to it.packageName, "totalTime" to it.totalTimeInForeground) }
        ?: emptyList()
    }

    Function("startMonitoring") { packageNames: List<String>, labelNames: List<String>, intervalSeconds: Int, isDev: Boolean, targetDailyMinutes: Int ->
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(context, MonitoringService::class.java).apply {
        putStringArrayListExtra("packageNames", ArrayList(packageNames))
        putStringArrayListExtra("labelNames", ArrayList(labelNames))
        putExtra("intervalMs", intervalSeconds * 1_000L)
        putExtra("isDev", isDev)
        putExtra("targetDailyMs", targetDailyMinutes * 60_000L)
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
      null
    }

    Function("stopMonitoring") {
      val context = appContext.reactContext ?: return@Function null
      context.stopService(Intent(context, MonitoringService::class.java))
      null
    }

    Function("isBatteryOptimizationIgnored") {
      val context = appContext.reactContext ?: return@Function false
      val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    Function("requestIgnoreBatteryOptimization") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
        data = Uri.parse("package:${context.packageName}")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
      null
    }

    // Returns package names that had an ACTIVITY_RESUMED event in [startTime, endTime].
    // Uses queryEvents for millisecond-precision detection, unlike queryUsageStats which aggregates by day.
    AsyncFunction("getForegroundApps") { startTime: Long, endTime: Long ->
      val context = appContext.reactContext ?: return@AsyncFunction emptyList<String>()
      val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
      val usageEvents = manager.queryEvents(startTime, endTime)
      val packages = mutableSetOf<String>()
      val event = android.app.usage.UsageEvents.Event()
      while (usageEvents.hasNextEvent()) {
        usageEvents.getNextEvent(event)
        if (event.eventType == android.app.usage.UsageEvents.Event.ACTIVITY_RESUMED) {
          packages.add(event.packageName)
        }
      }
      packages.toList()
    }

    AsyncFunction("getDailyUsage") { packageNames: List<String>, startTime: Long, endTime: Long ->
      getDailyUsageData(packageNames, startTime, endTime)
    }
  }

  private fun truncateToMidnight(timeMs: Long): Long {
    val cal = Calendar.getInstance()
    cal.timeInMillis = timeMs
    cal.set(Calendar.HOUR_OF_DAY, 0)
    cal.set(Calendar.MINUTE, 0)
    cal.set(Calendar.SECOND, 0)
    cal.set(Calendar.MILLISECOND, 0)
    return cal.timeInMillis
  }

  private fun getDailyUsageData(packageNames: List<String>, startTime: Long, endTime: Long): List<Map<String, Any>> {
    val context = appContext.reactContext ?: return emptyList()
    val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)

    val dailyTotals = mutableMapOf<Long, Long>()
    stats?.forEach { stat ->
      if (packageNames.contains(stat.packageName) && stat.totalTimeInForeground > 0) {
        val dayKey = truncateToMidnight(stat.firstTimeStamp)
        dailyTotals[dayKey] = (dailyTotals[dayKey] ?: 0L) + stat.totalTimeInForeground
      }
    }

    return dailyTotals.entries
      .sortedBy { it.key }
      .map { mapOf("dateMs" to it.key, "totalMs" to it.value) }
  }
}
