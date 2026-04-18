import { SettingsScreen } from "@/features/settings/settings-screen";
import { getSettings } from "@/lib/api/settings";

export default async function SettingsPage() {
  const settings = await getSettings();

  return <SettingsScreen settings={settings} />;
}
