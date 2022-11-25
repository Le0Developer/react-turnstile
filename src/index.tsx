import React, { useEffect, useState, useRef } from "react";
import { TurnstileOptions } from "turnstile-types";

const global = (globalThis ?? window) as any;
let turnstileState =
  typeof global.turnstile !== "undefined" ? "ready" : "unloaded";
let ensureTurnstile: () => Promise<any>;

// Functions responsible for loading the turnstile api, while also making sure
// to only load it once
{
  const TURNSTILE_LOAD_FUNCTION = "cf__reactTurnstileOnLoad";
  const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

  let turnstileLoad: {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  };
  const turnstileLoadPromise = new Promise((resolve, reject) => {
    turnstileLoad = { resolve, reject };
    if (turnstileState === "ready") resolve(undefined);
  });

  ensureTurnstile = () => {
    if (turnstileState === "unloaded") {
      turnstileState = "loading";
      global[TURNSTILE_LOAD_FUNCTION] = () => {
        turnstileLoad.resolve();
        turnstileState = "ready";
        delete global[TURNSTILE_LOAD_FUNCTION];
      };
      const url = `${TURNSTILE_SRC}?onload=${TURNSTILE_LOAD_FUNCTION}&render=explicit`;
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.addEventListener("error", () => {
        turnstileLoad.reject("Failed to load Turnstile.");
        delete global[TURNSTILE_LOAD_FUNCTION];
      });
      document.head.appendChild(script);
    }
    return turnstileLoadPromise;
  };
}

export default function Turnstile({
  id,
  ref: userRef,
  className,
  style,
  sitekey,
  action,
  cData,
  theme,
  size,
  tabIndex,
  responseField,
  responseFieldName,
  retry,
  retryInterval,
  autoResetOnExpire,
  onVerify,
  onLoad,
  onError,
  onExpire,
  onTimeout,
}: TurnstileProps) {
  const ownRef = useRef<HTMLDivElement | null>(null);
  const inplaceState = useState<TurnstileCallbacks>({ onVerify })[0];

  const ref = userRef ?? ownRef;

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
      const turnstileOptions: TurnstileOptions = {
        sitekey,
        action,
        cData,
        theme,
        size,
        tabindex: tabIndex,
        callback: (token: string) => inplaceState.onVerify(token),
        "error-callback": () => inplaceState.onError?.(),
        "expired-callback": () => {
          inplaceState.onExpire?.();
          if (autoResetOnExpire) window.turnstile.reset(widgetId);
        },
        "timeout-callback": () => inplaceState.onTimeout?.(),
        "response-field": responseField,
        "response-field-name": responseFieldName,
        retry,
        "retry-interval": retryInterval,
      };

      widgetId = window.turnstile.render(ref.current, turnstileOptions);
      inplaceState.onLoad?.(widgetId);
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
    size,
    tabIndex,
    responseField,
    responseFieldName,
    retry,
    retryInterval,
    autoResetOnExpire,
  ]);
  useEffect(() => {
    inplaceState.onVerify = onVerify;
    inplaceState.onLoad = onLoad;
    inplaceState.onError = onError;
    inplaceState.onExpire = onExpire;
  }, [onVerify, onLoad, onError, onExpire, onTimeout]);

  return <div ref={ref} id={id} className={className} style={style} />;
}

interface TurnstileProps extends TurnstileCallbacks {
  sitekey: string;
  action?: string;
  cData?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "invisible" | "compact";
  tabIndex?: number;
  responseField?: boolean;
  responseFieldName?: string;
  retry?: "auto" | "never";
  retryInterval?: number;
  autoResetOnExpire?: boolean;

  id?: string;
  ref?: React.MutableRefObject<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
}

interface TurnstileCallbacks {
  onVerify: (token: string) => void;
  onLoad?: (widgetId: string) => void;
  onError?: (error?: Error | any) => void;
  onExpire?: () => void;
  onTimeout?: () => void;
}
