# Interface: IIotaNftConnectorConstructorOptions

Options for the IotaNftConnector.

## Properties

### config {#config}

> **config**: [`IIotaNftConnectorConfig`](IIotaNftConnectorConfig.md)

The configuration to use for the connector.

***

### vaultConnectorType? {#vaultconnectortype}

> `optional` **vaultConnectorType?**: `string`

The vault connector type to use.

#### Default

```ts
"vault"
```

***

### loggingComponentType? {#loggingcomponenttype}

> `optional` **loggingComponentType?**: `string`

The logging component type.

#### Default

```ts
logging
```

***

### deploymentConfig? {#deploymentconfig}

> `optional` **deploymentConfig?**: `ISmartContractDeployments`

Optional deployment configuration to use instead of the default compiled configuration.
This allows tests and other scenarios to use different contract deployments.

#### Default

```ts
Uses compiled smart-contract-deployments.json
```
