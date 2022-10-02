import React, { useEffect, createRef } from "react";

const global = globalThis ?? window;
let turnstileState =
  typeof (global as any).turnstile !== "undefined" ? "ready" : "unloaded";
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
  (global as any)[TURNSTILE_LOAD_FUNCTION] = () => {
    turnstileLoad.resolve();
    turnstileState = "ready";
  };

  ensureTurnstile = () => {
    if (turnstileState === "unloaded") {
      turnstileState = "loading";
      const url = `${TURNSTILE_SRC}?onload=${TURNSTILE_LOAD_FUNCTION}&render=explicit`;
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.addEventListener("error", () => {
        turnstileLoad.reject("Failed to load Turnstile.");
      });
      document.head.appendChild(script);
    }
    return turnstileLoadPromise;
  };
}

export default function Turnstile({
  id,
  className,
  sitekey,
  action,
  cData,
  theme,
  tabIndex,
  onVerify,
  onLoad,
  onError,
  onExpire,
}: TurnstileProps) {
  const ref: React.RefObject<HTMLDivElement> = createRef();

  useEffect(() => {
    if (!ref.current) return;
    (async () => {
      if (!ref.current) return;
      // load turnstile
      if (turnstileState !== "ready") {
        try {
          await ensureTurnstile();
        } catch (e) {
          onError?.(e);
          return;
        }
      }
      onLoad?.();
      // turnstile is loaded, render the widget

      ref.current.innerHTML = ""; // remove old widget
      const turnstileOptions: RawTurnstileOptions = {
        sitekey,
        action,
        cData,
        theme,
        tabindex: tabIndex,
        callback: onVerify,
        "error-callback": onError,
        "expired-callback": onExpire,
        "response-field": false,
      };

      window.turnstile.render(ref.current, turnstileOptions);
    })();
  }, [
    sitekey,
    action,
    cData,
    theme,
    tabIndex,
    // reloading on the following causes an infinite loop
    // ref,
    // onVerify,
    // onLoad,
    // onError,
    // onExpire,
  ]);

  return <div ref={ref} id={id} className={className} />;
}

interface TurnstileProps {
  sitekey: string;
  action?: string;
  cData?: string;
  theme?: "light" | "dark" | "auto";
  tabIndex?: number;

  id?: string;
  className?: string;

  onVerify: (token: string) => void;
  onLoad?: () => void;
  onError?: (error?: Error | any) => void;
  onExpire?: () => void;
}

// Generic typescript definitions of the turnstile api
// Last updated: 2022-10-02 21:30:00 UTC

declare global {
  interface Window {
    turnstile: {
      render: (
        element: string | HTMLElement,
        options: RawTurnstileOptions
      ) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      remove: (widgetId: string) => void;
    };
  }
}

interface RawTurnstileOptions {
  sitekey: string;
  action?: string;
  cData?: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  tabindex?: number;
  // undocumented fields
  "size"?: "normal" | "invisible" | "compact"; // UNUSED; compact warns that its unavailable
  "response-field"?: boolean; // defaults to true
  "response-field-name"?: string; // defaults to cf-turnstile-response
}

// query arguments when adding the script

// compat=recaptcha      registers the turnstile api as window.grecaptcha and enables recaptcha compat
// onload=x              function is executed when turnstile is loaded
// render=explicit       if this value is anything but 'explicit', the DOM is searched for implicit widgets
