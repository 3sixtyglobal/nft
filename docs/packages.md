# NFT Packages

## nft-models

This package defines shared NFT domain contracts, request and response shapes, and connector interfaces used across the repository. It provides the common language that keeps connector, service, and client implementations aligned, so integrations stay consistent as features evolve.

- [README](../packages/nft-models/README.md)
- [Examples](../packages/nft-models/docs/examples.md)
- [Changelog](../packages/nft-models/docs/changelog.md)

## nft-connector-iota

This package implements NFT operations on the IOTA network, including minting, transfer, update, resolve, and burn workflows. It is useful when applications need network-backed ownership and metadata state, and it follows the network model documented by [IOTA](https://docs.iota.org).

- [README](../packages/nft-connector-iota/README.md)
- [Examples](../packages/nft-connector-iota/docs/examples.md)
- [Changelog](../packages/nft-connector-iota/docs/changelog.md)

## nft-connector-entity-storage

This package provides an entity-storage-backed connector for NFT operations, designed for local workflows, testing, and storage abstraction scenarios. It offers a straightforward persistence option that can be used without network deployment while keeping the same connector interface.

- [README](../packages/nft-connector-entity-storage/README.md)
- [Examples](../packages/nft-connector-entity-storage/docs/examples.md)
- [Changelog](../packages/nft-connector-entity-storage/docs/changelog.md)

## nft-service

This package provides service-layer orchestration and REST route definitions for NFT operations. It centralises connector selection and operation handling so API-facing components can use a single service boundary.

- [README](../packages/nft-service/README.md)
- [Examples](../packages/nft-service/docs/examples.md)
- [Changelog](../packages/nft-service/docs/changelog.md)

## nft-rest-client

This package provides a REST client for invoking NFT service endpoints from external applications and tools. It helps consumers call mint, resolve, transfer, update, and burn operations through a consistent HTTP interface.

- [README](../packages/nft-rest-client/README.md)
- [Examples](../packages/nft-rest-client/docs/examples.md)
- [Changelog](../packages/nft-rest-client/docs/changelog.md)
