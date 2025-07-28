
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // Redirect to the first available settings page
  redirect('/dashboard/settings/employees');
}
