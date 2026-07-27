# Function: nftMint()

> **nftMint**(`httpRequestContext`, `componentName`, `request`, `baseRouteName`): `Promise`\<`ICreatedResponse`\>

Mint an NFT.

## Parameters

### httpRequestContext

`IHttpRequestContext`

The request context for the API.

### componentName

`string`

The name of the component to use in the routes.

### request

`INftMintRequest`

The request.

### baseRouteName

`string`

The base route name for the API.

## Returns

`Promise`\<`ICreatedResponse`\>

A created response containing the location header with the new NFT id.
