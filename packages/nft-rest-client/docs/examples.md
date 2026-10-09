# NFT REST Client Examples

These examples show how to integrate the REST client into application code for common lifecycle operations and endpoint-driven workflows.

## NftRestClient

```typescript
import { NftRestClient } from '@3sixty/nft-rest-client';

interface ImmutableProfile {
  standard: 'IRC27';
  version: 'v1.0';
  type: string;
  uri: string;
  name: string;
}

interface MutableProfile {
  status: 'queued' | 'published';
  rating: number;
}

const client = new NftRestClient({
  endpoint: 'https://api.example.org',
  basePath: '/',
  headers: {
    Authorization: 'Bearer <token>'
  }
});

console.log(client.className()); // NftRestClient

const nftId = await client.mint<ImmutableProfile, MutableProfile>(
  'release-token',
  {
    standard: 'IRC27',
    version: 'v1.0',
    type: 'application/json',
    uri: 'ipfs://bafybeie5c...',
    name: 'Release Token'
  },
  {
    status: 'queued',
    rating: 0
  },
  'iota'
);

const resolved = await client.resolve<ImmutableProfile, MutableProfile>(nftId);

console.log(resolved.tag); // release-token
console.log(resolved.metadata?.status); // queued
```

```typescript
import { NftRestClient } from '@3sixty/nft-rest-client';

interface MutableProfile {
  status: 'queued' | 'published';
  rating: number;
}

const client = new NftRestClient({
  endpoint: 'https://api.example.org',
  basePath: '/'
});

const nftId = 'nft:iota:devnet:0xpackage:0xobject';

await client.transfer<MutableProfile>(
  nftId,
  'did:example:collector-7',
  '0x5df99c44d4f6f66d5a7f7298f46a0fdb6a4ac23a',
  {
    status: 'published',
    rating: 5
  }
);

await client.update<MutableProfile>(nftId, {
  status: 'published',
  rating: 8
});

await client.burn(nftId);
```
