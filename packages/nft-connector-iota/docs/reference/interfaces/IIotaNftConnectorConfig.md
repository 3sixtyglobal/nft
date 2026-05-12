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

### accountAddressIndex? {#accountaddressindex}

> `optional` **accountAddressIndex?**: `number`

The account address index to use when creating NFT.

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
