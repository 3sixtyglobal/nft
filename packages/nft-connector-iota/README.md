# TWIN NFT Connector IOTA

This package provides an NFT connector backed by the IOTA network, including mint, resolve, transfer, update, and burn flows. It is designed for applications that need ledger-level ownership and metadata operations, and it aligns with the network model described by [IOTA](https://docs.iota.org).

## Installation

```shell
npm install @twin.org/nft-connector-iota
```

## Docker

To perform testing of this component it may be necessary to launch a local instance of the gas station to communicate with.

```shell
docker run -d --name twin-gas-station-test -p 6379:6379 -p 9527:9527 -p 9184:9184 -e IOTA_NODE_URL="https://api.testnet.iota.cafe" -e GAS_STATION_AUTH="qEyCL6d9BKKFl/tfDGAKeGFkhUlf7FkqiGV7Xw4JUsI=" -e GAS_STATION_KEYPAIR="..." twinfoundation/twin-gas-station-test:latest
```

To generate `GAS_STATION_KEYPAIR` see <https://github.com/3sixtyglobal/twin-dlt/blob/main/packages/dlt-iota/README.md>

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)

## Origin

This package is derived from the original [iotaledger/twin-nft](https://github.com/iotaledger/twin-nft/tree/next/packages/nft-connector-iota) repository.
