# Interface: IIotaNftConnectorConfig

Configuration for the IOTA NFT Connector.

## Extends

- `IIotaConfig`

## Properties

### contractName? {#contractname}

> `optional` **contractName**: `string`

The name of the contract to use.

***

### packageControllerAddressIndex? {#packagecontrolleraddressindex}

> `optional` **packageControllerAddressIndex**: `number`

The package controller address index to use when creating package.

***

### walletAddressIndex? {#walletaddressindex}

> `optional` **walletAddressIndex**: `number`

The wallet address index to use when creating NFT.

***

### enableCostLogging? {#enablecostlogging}

> `optional` **enableCostLogging**: `boolean`

Enable cost logging.

#### Overrides

`IIotaConfig.enableCostLogging`
