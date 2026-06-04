/**
 * Example bigQuery handler — copy into your nodeExecutor or extend via PR.
 *
 * Requires: npm install @google-cloud/bigquery (in your project, not async-dag core)
 */

export function createBigQueryHandler() {
  let clientPromise = null;

  async function getClient() {
    if (!clientPromise) {
      const { BigQuery } = await import("@google-cloud/bigquery");
      clientPromise = new BigQuery();
    }
    return clientPromise;
  }

  return async function bigQueryNode(node) {
    const config = node.data?.nodeData;
    if (!config || typeof config !== "object") {
      throw new Error("bigQuery node requires data.nodeData object with projectId and query");
    }

    const { projectId, query, location, maximumBytesBilled } = config;
    if (!projectId || !query) {
      throw new Error("bigQuery nodeData must include projectId and query");
    }

    const bq = await getClient();
    const [job] = await bq.createQueryJob({
      projectId: String(projectId),
      query: String(query),
      location: location ? String(location) : undefined,
      maximumBytesBilled: maximumBytesBilled ? String(maximumBytesBilled) : undefined,
    });

    const [rows] = await job.getQueryResults();
    return { rows, jobId: job.id };
  };
}
