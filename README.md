# 3Sixty NFT

This repository provides modular components for creating, managing, and integrating non-fungible tokens across application, service, and connector layers. The packages are designed to share a consistent contract model so teams can build tooling, APIs, and command line flows without duplicating core NFT logic.

The codebase combines reusable models, connector implementations, service endpoints, and client tooling so the same operation flow can be used in local storage and network-backed environments. This makes it easier to move from development to production while retaining a coherent API surface.

## Packages

- [nft-models](packages/nft-models/README.md) - Shared NFT interfaces, request and response models, and connector contracts.
- [nft-connector-iota](packages/nft-connector-iota/README.md) - IOTA-backed NFT connector for network operations and on-ledger state.
- [nft-connector-entity-storage](packages/nft-connector-entity-storage/README.md) - Entity storage NFT connector for local persistence and test-oriented workflows.
- [nft-service](packages/nft-service/README.md) - NFT service orchestration with REST route generation.
- [nft-rest-client](packages/nft-rest-client/README.md) - HTTP client for calling NFT service endpoints from applications.

## Apps

- [nft-cli](apps/nft-cli/README.md) - Command line application for running end-to-end NFT operations.

## Contributing

To contribute to this package see the guidelines for building and publishing in [CONTRIBUTING](./CONTRIBUTING.md)

## Origin

This repository is derived from the original [iotaledger/twin-nft](https://github.com/iotaledger/twin-nft) repository.
