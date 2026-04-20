module nft::nft {
    use std::string::String;
    use iota_identity::identity::Identity;
    use iota_identity::controller::ControllerCap;

    /// Current version of the NFT contract
    const VERSION: u64 = 1;

    /// Identity object is deleted/deactivated — cannot mint with a deleted identity
    const EIdentityDeleted: u64 = 1;
    /// ControllerCap does not control the claimed identity
    const EControllerMismatch: u64 = 2;


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
        /// Stores the on-chain Object ID (as address) of the verified IOTA Identity that minted
        /// this NFT. Set via mint_with_identity() — @0x0 when minted via the unverified mint().
        issuerIdentityId: address,
    }


    /// Mint a new NFT and transfer it to the issuer.
    /// issuerIdentityId is stored as @0x0 (zero address) — use mint_with_identity() for
    /// cryptographically verified identity binding.
    public entry fun mint(
        immutable_metadata: String,
        tag: String,
        issuer: address,
        metadata: String,
        ctx: &mut TxContext
    ) {
        let nft = NFT {
            id: object::new(ctx),
            version: VERSION,
            immutable_metadata,
            tag,
            metadata,
            issuer,
            issuerIdentityId: @0x0000000000000000000000000000000000000000000000000000000000000000,
        };
        transfer::transfer(nft, issuer);
    }

    /// Mint a new NFT with cryptographically verified on-chain identity binding.
    /// Verifies that the caller controls the claimed IOTA Identity before recording it.
    /// The issuerIdentityId field is set to the Identity's on-chain Object ID (as address).
    public entry fun mint_with_identity(
        immutable_metadata: String,
        tag: String,
        metadata: String,
        identity: &Identity,
        controller_cap: &ControllerCap,
        ctx: &mut TxContext
    ) {
        // Verify the identity has not been deleted/deactivated
        assert!(!iota_identity::identity::deleted(identity), EIdentityDeleted);

        // Verify the ControllerCap actually controls the claimed identity
        assert!(
            iota_identity::controller::controller_of(controller_cap) == object::id(identity),
            EControllerMismatch
        );

        let nft = NFT {
            id: object::new(ctx),
            version: VERSION,
            immutable_metadata,
            tag,
            metadata,
            issuer: tx_context::sender(ctx),
            issuerIdentityId: object::id(identity).to_address(),
        };
        transfer::transfer(nft, tx_context::sender(ctx));
    }

    /// Update the mutable metadata of the NFT.
    public entry fun update_metadata(nft: &mut NFT, new_metadata: String) {
        nft.metadata = new_metadata;
    }

    /// Transfer without metadata update
    /// Version-flexible: Works with NFTs of any version for basic ownership transfer
    public entry fun transfer(
        nft: NFT,
        recipient: address,
    ) {
        transfer::public_transfer(nft, recipient);
    }

    /// Transfer with metadata update
    public entry fun transfer_with_metadata(
        mut nft: NFT,
        recipient: address,
        metadata: String
    ) {
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
            issuerIdentityId: _,
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
