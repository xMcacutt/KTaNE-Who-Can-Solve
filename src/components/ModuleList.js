import React, { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ModuleCard from "./ModuleCard";
import { AutoSizer, List, CellMeasurer, CellMeasurerCache } from "react-virtualized";

export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

export default function ModuleList({ user, scores, setScores }) {
    const cache = useRef(
        new CellMeasurerCache({
            fixedWidth: true,
            minHeight: 130,
        })
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [visibleRows, setVisibleRows] = useState(new Set());
    const debouncedSearchTerm = useDebounce(searchTerm, 100);
    const listRef = useRef(null);

    const { data: modules = [], isLoading, error } = useQuery({
        queryKey: ["modules", debouncedSearchTerm],
        queryFn: async () => {
            const res = await fetch(`/modules?search=${encodeURIComponent(debouncedSearchTerm)}`);
            if (!res.ok) throw new Error("Failed to fetch modules");
            return res.json();
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        cache.current.clearAll();
        if (listRef.current) {
            listRef.current.recomputeRowHeights();
        }
    }, [modules, hoveredIndex]);

    const rowRenderer = useCallback(
        ({ key, index, style, parent }) => {
            const module = modules[index];
            return (
                <CellMeasurer
                    key={key}
                    cache={cache.current}
                    parent={parent}
                    columnIndex={0}
                    rowIndex={index}
                >
                    {({ measure, registerChild }) => (
                        <div ref={registerChild} style={style}>
                            <ModuleCard
                                key={module.id}
                                module={module}
                                index={index}
                                user={user}
                                score={scores[module.module_id]}
                                setScores={setScores}
                                isHovered={hoveredIndex === index}
                                isVisible={visibleRows.has(index)}
                                onHoverStart={() => setHoveredIndex(index)}
                                onHoverEnd={() => setHoveredIndex(null)}
                                onHeightChange={measure}
                            />
                        </div>
                    )}
                </CellMeasurer>
            );
        },
        [modules, user, scores, setScores, hoveredIndex, visibleRows]
    );

    const onRowsRendered = useCallback(
        ({ startIndex, stopIndex }) => {
            const newVisibleRows = new Set();
            for (let i = startIndex; i <= stopIndex; i++) {
                newVisibleRows.add(i);
            }
            setVisibleRows(newVisibleRows);
        },
        []
    );

    return (
        <div>
            <h2 className="fs-5 fw-semibold mb-3">Available Modules</h2>
            <div className="position-relative mb-3">
                <input
                    type="text"
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>
            {isLoading && <p>Loading modules...</p>}
            {error && <p className="text-danger">{error.message}</p>}
            {!isLoading && !error && modules.length > 0 ? (
                <div style={{ width: "100%", height: "100vh" }}>
                    <AutoSizer>
                        {({ width, height }) => (
                            <List
                                ref={listRef}
                                width={width}
                                height={height}
                                rowHeight={cache.current.rowHeight}
                                deferredMeasurementCache={cache.current}
                                rowCount={modules.length}
                                rowRenderer={rowRenderer}
                                onRowsRendered={onRowsRendered}
                                overscanRowCount={10}
                            />
                        )}
                    </AutoSizer>
                </div>
            ) : (
                !isLoading && !error && <p className="text-secondary">No modules found.</p>
            )}
        </div>
    );
}