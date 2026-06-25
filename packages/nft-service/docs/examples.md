# NFT Service Examples

Use these snippets to route NFT operations through a service layer so your application can switch connector backends without changing business logic.

## NftService

```typescript
import { EntityStorageNftConnector } from '@twin.org/nft-connector-entity-storage';
import { NftConnectorFactory } from '@twin.org/nft-models';
import { NftService } from '@twin.org/nft-service';

interface ImmutableProfile {
  standard: 'IRC27';
  version: 'v1.0';
  type: string;
  uri: string;
  name: string;
}

interface MutableProfile {
  stage: 'draft' | 'live';
  revisions: number;
}

NftConnectorFactory.register(
  EntityStorageNftConnector.NAMESPACE,
  () => new EntityStorageNftConnector()
);

const service = new NftService({
  config: {
    defaultNamespace: EntityStorageNftConnector.NAMESPACE
  }
});

console.log(service.className()); // NftService

const controller = 'did:example:issuer-42';

const nftId = await service.mint<ImmutableProfile, MutableProfile>(
  'release-pass',
  {
    standard: 'IRC27',
    version: 'v1.0',
    type: 'image/jpeg',
    uri: 'ipfs://bafybeie11...',
    name: 'Release Pass'
  },
  {
    stage: 'draft',
    revisions: 1
  },
  EntityStorageNftConnector.NAMESPACE,
  controller
);

const resolved = await service.resolve<ImmutableProfile, MutableProfile>(nftId, controller);

console.log(resolved.owner); // did:example:issuer-42
console.log(resolved.metadata?.revisions); // 1
```

```typescript
import { EntityStorageNftConnector } from '@twin.org/nft-connector-entity-storage';
import { NftConnectorFactory } from '@twin.org/nft-models';
import { NftService } from '@twin.org/nft-service';

interface MutableProfile {
  stage: 'draft' | 'live';
  revisions: number;
}

NftConnectorFactory.register(
  EntityStorageNftConnector.NAMESPACE,
  () => new EntityStorageNftConnector()
);

const service = new NftService();
const controller = 'did:example:issuer-42';

const nftId = await service.mint(
  'release-pass',
  { frozen: false },
  { stage: 'draft', revisions: 1 },
  EntityStorageNftConnector.NAMESPACE,
  controller
);

await service.transfer<MutableProfile>(
  nftId,
  'did:example:collector-24',
  'addr:example:collector-24',
  {
    stage: 'live',
    revisions: 2
  },
  controller
);

await service.update<MutableProfile>(nftId, { stage: 'live', revisions: 3 }, controller);

await service.burn(nftId, controller);
```
