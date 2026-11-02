# @matreshka/gateway-bff-protocol

Wire types and message classes for **gateway ↔ BFF** transport in Matreshka (session open/close, client relay, errors).

Independent semver from `@matreshka/client-bff-protocol`. Breaking changes here affect BFF when used behind `@matreshka/gateway`, not the UI wire between client and BFF.

## Duplicated wire base

`messages/message.ts` and `messages/message-registry.ts` are duplicated from `client-bff-protocol`. If the JSON envelope shape (`type`, `payload`, etc.) changes, bump **major in both packages** in the same release and keep the files in sync.

## Usage (BFF)

```typescript
import { registerGatewayMessages } from "@matreshka/gateway-bff-protocol/messages/register-gateway-messages";
import { parseGatewayToBffMessage } from "@matreshka/gateway-bff-protocol/messages/gateway-to-bff";

registerGatewayMessages();
```

## Development

From this directory:

```bash
npm run build
npm run lint
npm test
```
