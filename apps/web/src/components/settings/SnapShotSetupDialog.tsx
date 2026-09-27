import { PermissionChecklist, PermissionContinueButton } from "../permissions/PermissionChecklist";
import { usePermissionStatus } from "../permissions/usePermissionStatus";
import {
  isModifierPairShortcut,
  type DesktopSnapShotSetupAction,
  type DesktopSnapShotState,
} from "@t3tools/contracts";
import { type MessageKey, i18n, type Translate } from "@t3tools/shared/i18n";
import { useState, type ReactNode } from "react";
import { MacAccessibilityIcon, MacScreenRecordingIcon } from "../Icons";
import { CaptureShortcutConfig } from "./CaptureShortcutConfig";
import { Button } from "../ui/button";
import { Dialog, DialogDescription } from "../ui/dialog";
import { WizardSteps, WizardPopup, WizardHeader, WizardPanel, WizardFooter } from "../ui/wizard";
import {
  captureSetupAccessReady,
  captureSetupBackend,
  captureSetupCheckMessage,
  captureSetupDesktopName,
  captureSetupInitialStep,
  captureSetupShortcutReady,
  type CaptureSetupStep,
} from "./SnapShotSetupDialog.logic";

// This dialog is exercised as a plain function (no renderer), so it reads the
// process-wide resolver instead of subscribing with `useTranslate`.
const t: Translate = i18n.t;

const SETUP_STEPS: ReadonlyArray<{ id: CaptureSetupStep; labelKey: MessageKey }> = [
  { id: "access", labelKey: "settings.snapshotSetup.step.access" },
  { id: "shortcut", labelKey: "settings.snapshotSetup.step.shortcut" },
];

type AccessCopy = Readonly<{ title: string; description: string }>;

const GNOME_ACCESS_COPY: Readonly<Record<string, AccessCopy>> = {
  "not-installed": {
    title: t("settings.snapshotSetup.gnome.notInstalled.title"),
    description: t("settings.snapshotSetup.gnome.notInstalled.description"),
  },
  "restart-required": {
    title: t("settings.snapshotSetup.gnome.restartRequired.title"),
    description: t("settings.snapshotSetup.gnome.restartRequired.description"),
  },
  "update-required": {
    title: t("settings.snapshotSetup.gnome.updateRequired.title"),
    description: t("settings.snapshotSetup.gnome.updateRequired.description"),
  },
  "extensions-disabled": {
    title: t("settings.snapshotSetup.gnome.extensionsDisabled.title"),
    description: t("settings.snapshotSetup.gnome.extensionsDisabled.description"),
  },
  disabled: {
    title: t("settings.snapshotSetup.gnome.disabled.title"),
    description: t("settings.snapshotSetup.gnome.disabled.description"),
  },
  enabled: {
    title: t("settings.snapshotSetup.gnome.enabled.title"),
    description: t("settings.snapshotSetup.gnome.enabled.description"),
  },
  unsupported: {
    title: t("settings.snapshotSetup.gnome.unsupported.title"),
    description: t("settings.snapshotSetup.gnome.unsupported.description"),
  },
  error: {
    title: t("settings.snapshotSetup.gnome.error.title"),
    description: t("settings.snapshotSetup.gnome.error.description"),
  },
};

const READY_COPY: AccessCopy = {
  title: t("settings.snapshotSetup.helper.ready.title"),
  description: t("settings.snapshotSetup.helper.ready.description"),
};

export function SnapShotSetupDialog({
  state,
  initialStep,
  wasEnabled,
  includeAccessibility,
  busy: actionBusy,
  error,
  shortcutInput,
  shortcutStatus,
  shortcutChanged,
  canSaveShortcut,
  onSaveShortcut,
  onEnable,
  onAction,
  onRefresh,
  onClose,
  onLeaveStep,
}: {
  state: DesktopSnapShotState;
  initialStep: CaptureSetupStep;
  wasEnabled: boolean;
  includeAccessibility: boolean;
  busy: boolean;
  error: string | null;
  shortcutInput: ReactNode;
  shortcutStatus: string | null | undefined;
  shortcutChanged: boolean;
  canSaveShortcut: boolean;
  onSaveShortcut: () => Promise<boolean>;
  onEnable: () => Promise<boolean>;
  onAction: (action: DesktopSnapShotSetupAction) => Promise<void>;
  onRefresh: () => Promise<DesktopSnapShotState | undefined>;
  onClose: (completed: boolean) => Promise<void>;
  onLeaveStep: () => void;
}) {
  const [step, setStep] = useState(() => captureSetupInitialStep(state, initialStep));
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [configBusy, setConfigBusy] = useState(false);
  const busy = actionBusy || checking || configBusy;
  const backend = captureSetupBackend(state);
  const configShortcut = backend === "niri" || backend === "hyprland";
  const desktop = captureSetupDesktopName(state);
  const extension = state.gnomeExtension;
  const helper = backend === "hyprland" ? state.hyprlandHelper : state.kdeHelper;
  const helperBackend = backend === "kde" || backend === "hyprland";
  const installHelper = backend === "hyprland" ? "install-hyprland-helper" : "install-kde-helper";
  const removeHelper = backend === "hyprland" ? "remove-hyprland-helper" : "remove-kde-helper";
  const accessReady = captureSetupAccessReady(state);
  const permissionStatus = usePermissionStatus(
    async () => {
      const refreshed = await onRefresh();
      if (!refreshed?.macPermissions) throw new Error("Permission status unavailable");
      return refreshed.macPermissions;
    },
    state.macPermissions ?? { screenRecording: false, accessibility: false },
    Boolean(state.macPermissions) && step === "access" && !busy,
  );
  const macPermissions = state.macPermissions ? permissionStatus.status : undefined;
  const macPermissionsReady =
    !macPermissions ||
    permissionStatus.isReady(
      includeAccessibility ? ["screenRecording", "accessibility"] : ["screenRecording"],
    );
  const shortcutReady = captureSetupShortcutReady(state, shortcutChanged);
  const install = extension?.status === "not-installed" || extension?.status === "update-required";
  const enable = extension?.status === "disabled";
  const changeStep = (next: CaptureSetupStep) => {
    onLeaveStep();
    setChecked(false);
    setStep(next);
  };
  const checkAgain = async () => {
    if (busy) return;
    setChecking(true);
    setChecked(false);
    try {
      setChecked((await onRefresh()) !== undefined);
    } finally {
      setChecking(false);
    }
  };
  const accessCopy =
    state.message && !macPermissions
      ? {
          title: t("settings.snapshotSetup.stateCheckFailed.title"),
          description: t("settings.snapshotSetup.stateCheckFailed.description"),
        }
      : backend === "gnome" && extension
        ? extension.status === "enabled" && !accessReady
          ? {
              title: t("settings.snapshotSetup.extensionNotReady.title"),
              description: t("settings.snapshotSetup.extensionNotReady.description"),
            }
          : (GNOME_ACCESS_COPY[extension.status] ?? READY_COPY)
        : helperBackend
          ? helper?.status === "ready"
            ? READY_COPY
            : helper?.status === "error"
              ? {
                  title: t("settings.snapshotSetup.helper.error.title"),
                  description: t("settings.snapshotSetup.helper.error.description"),
                }
              : {
                  title: t(
                    helper?.status === "update-required"
                      ? "settings.snapshotSetup.helper.updateRequired.title"
                      : "settings.snapshotSetup.helper.allow.title",
                  ),
                  description: t("settings.snapshotSetup.helper.description"),
                }
          : backend === "niri"
            ? READY_COPY
            : backend === "picker"
              ? {
                  title: t("settings.snapshotSetup.picker.title"),
                  description: t("settings.snapshotSetup.picker.description"),
                }
              : {
                  title: t("settings.snapshotSetup.allow.title"),
                  description: t(
                    backend === "portal"
                      ? "settings.snapshotSetup.allow.portalDescription"
                      : macPermissions
                        ? macPermissionsReady
                          ? "settings.snapshotSetup.allow.macTestDescription"
                          : "settings.snapshotSetup.allow.macEachDescription"
                        : "settings.snapshotSetup.allow.macPromptDescription",
                  ),
                };
  const title = step === "access" ? accessCopy.title : t("settings.snapshotSetup.title.shortcut");
  const description =
    step === "access"
      ? accessCopy.description
      : configShortcut
        ? t("settings.snapshotSetup.description.configShortcut")
        : state.mode === "portal"
          ? t("settings.snapshotSetup.description.portal")
          : t("settings.snapshotSetup.description.modifierPair");
  const stepIndex = SETUP_STEPS.findIndex(({ id }) => id === step);
  const details = [
    ...new Set(
      [
        error,
        ...(step === "access"
          ? [
              state.message,
              backend === "gnome" &&
              (extension?.status === "error" || extension?.status === "unsupported")
                ? extension.message
                : null,
              helperBackend && helper?.status === "error" ? helper.message : null,
            ]
          : []),
      ].filter((detail) => detail !== null),
    ),
  ];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) void onClose(false);
      }}
    >
      <WizardPopup showCloseButton={!busy}>
        <WizardHeader
          title={t(
            desktop
              ? "settings.snapshotSetup.wizardTitle.desktop"
              : "settings.snapshotSetup.wizardTitle.generic",
            desktop ? { desktop } : undefined,
          )}
        >
          <WizardSteps
            steps={SETUP_STEPS.map((item) => t(item.labelKey))}
            currentStep={stepIndex}
            isStepDisabled={(index) => busy || index > stepIndex}
            onStepChange={(index) => {
              const next = SETUP_STEPS[index];
              if (next && next.id !== step) changeStep(next.id);
            }}
          />
        </WizardHeader>
        <WizardPanel>
          <div className="space-y-4 text-sm">
            <div className="space-y-2" aria-live="polite">
              <h3 className="flex items-center gap-2 font-medium">{title}</h3>
              <DialogDescription>{description}</DialogDescription>
            </div>
            {step === "access" ? (
              <>
                <p
                  role="status"
                  aria-atomic="true"
                  className={
                    checked && !busy && !error ? "text-xs text-muted-foreground" : "sr-only"
                  }
                >
                  {checked && !busy && !error ? captureSetupCheckMessage(state) : null}
                </p>
                {macPermissions ? (
                  <PermissionChecklist
                    busy={busy}
                    permissions={[
                      {
                        id: "screenRecording",
                        icon: <MacScreenRecordingIcon className="size-8 shrink-0 drop-shadow-sm" />,
                        title: t("settings.snapshotSetup.permission.screenRecording"),
                        description: t(
                          "settings.snapshotSetup.permission.screenRecordingDescription",
                        ),
                        granted: macPermissions.screenRecording,
                        onAllow: () => void onAction("allow-screen-recording"),
                      },
                      {
                        id: "accessibility",
                        icon: <MacAccessibilityIcon className="size-8 shrink-0 drop-shadow-sm" />,
                        title: t("settings.snapshotSetup.permission.accessibility"),
                        description: t(
                          includeAccessibility
                            ? "settings.snapshotSetup.permission.accessibilityDescription"
                            : "settings.snapshotSetup.permission.accessibilityOptionalDescription",
                        ),
                        granted: macPermissions.accessibility,
                        onAllow: () => void onAction("allow-accessibility"),
                      },
                    ]}
                  />
                ) : null}
                {permissionStatus.error && macPermissions ? (
                  <p role="status" className="text-xs text-muted-foreground">
                    {permissionStatus.error}
                  </p>
                ) : null}
                {helperBackend && helper?.status === "error" ? (
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void onAction(installHelper)}
                  >
                    {t("settings.snapshotSetup.action.reinstallHelper")}
                  </Button>
                ) : null}
              </>
            ) : configShortcut ? (
              <CaptureShortcutConfig
                state={state}
                disabled={actionBusy || checking || !accessReady}
                onBusyChange={setConfigBusy}
                onSaved={onRefresh}
                onComplete={() => onClose(true)}
              />
            ) : (
              <div className="space-y-3">
                {shortcutInput}
                {shortcutStatus ? (
                  <p className="text-xs text-muted-foreground" role="status">
                    {shortcutStatus}
                  </p>
                ) : null}
                {!shortcutChanged &&
                !state.shortcutRegistered &&
                !state.shortcutPending &&
                state.shortcutCanRetry !== false &&
                !isModifierPairShortcut(state.shortcut) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void onAction("retry-shortcut")}
                  >
                    {t(
                      state.mode === "portal"
                        ? "settings.snapshot.shortcutPermissions"
                        : "settings.snapshotSetup.action.tryAgain",
                    )}
                  </Button>
                ) : null}
              </div>
            )}
            {step === "shortcut" && !accessReady ? (
              <p role="alert" className="text-destructive">
                {t("settings.snapshotSetup.action.captureNeedsAttention")}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="text-destructive">
                {t("settings.snapshotSetup.action.stepFailed")}
              </p>
            ) : null}
            {details.length > 0 || (step === "access" && (backend === "gnome" || helperBackend)) ? (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">{t("action.showAdvanced")}</summary>
                <div className="mt-3 space-y-3">
                  {details.map((detail) => (
                    <p key={detail} className="break-words">
                      {detail}
                    </p>
                  ))}
                  {step === "access" && (backend === "gnome" || helperBackend) ? (
                    <p>{t("settings.snapshotSetup.action.included")}</p>
                  ) : null}
                  {step === "access" && backend === "gnome" && extension?.status === "enabled" ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void onAction("disable-extension")}
                    >
                      {t("settings.snapshotSetup.action.disableExtension")}
                    </Button>
                  ) : null}
                  {step === "access" && helperBackend && helper?.status !== "not-installed" ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void onAction(removeHelper)}
                    >
                      {t("settings.snapshotSetup.action.removeHelper")}
                    </Button>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>
        </WizardPanel>
        <WizardFooter>
          {step !== "access" ? (
            <Button variant="ghost" disabled={busy} onClick={() => changeStep("access")}>
              {t("action.back")}
            </Button>
          ) : null}
          <Button variant="ghost" disabled={busy} onClick={() => void onClose(false)}>
            {t(
              wasEnabled
                ? "settings.snapshotSetup.action.close"
                : "settings.snapshotSetup.action.finishLater",
            )}
          </Button>
          {step === "access" ? (
            helperBackend && !accessReady && helper?.status !== "ready" ? (
              <Button
                disabled={busy}
                aria-busy={busy}
                onClick={() =>
                  void (helper?.status === "error" ? checkAgain() : onAction(installHelper))
                }
              >
                {checking
                  ? t("settings.snapshotSetup.action.checking")
                  : busy
                    ? t("settings.snapshotSetup.action.installing")
                    : helper?.status === "error"
                      ? t("settings.snapshotSetup.action.checkAgain")
                      : helper?.status === "update-required"
                        ? t("settings.snapshotSetup.action.updateHelper")
                        : t("settings.snapshotSetup.action.installHelper")}
              </Button>
            ) : backend === "gnome" && !accessReady && extension?.status !== "enabled" ? (
              <Button
                disabled={busy}
                aria-busy={checking}
                onClick={() =>
                  void (install
                    ? onAction("install-extension")
                    : enable
                      ? onAction("enable-extension")
                      : checkAgain())
                }
              >
                {checking
                  ? t("settings.snapshotSetup.action.checking")
                  : busy
                    ? install
                      ? t("settings.snapshotSetup.action.installing")
                      : enable
                        ? t("settings.snapshotSetup.action.enabling")
                        : t("settings.snapshotSetup.action.working")
                    : install
                      ? t(
                          extension?.status === "update-required"
                            ? "settings.snapshotSetup.action.updateExtension"
                            : "settings.snapshotSetup.action.installExtension",
                        )
                      : enable
                        ? t("settings.snapshotSetup.action.enableExtension")
                        : t("settings.snapshotSetup.action.checkAgain")}
              </Button>
            ) : (
              <PermissionContinueButton
                ready={macPermissionsReady}
                busy={busy}
                onClick={async () => {
                  if (await onEnable()) changeStep("shortcut");
                }}
              >
                {busy
                  ? t("settings.snapshotSetup.action.working")
                  : macPermissions
                    ? t("settings.snapshotSetup.action.testCaptureAndContinue")
                    : backend === "direct"
                      ? t("settings.snapshotSetup.action.allowCapture")
                      : !accessReady && !macPermissions
                        ? t("settings.snapshotSetup.action.tryAgain")
                        : t("action.continue")}
              </PermissionContinueButton>
            )
          ) : !configShortcut ? (
            <Button
              disabled={
                busy || !accessReady || (shortcutChanged ? !canSaveShortcut : !shortcutReady)
              }
              onClick={async () => {
                if (!shortcutChanged || (await onSaveShortcut())) await onClose(true);
              }}
            >
              {busy
                ? t("settings.snapshotSetup.action.saving")
                : shortcutChanged
                  ? t("settings.snapshotSetup.action.saveAndFinish")
                  : t("action.done")}
            </Button>
          ) : null}
        </WizardFooter>
      </WizardPopup>
    </Dialog>
  );
}
