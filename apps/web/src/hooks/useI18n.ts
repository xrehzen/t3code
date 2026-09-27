import { useSyncExternalStore } from "react";
import { i18n, type SupportedLocale, type Translate } from "@t3tools/shared/i18n";

/**
 * Subscribes the component to the active locale and returns the resolver.
 *
 * `useSyncExternalStore` rather than a `useState` counter: the locale lives in a
 * module singleton outside React, and this is the hook React provides for
 * exactly that. It also avoids the render that a subscription registered in an
 * effect would miss.
 */
export function useI18n() {
  useSyncExternalStore(
    i18n.subscribe,
    () => i18n.locale,
    () => i18n.locale,
  );

  return i18n;
}

/** `t` bound to the current locale, for components that only need to translate. */
export function useTranslate(): Translate {
  return useI18n().t;
}

/** Reads the active locale without subscribing to future changes. */
export function useActiveLocale(): SupportedLocale {
  return i18n.locale;
}
