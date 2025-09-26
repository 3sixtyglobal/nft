module nft::nft {
    use std::string::String;

    /// Current version of the NFT contract
    const VERSION: u64 = 1;



    /// MigrationState tracks whether migration operations are enabled
    public struct MigrationState has key {
        id: UID,
        enabled: bool,
    }

    /// UpgradeCapRegistry stores reference to upgrade capabilities
    public struct UpgradeCapRegistry has key {
        id: UID,
        upgrade_cap_id: address,
    }

    /// Initialize the contract by creating tooling infrastructure
    fun init(ctx: &mut TxContext) {
        let migration_state = MigrationState {
            id: object::new(ctx),
            enabled: false,
        };
        transfer::share_object(migration_state);

        let upgrade_registry = UpgradeCapRegistry {
            id: object::new(ctx),
            upgrade_cap_id: @0x0,
        };
        transfer::share_object(upgrade_registry);
    }

    /// The NFT struct representing our NFT object.
    public struct NFT has key, store {
        id: UID,
        version: u64, // Version of the contract that created this NFT
        immutable_metadata: String, // All immutable data as JSON,
        tag: String,
        metadata: String, // Mutable metadata
        issuer: address,
        issuerIdentity: String,
        ownerIdentity: String
    }


    /// Mint a new NFT and transfer it to the issuer.
    public entry fun mint(
        immutable_metadata: String,
        tag: String,
        issuer: address,
        metadata: String,
        issuerIdentity: String,
        ownerIdentity: String,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            version: VERSION,
            immutable_metadata,
            tag,
            metadata,
            issuer,
            issuerIdentity,
            ownerIdentity
        };
        transfer::transfer(nft, issuer);
    }

    /// Update the mutable metadata of the NFT.
    public entry fun update_metadata(nft: &mut NFT, new_metadata: String) {
        nft.metadata = new_metadata;
    }

    /// Transfer without metadata update
    /// Version-flexible: Works with NFTs of any version for basic ownership transfer
    public entry fun transfer(
        mut nft: NFT, // Take ownership directly
        recipient: address,
        recipientIdentity: String
    ) {
        // No version assertion - basic transfers should work regardless of NFT version
        nft.ownerIdentity = recipientIdentity;

        transfer::public_transfer(nft, recipient);
    }

    /// Transfer with metadata update
    public entry fun transfer_with_metadata(
        mut nft: NFT, // Take ownership directly
        recipient: address,
        recipientIdentity: String,
        metadata: String
    ) {
        nft.ownerIdentity = recipientIdentity;

        update_metadata(&mut nft, metadata);

        transfer::public_transfer(nft, recipient);
    }

    /// Burn the NFT.
    /// Version-flexible: Owners should always be able to destroy their NFTs regardless of version
    public entry fun burn(nft: NFT) {
        // No version assertion - burning should work for NFTs of any version
        let NFT {
            id,
            version: _,
            immutable_metadata: _,
            tag: _,
            metadata: _,
            issuer: _,
            issuerIdentity: _,
            ownerIdentity: _
        } = nft;
        object::delete(id);
    }

    /// Get the current contract version
    public fun get_current_version(): u64 {
        VERSION
    }

    /// Get NFT version without modifying the NFT
    public fun get_nft_version(nft: &NFT): u64 {
        nft.version
    }
}
