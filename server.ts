import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Client as NotionClient } from "@notionhq/client";

// Helper to clean Notion Database ID from URL or raw ID string
function normalizeNotionId(idOrUrl: string): string {
  if (!idOrUrl) return "";
  const cleaned = idOrUrl.trim();
  // If it's a URL like https://www.notion.so/workspace/19f80abf37c38095a56ee892d3f3f26a?v=...
  const urlMatch = cleaned.match(/([a-f0-9]{32})/i);
  if (urlMatch) {
    return urlMatch[1];
  }
  // If standard UUID with hyphens
  const uuidMatch = cleaned.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1].replace(/-/g, "");
  }
  return cleaned.replace(/-/g, "");
}

// Helper to get active Notion client
function getNotionClient(customApiKey?: string): NotionClient | null {
  const apiKey = customApiKey || process.env.NOTION_API_KEY;
  if (!apiKey) return null;
  return new NotionClient({ auth: apiKey });
}

// Convert Notion Page to Trade object
function parseNotionPageToTrade(page: any): any {
  const props = page.properties || {};
  
  const getTitle = (propNameKeywords: string[]): string => {
    for (const key of Object.keys(props)) {
      if (propNameKeywords.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        const p = props[key];
        if (p.type === "title" && p.title?.[0]) return p.title[0].plain_text || "";
        if (p.type === "rich_text" && p.rich_text?.[0]) return p.rich_text[0].plain_text || "";
      }
    }
    return "";
  };

  const getSelect = (propNameKeywords: string[]): string => {
    for (const key of Object.keys(props)) {
      if (propNameKeywords.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        const p = props[key];
        if (p.type === "select" && p.select?.name) return p.select.name;
        if (p.type === "status" && p.status?.name) return p.status.name;
        if (p.type === "rich_text" && p.rich_text?.[0]) return p.rich_text[0].plain_text || "";
      }
    }
    return "";
  };

  const getNumber = (propNameKeywords: string[], defaultValue = 0): number => {
    for (const key of Object.keys(props)) {
      if (propNameKeywords.some(k => key.toLowerCase() === k.toLowerCase() || key.toLowerCase().includes(k.toLowerCase()))) {
        const p = props[key];
        if (p.type === "number" && typeof p.number === "number") return p.number;
        if (p.type === "formula" && typeof p.formula?.number === "number") return p.formula.number;
        if (p.type === "rich_text" && p.rich_text?.[0]) {
          const num = parseFloat(p.rich_text[0].plain_text);
          if (!isNaN(num)) return num;
        }
      }
    }
    return defaultValue;
  };

  const getText = (propNameKeywords: string[]): string => {
    for (const key of Object.keys(props)) {
      if (propNameKeywords.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        const p = props[key];
        if (p.type === "rich_text" && p.rich_text?.[0]) return p.rich_text.map((r: any) => r.plain_text).join("");
        if (p.type === "title" && p.title?.[0]) return p.title[0].plain_text || "";
        if (p.type === "url" && p.url) return p.url;
      }
    }
    return "";
  };

  const getDate = (propNameKeywords: string[]): string => {
    for (const key of Object.keys(props)) {
      if (propNameKeywords.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        const p = props[key];
        if (p.type === "date" && p.date?.start) {
          return p.date.start.split("T")[0];
        }
      }
    }
    if (page.created_time) {
      return page.created_time.split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  };

  const getUrlOrFiles = (propNameKeywords: string[]): string[] => {
    const urls: string[] = [];
    for (const key of Object.keys(props)) {
      if (propNameKeywords.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        const p = props[key];
        if (p.type === "url" && p.url) {
          urls.push(p.url);
        } else if (p.type === "files" && Array.isArray(p.files)) {
          p.files.forEach((f: any) => {
            const u = f.file?.url || f.external?.url;
            if (u) urls.push(u);
          });
        } else if (p.type === "rich_text" && p.rich_text?.[0]) {
          const text = p.rich_text[0].plain_text;
          if (text.startsWith("http") || text.startsWith("data:image")) {
            urls.push(text);
          }
        }
      }
    }
    return urls;
  };

  const symbol = getTitle(["symbol", "pair", "instrument", "name", "title"]) || "EUR/USD";
  const direction = (getSelect(["direction", "side", "type"]).toUpperCase().includes("SHORT") ? "SHORT" : "LONG");
  const rawStatus = getSelect(["status", "outcome", "result"]).toUpperCase();
  const status = rawStatus.includes("WIN")
    ? "WIN"
    : rawStatus.includes("LOSS")
    ? "LOSS"
    : rawStatus.includes("BREAK") || rawStatus.includes("BE")
    ? "BREAKEVEN"
    : "OPEN";

  const strategy = (getSelect(["strategy", "setup"]) || "DEMAND") as any;
  const session = (getSelect(["session"]) || "New York Session") as any;
  const emotion = (getSelect(["emotion", "psychology", "mental"]) || "Disciplined") as any;
  
  const entryPrice = getNumber(["entry price", "entry"], 0);
  const exitPrice = getNumber(["exit price", "exit"], undefined as any);
  const slPrice = getNumber(["stop loss", "sl"], 0);
  const tpPrice = getNumber(["take profit", "tp"], 0);
  const riskPips = getNumber(["risk pips", "risk"], 15);
  const positionSize = getNumber(["position size", "lot", "lots", "size"], 1.0);
  const calculatedRiskReward = getNumber(["calculated risk reward", "risk reward", "r:r", "rr"], 2.0);
  const actualRiskReward = getNumber(["actual risk reward", "actual rr"], undefined as any);
  const pnlAmount = getNumber(["pnl", "p&l", "net pnl", "profit", "amount"], undefined as any);
  const pnlPips = getNumber(["pnl pips", "pips"], undefined as any);
  const date = getDate(["date", "trade date", "created"]);
  const notes = getText(["notes", "review", "journal notes", "comment"]);
  const tradingViewUrl = getText(["tradingview", "chart link", "tv url"]);
  const chartImages = getUrlOrFiles(["screenshot", "chart image", "images", "attachment"]);
  const userId = getText(["trader email", "user email", "user id", "user", "email"]);

  return {
    id: page.id,
    userId: userId || undefined,
    symbol,
    direction,
    status,
    strategyType: strategy,
    session,
    emotionalState: emotion,
    entryPrice,
    exitPrice: exitPrice || undefined,
    slPrice,
    tpPrice,
    riskPips,
    positionSize,
    calculatedRiskReward,
    actualRiskReward: actualRiskReward || undefined,
    pnlAmount: pnlAmount !== undefined ? pnlAmount : undefined,
    pnlPips: pnlPips !== undefined ? pnlPips : undefined,
    date,
    notes,
    tradingViewUrl: tradingViewUrl || undefined,
    chartImages,
    tags: [],
    rating: 5,
  };
}

// Build Notion Page Properties from Trade object based on database schema
function buildNotionPageProperties(trade: any, databaseSchema: any): Record<string, any> {
  const schemaProps = databaseSchema?.properties || {};
  const properties: Record<string, any> = {};

  // Exact or case-insensitive property finder
  const getPropKey = (names: string[]): string | null => {
    for (const target of names) {
      for (const key of Object.keys(schemaProps)) {
        if (key.toLowerCase() === target.toLowerCase()) {
          return key;
        }
      }
    }
    for (const target of names) {
      for (const key of Object.keys(schemaProps)) {
        if (key.toLowerCase().includes(target.toLowerCase())) {
          return key;
        }
      }
    }
    return null;
  };

  // 1. Title / Symbol / Name
  const titleKey = Object.keys(schemaProps).find((k) => schemaProps[k].type === "title") || "Name";
  const displayTitle = trade.symbol ? `${trade.symbol} - ${trade.strategyType || trade.direction || 'Trade'}` : 'Trade Entry';
  properties[titleKey] = {
    title: [{ text: { content: displayTitle } }],
  };

  // 2. Trader Email / User ID
  const emailKey = getPropKey(["Trader Email", "User ID", "Email"]);
  const emailVal = trade.userId || trade.userEmail;
  if (emailKey && emailVal) {
    properties[emailKey] = {
      rich_text: [{ text: { content: String(emailVal) } }],
    };
  }

  // 3. Direction
  const dirKey = getPropKey(["Direction", "Side"]);
  if (dirKey && trade.direction) {
    properties[dirKey] = { select: { name: trade.direction } };
  }

  // 4. Strategy Setup
  const stratKey = getPropKey(["Strategy Setup", "Strategy", "Setup"]);
  if (stratKey && trade.strategyType) {
    properties[stratKey] = { select: { name: trade.strategyType } };
  }

  // 5. Status
  const statusKey = getPropKey(["Status", "Outcome", "Result"]);
  if (statusKey) {
    const statusVal = trade.status || "OPEN";
    if (schemaProps[statusKey]?.type === "status") {
      properties[statusKey] = { status: { name: statusVal } };
    } else {
      properties[statusKey] = { select: { name: statusVal } };
    }
  }

  // 6. Session
  const sessionKey = getPropKey(["Session"]);
  if (sessionKey && trade.session) {
    properties[sessionKey] = { select: { name: trade.session } };
  }

  // 7. Emotional State
  const emotionKey = getPropKey(["Emotional State", "Emotion", "Psychology"]);
  if (emotionKey && trade.emotionalState) {
    properties[emotionKey] = { select: { name: trade.emotionalState } };
  }

  // 8. Trade Date
  const dateKey = getPropKey(["Trade Date", "Date"]);
  const dateVal = trade.date || new Date().toISOString().split("T")[0];
  if (dateKey && dateVal) {
    properties[dateKey] = { date: { start: dateVal } };
  }

  // 9. Numbers
  const setNum = (names: string[], val?: number) => {
    if (val === undefined || isNaN(val)) return;
    const k = getPropKey(names);
    if (k && schemaProps[k]?.type === "number") {
      properties[k] = { number: Number(val) };
    }
  };

  setNum(["Entry Price", "Entry"], trade.entryPrice);
  setNum(["Exit Price", "Exit"], trade.exitPrice);
  setNum(["Stop Loss", "SL"], trade.slPrice);
  setNum(["Take Profit", "TP"], trade.tpPrice);
  setNum(["PnL ($)", "PnL", "Profit"], trade.pnlAmount);
  setNum(["Risk:Reward", "Risk Reward", "Calculated Risk Reward", "R:R"], trade.calculatedRiskReward || trade.actualRiskReward);
  setNum(["Risk (Pips)", "Risk Pips"], trade.riskPips);
  setNum(["Lot Size", "Position Size"], trade.positionSize);

  // 10. Notes
  const notesKey = getPropKey(["Journal Notes", "Notes", "Review"]);
  if (notesKey && trade.notes) {
    properties[notesKey] = {
      rich_text: [{ text: { content: trade.notes.slice(0, 1999) } }],
    };
  }

  // 11. TradingView URL
  const tvKey = getPropKey(["TradingView URL", "Chart Link", "URL"]);
  const tvUrl = trade.tradingViewUrl || (trade.chartImages && trade.chartImages.find((img: string) => img.startsWith("http")));
  if (tvKey && tvUrl) {
    properties[tvKey] = { url: tvUrl };
  }

  // 12. Chart Screenshot / Files
  const filesKey = getPropKey(["Chart Screenshot", "Screenshot", "Files"]);
  if (filesKey && schemaProps[filesKey]?.type === "files") {
    const validUrls: string[] = [];
    if (trade.tradingViewUrl && trade.tradingViewUrl.startsWith("http")) {
      validUrls.push(trade.tradingViewUrl);
    }
    if (Array.isArray(trade.chartImages)) {
      trade.chartImages.forEach((img: string) => {
        if (img && img.startsWith("http") && !validUrls.includes(img)) {
          validUrls.push(img);
        }
      });
    }

    if (validUrls.length > 0) {
      properties[filesKey] = {
        files: validUrls.map((url, idx) => ({
          name: `TradingView Chart ${idx + 1}`,
          type: "external",
          external: { url },
        })),
      };
    }
  }

  return properties;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "25mb" }));

  const DEFAULT_NOTION_API_KEY = process.env.NOTION_API_KEY || "ntn_Q38234662644sLexkBRmI46birmVGxUHESVj8PrVosR0Oi";
  const DEFAULT_NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || "3bf0e3e57718801182ece24131bad598";

  // Helper to save base64 image and return public URL
  function saveBase64ImageLocally(base64Str: string, req: express.Request): string | null {
    try {
      if (!base64Str || typeof base64Str !== "string") return null;
      if (base64Str.startsWith("http://") || base64Str.startsWith("https://")) return base64Str;
      if (!base64Str.startsWith("data:image/")) return null;

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return null;

      const ext = matches[1].split("/")[1] || "png";
      const buffer = Buffer.from(matches[2], "base64");
      const filename = `chart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);

      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost";
      return `${protocol}://${host}/uploads/${filename}`;
    } catch (e) {
      console.error("Failed saving base64 image:", e);
      return null;
    }
  }

  // Serve uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // NOTION DATABASE INTEGRATION ENDPOINTS
  // -------------------------------------------------------------

  // 1. Get Notion Status
  app.get("/api/notion/status", async (req, res) => {
    try {
      const apiKey = (req.query.apiKey as string) || (req.headers["x-notion-key"] as string) || DEFAULT_NOTION_API_KEY;
      const databaseId = normalizeNotionId((req.query.databaseId as string) || (req.headers["x-notion-db"] as string) || DEFAULT_NOTION_DATABASE_ID);

      if (!apiKey || !databaseId) {
        return res.json({
          configured: false,
          hasApiKey: !!apiKey,
          hasDatabaseId: !!databaseId,
          databaseId: databaseId || null,
        });
      }

      const notion = new NotionClient({ auth: apiKey });
      const database: any = await notion.databases.retrieve({ database_id: databaseId });

      const title = database.title?.[0]?.plain_text || "Notion Trading Journal";
      return res.json({
        configured: true,
        databaseId,
        databaseTitle: title,
        propertiesCount: Object.keys(database.properties || {}).length,
      });
    } catch (error: any) {
      console.error("Notion Status Check Error:", error?.message || error);
      return res.json({
        configured: false,
        error: error?.message || "Failed to connect to Notion Database.",
      });
    }
  });

  // 2. Test Connection & Validate Notion Database
  app.post("/api/notion/test-connection", async (req, res) => {
    try {
      const { apiKey, databaseId } = req.body;
      const key = apiKey || process.env.NOTION_API_KEY;
      const rawDbId = databaseId || process.env.NOTION_DATABASE_ID;
      const normalizedId = normalizeNotionId(rawDbId);

      if (!key) {
        return res.status(400).json({ error: "Please provide a Notion Integration Secret (API Key)." });
      }
      if (!normalizedId) {
        return res.status(400).json({ error: "Please provide a valid Notion Database ID or URL." });
      }

      const notion = new NotionClient({ auth: key });
      const database: any = await notion.databases.retrieve({ database_id: normalizedId });

      const title = database.title?.[0]?.plain_text || "Notion Trading Journal";
      const propNames = Object.keys(database.properties || {});

      return res.json({
        success: true,
        databaseTitle: title,
        databaseId: normalizedId,
        properties: propNames,
      });
    } catch (error: any) {
      console.error("Notion Test Connection Error:", error);
      return res.status(400).json({
        error: error?.message || "Could not access Notion database. Make sure the database exists and your Notion integration is added in Database -> '...' -> 'Connections'.",
      });
    }
  });

  // 3. Fetch Trades from Notion Database
  app.get("/api/notion/trades", async (req, res) => {
    try {
      const apiKey = (req.headers["x-notion-key"] as string) || process.env.NOTION_API_KEY || DEFAULT_NOTION_API_KEY;
      const databaseId = normalizeNotionId((req.headers["x-notion-db"] as string) || process.env.NOTION_DATABASE_ID || DEFAULT_NOTION_DATABASE_ID);
      const userEmail = (req.headers["x-user-email"] as string) || (req.query.userEmail as string) || "";

      if (!apiKey || !databaseId) {
        return res.status(400).json({
          error: "Notion is not configured. Please provide NOTION_API_KEY and NOTION_DATABASE_ID.",
        });
      }

      const notion = new NotionClient({ auth: apiKey });
      const queryPayload: any = {
        database_id: databaseId,
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
        page_size: 100,
      };

      if (userEmail) {
        queryPayload.filter = {
          or: [
            {
              property: "Trader Email",
              rich_text: {
                equals: userEmail,
              },
            },
            {
              property: "User ID",
              rich_text: {
                equals: userEmail,
              },
            }
          ]
        };
      }

      const response: any = await (notion as any).databases.query(queryPayload);

      let trades = response.results.map(parseNotionPageToTrade);
      return res.json({ trades, count: trades.length });
    } catch (error: any) {
      console.error("Fetch Notion Trades Error:", error);
      return res.status(500).json({
        error: error?.message || "Failed to fetch trades from Notion database.",
      });
    }
  });

  // 4. Create New Trade in Notion Database
  app.post("/api/notion/trades", async (req, res) => {
    try {
      const apiKey = (req.headers["x-notion-key"] as string) || process.env.NOTION_API_KEY || DEFAULT_NOTION_API_KEY;
      const databaseId = normalizeNotionId((req.headers["x-notion-db"] as string) || process.env.NOTION_DATABASE_ID || DEFAULT_NOTION_DATABASE_ID);

      if (!apiKey || !databaseId) {
        return res.status(400).json({
          error: "Notion is not configured. Please provide NOTION_API_KEY and NOTION_DATABASE_ID.",
        });
      }

      let trade = req.body;
      if (Array.isArray(trade.chartImages)) {
        trade.chartImages = trade.chartImages.map((img: string) => {
          if (img && img.startsWith("data:image/")) {
            return saveBase64ImageLocally(img, req) || img;
          }
          return img;
        });
      }

      const notion = new NotionClient({ auth: apiKey });
      const dbSchema: any = await notion.databases.retrieve({ database_id: databaseId });

      const properties = buildNotionPageProperties(trade, dbSchema);

      const newPage = await notion.pages.create({
        parent: { database_id: databaseId },
        properties,
      });

      const parsedTrade = parseNotionPageToTrade(newPage);
      return res.json({ success: true, trade: { ...trade, id: newPage.id, ...parsedTrade } });
    } catch (error: any) {
      console.error("Create Notion Trade Error:", error);
      return res.status(500).json({
        error: error?.message || "Failed to create trade in Notion database.",
      });
    }
  });

  // 5. Update Trade in Notion Database
  app.patch("/api/notion/trades/:id", async (req, res) => {
    try {
      const apiKey = (req.headers["x-notion-key"] as string) || process.env.NOTION_API_KEY || DEFAULT_NOTION_API_KEY;
      const databaseId = normalizeNotionId((req.headers["x-notion-db"] as string) || process.env.NOTION_DATABASE_ID || DEFAULT_NOTION_DATABASE_ID);
      const pageId = req.params.id;

      if (!apiKey) {
        return res.status(400).json({ error: "Notion API key required." });
      }

      const trade = req.body;
      const notion = new NotionClient({ auth: apiKey });
      
      let dbSchema = null;
      if (databaseId) {
        try {
          dbSchema = await notion.databases.retrieve({ database_id: databaseId });
        } catch (_) {}
      }

      const properties = buildNotionPageProperties(trade, dbSchema);

      const updatedPage = await notion.pages.update({
        page_id: pageId,
        properties,
      });

      const parsedTrade = parseNotionPageToTrade(updatedPage);
      return res.json({ success: true, trade: { ...trade, id: updatedPage.id, ...parsedTrade } });
    } catch (error: any) {
      console.error("Update Notion Trade Error:", error);
      return res.status(500).json({
        error: error?.message || "Failed to update trade in Notion database.",
      });
    }
  });

  // 6. Delete (Archive) Trade in Notion Database
  app.delete("/api/notion/trades/:id", async (req, res) => {
    try {
      const apiKey = (req.headers["x-notion-key"] as string) || process.env.NOTION_API_KEY || DEFAULT_NOTION_API_KEY;
      const pageId = req.params.id;

      if (!apiKey) {
        return res.status(400).json({ error: "Notion API key required." });
      }

      const notion = new NotionClient({ auth: apiKey });
      await notion.pages.update({
        page_id: pageId,
        archived: true,
      });

      return res.json({ success: true, id: pageId });
    } catch (error: any) {
      console.error("Delete Notion Trade Error:", error);
      return res.status(500).json({
        error: error?.message || "Failed to delete trade from Notion database.",
      });
    }
  });

  // 7. Batch Sync All Trades into Notion
  app.post("/api/notion/sync-all", async (req, res) => {
    try {
      const apiKey = (req.headers["x-notion-key"] as string) || process.env.NOTION_API_KEY || DEFAULT_NOTION_API_KEY;
      const databaseId = normalizeNotionId((req.headers["x-notion-db"] as string) || process.env.NOTION_DATABASE_ID || DEFAULT_NOTION_DATABASE_ID);
      const { trades } = req.body;

      if (!apiKey || !databaseId) {
        return res.status(400).json({ error: "Notion API Key and Database ID required." });
      }

      if (!trades || !Array.isArray(trades)) {
        return res.status(400).json({ error: "Invalid trades list." });
      }

      const notion = new NotionClient({ auth: apiKey });
      const dbSchema: any = await notion.databases.retrieve({ database_id: databaseId });

      let createdCount = 0;
      for (const trade of trades) {
        try {
          if (Array.isArray(trade.chartImages)) {
            trade.chartImages = trade.chartImages.map((img: string) => {
              if (img && img.startsWith("data:image/")) {
                return saveBase64ImageLocally(img, req) || img;
              }
              return img;
            });
          }

          const properties = buildNotionPageProperties(trade, dbSchema);
          await notion.pages.create({
            parent: { database_id: databaseId },
            properties,
          });
          createdCount++;
        } catch (itemErr) {
          console.error("Failed to sync individual trade:", trade.symbol, itemErr);
        }
      }

      return res.json({ success: true, syncedCount: createdCount, total: trades.length });
    } catch (error: any) {
      console.error("Sync All Notion Trades Error:", error);
      return res.status(500).json({
        error: error?.message || "Failed to batch sync trades to Notion.",
      });
    }
  });

  // -------------------------------------------------------------
  // AI JOURNAL AUDITOR ENDPOINT
  // -------------------------------------------------------------
  app.post("/api/ai-insights", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "Gemini API key is not configured in environment variables.",
        });
      }

      const { trades, summaryStats, period } = req.body;
      if (!trades || !Array.isArray(trades)) {
        return res.status(400).json({ error: "Invalid trade dataset provided." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const periodName = period || "Selected Period";

      const prompt = `You are an elite, unsparing Quantitative Trading Performance Auditor and Trading Psychology Expert.
Your job is to review the trader's actual journal entries for the timeframe: "${periodName}".
Because "the journal never lies", your audit must be brutally honest, identifying exact execution mistakes, psychological traps, risk management violations, and bad trading habits, while also acknowledging what went right.

Dataset Summary for ${periodName}:
- Total Trades Analyzed: ${trades.length}
- Overall Win Rate: ${summaryStats?.winRate ?? 'N/A'}%
- Total Net P&L: $${summaryStats?.netPnL ?? 'N/A'}
- Avg Risk:Reward Ratio: ${summaryStats?.avgRR ?? 'N/A'}:1
- Profit Factor: ${summaryStats?.profitFactor ?? 'N/A'}
- Most Frequent Strategy: ${summaryStats?.topStrategy ?? 'N/A'}
- Dominant Emotional State: ${summaryStats?.topEmotion ?? 'N/A'}

Detailed Trade Log for ${periodName} (up to 30 trades):
${JSON.stringify(
  trades.slice(-30).map((t: any) => ({
    id: t.id,
    date: t.date,
    symbol: t.symbol,
    direction: t.direction,
    status: t.status,
    pnlAmount: t.pnlAmount,
    pnlPips: t.pnlPips,
    riskReward: t.calculatedRiskReward,
    strategy: t.strategyType,
    emotion: t.emotionalState,
    notes: t.notes || "No notes provided",
    timeframe: `${t.levelTimeframe || ''} / ${t.confirmationTimeframe || ''}`
  })),
  null,
  2
)}

Analyze this exact dataset and produce a structured JSON response with the following JSON schema:
{
  "periodAnalyzed": string, // e.g. "${periodName}"
  "overallGrade": string, // e.g. "B-", "A+", "C", "D", "F"
  "performanceScore": number, // Score from 0 to 100 based on discipline, R:R adherence, win rate, and emotional control
  "executiveSummary": string, // 2-3 sentences evaluating overall execution, profit consistency, and major behavior during this period
  "tradeCountInPeriod": number, // count of trades in this set
  "periodWinRate": number, // win rate percentage number
  "periodNetPnL": number, // total P&L number for this period
  "riskManagementGrade": string, // e.g. "A", "B-", "D" evaluating stop-loss discipline and R:R ratios
  "psychologyInsight": string, // Detailed breakdown of how emotional states (FOMO, Revenge, Anxiety, Overconfidence) impacted P&L and win rate
  "keyStrengths": string[], // 3 specific strengths or best habits observed in this period
  "areasForImprovement": string[], // 3 specific vulnerabilities or bad habits detected in this period
  "majorMistakes": [
    {
      "title": string, // e.g. "Revenge Overtrading After Loss"
      "category": string, // Must be one of: "Risk", "Psychology", "Technical", "Execution"
      "description": string, // Specific explanation referencing trades, notes, or patterns
      "impact": string // Financial or psychological impact e.g. "-$420 loss across 3 impulsive trades"
    }
  ],
  "whatWentRight": string[], // 3 concrete things that worked well during this timeframe
  "actionableRules": string[], // 3-4 golden rules for the upcoming trading period
  "improvementPlan": string[], // 4 step-by-step instructions to fix leaks immediately
  "ruleOfThumbForNextPeriod": string // A punchy, memorable 1-sentence motto/directive for the next week/month
}

Return ONLY valid raw JSON with no markdown wrapping.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (error: any) {
      console.error("AI Insights Generation Error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate AI trading insights.",
      });
    }
  });

  // Vite development server setup or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Trading Journal Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

