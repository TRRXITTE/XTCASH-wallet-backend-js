import { MixinLimits } from './MixinLimits';
/**
 * Configuration for the wallet backend.
 *
 * Everything is optional.
 */
export interface IConfig {
    /**
     * The amount of decimal places your coin has, e.g. traaittCASH has two
     * decimals
     */
    decimalPlaces?: number;
    /**
     * The address prefix your coin uses - you can find this in CryptoNoteConfig.h.
     * In traaittCASH, this converts to cash
     */
    addressPrefix?: number;
    /**
     * Request timeout for daemon operations in milliseconds
     */
    requestTimeout?: number;
    /**
     * The block time of your coin, in seconds
     */
    blockTargetTime?: number;
    /**
     * How often to process blocks, in millseconds
     */
    syncThreadInterval?: number;
    /**
     * How often to update the daemon info
     */
    daemonUpdateInterval?: number;
    /**
     * How often to check on locked transactions
     */
    lockedTransactionsCheckInterval?: number;
    /**
     * The amount of blocks to process per 'tick' of the mainloop. Note: too
     * high a value will cause the event loop to be blocked, and your interaction
     * to be laggy.
     */
    blocksPerTick?: number;
    /**
     * Your coins 'ticker', generally used to refer to the coin, i.e. 123 TR
     */
    ticker?: string;
    /**
     * Most people haven't mined any blocks, so lets not waste time scanning
     * them
     */
    scanCoinbaseTransactions?: boolean;
    /**
     * The minimum fee allowed for transactions, in ATOMIC units
     */
    minimumFee?: number;
    /**
     * Mapping of height to mixin maximum and mixin minimum
     */
    mixinLimits?: MixinLimits;
    /**
     * The length of a standard address for your coin
     */
    standardAddressLength?: number;
    /**
     * The length of an integrated address for your coin - It's the same as
     * a normal address, but there is a paymentID included in there - since
     * payment ID's are 64 chars, and base58 encoding is done by encoding
     * chunks of 8 chars at once into blocks of 11 chars, we can calculate
     * this automatically
     */
    integratedAddressLength?: number;
    /**
     * A replacement function for the JS/C++ underivePublicKey.
     */
    underivePublicKey?: (derivation: string, outputIndex: number, outputKey: string) => string;
    /**
     * A replacement function for the JS/C++ derivePublicKey.
     */
    derivePublicKey?: (derivation: string, outputIndex: number, publicKey: string) => string;
    /**
     * A replacement function for the JS/C++ deriveSecretKey.
     */
    deriveSecretKey?: (derivation: string, outputIndex: number, privateKey: string) => string;
    /**
     * A replacement function for the JS/C++ generateKeyImage.
     */
    generateKeyImage?: (publicKey: string, privateKey: string) => string;
    /**
     * A replacement function for the JS/C++ secretKeyToPublicKey.
     */
    secretKeyToPublicKey?: (privateKey: string) => string;
    /**
     * A replacement function for the JS/C++ cnFastHash.
     */
    cnFastHash?: (input: string) => string;
    /**
     * A replacement function for the JS/C++ generateRingSignatures.
     */
    generateRingSignatures?: (transactionPrefixHash: string, keyImage: string, inputKeys: string[], privateKey: string, realIndex: number) => string[];
    /**
     * A replacement function for the JS/C++ checkRingSignatures.
     */
    checkRingSignatures?: (transactionPrefixHash: string, keyImage: string, publicKeys: string[], signatures: string[]) => boolean;
    /**
     * A replacement function for the JS/C++ generateKeyDerivation.
     */
    generateKeyDerivation?: (transactionPublicKey: string, privateViewKey: string) => string;
    /**
     * The max amount of memory to use, storing downloaded blocks to be processed.
     */
    blockStoreMemoryLimit?: number;
    /**
     * The amount of blocks to take from the daemon per request. Cannot take
     * more than 100.
     */
    blocksPerDaemonRequest?: number;
    /**
     * The amount of seconds to permit not having fetched a block from the
     * daemon before emitting 'deadnode'. Note that this just means contacting
     * the daemon for data - if you are synced and it returns TopBlock - the
     * event will not be emitted.
     */
    maxLastFetchedBlockInterval?: number;
    /**
     * The amount of seconds to permit not having fetched a new network height
     * from the daemon before emitting 'deadnode'.
     */
    maxLastUpdatedNetworkHeightInterval?: number;
    /**
     * The amount of seconds to permit not having fetched a new local height
     * from the daemon before emitting 'deadnode'.
     */
    maxLastUpdatedLocalHeightInterval?: number;
    /**
     * Allows specifying a custom user agent string to use with requests.
     */
    customUserAgentString?: string;
    /**
     * Allows specifying a custom configuration object for the request module.
     */
    customRequestOptions?: any;
    [key: string]: any;
}
/**
 * Configuration for the wallet backend
 *
 * @hidden
 */
export declare class Config implements IConfig {
    /**
     * The amount of decimal places your coin has, e.g. traaittCASH has eight
     * decimals
     */
    decimalPlaces: number;
    /**
     * The address prefix your coin uses - you can find this in CryptoNoteConfig.h.
     * In traaittCASH, this converts to cash
     */
    addressPrefix: number;
    /**
     * Request timeout for daemon operations in milliseconds
     */
    requestTimeout: number;
    /**
     * The block time of your coin, in seconds
     */
    blockTargetTime: number;
    /**
     * How often to process blocks, in millseconds
     */
    syncThreadInterval: number;
    /**
     * How often to update the daemon info
     */
    daemonUpdateInterval: number;
    /**
     * How often to check on locked transactions
     */
    lockedTransactionsCheckInterval: number;
    /**
     * The amount of blocks to process per 'tick' of the mainloop. Note: too
     * high a value will cause the event loop to be blocked, and your interaction
     * to be laggy.
     */
    blocksPerTick: number;
    /**
     * Your coins 'ticker', generally used to refer to the coin, i.e. 123 TR
     */
    ticker: string;
    /**
     * Most people haven't mined any blocks, so lets not waste time scanning
     * them
     */
    scanCoinbaseTransactions: boolean;
    /**
     * The minimum fee allowed for transactions, in ATOMIC units
     */
    minimumFee: number;
    /**
     * Mapping of height to mixin maximum and mixin minimum
     */
    mixinLimits: MixinLimits;
    /**
     * The length of a standard address for your coin
     */
    standardAddressLength: number;
    integratedAddressLength: number;
    /**
     * A replacement function for the JS/C++ underivePublicKey.
     */
    underivePublicKey?: (derivation: string, outputIndex: number, outputKey: string) => string;
    /**
     * A replacement function for the JS/C++ derivePublicKey.
     */
    derivePublicKey?: (derivation: string, outputIndex: number, publicKey: string) => string;
    /**
     * A replacement function for the JS/C++ deriveSecretKey.
     */
    deriveSecretKey?: (derivation: string, outputIndex: number, privateKey: string) => string;
    /**
     * A replacement function for the JS/C++ generateKeyImage.
     */
    generateKeyImage?: (publicKey: string, privateKey: string) => string;
    /**
     * A replacement function for the JS/C++ secretKeyToPublicKey.
     */
    secretKeyToPublicKey?: (privateKey: string) => string;
    /**
     * A replacement function for the JS/C++ cnFastHash.
     */
    cnFastHash?: (input: string) => string;
    /**
     * A replacement function for the JS/C++ generateRingSignatures.
     */
    generateRingSignatures?: (transactionPrefixHash: string, keyImage: string, inputKeys: string[], privateKey: string, realIndex: number) => string[];
    /**
     * A replacement function for the JS/C++ checkRingSignatures.
     */
    checkRingSignatures?: (transactionPrefixHash: string, keyImage: string, publicKeys: string[], signatures: string[]) => boolean;
    /**
     * A replacement function for the JS/C++ generateKeyDerivation.
     */
    generateKeyDerivation?: (transactionPublicKey: string, privateViewKey: string) => string;
    /**
     * The amount of memory to use storing downloaded blocks - 50MB
     */
    blockStoreMemoryLimit: number;
    /**
     * The amount of blocks to take from the daemon per request. Cannot take
     * more than 100.
     */
    blocksPerDaemonRequest: number;
    /**
     * The amount of seconds to permit not having fetched a block from the
     * daemon before emitting 'deadnode'. Note that this just means contacting
     * the daemon for data - if you are synced and it returns TopBlock - the
     * event will not be emitted.
     */
    maxLastFetchedBlockInterval: number;
    /**
     * The amount of seconds to permit not having fetched a new network height
     * from the daemon before emitting 'deadnode'.
     */
    maxLastUpdatedNetworkHeightInterval: number;
    /**
     * The amount of seconds to permit not having fetched a new local height
     * from the daemon before emitting 'deadnode'.
     */
    maxLastUpdatedLocalHeightInterval: number;
    /**
     * Allows setting a customer user agent string
     */
    customUserAgentString: string;
    /**
     * Allows specifying a custom configuration object for the request module.
     */
    customRequestOptions: any;
    [key: string]: any;
}
/**
 * Merge the default config with the provided config
 *
 * @hidden
 */
export declare function MergeConfig(config?: IConfig, currentConfig?: Config): Config;
