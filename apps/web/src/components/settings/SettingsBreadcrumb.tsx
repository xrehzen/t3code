import {
  WorkspaceBreadcrumb,
  WorkspaceBreadcrumbItem,
  WorkspaceBreadcrumbSeparator,
} from "../WorkspaceBreadcrumb";
import type { MessageKey, Translate } from "@t3tools/shared/i18n";
import { useTranslate } from "../../hooks/useI18n";
import { SETTINGS_SECTION_LABEL_KEYS } from "./settingsSearch";

const SETTINGS_BREADCRUMB_LABEL_KEYS: Readonly<Record<string, MessageKey>> = {
  ...SETTINGS_SECTION_LABEL_KEYS,
  "/settings/diagnostics": "settings.nav.diagnostics",
  "/settings/open-source-licenses": "settings.nav.licenses",
};

function settingsBreadcrumbLabel(pathname: string, t: Translate): string | null {
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const key = SETTINGS_BREADCRUMB_LABEL_KEYS[normalizedPathname];
  return key ? t(key) : null;
}

/**
 * `Settings / Section`. The scope a change applies to lives at the top of the
 * page content, see `SettingsScopeSentence`.
 */
export function SettingsBreadcrumb({ pathname }: { pathname: string }) {
  const t = useTranslate();
  const sectionLabel = settingsBreadcrumbLabel(pathname, t);

  return (
    <WorkspaceBreadcrumb ariaLabel="Settings breadcrumb">
      {sectionLabel ? (
        <>
          <WorkspaceBreadcrumbItem>Settings</WorkspaceBreadcrumbItem>
          <WorkspaceBreadcrumbSeparator />
        </>
      ) : null}
      <WorkspaceBreadcrumbItem current className="truncate">
        {sectionLabel ?? "Settings"}
      </WorkspaceBreadcrumbItem>
    </WorkspaceBreadcrumb>
  );
}
