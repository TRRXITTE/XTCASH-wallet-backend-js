import { SynchronizationStatusJSON } from './JsonSerialization';
export declare class SynchronizationStatus {
    static fromJSON(json: SynchronizationStatusJSON): SynchronizationStatus;
    private blockHashCheckpoints;
    private lastKnownBlockHashes;
    private lastKnownBlockHeight;
    private lastSavedCheckpointAt;
    constructor(startHeight?: number);
    toJSON(): SynchronizationStatusJSON;
    getHeight(): number;
    storeBlockHash(blockHeight: number, blockHash: string): void;
    getBlockCheckpoints(): string[];
    getRecentBlockHashes(): string[];
}
