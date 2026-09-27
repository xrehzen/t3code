import type { InterfaceLanguage } from "@t3tools/contracts/settings";
import { i18n, resolveLocale, type SupportedLocale } from "@t3tools/shared/i18n";

/**
 * Resolves the interface language for the main process.
 *
 * `systemLocale` is a parameter rather than something read here: the main
 * process already has `ElectronApp.systemLocale`, and reaching for Electron
 * directly would make this untestable.
 */
export function resolveInterfaceLanguage(
  interfaceLanguage: InterfaceLanguage,
  systemLocale: string | null | undefined,
): SupportedLocale {
  return interfaceLanguage === "system" ? resolveLocale(systemLocale) : interfaceLanguage;
}

/**
 * Resolves the interface language and applies it to the catalog.
 *
 * The catalog is a module singleton, so the renderer and the main process each
 * hold their own. The renderer resolves its own from the client setting, which
 * means without this the native application menu, the update dialogs and the
 * SnapShot messages would stay English in a Turkish session even though the
 * window next to them is Turkish.
 */
export function applyInterfaceLanguage(
  interfaceLanguage: InterfaceLanguage,
  systemLocale: string | null | undefined,
): SupportedLocale {
  const resolved = resolveInterfaceLanguage(interfaceLanguage, systemLocale);
  i18n.setLocale(resolved);
  return resolved;
}
