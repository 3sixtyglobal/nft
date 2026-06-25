# NFT Connector Entity Storage Examples

Use these examples to bootstrap an in-memory NFT flow for local development, integration tests, and quick contract-free prototyping.

## EntityStorageNftConnector

```typescript
import { EntityStorageNftConnector } from '@twin.org/nft-connector-entity-storage';

interface ImmutableProfile {
  standard: 'IRC27';
  version: 'v1.0';
  type: string;
  uri: string;
  name: string;
}

interface MutableProfile {
  status: 'draft' | 'published';
  views: number;
}

const connector = new EntityStorageNftConnector({
  nftEntityStorageType: 'nft'
});

console.log(connector.className()); // EntityStorageNftConnector

const nftId = await connector.mint<ImmutableProfile, MutableProfile>(
  'did:example:issuer-1',
  'collectible',
  {
    standard: 'IRC27',
    version: 'v1.0',
    type: 'image/png',
    uri: 'ipfs://bafybeic4h2...',
    name: 'Genesis Collectible'
  },
  {
    status: 'draft',
    views: 0
  }
);

console.log(nftId); // nft:entity-storage:<generated-id>

const resolved = await connector.resolve<ImmutableProfile, MutableProfile>(nftId);

console.log(resolved.issuer); // did:example:issuer-1
console.log(resolved.tag); // collectible
console.log(resolved.metadata?.status); // draft
```

```typescript
import { EntityStorageNftConnector } from '@twin.org/nft-connector-entity-storage';

interface MutableProfile {
  status: 'draft' | 'published';
  views: number;
}

const connector = new EntityStorageNftConnector();
const controllerIdentity = 'did:example:issuer-1';
const recipientIdentity = 'did:example:owner-2';
const recipientAddress = 'addr:example:owner-2';

const nftId = await connector.mint(controllerIdentity, 'collectible');

await connector.transfer<MutableProfile>(
  controllerIdentity,
  nftId,
  recipientIdentity,
  recipientAddress,
  {
    status: 'published',
    views: 10
  }
);

await connector.update<MutableProfile>(controllerIdentity, nftId, {
  status: 'published',
  views: 25
});

const updated = await connector.resolve<Record<string, never>, MutableProfile>(nftId);

console.log(updated.owner); // did:example:owner-2
console.log(updated.metadata?.views); // 25
```

```typescript
import { EntityStorageNftConnector } from '@twin.org/nft-connector-entity-storage';

const connector = new EntityStorageNftConnector();
const controllerIdentity = 'did:example:issuer-1';

const nftId = await connector.mint(controllerIdentity, 'to-burn');

await connector.burn(controllerIdentity, nftId);

try {
  await connector.resolve(nftId);
} catch (error) {
  console.log(error instanceof Error); // true
}
```

## Schema Initialisation

```typescript
import { initSchema } from '@twin.org/nft-connector-entity-storage';

initSchema();
```
