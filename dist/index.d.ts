import { ethers } from "ethers";
export declare const abiConcat: (arr: any) => unknown[];
export declare const getCallKey: (target: string, func: Function, args?: any[], chainId?: number) => any;
export declare const buildCall: (target: string, func: Function, args: any[], argsList?: any[][], chainId?: number) => any;
export declare const createChainQuery: (iface: ethers.utils.Interface, provider: ethers.providers.Provider, maxCallQueue?: number, queueCallDelay?: number, strict?: boolean, verbosity?: number) => {
    (target: string, func: Function, args: any[], argsList: any[][]): [any];
    useStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<{
        iface: ethers.utils.Interface;
        provider: ethers.providers.Provider;
        cachedResults: {};
        queuedCalls: {};
        dispatchedCalls: {};
        failedCalls: {};
        queueTimeout: undefined;
        updateInterface(iface: ethers.utils.Interface): void;
        updateProvider(provider: ethers.providers.Provider): void;
        getQueryResult(target: string, func: Function, args: [any]): any;
        queueCall(target: string, func: Function, args: [any]): void;
        runQueueDispatchCheck(): void;
        dispatchQueuedCalls(): void;
        dispatchCalls(calls: object): Promise<void>;
    }>, "subscribe"> & {
        subscribe: {
            (listener: (selectedState: {
                iface: ethers.utils.Interface;
                provider: ethers.providers.Provider;
                cachedResults: {};
                queuedCalls: {};
                dispatchedCalls: {};
                failedCalls: {};
                queueTimeout: undefined;
                updateInterface(iface: ethers.utils.Interface): void;
                updateProvider(provider: ethers.providers.Provider): void;
                getQueryResult(target: string, func: Function, args: [any]): any;
                queueCall(target: string, func: Function, args: [any]): void;
                runQueueDispatchCheck(): void;
                dispatchQueuedCalls(): void;
                dispatchCalls(calls: object): Promise<void>;
            }, previousSelectedState: {
                iface: ethers.utils.Interface;
                provider: ethers.providers.Provider;
                cachedResults: {};
                queuedCalls: {};
                dispatchedCalls: {};
                failedCalls: {};
                queueTimeout: undefined;
                updateInterface(iface: ethers.utils.Interface): void;
                updateProvider(provider: ethers.providers.Provider): void;
                getQueryResult(target: string, func: Function, args: [any]): any;
                queueCall(target: string, func: Function, args: [any]): void;
                runQueueDispatchCheck(): void;
                dispatchQueuedCalls(): void;
                dispatchCalls(calls: object): Promise<void>;
            }) => void): () => void;
            <U>(selector: (state: {
                iface: ethers.utils.Interface;
                provider: ethers.providers.Provider;
                cachedResults: {};
                queuedCalls: {};
                dispatchedCalls: {};
                failedCalls: {};
                queueTimeout: undefined;
                updateInterface(iface: ethers.utils.Interface): void;
                updateProvider(provider: ethers.providers.Provider): void;
                getQueryResult(target: string, func: Function, args: [any]): any;
                queueCall(target: string, func: Function, args: [any]): void;
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
