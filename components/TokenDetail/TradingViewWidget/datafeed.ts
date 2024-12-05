"use client";

import type {
    Bar,
    LibrarySymbolInfo,
    IBasicDataFeed,
    DatafeedConfiguration,
    ResolutionString,
} from "@/public/libraries/charting_library";
import { getChartTable } from "@/utils/getChartTable";

const lastBarsCache = new Map<string, Bar>();
const configurationData: DatafeedConfiguration = {
    supported_resolutions: [
        "1",
        "5",
        "15",
        "45",
        "60",
        "240",
        "1440",
    ] as ResolutionString[],
};

export function getDataFeed({
    pairIndex,
    name,
    token
}: {
    name: string;
    pairIndex: number;
    token: string
}): IBasicDataFeed {
    return {
        onReady: (callback) => {
            console.log("[onReady]: Method call");
            setTimeout(() => callback(configurationData));
        },

        searchSymbols: () => {
            console.log("[searchSymbols]: Method call");
        },

        resolveSymbol: async (
            symbolName,
            onSymbolResolvedCallback,
            // _onResolveErrorCallback,
            // _extension,
        ) => {
            console.log("[resolveSymbol]: Method call", symbolName);

            const symbolInfo: LibrarySymbolInfo = {
                ticker: name,
                name: name,
                description: name,
                type: "crypto",
                session: "24x7",
                timezone: "Etc/UTC",
                minmov: 1,
                pricescale: 1000000000,
                exchange: "",
                has_intraday: true,
                visible_plots_set: 'ohlc',
                has_weekly_and_monthly: false,
                supported_resolutions: configurationData.supported_resolutions,
                volume_precision: 2,
                data_status: "streaming",
                format: "price",
                listed_exchange: "",
            };

            setTimeout(() => onSymbolResolvedCallback(symbolInfo));
        },

        getBars: async (
            symbolInfo: LibrarySymbolInfo,
            resolution,
            periodParams,
            onHistoryCallback,
            onErrorCallback,
        ) => {
            const { from, to, firstDataRequest } = periodParams;

            try {
                const chartTable = await getChartTable({
                    token,
                    pairIndex: pairIndex,
                    from,
                    to,
                    range: +resolution,
                });

                if (!chartTable || !chartTable.table) {
                    onHistoryCallback([], {
                        noData: true,
                    });
                    return;
                }

                let bars: Bar[] = [];

                chartTable.table.forEach((bar: Bar) => {
                    if (bar.time >= from && bar.time < to) {
                        bars = [...bars, { ...bar, time: bar.time * 1000 }];
                    }
                });

                if (firstDataRequest) {
                    lastBarsCache.set(symbolInfo.name, {
                        ...bars[bars.length - 1],
                    });
                }
                onHistoryCallback(bars, {
                    noData: false,
                });
            } catch (error) {
                console.log("[getBars]: Get error", error);
                onErrorCallback(error as string);
            }
        },

        subscribeBars: () => { },

        unsubscribeBars: () => { },
    };
}
