import type { InterfaceLanguage } from "@t3tools/contracts/settings";
import { i18n, resolveInterfaceLanguage } from "@t3tools/shared/i18n";

/**
 * Resolves the interface language for the main process and applies it to the
 * catalog.
 *
 * The catalog is a module singleton, so the renderer and the main process each
 * hold their own. The renderer resolves its own from the client setting, which
 * means without this the native application menu, the update dialogs and the
 * SnapShot messages would stay English in a Turkish session even though the
 * window next to them is Turkish.
 *
 * `systemLocale` is a parameter rather than something read here: the main
 * process already has `ElectronApp.systemLocale`, and reaching for Electron
 * directly would make this untestable.
 */
export function applyInterfaceLanguage(
  interfaceLanguage: InterfaceLanguage,
  systemLocale: string | null | undefined,
): void {
  i18n.setLocale(resolveInterfaceLanguage(interfaceLanguage, systemLocale));
}
