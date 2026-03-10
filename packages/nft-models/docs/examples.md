# NFT Models Examples

These examples focus on connector contracts and shared request models so multiple implementations can follow the same API surface.

## NftConnectorFactory

```typescript
import { NftConnectorFactory, type INftConnector } from '@twin.org/nft-models';

class MockNftConnector implements INftConnector {
  public className(): string {
    return 'MockNftConnector';
  }

  public async mint(controllerIdentity: string, tag: string): Promise<string> {
    return `nft:entity-storage:${controllerIdentity}:${tag}`;
  }

  public async resolve(id: string): Promise<{ issuer: string; owner: string; tag: string }> {
    return {
      issuer: 'did:example:issuer-1',
      owner: 'did:example:owner-1',
      tag: id
    };
  }

  public async burn(): Promise<void> {}

  public async transfer(): Promise<void> {}

  public async update(): Promise<void> {}
}

NftConnectorFactory.register('mock-nft', () => new MockNftConnector());

const connectorNames = NftConnectorFactory.names();
const connector = NftConnectorFactory.get<INftConnector>('mock-nft');

console.log(connectorNames.includes('mock-nft')); // true
console.log(connector.className()); // MockNftConnector
```

## INftComponent Request Shapes

```typescript
import type {
  IIrc27Metadata,
  INftMintRequest,
  INftTransferRequest,
  INftUpdateRequest
} from '@twin.org/nft-models';

const immutableMetadata: IIrc27Metadata = {
  standard: 'IRC27',
  version: 'v1.0',
  type: 'image/png',
  uri: 'ipfs://bafybeigdyr...',
  name: 'Genesis Badge',
  description: 'A launch collectible'
};

const mintRequest: INftMintRequest = {
  tag: 'genesis-badge',
  immutableMetadata,
  metadata: {
    season: 1,
    rarity: 'legendary'
  },
  namespace: 'iota'
};

const transferRequest: INftTransferRequest = {
  recipientIdentity: 'did:example:collector-8',
  recipientAddress: '0x5df99c44d4f6f66d5a7f7298f46a0fdb6a4ac23a',
  metadata: {
    transferredAt: '2026-03-10T10:00:00.000Z'
  }
};

const updateRequest: INftUpdateRequest = {
  metadata: {
    rarity: 'mythic',
    season: 2
  }
};

console.log(mintRequest.namespace); // iota
console.log(transferRequest.recipientIdentity); // did:example:collector-8
console.log(updateRequest.metadata.season); // 2
```
