import type { RuntimeMode } from "@t3tools/contracts";
import { i18n, type MessageKey } from "@t3tools/shared/i18n";
import { type LucideIcon, LockIcon, LockOpenIcon, PenLineIcon, SparklesIcon } from "lucide-react";

/**
 * Label and description are getters so they resolve against the active locale
 * on every read. Freezing the English copy at module load would leave the mode
 * picker untranslated after a language switch.
 */
const RUNTIME_MODE_MESSAGE_KEYS: Record<
  RuntimeMode,
  { label: MessageKey; description: MessageKey }
> = {
  "approval-required": {
    label: "composer.mode.supervised",
    description: "composer.mode.approvalRequiredDescription",
  },
  "auto-accept-edits": {
    label: "composer.mode.autoAcceptEdits",
    description: "composer.mode.autoAcceptEditsDescription",
  },
  auto: {
    label: "composer.mode.auto",
    description: "composer.mode.autoDescription",
  },
  "full-access": {
    label: "composer.mode.fullAccess",
    description: "composer.mode.fullAccessDescription",
  },
};

const RUNTIME_MODE_ICONS: Record<RuntimeMode, LucideIcon> = {
  "approval-required": LockIcon,
  "auto-accept-edits": PenLineIcon,
  auto: SparklesIcon,
  "full-access": LockOpenIcon,
};

function runtimeModeEntry(mode: RuntimeMode) {
  return {
    get label(): string {
      return i18n.t(RUNTIME_MODE_MESSAGE_KEYS[mode].label);
    },
    get description(): string {
      return i18n.t(RUNTIME_MODE_MESSAGE_KEYS[mode].description);
    },
    icon: RUNTIME_MODE_ICONS[mode],
  };
}

export const runtimeModeConfig: Record<
  RuntimeMode,
  { label: string; description: string; icon: LucideIcon }
> = {
  "approval-required": runtimeModeEntry("approval-required"),
  "auto-accept-edits": runtimeModeEntry("auto-accept-edits"),
  auto: runtimeModeEntry("auto"),
  "full-access": runtimeModeEntry("full-access"),
};

export const runtimeModeOptions = Object.keys(runtimeModeConfig) as RuntimeMode[];
