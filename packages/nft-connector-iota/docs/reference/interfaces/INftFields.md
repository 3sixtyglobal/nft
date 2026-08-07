# Interface: INftFields

Interface representing the storage fields of an NFT.

## Properties

### id {#id}

> **id**: `object`

The ID of the NFT.

#### id

> **id**: `string`

The ID of the NFT.

***

### version {#version}

> **version**: `string`

The version of the NFT contract that created this NFT.

***

### immutable\_metadata {#immutable_metadata}

> **immutable\_metadata**: `string`

The immutable metadata of the NFT.

***

### tag {#tag}

> **tag**: `string`

The tag of the NFT.

***

### metadata {#metadata}

> **metadata**: `string`

The metadata of the NFT.

***

### issuer {#issuer}

> **issuer**: `string`

The issuer of the NFT - the wallet address that signed the mint transaction.

***

### issuerIdentityId {#issueridentityid}

> **issuerIdentityId**: `string`

The on-chain Object ID (as hex address string) of the verified IOTA Identity that minted
this NFT. "0x0000...0000" when minted via the unverified mint() function.
