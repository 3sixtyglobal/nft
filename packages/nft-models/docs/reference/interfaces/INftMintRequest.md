# Interface: INftMintRequest

Request to mint a new NFT.

## Properties

### body {#body}

> **body**: `object`

The request body containing minting parameters.

#### tag

> **tag**: `string`

The tag for the NFT.

#### immutableMetadata?

> `optional` **immutableMetadata?**: `unknown`

The immutable metadata for the NFT.

#### metadata?

> `optional` **metadata?**: `unknown`

The metadata for the NFT.

#### namespace?

> `optional` **namespace?**: `string`

The namespace of the connector to use for the NFT, defaults to component configured namespace.
