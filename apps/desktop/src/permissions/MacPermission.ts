import type { MessageKey } from "@t3tools/shared/i18n";
import { i18n } from "@t3tools/shared/i18n";

export const MAC_PERMISSION_SETTINGS_URLS = {
  "screen-recording":
    "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
  accessibility: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
  "full-disk-access":
    "x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_AllFiles",
};

export type MacPermission = keyof typeof MAC_PERMISSION_SETTINGS_URLS;

const MAC_PERMISSION_TITLE_KEYS = {
  "screen-recording": "desktop.macPermission.screenRecording",
  accessibility: "desktop.macPermission.accessibility",
  "full-disk-access": "desktop.macPermission.fullDiskAccess",
} as const satisfies Record<MacPermission, MessageKey>;

/** Read per call: the catalog locale is not known when this module first loads. */
export function macPermissionTitle(permission: MacPermission): string {
  return i18n.t(MAC_PERMISSION_TITLE_KEYS[permission]);
}
