import React, { useEffect, useState, useRef } from "react";
import {
  TurnstileObject,
  TurnstileOptions,
  SupportedLanguages,
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
  style,
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
  userRef,
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
    let widgetId = "",
      timeoutId = 0;
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
        language,
        tabindex: tabIndex,
        "response-field": responseField,
        "response-field-name": responseFieldName,
        size,
        retry: "never", // see error-callback for why
        "retry-interval": retryInterval,
        "refresh-expired": refreshExpired,
        appearance,
        execution,
        callback: (token: string) => inplaceState.onVerify(token),
        "error-callback": () => {
          // we handle retry ourselves because turnstile does not properly
          // reset its timeout when calling turnstile.remove, logging the
          // following in the console:
          // > [Cloudflare Turnstile] Nothing to reset found for provided container.
          // refs:
          // - https://github.com/Le0Developer/react-turnstile/issues/14
          // - https://discord.com/channels/595317990191398933/1025131875397812224/1122137855368646717
          // TODO: remove when fixed
          if (retry === "auto") {
            timeoutId = setTimeout(() => {
              window.turnstile.reset(widgetId);
              timeoutId = 0;
              // no need to do bounds checks, tunrstile already does them for us
              // even though we have retry=never
            }, 2000 + (retryInterval ?? 8000));
          }
          inplaceState.onError?.();
        },
        "expired-callback": () => inplaceState.onExpire?.(),
        "timeout-callback": () => inplaceState.onTimeout?.(),
      };

      widgetId = window.turnstile.render(ref.current, turnstileOptions);
      inplaceState.onLoad?.(widgetId);
    })();
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile.remove(widgetId);
      if (timeoutId) clearTimeout(timeoutId);
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
    inplaceState.onLoad = onLoad;
    inplaceState.onError = onError;
    inplaceState.onExpire = onExpire;
    inplaceState.onTimeout = onTimeout;
  }, [onVerify, onLoad, onError, onExpire, onTimeout]);

  return <div ref={ref} id={id} className={className} style={style} />;
}

interface TurnstileProps extends TurnstileCallbacks {
  sitekey: string;
  action?: string;
  cData?: string;
  theme?: "light" | "dark" | "auto";
  language?: SupportedLanguages | "auto";
  tabIndex?: number;
  responseField?: boolean;
  responseFieldName?: string;
  size?: "normal" | "invisible" | "compact";
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

interface TurnstileCallbacks {
  onVerify: (token: string) => void;
  onLoad?: (widgetId: string) => void;
  onError?: (error?: Error | any) => void;
  onExpire?: () => void;
  onTimeout?: () => void;
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
