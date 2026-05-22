package com.example.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class PaymentSmsStore {
    public static final String CHANNEL_ID = "payment_alerts";

    private static final String PREFS_NAME = "flowspend_payment_alerts";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_PENDING_MESSAGES = "pending_messages";

    private static final String[] PAYMENT_KEYWORDS = new String[] {
        "debited", "debit", "credited", "credit", "paid", "spent", "purchase",
        "withdrawn", "transferred", "received", "deposited", "upi", "imps",
        "neft", "rtgs", "atm", "pos", "txn", "transaction", "a/c", "account"
    };

    private PaymentSmsStore() {}

    public static boolean isEnabled(Context context) {
        return prefs(context).getBoolean(KEY_ENABLED, false);
    }

    public static void setEnabled(Context context, boolean enabled) {
        prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
        if (enabled) {
            createNotificationChannel(context);
        }
    }

    public static boolean looksLikePaymentMessage(String body) {
        if (body == null) return false;

        String lower = body.toLowerCase();
        boolean hasKeyword = false;
        for (String keyword : PAYMENT_KEYWORDS) {
            if (lower.contains(keyword)) {
                hasKeyword = true;
                break;
            }
        }

        return hasKeyword && lower.matches("(?s).*(inr|rs\\.?|₹|\\u20b9|usd|eur|\\$|€)\\s*[0-9].*|(?s).*\\d[\\d,]*(\\.\\d{1,2})?\\s*(inr|rs\\.?|₹|\\u20b9|usd|eur|\\$|€).*");
    }

    public static void addPendingMessage(Context context, String address, String body, long date) {
        try {
            JSONArray messages = getPendingJson(context);
            JSONObject message = new JSONObject();
            message.put("id", "incoming-" + date + "-" + Math.abs(body.hashCode()));
            message.put("address", address == null ? "" : address);
            message.put("body", body == null ? "" : body);
            message.put("date", date);
            messages.put(message);

            prefs(context).edit().putString(KEY_PENDING_MESSAGES, messages.toString()).apply();
        } catch (JSONException ignored) {
            // Ignore malformed local cache writes. The SMS itself remains in the device inbox.
        }
    }

    public static JSONArray getPendingJson(Context context) {
        String raw = prefs(context).getString(KEY_PENDING_MESSAGES, "[]");
        try {
            return new JSONArray(raw);
        } catch (JSONException error) {
            return new JSONArray();
        }
    }

    public static void clearPending(Context context) {
        prefs(context).edit().putString(KEY_PENDING_MESSAGES, "[]").apply();
    }

    public static void showPaymentNotification(Context context, String address, String body) {
        createNotificationChannel(context);

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        intent.putExtra("openPaymentReview", true);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, 1001, intent, flags);
        String title = "Payment message detected";
        String content = address == null || address.isEmpty()
            ? "Review this transaction before adding it."
            : "From " + address + " - review before adding.";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(content)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent);

        try {
            NotificationManagerCompat.from(context).notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), builder.build());
        } catch (SecurityException ignored) {
            // Notification permission can be revoked after enabling alerts.
        }
    }

    private static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Payment alerts",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Alerts when incoming SMS messages look like payments.");

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.createNotificationChannel(channel);
        }
    }

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }
}
