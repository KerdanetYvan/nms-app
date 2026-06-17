package expo.modules.usagestats

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper

class MonitoringService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private var packageNames: List<String> = emptyList()
    private var packageToLabel: Map<String, String> = emptyMap()
    private var intervalMs: Long = 5_000L
    private val lastAlerted = mutableMapOf<String, Long>()
    private val cooldownMs = 60_000L

    private val poller = object : Runnable {
        override fun run() {
            checkForegroundApps()
            handler.postDelayed(this, intervalMs)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            val pkgs = intent.getStringArrayListExtra("packageNames") ?: arrayListOf()
            val labels = intent.getStringArrayListExtra("labelNames") ?: arrayListOf()
            packageNames = pkgs
            packageToLabel = pkgs.zip(labels).toMap()
            intervalMs = intent.getLongExtra("intervalMs", 5_000L)
        }

        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createChannel(nm, FG_CHANNEL_ID, "Surveillance active", NotificationManager.IMPORTANCE_LOW)

        val fgNotif = buildNotification(FG_CHANNEL_ID, "Doo surveille", "Surveillance des apps en cours…")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(FG_NOTIF_ID, fgNotif, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(FG_NOTIF_ID, fgNotif)
        }

        handler.removeCallbacks(poller)
        handler.post(poller)

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(poller)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun checkForegroundApps() {
        if (packageNames.isEmpty()) return
        val manager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        // Query a window slightly larger than the interval to avoid missing edge events.
        val startTime = endTime - intervalMs - 2_000L

        val events = manager.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        val detected = mutableSetOf<String>()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED &&
                packageNames.contains(event.packageName)
            ) {
                detected.add(event.packageName)
            }
        }

        val now = System.currentTimeMillis()
        for (pkg in detected) {
            if ((now - (lastAlerted[pkg] ?: 0L)) < cooldownMs) continue
            lastAlerted[pkg] = now
            sendAlert(packageToLabel[pkg] ?: pkg)
        }
    }

    private fun sendAlert(appLabel: String) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        createChannel(nm, ALERT_CHANNEL_ID, "Alertes surveillance", NotificationManager.IMPORTANCE_HIGH)
        val notif = buildNotification(ALERT_CHANNEL_ID, "Doo surveille", "$appLabel est ouvert — on garde un œil")
        nm.notify(ALERT_NOTIF_ID, notif)
    }

    private fun buildNotification(channelId: String, title: String, text: String): Notification {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentTitle(title)
                .setContentText(text)
                .setAutoCancel(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setSmallIcon(android.R.drawable.ic_menu_compass)
                .setContentTitle(title)
                .setContentText(text)
                .setAutoCancel(true)
                .build()
        }
    }

    private fun createChannel(nm: NotificationManager, id: String, name: String, importance: Int) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (nm.getNotificationChannel(id) == null) {
                nm.createNotificationChannel(NotificationChannel(id, name, importance))
            }
        }
    }

    companion object {
        const val FG_NOTIF_ID = 1001
        const val ALERT_NOTIF_ID = 1002
        const val FG_CHANNEL_ID = "doo-monitoring-fg"
        const val ALERT_CHANNEL_ID = "doo-monitoring-alert"
    }
}
