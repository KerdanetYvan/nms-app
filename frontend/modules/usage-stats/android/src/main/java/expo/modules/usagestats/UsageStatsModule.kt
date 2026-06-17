package expo.modules.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
  }
}
