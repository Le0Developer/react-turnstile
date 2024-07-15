# react-turnstile

A very simple React library for [Cloudflare Turnstile](https://challenges.cloudflare.com).

## Installation

```sh
npm i react-turnstile
```

## Usage

```jsx
import Turnstile, { useTurnstile } from "react-turnstile";

// ...

function TurnstileWidget() {
  const turnstile = useTurnstile();
  return (
    <Turnstile
      sitekey="1x00000000000000000000AA"
      onVerify={(token) => {
        fetch("/login", {
          method: "POST",
          body: JSON.stringify({ token }),
        }).then((response) => {
          if (!response.ok) turnstile.reset();
        });
      }}
    />
  );
}
```

Turnstile tokens expire after 5 minutes, to automatically reset the challenge once they expire,
set the `refreshExpired` prop to `'auto'` or reset the widget yourself using the `onExpire` callback.

### Reducing Layout Shift

The turnstile iframe initially loads as invisible before becoming visible and
expanding to the expected widget size.

This causes Layout Shift and reduces your Cumulative Layout Shift score and UX.

This can be fixed with the `fixedSize={true}` option, which will force the
wrapper div to be the specific size of turnstile.

### Bound Turnstile Object

The Bound Turnstile Object is given as argument to all callbacks and allows you
to call certain `window.turnstile` functions without having to store the `widgetId`
yourself.

```js
function Component() {
  return (
    <Turnstile
      execution="execute"
      onLoad={(widgetId, bound) => {
        // before:
        window.turnstile.execute(widgetId);
        // now:
        bound.execute();
      }}
    />
  );
}
```

## Documentation

Turnstile takes the following arguments:

| name              | type    | description                                          |
| ----------------- | ------- | ---------------------------------------------------- |
| sitekey           | string  | sitekey of your website (REQUIRED)                   |
| action            | string  | -                                                    |
| cData             | string  | -                                                    |
| theme             | string  | one of "light", "dark", "auto"                       |
| language          | string  | override the language used by turnstile              |
| tabIndex          | number  | -                                                    |
| responseField     | boolean | controls generation of `<input />` element           |
| responseFieldName | string  | changes the name of `<input />` element              |
| size              | string  | one of "normal", "compact"                           |
| fixedSize         | boolean | fix the size of the `<div />` to reduce layout shift |
| retry             | string  | one of "auto", "never"                               |
| retryInterval     | number  | interval of retries in ms                            |
| refreshExpired    | string  | one of "auto", "manual", "never"                     |
| appearance        | string  | one of "always", "execute", "interaction-only"       |
| execution         | string  | one of "render", "execute"                           |
| id                | string  | id of the div                                        |
| userRef           | Ref     | custom react ref for the div                         |
| className         | string  | passed to the div                                    |
| style             | object  | passed to the div                                    |

And the following callbacks:

| name                | arguments                   | description                                         |
| ------------------- | --------------------------- | --------------------------------------------------- |
| onVerify            | token                       | called when challenge is passed                     |
| onSuccess           | token, preClearanceObtained | called when challenge is passed                     |
| onLoad              | widgetId                    | called when the widget is loaded                    |
| onError             | error                       | called when an error occurs                         |
| onExpire            | -                           | called when the token expires                       |
| onTimeout           | token                       | called when the challenge expires                   |
| onAfterInteractive  | -                           | called when the challenge becomes interactive       |
| onBeforeInteractive | -                           | called when the challenge no longer is interactive  |
| onUnsupported       | -                           | called when the browser is unsupported by Turnstile |

The callbacks also take an additional `BoundTurnstileObject` which exposes
certain functions of `window.turnstile` which are already bound to the
current widget, so you don't need track the `widgetId` yourself.

For more details on what each argument does, see the [Cloudflare Documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations).
