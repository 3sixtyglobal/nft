# NFT Connector IOTA Examples

These snippets show a practical lifecycle for network-backed NFTs: initialisation, minting, reading, transferring, metadata updates, and burn flows.

## IotaNftConnector

```typescript
import { IotaNftConnector, type IIotaNftConnectorConfig } from '@twin.org/nft-connector-iota';

interface ImmutableProfile {
  standard: 'IRC27';
  version: 'v1.0';
  type: string;
  uri: string;
  name: string;
}

interface MutableProfile {
  status: 'draft' | 'published';
  likes: number;
}

const config: IIotaNftConnectorConfig = {
  network: 'devnet',
  clientOptions: {
    nodes: ['https://api.devnet.iota.cafe']
  },
  contractName: 'nft',
  walletAddressIndex: 0,
  gasBudget: 1_000_000_000
};

const connector = new IotaNftConnector({ config });

await connector.start('logging');

console.log(connector.className()); // IotaNftConnector

const nftId = await connector.mint<ImmutableProfile, MutableProfile>(
  'did:example:issuer-1',
  'music-pass',
  {
    standard: 'IRC27',
    version: 'v1.0',
    type: 'audio/flac',
    uri: 'ipfs://bafybeif34...',
    name: 'Backstage Pass'
  },
  {
    status: 'draft',
    likes: 0
  }
);

const resolved = await connector.resolve<ImmutableProfile, MutableProfile>(nftId);

console.log(resolved.owner); // did:example:issuer-1
console.log(resolved.metadata?.likes); // 0
```

```typescript
import { IotaNftConnector, type IIotaNftConnectorConfig } from '@twin.org/nft-connector-iota';

interface MutableProfile {
  status: 'draft' | 'published';
  likes: number;
}

const config: IIotaNftConnectorConfig = {
  network: 'devnet',
  clientOptions: {
    nodes: ['https://api.devnet.iota.cafe']
  }
};

const connector = new IotaNftConnector({ config });

await connector.start();

const controller = 'did:example:issuer-1';
const recipient = 'did:example:collector-9';
const recipientAddress = '0x5df99c44d4f6f66d5a7f7298f46a0fdb6a4ac23a';

const nftId = await connector.mint(controller, 'tradeable');

await connector.transfer<MutableProfile>(controller, nftId, recipient, recipientAddress, {
  status: 'published',
  likes: 2
});

await connector.update<MutableProfile>(recipient, nftId, {
  status: 'published',
  likes: 9
});

const updated = await connector.resolve<Record<string, never>, MutableProfile>(nftId);

console.log(updated.owner); // did:example:collector-9
console.log(updated.metadata?.status); // published
```

```typescript
import { IotaNftConnector, type IIotaNftConnectorConfig } from '@twin.org/nft-connector-iota';

const config: IIotaNftConnectorConfig = {
  network: 'devnet',
  clientOptions: {
    nodes: ['https://api.devnet.iota.cafe']
  }
};

const connector = new IotaNftConnector({ config });
await connector.start();

const controller = 'did:example:issuer-1';
const nftId = await connector.mint(controller, 'to-burn');

await connector.burn(controller, nftId);
```

## IotaNftUtils

```typescript
import { IotaNftUtils } from '@twin.org/nft-connector-iota';

const nftId = 'nft:iota:devnet:0xpackage:0xobject';

const packageId = IotaNftUtils.nftIdToPackageId(nftId);
const objectId = IotaNftUtils.nftIdToObjectId(nftId);

console.log(packageId); // 0xpackage
console.log(objectId); // 0xobject
```
