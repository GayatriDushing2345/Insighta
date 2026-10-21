import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  businessesTable,
  datasetsTable,
  insightsTable,
  queriesTable,
} from "@workspace/db";
import { eq, desc, like, or, and } from "drizzle-orm";
import { processDataset } from "../services/dataProcessor.js";
import {
  generateInsightsFromData,
  answerBusinessQuestion,
} from "../services/aiService.js";

const router: IRouter = Router();

router.get("/businesses", async (req, res) => {
  try {
    const { industry, search } = req.query as {
      industry?: string;
      search?: string;
    };

    let allBusinesses = await db
      .select()
      .from(businessesTable)
      .orderBy(desc(businessesTable.createdAt));

    if (industry) {
      allBusinesses = allBusinesses.filter((b) =>
        b.industry.toLowerCase().includes(industry.toLowerCase())
      );
    }

    if (search) {
      const q = search.toLowerCase();
      allBusinesses = allBusinesses.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.industry.toLowerCase().includes(q)
      );
    }

    const result = await Promise.all(
      allBusinesses.map(async (biz) => {
        const datasets = await db
          .select({ id: datasetsTable.id })
          .from(datasetsTable)
          .where(eq(datasetsTable.businessId, biz.id));

        const insights = await db
          .select({ id: insightsTable.id })
          .from(insightsTable)
          .where(eq(insightsTable.businessId, biz.id));

        return {
          ...biz,
          datasetCount: datasets.length,
          insightCount: insights.length,
          createdAt: biz.createdAt.toISOString(),
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error(err, "Error listing businesses");
    res.status(500).json({ error: "Failed to list businesses" });
  }
});

router.get("/businesses/my", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.ownerId, req.user.id))
      .limit(1);

    if (!biz) {
      res.json({ business: null });
      return;
    }

    const datasets = await db
      .select({ id: datasetsTable.id })
      .from(datasetsTable)
      .where(eq(datasetsTable.businessId, biz.id));

    const insights = await db
      .select({ id: insightsTable.id })
      .from(insightsTable)
      .where(eq(insightsTable.businessId, biz.id));

    res.json({
      business: {
        ...biz,
        datasetCount: datasets.length,
        insightCount: insights.length,
        createdAt: biz.createdAt.toISOString(),
        updatedAt: biz.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    req.log.error(err, "Error fetching user's business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.get("/businesses/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  try {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const datasets = await db
      .select()
      .from(datasetsTable)
      .where(eq(datasetsTable.businessId, id))
      .orderBy(desc(datasetsTable.createdAt));

    const insights = await db
      .select()
      .from(insightsTable)
      .where(eq(insightsTable.businessId, id))
      .orderBy(desc(insightsTable.createdAt));

    const formattedDatasets = datasets.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      rawData: undefined,
    }));

    const formattedInsights = insights.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
    }));

    res.json({
      ...biz,
      createdAt: biz.createdAt.toISOString(),
      datasets: formattedDatasets,
      insights: formattedInsights,
    });
  } catch (err) {
    req.log.error(err, "Error fetching business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.post("/businesses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, industry, description, website } = req.body as {
    name?: string;
    industry?: string;
    description?: string;
    website?: string;
  };

  if (!name || !industry || !description) {
    res.status(400).json({ error: "name, industry, and description are required" });
    return;
  }

  try {
    const [biz] = await db
      .insert(businessesTable)
      .values({
        ownerId: req.user.id,
        name,
        industry,
        description,
        website: website ?? null,
      })
      .returning();

    res.status(201).json({
      ...biz,
      datasetCount: 0,
      insightCount: 0,
      createdAt: biz.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Error creating business");
    res.status(500).json({ error: "Failed to create business" });
  }
});

router.patch("/businesses/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  try {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    if (biz.ownerId !== req.user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { name, industry, description, website } = req.body as {
      name?: string;
      industry?: string;
      description?: string;
      website?: string;
    };

    const [updated] = await db
      .update(businessesTable)
      .set({
        name: name ?? biz.name,
        industry: industry ?? biz.industry,
        description: description ?? biz.description,
        website: website ?? biz.website,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, id))
      .returning();

    const datasets = await db
      .select({ id: datasetsTable.id })
      .from(datasetsTable)
      .where(eq(datasetsTable.businessId, id));

    const insights = await db
      .select({ id: insightsTable.id })
      .from(insightsTable)
      .where(eq(insightsTable.businessId, id));

    res.json({
      ...updated,
      datasetCount: datasets.length,
      insightCount: insights.length,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Error updating business");
    res.status(500).json({ error: "Failed to update business" });
  }
});

router.get("/businesses/:id/datasets", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  try {
    const datasets = await db
      .select()
      .from(datasetsTable)
      .where(eq(datasetsTable.businessId, id))
      .orderBy(desc(datasetsTable.createdAt));

    res.json(
      datasets.map((d) => ({
        ...d,
        rawData: undefined,
        createdAt: d.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error(err, "Error listing datasets");
    res.status(500).json({ error: "Failed to list datasets" });
  }
});

router.post("/businesses/:id/datasets", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const businessId = parseInt(req.params.id);
  if (isNaN(businessId)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  try {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!biz || biz.ownerId !== req.user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { name, fileType, data } = req.body as {
      name?: string;
      fileType?: string;
      data?: string;
    };

    if (!name || !fileType || !data) {
      res.status(400).json({ error: "name, fileType, and data are required" });
      return;
    }

    const [dataset] = await db
      .insert(datasetsTable)
      .values({
        businessId,
        name,
        fileType,
        status: "processing",
        rowCount: 0,
        rawData: data,
      })
      .returning();

    res.status(201).json({
      ...dataset,
      rawData: undefined,
      createdAt: dataset.createdAt.toISOString(),
    });

    setImmediate(async () => {
      try {
        const stats = processDataset(data, fileType);
        const summary = `Dataset: ${name}\n${stats.rowCount} rows, ${stats.columnCount} columns`;

        await db
          .update(datasetsTable)
          .set({
            status: "ready",
            rowCount: stats.rowCount,
            columns: stats.columns as unknown as typeof datasetsTable.columns,
            summary,
            statistics: stats as unknown as typeof datasetsTable.statistics,
          })
          .where(eq(datasetsTable.id, dataset.id));
      } catch {
        await db
          .update(datasetsTable)
          .set({ status: "failed" })
          .where(eq(datasetsTable.id, dataset.id));
      }
    });
  } catch (err) {
    req.log.error(err, "Error uploading dataset");
    res.status(500).json({ error: "Failed to upload dataset" });
  }
});

router.get("/businesses/:id/insights", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  try {
    const insights = await db
      .select()
      .from(insightsTable)
      .where(eq(insightsTable.businessId, id))
      .orderBy(desc(insightsTable.createdAt));

    res.json(insights.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err, "Error listing insights");
    res.status(500).json({ error: "Failed to list insights" });
  }
});

router.post("/businesses/:id/insights/generate", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const businessId = parseInt(req.params.id);
  if (isNaN(businessId)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  try {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    if (biz.ownerId !== req.user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const datasets = await db
      .select()
      .from(datasetsTable)
      .where(
        and(
          eq(datasetsTable.businessId, businessId),
          eq(datasetsTable.status, "ready")
        )
      )
      .orderBy(desc(datasetsTable.createdAt))
      .limit(3);

    const allInsights: typeof insightsTable.$inferSelect[] = [];

    if (datasets.length === 0) {
      const [fallbackInsight] = await db
        .insert(insightsTable)
        .values({
          businessId,
          datasetId: null,
          type: "summary",
          title: `${biz.name} Business Overview`,
          content: `${biz.name} operates in the ${biz.industry} industry. ${biz.description} Upload datasets to generate data-driven insights and growth analysis.`,
          metrics: null,
        })
        .returning();

      allInsights.push(fallbackInsight);
    } else {
      for (const dataset of datasets) {
        if (!dataset.statistics) continue;

        const generated = await generateInsightsFromData(
          biz.name,
          biz.description,
          biz.industry,
          dataset.name,
          dataset.statistics as Parameters<typeof generateInsightsFromData>[4]
        );

        for (const g of generated) {
          const [insight] = await db
            .insert(insightsTable)
            .values({
              businessId,
              datasetId: dataset.id,
              type: g.type,
              title: g.title,
              content: g.content,
              metrics: null,
            })
            .returning();
          allInsights.push(insight);
        }
      }
    }

    res.json(allInsights.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err, "Error generating insights");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

router.post("/businesses/:id/ask", async (req, res) => {
  const businessId = parseInt(req.params.id);
  if (isNaN(businessId)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  const { question } = req.body as { question?: string };
  if (!question || question.trim().length === 0) {
    res.status(400).json({ error: "Question is required" });
    return;
  }

  try {
    const [biz] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, businessId))
      .limit(1);

    if (!biz) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const insights = await db
      .select({ type: insightsTable.type, title: insightsTable.title, content: insightsTable.content })
      .from(insightsTable)
      .where(eq(insightsTable.businessId, businessId))
      .orderBy(desc(insightsTable.createdAt))
      .limit(10);

    const datasets = await db
      .select({ name: datasetsTable.name, summary: datasetsTable.summary })
      .from(datasetsTable)
      .where(eq(datasetsTable.businessId, businessId))
      .orderBy(desc(datasetsTable.createdAt))
      .limit(5);

    const datasetSummaries = datasets
      .filter((d) => d.summary)
      .map((d) => `Dataset: ${d.name}\n${d.summary}`);

    const answer = await answerBusinessQuestion(
      biz.name,
      biz.description,
      biz.industry,
      question,
      insights,
      datasetSummaries
    );

    const userId = req.isAuthenticated() ? req.user.id : null;

    const [queryRecord] = await db
      .insert(queriesTable)
      .values({
        businessId,
        userId,
        question,
        answer,
        sources: null,
      })
      .returning();

    res.json({ ...queryRecord, createdAt: queryRecord.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err, "Error answering question");
    res.status(500).json({ error: "Failed to answer question" });
  }
});

router.get("/businesses/:id/queries", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid business ID" });
    return;
  }

  try {
    const queries = await db
      .select()
      .from(queriesTable)
      .where(eq(queriesTable.businessId, id))
      .orderBy(desc(queriesTable.createdAt))
      .limit(20);

    res.json(queries.map((q) => ({ ...q, createdAt: q.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err, "Error listing queries");
    res.status(500).json({ error: "Failed to list queries" });
  }
});

export default router;
