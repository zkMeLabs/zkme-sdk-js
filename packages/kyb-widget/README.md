# zkMe zkKYB SDK

zkMe zkKYB SDK.

## Installation

```shell
pnpm add @zkmelabs/kyb-widget

# or
yarn add @zkmelabs/kyb-widget

# or
npm install @zkmelabs/kyb-widget
```

## Getting Started

### Step 1. Import styles

```javascript
import "@zkmelabs/kyb-widget/dist/style.css";
```

### Step 2. Create a new `ZkMeKybWidget` instance

```javascript
import { ZkMeKybWidget, type Provider } from '@zkmelabs/kyb-widget'

const provider: Provider = {
  async getAccessToken() {
    // Request a new token from your backend service and return it to the widget.
    // For the access token, see https://docs.zk.me/hub/~/changes/176/start/zkkyb-checklist/intergration-checklist/zkkyb#how-to-generate-an-access-token-with-api_key
    return fetchNewToken()
  },

  async getUserAccounts() {
    // If your project is a Dapp,
    // you need to return the user's connected wallet address.
    const userConnectedAddress = await connect()
    return [userConnectedAddress]

    // If not,
    // you should return the user's e-mail address, phone number or any other unique identifier.
    //
    // return ['email address']
    // or
    // return ['phone number']
    // or
    // return ['unique identifier']
  },
  },
}

const zkMeKybWidget = new ZkMeKybWidget(
  appId, // This parameter means the same thing as "mchNo"
  'YourDappName',
  provider,
  // Optional configurations are detailed in the table below
  options
)
```

| Param             | Type    | Description                                                                                                                                                                                                                                                               |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options.programNo | string? | The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYB). If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard. |

### Step 3. Listen to the `kybFinished` widget events to detect when the user has completed the zkKYB/MeID process.

#### zkKYB

```typescript
function handleKybFinished(results) {
  const { status, associatedAccount, zkMeAccount, programNo } = results;

  if (status === 5 && associatedAccount === userConnectedAddress.toLowerCase()) {
    // Prompts the user that zkKYB verification has been completed
  }
}

zkMeKybWidget.on("kybFinished", handleKybFinished);
```

### Step 4. Launch the zkMe widget and it will be displayed in the center of your webpage.

```javascript
// Button on your page
button.addEventListener("click", () => {
  zkMeKybWidget.launch();
});
```

## Helper functions

- verifyKybWithZkMeServices()

Before launching the widget you should check the zkKYB/MeID status of the user and launch the widget when the check result is `false`.

```typescript
import { verifyKybWithZkMeServices } from "@zkmelabs/kyb-widget";

// zkKYB
const { status, statusDesc } = await verifyKybWithZkMeServices(
  appId,
  userAccount,
  accessToken,
  // Optional configurations are detailed in the table below
  options
);
```

| Param             | Type    | Description                                                                                                                                                                                                                                                               |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| appId             | string  | This parameter means the same thing as "mchNo"                                                                                                                                                                                                                            |
| userAccount       | string  | The `userAccount` info (such as wallet address, email, phone number, or unique identifier) must match the format of accounts returned by `provider.getUserAccounts`.                                                                                                      |
| accessToken       | string  | The access token obtained from your backend service..                                                                                                                                                                                                          |
| options.programNo | string? | The number of the program created in the dashboard system and make sure the program is enabled (dashboard.zk.me - Configuration - zkKYB). If you do not specify a value for this parameter, the SDK will default to the earliest program you configured in the dashboard. |

### Response Fields:

| Field           | Type   | Description                                                                                                    |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| code            | number | Response code. `80000000` indicates success.                                                                   |
| msg             | string | Response message.                                                                                              |
| data.statusCode | number | The current verification status code (1-6). See the status codes table below.                                  |
| data.statusDesc | string | The human-readable status description.                                                                         |
| timestamp       | number | Response timestamp in milliseconds.                                                                            |

### Status Codes:

| Status Code | Status Name           | Description                                                      |
| ----------- | --------------------- | ---------------------------------------------------------------- |
| 1           | Verification Started  | The KYB verification process has been initiated.                 |
| 2           | Info Submitted        | The user has completed and submitted their information.          |
| 3           | Under Review          | The submitted information is being reviewed by the compliance team. |
| 4           | Resubmission Required | Further information or clarification is needed.                  |
| 5           | Verification Passed   | The KYB verification was successful.                             |
| 6           | Verification Failed   | The KYB verification was unsuccessful.                           |

## Query Business Status via API

Alternatively, you can query the KYB status directly from your backend by calling the zkMe API.

### Request:

```
POST https://agw.zk.me/kybpopup/api/kyb/getBusinessStatus
```

### Request Body:

| Parameter      | Type   | Required | Description                                                                                  |
| -------------- | ------ | -------- | -------------------------------------------------------------------------------------------- |
| programNo      | string | Yes      | The Program No from your Dashboard.                                                          |
| accessToken    | string | Yes      | The access token obtained from your backend service.                                         |
| mchNo          | string | Yes      | Your unique merchant number (same as `appId`).                                               |
| partnerUserId  | string | Yes      | The merchant-side unique identifier (e.g., corporate email).                                 |

### Request Example:

```json
{
  "programNo": "eyJhbGciOiJSUzI1NiIsImltcCI6ICI6IjFlOWkazcifQ.eyJuV1l1jIjoiSmFuZSBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.xxxxxx",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxx",
  "mchNo": "merchant_123456",
  "partnerUserId": "f1215345"
}
```


### Response Example:

```json
{
  "code": 80000000,
  "msg": "success",
  "data": {
    "statusCode": 3,
    "statusDesc": "Under Review"
  },
  "timestamp": 1700000000000
}
```

### Response Fields:

| Field           | Type   | Description                                                                                                    |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| code            | number | Response code. `80000000` indicates success.                                                                   |
| msg             | string | Response message.                                                                                              |
| data.statusCode | number | The current verification status code (1-6). See the status codes table above.                                  |
| data.statusDesc | string | The human-readable status description.                                                                         |
| timestamp       | number | Response timestamp in milliseconds.                                                                            |

## How to Generate an Access Token with API_KEY

To use your API_KEY to obtain an accessToken, you will need to make a specific HTTP request. Here's how you can do it:

### a. Endpoint: Send a `POST` request to the token exchange endpoint.

```
POST https://agw.zk.me/kybpopup/api/generate-access-token
```

> **Note:** Please remember to modify the `Content-Type` in the request header to `application/json`. Failing to do so might result in a `Parameter Error` response.

### b. Request Body:

| Parameter Name | Required | Type   | Desc                                      |
| -------------- | -------- | ------ | ----------------------------------------- |
| apiKey         | True     | string | The API_KEY provided by zkMe.             |
| appId          | True     | string | A unique identifier (mchNo) to DApp provided by zkMe. |

> **Note:** `API_KEY` can be found in [the Configuration section](https://dashboard.zk.me) of the Integration on the zkMe Dashboard.



## ZkMeKybWidget instance methods

### launch()

Launch the zkMe widget and it will be displayed in the center of your webpage.

```typescript
launch(): void
```

### on()

Listen to zkMe widget events.

```typescript
on(event: 'kybFinished', callback: KybFinishedHook): void;
on(event: 'close', callback: () => void): void;
```

### hide()

Hide the zkMe widget.

```typescript
hide(): void
```

### destroy()

Remove the message event listener registered by the zkMe widget from the window and destroy the DOM node. This will also clean up the Toast Manager.

```typescript
destroy(): void
```
