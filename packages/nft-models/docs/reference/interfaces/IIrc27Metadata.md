# Interface: IIrc27Metadata

Model defining the IRC27 NFT Standards.
https://docs.iota.org/developer/references/framework/stardust/irc27

## Properties

### standard {#standard}

> **standard**: `"IRC27"`

The standard marker.

***

### version {#version}

> **version**: `"v1.0"`

The version

***

### type {#type}

> **type**: `string`

A mime type for the content of the NFT.

***

### uri {#uri}

> **uri**: `string`

Url pointing to the NFT file location with MIME type defined in type.

***

### name {#name}

> **name**: `string`

Alphanumeric text string defining the human identifiable name for the NFT

***

### collectionName? {#collectionname}

> `optional` **collectionName?**: `string`

Alphanumeric text string defining the human identifiable collection name.

***

### royalties? {#royalties}

> `optional` **royalties?**: `object`

Object containing key value pair where payment address mapped to the payout percentage.

#### Index Signature

\[`id`: `string`\]: `number`

***

### issuerName? {#issuername}

> `optional` **issuerName?**: `string`

Alphanumeric text string to define the human identifiable name of the creator.

***

### description? {#description}

> `optional` **description?**: `string`

Alphanumeric text string to define a basic description of the NFT.

***

### attributes? {#attributes}

> `optional` **attributes?**: `object`[]

Array objects defining additional attributes of the NFT

#### trait\_type

> **trait\_type**: `string`

#### value

> **value**: `unknown`
