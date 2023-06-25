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
set the `autoResetOnExpire` prop to true or reset the widget yourself using the `onExpire` callback.

### Reducing Layout Shift

The turnstile iframe initially loads as invisible before becoming visible and
expanding to the expected widget size.

This causes Layout Shift and reduces your Cumulative Layout Shift score and UX.

This can be fixed with the `fixedSize={true}` option, which will force the
wrapper div to be the specific size of turnstile.

## Documentation

Turnstile takes the following arguments:

| name              | type    | description                                           |
| ----------------- | ------- | ----------------------------------------------------- |
| sitekey           | string  | sitekey of your website (REQUIRED)                    |
| action            | string  | -                                                     |
| cData             | string  | -                                                     |
| theme             | string  | one of "light", "dark", "auto"                        |
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
| onExpire  | -         | called when the token expires              |
| onTimeout | -         | called when the challenge expires          |

For more details on what each argument does, see the [Cloudflare Documentation](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#configurations).
