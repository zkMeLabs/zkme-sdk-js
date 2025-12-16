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
    // -------------------------TODO-------------------------
    // Request a new token from your backend service and return it to the widget.
    // For the access token, see https://docs.zk.me/hub/start/zkKYB/integration/js-sdk/zkkyb#how-to-generate-an-access-token-with-api_key
    // ------------------------------------------------------
    return fetchNewToken()
  },

  async getExternalID() {
    // -------------------------TODO-------------------------
    // `ExternalID` represents the unique identifier of this user in your system.
    // Typical examples include a corporate e-mail address, phone number,
    // or an internal user ID. Use the same identifier consistently
    // whenever you query or verify this user's KYB status.
    // ------------------------------------------------------
    return [externalID]
  },
  },
}

const zkMeKybWidget = new ZkMeKybWidget(
  // -------------------------TODO-------------------------
  appId, // This parameter means the same thing as "mchNo"
  'YourDappName',
  provider,
  {
      programNo: 'YourProgramNo' // You can find the Program No in the ‘Configuration’ section of your KYB dashboard
      // For other options, please refer to the table below
  }
  // ------------------------------------------------------
)
```

| Param             | Type    | Description                                                                                                                                                                                                                                                               |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| options.programNo | string? | If you have activated multiple programs running in parallel, please pay attention to this setting:<br><br>The param can be found in Dashboard and please make sure the program is enabled. The SDK will take the number of the first activated program as the default value if this parameter is not provided in the code. |

### Step 3. Listen to the `kybFinished` widget events to detect when the user has completed the zkKYB process.

```typescript
function handleKybFinished(results) {
  const { status, externalID, zkMeAccount, programNo } = results;

  if (status === 5 && externalID === userConnectedAddress.toLowerCase()) {
    // -------------------------TODO-------------------------
    // The user has successfully completed zkKYB verification.
    // Prompt the user that verification has been completed.
    // ------------------------------------------------------
    console.log(`KYB verification completed for ${externalID}`)
  }
}

zkMeKybWidget.on("kybFinished", handleKybFinished);
```
#### Event Callback Parameters

The `kybFinished` event callback receives a `results` object with the following properties:

| Name | Type | Description |
| ---- | ---- | ----------- |
| status | int | Indicates the current verification status of the KYB process.<br><br>Status codes are defined as follows:<br>• `1` – Verification Started<br>• `2` – Info Submitted<br>• `3` – Under Review<br>• `4` – Resubmission Required<br>• `5` – Verification Passed<br>• `6` – Verification Failed |
| externalID | string | The entity identifier from your system, echoed back by the SDK. This is the same value you returned as `externalID` in the `getExternalID()` function (for example, a corporate email address, phone number, or an internal user ID). |
| zkMeAccount | string | The zkMe internal account identifier. |

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
  appId, // Your unique App ID (mchNo)
  externalID, // The user's unique identifier (e.g., corporate email)
  accessToken, // Access token from your backend
  options // Optional configurations are detailed in the table below
);
```

| Param             | Type    | Description                                                                                                                                                                                                                                                               |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| appId             | string  | This parameter means the same thing as "mchNo"                                                                                                                                                                                                                            |
| externalID       | string  | The unique identifier provided by you to reference the KYB entity to be verified. This should match the `getExternalID()` passed by `provider.getExternalID`.                                                                                                      |
| accessToken       | string  | The access token obtained from your backend service..                                                                                                                                                                                                          |
| options.programNo | string? | If you have activated multiple programs running in parallel, please pay attention to this setting: <br><br>The param can be found in Dashboard and please make sure the program is enabled.The SDK will take the number of the first activated program as the default value if this parameter is not provided in the code. |

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
| programNo      | string | Yes      | Same as the programNo you pass for the SDK  integration.                                                          |
| accessToken    | string | Yes      | Same as the Access Token used in the SDK integration.                                         |
| mchNo          | string | Yes      | Same as AppID.                                               |
| externalID  | string | Yes      | The unique identifier provided by you to reference the KYB entity to be verified. This should match the `getExternalID()` passed during SDK integration.                                 |

### Request Example:

```json
{
  "programNo": "eyJhbGciOiJSUzI1NiIsImltcCI6ICI6IjFlOWkazcifQ.eyJuV1l1jIjoiSmFuZSBEb2UiLCJpYXQiOjE1MTYyMzkwMjJ9.xxxxxx",
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxx",
  "mchNo": "merchant_123456",
  "externalID": "f1215345"
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
