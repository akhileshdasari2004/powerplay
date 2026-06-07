/**
 * Query Optimizer Utilities
 * 
 * Tools for analyzing and optimizing MongoDB queries
 */

/**
 * Explain a query and return the query plan
 */
export const explainQuery = async (model, query) => {
  return query.explain('executionStats');
};

/**
 * Check if a query uses indexes properly
 */
export const checkIndexUsage = async (model, filter) => {
  const explain = await model.find(filter).explain('executionStats');
  const { executionStats, winningPlan } = explain;
  
  return {
    usedIndex: winningPlan?.stage === 'IXSCAN',
    totalKeysExamined: executionStats?.totalKeysExamined || 0,
    totalDocsExamined: executionStats?.totalDocsExamined || 0,
    executionTimeMillis: executionStats?.executionTimeMillis || 0,
    isCovered: executionStats?.totalKeysExamined === executionStats?.nReturned
  };
};

/**
 * Batch queries for better performance
 */
export const batchQueries = async (queries, concurrency = 5) => {
  const results = [];
  const batches = [];
  
  for (let i = 0; i < queries.length; i += concurrency) {
    batches.push(queries.slice(i, i + concurrency));
  }
  
  for (const batch of batches) {
    const batchResults = await Promise.all(batch.map(q => q()));
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Cursor-based pagination for large datasets
 */
export const cursorPaginate = async (model, { 
  filter = {}, 
  sort = { createdAt: -1 }, 
  limit = 100, 
  cursor = null 
}) => {
  const query = { ...filter };
  
  if (cursor) {
    query._id = { $lt: cursor };
  }
  
  const items = await model
    .find(query)
    .sort(sort)
    .limit(limit + 1); // Fetch one extra to determine if there's more
  
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? data[data.length - 1]._id : null;
  
  return {
    data,
    nextCursor,
    hasMore
  };
};

/**
 * Aggregation pipeline builder with common optimizations
 */
export const buildAggregationPipeline = (options) => {
  const {
    match = {},
    sort = {},
    limit,
    skip,
    lookup = null,
    unwind = null,
    group = null,
    project = null,
    addFields = null
  } = options;
  
  const pipeline = [];
  
  // $match at the start for index usage
  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }
  
  // $sort early for efficiency
  if (Object.keys(sort).length > 0) {
    pipeline.push({ $sort: sort });
  }
  
  // $skip before $limit
  if (skip) {
    pipeline.push({ $skip: skip });
  }
  
  // $limit early
  if (limit) {
    pipeline.push({ $limit: limit });
  }
  
  // $lookup for joining (after filtering)
  if (lookup) {
    pipeline.push({ $lookup: lookup });
  }
  
  // $unwind
  if (unwind) {
    pipeline.push({ $unwind: unwind });
  }
  
  // $addFields
  if (addFields) {
    pipeline.push({ $addFields: addFields });
  }
  
  // $group
  if (group) {
    pipeline.push({ $group: group });
  }
  
  // $project at the end
  if (project) {
    pipeline.push({ $project: project });
  }
  
  return pipeline;
};

/**
 * Bulk operations for efficient updates
 */
export const bulkUpdate = async (model, operations) => {
  const bulkOps = operations.map(op => {
    switch (op.type) {
      case 'updateOne':
        return {
          updateOne: {
            filter: op.filter,
            update: op.update,
            upsert: op.upsert || false
          }
        };
      case 'deleteOne':
        return {
          deleteOne: {
            filter: op.filter
          }
        };
      case 'replaceOne':
        return {
          replaceOne: {
            filter: op.filter,
            replacement: op.replacement,
            upsert: op.upsert || false
          }
        };
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  });
  
  return model.bulkWrite(bulkOps, { ordered: false });
};

export default {
  explainQuery,
  checkIndexUsage,
  batchQueries,
  cursorPaginate,
  buildAggregationPipeline,
  bulkUpdate
};