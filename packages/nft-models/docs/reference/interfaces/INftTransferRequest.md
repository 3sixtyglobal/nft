# Interface: INftTransferRequest

Request to transfer an NFT to a new owner.

## Properties

### pathParams {#pathparams}

> **pathParams**: `object`

The path parameters for the request.

#### id

> **id**: `string`

The id of the NFT to transfer in urn format.

***

### body {#body}

> **body**: `object`

The request body containing transfer parameters.

#### recipientAddress

> **recipientAddress**: `string`

The recipient address for the NFT.

#### metadata?

> `optional` **metadata?**: `unknown`

The metadata for the NFT.
