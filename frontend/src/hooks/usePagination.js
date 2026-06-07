/**
 * usePagination Hook
 * 
 * Manages pagination state and calculations
 */

import { useState, useMemo, useCallback } from 'react';

export const usePagination = ({ totalItems = 0, itemsPerPage = 10, initialPage = 1 }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [internalTotalItems, setInternalTotalItems] = useState(totalItems);

  const totalPages = useMemo(() => {
    return Math.ceil(internalTotalItems / itemsPerPage) || 1;
  }, [internalTotalItems, itemsPerPage]);

  const totalItemsPerPage = itemsPerPage;

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const canGoNext = currentPage < totalPages;
  const canGoPrevious = currentPage > 1;

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, internalTotalItems);

  const setTotal = useCallback((total) => {
    setInternalTotalItems(total);
  }, []);

  const changePageSize = useCallback((size) => {
    setCurrentPage(1);
  }, []);

  const paginationRange = useMemo(() => {
    const delta = 2; // Pages to show on each side of current
    const range = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
      range.unshift(1);
    } else {
      range.unshift(1);
    }

    if (currentPage + delta < totalPages - 1) {
      range.push('...');
      range.push(totalPages);
    } else if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    totalItems: internalTotalItems,
    totalItemsPerPage,
    pageSize: itemsPerPage,
    goToPage,
    nextPage,
    previousPage,
    setTotal,
    changePageSize,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    paginationRange
  };
};

export default usePagination;