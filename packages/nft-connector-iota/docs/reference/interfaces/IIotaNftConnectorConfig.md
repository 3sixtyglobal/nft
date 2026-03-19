# Interface: IIotaNftConnectorConfig

Configuration for the IOTA NFT Connector.

## Extends

- `IIotaConfig`

## Properties

### contractName? {#contractname}

> `optional` **contractName?**: `string`

The name of the contract to use.

#### Default

```ts
"nft"
```

***

### packageControllerAddressIndex? {#packagecontrolleraddressindex}

> `optional` **packageControllerAddressIndex?**: `number`

The package controller address index to use when creating package.

#### Default

```ts
0
```

***

### walletAddressIndex? {#walletaddressindex}

> `optional` **walletAddressIndex?**: `number`

The wallet address index to use when creating NFT.

#### Default

```ts
0
```

***

### enableCostLogging? {#enablecostlogging}

> `optional` **enableCostLogging?**: `boolean`

Enable cost logging.

#### Default

```ts
false
```

#### Overrides

`IIotaConfig.enableCostLogging`
