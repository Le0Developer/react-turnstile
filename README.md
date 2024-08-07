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

// Programmatic access example:
const turnstile = useTurnstile();

const result = await fetch('/path/to/some/api');
if (!result.ok) {
  throw new Error(`Request failed with code ${result.status}`);
  turnstile.reset();
}


function TurnstileWidget() {
  return (
    <Turnstile
      sitekey="1x00000000000000000000AA"
      onVerify={(token) => alert(token)}
    />
  );
}
```

Turnstile tokens expire after 5 minutes, to automatically reset the challenge once they expire,
set the `autoResetOnExpire` prop to true or reset the widget yourself using the `onExpire` callback.

## Documentation

Turnstile takes the following arguments:

| name              | type    | description                                           |
| ----------------- | ------- | ----------------------------------------------------- |
| sitekey           | string  | sitekey of your website (REQUIRED)                    |
| action            | string  | -                                                     |
| cData             | string  | -                                                     |
| theme             | string  | one of "light", "dark", "auto"                        |
| size              | string  | one of "normal", "compact". default: "normal"         |
| tabIndex          | number  | -                                                     |
| responseField     | boolean | controls generation of `<input />` element            |
| responseFieldName | string  | changes the name of `<input />` element               |
| retry             | string  | one of "auto", "never"                                |
| retryInterval     | number  | interval of retries in ms                             |
| autoResetOnExpire | boolean | automatically reset the widget when the token expires |
| id                | string  | id of the div                                         |
| ref               | Ref     | custom react ref for the div                          |
| className         | string  | passed to the div                                     |
| style             | object  | passed to the div                                     |

And the following callbacks:

| name      | arguments | description                                |
| --------- | --------- | ------------------------------------------ |
| onVerify  | token     | called when challenge is passed (REQUIRED) |
| onLoad    | widgetId  | called when the widget is loaded           |
| onError   | error     | called when an error occurs                |
| onExpire  | token     | called when the token expires              |
| onTimeout | -         | called when the challenge expires          |

For more details on what each argument does, see the [Cloudflare Documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations).
