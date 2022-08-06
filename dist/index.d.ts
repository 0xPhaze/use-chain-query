import { ethers } from "ethers";
export declare const abiConcat: (arr: any) => unknown[];
export declare const getCallKey: (target: string, func: Function, args: any[], chainId?: number) => any;
export declare const buildCall: (target: string, func: Function, args: any[], argsList?: any[][], chainId?: number) => any;
export declare const createChainQuery: (provider?: undefined, iface?: undefined, maxCallQueue?: number, queueCallDelay?: number, verbosity?: number) => {
    (target: string, func: Function, args: any[], argsList: any[][]): [any];
    useStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<{
        provider: undefined;
        iface: undefined;
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
                provider: undefined;
                iface: undefined;
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
                provider: undefined;
                iface: undefined;
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
                provider: undefined;
                iface: undefined;
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
export declare const useChainQuery: {
    (target: string, func: Function, args: any[], argsList: any[][]): [any];
    useStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<{
        provider: undefined;
        iface: undefined;
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
                provider: undefined;
                iface: undefined;
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
                provider: undefined;
                iface: undefined;
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
                provider: undefined;
                iface: undefined;
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
export declare function multiCall(provider: ethers.providers.Provider, iface: ethers.utils.Interface, calls: any[]): Promise<any>;
