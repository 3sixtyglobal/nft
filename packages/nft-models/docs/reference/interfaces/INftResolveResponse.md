# Interface: INftResolveResponse

Response to resolving the NFT.

## Properties

### body {#body}

> **body**: `object`

The data that was resolved.

#### issuer

> **issuer**: `string`

The issuer of the NFT.

#### issuerIdentityId

> **issuerIdentityId**: `string`

The on-chain Object ID of the verified IOTA Identity that minted this NFT.
Empty string when not minted with identity verification.

#### tag

> **tag**: `string`

The tag data for the NFT.

#### immutableMetadata?

> `optional` **immutableMetadata?**: `unknown`

The immutable data for the NFT.

#### metadata?

> `optional` **metadata?**: `unknown`

The metadata for the NFT.
