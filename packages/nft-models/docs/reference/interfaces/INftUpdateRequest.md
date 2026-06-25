# Interface: INftUpdateRequest

Request to update the mutable metadata of an NFT.

## Properties

### pathParams {#pathparams}

> **pathParams**: `object`

The path parameters for the request.

#### id

> **id**: `string`

The id of the NFT to update in urn format.

***

### body {#body}

> **body**: `object`

The request body containing update parameters.

#### metadata?

> `optional` **metadata?**: `unknown`

The metadata for the NFT.
