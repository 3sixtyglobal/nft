# Class: NftService

Service for performing NFT operations to a connector.

## Implements

- `INftComponent`

## Constructors

### Constructor

> **new NftService**(`options?`): `NftService`

Create a new instance of NftService.

#### Parameters

##### options?

[`INftServiceConstructorOptions`](../interfaces/INftServiceConstructorOptions.md)

The options for the service.

#### Returns

`NftService`

## Properties

### CLASS\_NAME {#class_name}

> `readonly` `static` **CLASS\_NAME**: `string`

Runtime name for the class.

## Methods

### className() {#classname}

> **className**(): `string`

Returns the class name of the component.

#### Returns

`string`

The class name of the component.

#### Implementation of

`INftComponent.className`

***

### mint() {#mint}

> **mint**\<`T`, `U`\>(`tag`, `immutableMetadata?`, `metadata?`, `namespace?`, `controllerIdentity?`): `Promise`\<`string`\>

Mint an NFT.

#### Type Parameters

##### T

`T` = `unknown`

##### U

`U` = `unknown`

#### Parameters

##### tag

`string`

The tag for the NFT.

##### immutableMetadata?

`T`

The immutable metadata for the NFT.

##### metadata?

`U`

The metadata for the NFT.

##### namespace?

`string`

The namespace of the connector to use for the NFT, defaults to service configured namespace.

##### controllerIdentity?

`string`

The identity to perform the nft operation with.

#### Returns

`Promise`\<`string`\>

The id of the created NFT in urn format.

#### Implementation of

`INftComponent.mint`

***

### resolve() {#resolve}

> **resolve**\<`T`, `U`\>(`id`, `controllerIdentity?`): `Promise`\<\{ `issuer`: `string`; `issuerIdentityId`: `string`; `tag`: `string`; `immutableMetadata?`: `T`; `metadata?`: `U`; \}\>

Resolve an NFT.

#### Type Parameters

##### T

`T` = `unknown`

##### U

`U` = `unknown`

#### Parameters

##### id

`string`

The id of the NFT to resolve.

##### controllerIdentity?

`string`

The identity to perform the nft operation with.

#### Returns

`Promise`\<\{ `issuer`: `string`; `issuerIdentityId`: `string`; `tag`: `string`; `immutableMetadata?`: `T`; `metadata?`: `U`; \}\>

The data for the NFT.

#### Implementation of

`INftComponent.resolve`

***

### burn() {#burn}

> **burn**(`id`, `controllerIdentity?`): `Promise`\<`void`\>

Burn an NFT.

#### Parameters

##### id

`string`

The id of the NFT to burn in urn format.

##### controllerIdentity?

`string`

The identity to perform the nft operation with.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`INftComponent.burn`

***

### transfer() {#transfer}

> **transfer**\<`U`\>(`id`, `recipientAddress`, `metadata?`, `controllerIdentity?`): `Promise`\<`void`\>

Transfer an NFT.

#### Type Parameters

##### U

`U` = `unknown`

#### Parameters

##### id

`string`

The id of the NFT to transfer in urn format.

##### recipientAddress

`string`

The recipient address for the NFT.

##### metadata?

`U`

Optional mutable data to include during the transfer.

##### controllerIdentity?

`string`

The identity to perform the nft operation with.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`INftComponent.transfer`

***

### update() {#update}

> **update**\<`U`\>(`id`, `metadata`, `controllerIdentity?`): `Promise`\<`void`\>

Update the data of the NFT.

#### Type Parameters

##### U

`U` = `unknown`

#### Parameters

##### id

`string`

The id of the NFT to update in urn format.

##### metadata

`U`

The mutable data to update.

##### controllerIdentity?

`string`

The identity to perform the nft operation with.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Implementation of

`INftComponent.update`
