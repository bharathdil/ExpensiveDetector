package com.example.app;

import android.Manifest;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_SMS }, alias = "sms"),
        @Permission(strings = { Manifest.permission.RECEIVE_SMS }, alias = "smsReceive"),
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
    }
)
public class SmsReaderPlugin extends Plugin {
    private static final int DEFAULT_LIMIT = 80;
    private static final int MAX_LIMIT = 300;

    @PluginMethod
    public void readRecentMessages(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }

        loadMessages(call);
    }

    @PluginMethod
    public void setPaymentAlertsEnabled(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);

        if (!enabled) {
            PaymentSmsStore.setEnabled(getContext(), false);
            resolveStatus(call);
            return;
        }

        if (getPermissionState("smsReceive") != PermissionState.GRANTED) {
            requestPermissionForAlias("smsReceive", call, "paymentAlertsPermissionCallback");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "paymentAlertsPermissionCallback");
            return;
        }

        PaymentSmsStore.setEnabled(getContext(), true);
        resolveStatus(call);
    }

    @PluginMethod
    public void getPaymentAlertsStatus(PluginCall call) {
        resolveStatus(call);
    }

    @PluginMethod
    public void getPendingPaymentMessages(PluginCall call) {
        JSObject result = new JSObject();
        result.put("messages", PaymentSmsStore.getPendingJson(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void clearPendingPaymentMessages(PluginCall call) {
        PaymentSmsStore.clearPending(getContext());
        call.resolve();
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            loadMessages(call);
            return;
        }

        call.reject("SMS permission was denied.");
    }

    @PermissionCallback
    private void paymentAlertsPermissionCallback(PluginCall call) {
        if (getPermissionState("smsReceive") != PermissionState.GRANTED) {
            PaymentSmsStore.setEnabled(getContext(), false);
            call.reject("SMS receive permission is required for payment alerts.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            getPermissionState("notifications") != PermissionState.GRANTED) {
            PaymentSmsStore.setEnabled(getContext(), false);
            call.reject("Notification permission is required for payment alerts.");
            return;
        }

        PaymentSmsStore.setEnabled(getContext(), true);
        resolveStatus(call);
    }

    private void loadMessages(PluginCall call) {
        int limit = Math.min(Math.max(call.getInt("limit", DEFAULT_LIMIT), 1), MAX_LIMIT);
        JSArray messages = new JSArray();

        Uri inboxUri = Uri.parse("content://sms/inbox");
        String[] projection = new String[] { "_id", "address", "body", "date" };

        try (Cursor cursor = getContext().getContentResolver().query(
            inboxUri,
            projection,
            null,
            null,
            "date DESC"
        )) {
            if (cursor == null) {
                call.reject("Could not read SMS inbox.");
                return;
            }

            int idIndex = cursor.getColumnIndex("_id");
            int addressIndex = cursor.getColumnIndex("address");
            int bodyIndex = cursor.getColumnIndex("body");
            int dateIndex = cursor.getColumnIndex("date");

            int count = 0;
            while (cursor.moveToNext() && count < limit) {
                JSObject item = new JSObject();
                item.put("id", idIndex >= 0 ? cursor.getString(idIndex) : String.valueOf(count));
                item.put("address", addressIndex >= 0 ? cursor.getString(addressIndex) : "");
                item.put("body", bodyIndex >= 0 ? cursor.getString(bodyIndex) : "");
                item.put("date", dateIndex >= 0 ? cursor.getLong(dateIndex) : 0L);
                messages.put(item);
                count++;
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            call.resolve(result);
        } catch (SecurityException error) {
            call.reject("SMS permission is required to scan bank messages.", error);
        } catch (Exception error) {
            call.reject("Could not scan SMS messages.", error);
        }
    }

    private void resolveStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", PaymentSmsStore.isEnabled(getContext()));
        result.put("smsReceivePermission", getPermissionState("smsReceive").toString());
        result.put("notificationPermission", getPermissionState("notifications").toString());
        call.resolve(result);
    }
}
