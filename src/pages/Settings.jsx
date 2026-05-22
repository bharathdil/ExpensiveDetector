import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/localStorageClient';
import { useTheme } from '@/lib/ThemeProvider';
import { LogOut, Trash2, Moon, Sun, ChevronRight, Shield, Bell, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { getPaymentAlertsStatus, setPaymentAlertsEnabled } from '@/lib/smsReader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PageHeader from '@/components/layout/PageHeader';

function SettingRow({ icon: Icon, label, description, onClick, rightSlot, destructive }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left select-none transition-colors active:bg-muted/80 ${destructive ? 'text-destructive' : 'text-foreground'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${destructive ? 'bg-destructive/10' : 'bg-muted'}`}>
        <Icon className={`w-4.5 h-4.5 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {rightSlot ?? <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </button>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  useEffect(() => {
    getPaymentAlertsStatus()
      .then((status) => setNotificationsEnabled(Boolean(status.enabled)))
      .catch(() => setNotificationsEnabled(false));
  }, []);

  const toggleNotifications = async () => {
    const nextEnabled = !notificationsEnabled;
    setNotificationsLoading(true);

    try {
      const status = await setPaymentAlertsEnabled(nextEnabled);
      setNotificationsEnabled(Boolean(status.enabled));

      if (status.unavailableReason) {
        toast({
          title: 'Notifications unavailable',
          description: status.unavailableReason,
          variant: 'destructive',
        });
      }
    } catch (error) {
      setNotificationsEnabled(false);
      toast({
        title: 'Could not enable notifications',
        description: error?.message || 'Please allow SMS and notification permissions.',
        variant: 'destructive',
      });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleLogout = async () => {
    await db.auth.logout('/');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Clear all expense data
      const expenses = await db.entities.Expense.list('', 1000);
      await Promise.all(expenses.map(e => db.entities.Expense.delete(e.id)));
      queryClient.clear();
      await db.auth.logout('/');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="mobile-page">
      <PageHeader title="Settings" />

      <div className="px-4 pt-4 space-y-4">
        {/* Appearance */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Appearance</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <SettingRow
              icon={theme === 'dark' ? Moon : Sun}
              label="Dark Mode"
              description={theme === 'dark' ? 'Dark theme is on' : 'Using light theme'}
              onClick={toggleTheme}
              rightSlot={
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  className="pointer-events-none"
                />
              }
            />
          </div>
        </div>

        {/* Preferences */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Preferences</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
            <SettingRow
              icon={Bell}
              label="Notifications"
              description={notificationsEnabled ? 'Payment SMS alerts are on' : 'Notify when payment SMS arrives'}
              onClick={toggleNotifications}
              rightSlot={
                <Switch
                  checked={notificationsEnabled}
                  disabled={notificationsLoading}
                  onCheckedChange={toggleNotifications}
                  className="pointer-events-none"
                />
              }
            />
            <SettingRow
              icon={Shield}
              label="Privacy"
              description="Data is stored privately on your account"
              rightSlot={<span className="text-xs text-green-600 font-semibold">Protected</span>}
            />
            <SettingRow
              icon={Info}
              label="About SmartSpend"
              description="Version 1.0.0"
              rightSlot={<span className="text-xs text-muted-foreground">v1.0.0</span>}
            />
          </div>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Account</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border/50">
            <SettingRow
              icon={LogOut}
              label="Log Out"
              description="Sign out of your account"
              onClick={handleLogout}
            />
            <SettingRow
              icon={Trash2}
              label="Delete Account"
              description="Permanently delete all your data"
              onClick={() => setDeleteOpen(true)}
              destructive
            />
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-3xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your transactions and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded-xl bg-destructive text-destructive-foreground"
            >
              {deleting ? 'Deleting...' : 'Delete Everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
