import { ethers } from "ethers";
export declare const abiConcat: (arr: any) => unknown[];
export declare const getCallKey: (target: string, func: string, args?: any[], chainId?: number) => any;
export declare const buildCall: (target: string, func: string, args: any[], argsList?: any[][], chainId?: number) => any;
export declare const createChainQuery: (iface: ethers.utils.Interface, provider: ethers.providers.Provider, maxCallQueue?: number, queueCallDelay?: number, strict?: boolean, verbosity?: number) => {
    (target: string, func: string, args: any[], argsList: any[][]): [any];
    useStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<{
        iface: ethers.utils.Interface;
        provider: ethers.providers.Provider;
        chainId: undefined;
        cachedResults: {};
        queuedCalls: {};
        dispatchedCalls: {};
        failedCalls: {};
        lastUpdateTime: {};
        queueTimeout: undefined;
        updateInterface(iface: ethers.utils.Interface): void;
        updateProvider(provider: ethers.providers.Provider): void;
        updateChainId(chainId: number): void;
        getQueryResult(target: string, func: string, args: any[]): any;
        queueCall(target: string, func: string, args: any[]): void;
        runQueueDispatchCheck(): void;
        dispatchQueuedCalls(): void;
        dispatchCalls(calls: object): Promise<void>;
    }>, "subscribe"> & {
        subscribe: {
            (listener: (selectedState: {
                iface: ethers.utils.Interface;
                provider: ethers.providers.Provider;
                chainId: undefined;
                cachedResults: {};
                queuedCalls: {};
                dispatchedCalls: {};
                failedCalls: {};
                lastUpdateTime: {};
                queueTimeout: undefined;
                updateInterface(iface: ethers.utils.Interface): void;
                updateProvider(provider: ethers.providers.Provider): void;
                updateChainId(chainId: number): void;
                getQueryResult(target: string, func: string, args: any[]): any;
                queueCall(target: string, func: string, args: any[]): void;
                runQueueDispatchCheck(): void;
                dispatchQueuedCalls(): void;
                dispatchCalls(calls: object): Promise<void>;
            }, previousSelectedState: {
                iface: ethers.utils.Interface;
                provider: ethers.providers.Provider;
                chainId: undefined;
                cachedResults: {};
                queuedCalls: {};
                dispatchedCalls: {};
                failedCalls: {};
                lastUpdateTime: {};
                queueTimeout: undefined;
                updateInterface(iface: ethers.utils.Interface): void;
                updateProvider(provider: ethers.providers.Provider): void;
                updateChainId(chainId: number): void;
                getQueryResult(target: string, func: string, args: any[]): any;
                queueCall(target: string, func: string, args: any[]): void;
                runQueueDispatchCheck(): void;
                dispatchQueuedCalls(): void;
                dispatchCalls(calls: object): Promise<void>;
            }) => void): () => void;
            <U>(selector: (state: {
                iface: ethers.utils.Interface;
                provider: ethers.providers.Provider;
                chainId: undefined;
                cachedResults: {};
                queuedCalls: {};
                dispatchedCalls: {};
                failedCalls: {};
                lastUpdateTime: {};
                queueTimeout: undefined;
                updateInterface(iface: ethers.utils.Interface): void;
                updateProvider(provider: ethers.providers.Provider): void;
                updateChainId(chainId: number): void;
                getQueryResult(target: string, func: string, args: any[]): any;
                queueCall(target: string, func: string, args: any[]): void;
                runQueueDispatchCheck(): void;
                dispatchQueuedCalls(): void;
                dispatchCalls(calls: object): Promise<void>;
            }) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
                equalityFn?: ((a: U, b: U) => boolean) | undefined;
                fireImmediately?: boolean | undefined;
            } | undefined): () => void;
        };
    }>;
};
export declare function multiCall(provider: ethers.providers.Provider, iface: ethers.utils.Interface, calls: any[], strict: boolean): Promise<any>;
