import React, { useEffect, useState, useRef } from "react";
import {
  TurnstileObject,
  SupportedLanguages,
  RenderParameters,
} from "turnstile-types";

const globalNamespace = (
  typeof globalThis !== "undefined" ? globalThis : window
) as any;
let turnstileState =
  typeof globalNamespace.turnstile !== "undefined" ? "ready" : "unloaded";
let ensureTurnstile: () => Promise<any>;

// Functions responsible for loading the turnstile api, while also making sure
// to only load it once
let turnstileLoad: {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
};
const turnstileLoadPromise = new Promise((resolve, reject) => {
  turnstileLoad = { resolve, reject };
  if (turnstileState === "ready") resolve(undefined);
});

{
  const TURNSTILE_LOAD_FUNCTION = "cf__reactTurnstileOnLoad";
  const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

  ensureTurnstile = () => {
    if (turnstileState === "unloaded") {
      turnstileState = "loading";
      globalNamespace[TURNSTILE_LOAD_FUNCTION] = () => {
        turnstileLoad.resolve();
        turnstileState = "ready";
        delete globalNamespace[TURNSTILE_LOAD_FUNCTION];
      };
      const url = `${TURNSTILE_SRC}?onload=${TURNSTILE_LOAD_FUNCTION}&render=explicit`;
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.addEventListener("error", () => {
        turnstileLoad.reject("Failed to load Turnstile.");
        delete globalNamespace[TURNSTILE_LOAD_FUNCTION];
      });
      document.head.appendChild(script);
    }
    return turnstileLoadPromise;
  };
}

export default function Turnstile({
  id,
  className,
  style: customStyle,
  sitekey,
  action,
  cData,
  theme,
  language,
  tabIndex,
  responseField,
  responseFieldName,
  size,
  fixedSize,
  retry,
  retryInterval,
  refreshExpired,
  appearance,
  execution,
  userRef,
  onVerify,
  onSuccess,
  onLoad,
  onError,
  onExpire,
  onTimeout,
  onAfterInteractive,
  onBeforeInteractive,
  onUnsupported,
}: TurnstileProps) {
  const ownRef = useRef<HTMLDivElement | null>(null);
  const inplaceState = useState<TurnstileCallbacks>({
    onVerify,
    onSuccess,
    onLoad,
    onError,
    onExpire,
    onTimeout,
    onAfterInteractive,
    onBeforeInteractive,
    onUnsupported,
  })[0];

  const ref = userRef ?? ownRef;

  const style = fixedSize
    ? {
        width:
          size === "compact" ? "130px" : size === "flexible" ? "100%" : "300px",
        height: size === "compact" ? "120px" : "65px",
        ...customStyle,
      }
    : customStyle;

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let widgetId = "";
    (async () => {
      // load turnstile
      if (turnstileState !== "ready") {
        try {
          await ensureTurnstile();
        } catch (e) {
          inplaceState.onError?.(e);
          return;
        }
      }
      if (cancelled || !ref.current) return;
      let boundTurnstileObject: BoundTurnstileObject;
      const turnstileOptions: RenderParameters = {
        sitekey,
        action,
        cData,
        theme,
        language,
        tabindex: tabIndex,
        "response-field": responseField,
        "response-field-name": responseFieldName,
        size,
        retry,
        "retry-interval": retryInterval,
        "refresh-expired": refreshExpired,
        appearance,
        execution,
        callback: (token: string, preClearanceObtained: boolean) => {
          inplaceState.onVerify?.(token, boundTurnstileObject);
          inplaceState.onSuccess?.(
            token,
            preClearanceObtained,
            boundTurnstileObject
          );
        },
        "error-callback": (error?: any) =>
          inplaceState.onError?.(error, boundTurnstileObject),
        "expired-callback": (token: string) =>
          inplaceState.onExpire?.(token, boundTurnstileObject),
        "timeout-callback": () =>
          inplaceState.onTimeout?.(boundTurnstileObject),
        "after-interactive-callback": () =>
          inplaceState.onAfterInteractive?.(boundTurnstileObject),
        "before-interactive-callback": () =>
          inplaceState.onBeforeInteractive?.(boundTurnstileObject),
        "unsupported-callback": () =>
          inplaceState.onUnsupported?.(boundTurnstileObject),
      };

      widgetId = window.turnstile.render(ref.current, turnstileOptions);
      boundTurnstileObject = createBoundTurnstileObject(widgetId);
      inplaceState.onLoad?.(widgetId, boundTurnstileObject);
    })();
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile.remove(widgetId);
    };
  }, [
    sitekey,
    action,
    cData,
    theme,
    language,
    tabIndex,
    responseField,
    responseFieldName,
    size,
    retry,
    retryInterval,
    refreshExpired,
    appearance,
    execution,
  ]);
  useEffect(() => {
    inplaceState.onVerify = onVerify;
    inplaceState.onSuccess = onSuccess;
    inplaceState.onLoad = onLoad;
    inplaceState.onError = onError;
    inplaceState.onExpire = onExpire;
    inplaceState.onTimeout = onTimeout;
    inplaceState.onAfterInteractive = onAfterInteractive;
    inplaceState.onBeforeInteractive = onBeforeInteractive;
    inplaceState.onUnsupported = onUnsupported;
  }, [
    onVerify,
    onSuccess,
    onLoad,
    onError,
    onExpire,
    onTimeout,
    onAfterInteractive,
    onBeforeInteractive,
    onUnsupported,
  ]);

  return <div ref={ref} id={id} className={className} style={style} />;
}

export interface TurnstileProps extends TurnstileCallbacks {
  sitekey: string;
  action?: string;
  cData?: string;
  theme?: "light" | "dark" | "auto";
  language?: SupportedLanguages | "auto";
  tabIndex?: number;
  responseField?: boolean;
  responseFieldName?: string;
  size?: "normal" | "compact" | "flexible" | "invisible";
  fixedSize?: boolean;
  retry?: "auto" | "never";
  retryInterval?: number;
  refreshExpired?: "auto" | "manual" | "never";
  appearance?: "always" | "execute" | "interaction-only";
  execution?: "render" | "execute";
  id?: string;
  userRef?: React.MutableRefObject<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
}

export interface TurnstileCallbacks {
  onVerify?: (token: string, boundTurnstile: BoundTurnstileObject) => void;
  onSuccess?: (
    token: string,
    preClearanceObtained: boolean,
    boundTurnstile: BoundTurnstileObject
  ) => void;
  onLoad?: (widgetId: string, boundTurnstile: BoundTurnstileObject) => void;
  onError?: (
    error?: Error | any,
    boundTurnstile?: BoundTurnstileObject
  ) => void;
  onExpire?: (token: string, boundTurnstile: BoundTurnstileObject) => void;
  onTimeout?: (boundTurnstile: BoundTurnstileObject) => void;
  onAfterInteractive?: (boundTurnstile: BoundTurnstileObject) => void;
  onBeforeInteractive?: (boundTurnstile: BoundTurnstileObject) => void;
  onUnsupported?: (boundTurnstile: BoundTurnstileObject) => void;
}

export interface BoundTurnstileObject {
  execute: (options?: RenderParameters) => void;
  reset: () => void;
  getResponse: () => void;
  isExpired: () => boolean;
}

function createBoundTurnstileObject(widgetId: string): BoundTurnstileObject {
  return {
    execute: (options) => window.turnstile.execute(widgetId, options),
    reset: () => window.turnstile.reset(widgetId),
    getResponse: () => window.turnstile.getResponse(widgetId),
    isExpired: () => window.turnstile.isExpired(widgetId),
  };
}

export function useTurnstile(): TurnstileObject {
  // we are using state here to trigger a component re-render once turnstile
  // loads, so the component using this hook gets the object once its loaded
  const [_, setState] = useState(turnstileState);

  useEffect(() => {
    if (turnstileState === "ready") return;
    turnstileLoadPromise.then(() => setState(turnstileState));
  }, []);

  return globalNamespace.turnstile;
}
