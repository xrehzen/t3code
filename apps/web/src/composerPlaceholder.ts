import type { MessageKey } from "@t3tools/shared/i18n";

/**
 * Composer copy lives in the shared catalog, so this module exports the key
 * rather than the string: resolving it at module load would freeze the locale
 * at import time and the language setting would need a reload to take effect.
 */
export const DISCONNECTED_COMPOSER_PLACEHOLDER_KEY =
  "composer.placeholder.disconnected" satisfies MessageKey;
