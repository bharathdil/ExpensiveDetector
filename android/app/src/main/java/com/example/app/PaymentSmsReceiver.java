package com.example.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;

public class PaymentSmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!PaymentSmsStore.isEnabled(context)) {
            return;
        }

        SmsMessage[] messages = Telephony.Sms.Intents.getMessagesFromIntent(intent);
        if (messages == null || messages.length == 0) {
            return;
        }

        StringBuilder bodyBuilder = new StringBuilder();
        String address = "";
        long date = System.currentTimeMillis();

        for (SmsMessage sms : messages) {
            if (sms == null) continue;
            if (address.isEmpty()) {
                address = sms.getDisplayOriginatingAddress();
            }
            if (sms.getTimestampMillis() > 0) {
                date = sms.getTimestampMillis();
            }
            bodyBuilder.append(sms.getMessageBody());
        }

        String body = bodyBuilder.toString();
        if (!PaymentSmsStore.looksLikePaymentMessage(body)) {
            return;
        }

        PaymentSmsStore.addPendingMessage(context, address, body, date);
        PaymentSmsStore.showPaymentNotification(context, address, body);
    }
}
