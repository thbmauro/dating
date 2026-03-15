import { Hono } from "hono";
import { env } from "../env";

const historyRouter = new Hono();

interface HistoricalEvent {
  year: string;
  month: string;
  day: string;
  event: string;
}

// Keywords that indicate weird/quirky/interesting events
const weirdKeywords = [
  'strange', 'odd', 'unusual', 'bizarre', 'peculiar', 'quirky', 'eccentric',
  'mystery', 'hoax', 'prank', 'scandal', 'controversial', 'escaped', 'stole',
  'smuggled', 'disguised', 'fake', 'imposter', 'accidentally', 'mistakenly',
  'record', 'first', 'invented', 'discovered', 'crowned', 'married',
  'eloped', 'banned', 'outlawed', 'legalized', 'patent', 'experiment',
  'exploded', 'collapsed', 'vanished', 'disappeared', 'reappeared',
  'circus', 'elephant', 'zoo', 'parade', 'costume', 'naked', 'nude'
];

// Keywords to filter out violent/disturbing events
const violentKeywords = [
  'massacre', 'genocide', 'executed', 'execution', 'murdered', 'assassinated',
  'assassination', 'killed', 'killing', 'slaughter', 'death', 'died', 'bombing',
  'attack', 'war', 'battle', 'invaded', 'invasion', 'terrorist', 'explosion',
  'holocaust', 'atrocity', 'torture', 'suicide', 'crash', 'disaster', 'earthquake',
  'tsunami', 'hurricane', 'famine', 'plague', 'epidemic', 'pandemic', 'riot',
  'revolt', 'rebellion', 'coup', 'siege', 'surrender', 'captive', 'prisoner',
  'executed', 'hanged', 'beheaded', 'shot', 'drowned', 'burned'
];

const categoryKeywords: Record<string, string[]> = {
  weird: ['strange', 'odd', 'unusual', 'bizarre', 'peculiar', 'quirky', 'eccentric', 'mystery', 'hoax', 'prank', 'fake', 'imposter', 'accidentally', 'mistakenly', 'naked', 'nude', 'circus', 'elephant'],
  science: ['science', 'scientist', 'experiment', 'laboratory', 'physics', 'chemistry', 'biology', 'astronomy', 'telescope', 'microscope', 'theory', 'hypothesis', 'Nobel', 'research', 'atom', 'molecule', 'DNA', 'vaccine', 'medical'],
  royalty: ['king', 'queen', 'prince', 'princess', 'emperor', 'empress', 'monarch', 'throne', 'crown', 'royal', 'dynasty', 'palace', 'coronation', 'reign', 'duke', 'duchess', 'czar', 'sultan'],
  inventions: ['invented', 'invention', 'patent', 'prototype', 'machine', 'device', 'technology', 'engineer', 'designed', 'built', 'created', 'telegraph', 'telephone', 'radio', 'television', 'computer', 'airplane', 'automobile', 'electric'],
  exploration: ['explored', 'explorer', 'expedition', 'voyage', 'discovered', 'discovery', 'sailed', 'navigated', 'circumnavigation', 'colony', 'frontier', 'uncharted', 'continent', 'ocean', 'mountain', 'pole', 'arctic', 'antarctic', 'space', 'moon', 'Mars'],
  'art & culture': ['art', 'artist', 'painting', 'sculpture', 'museum', 'gallery', 'music', 'composer', 'symphony', 'opera', 'theater', 'film', 'movie', 'novel', 'author', 'poet', 'poetry', 'literature', 'dance', 'ballet'],
  ancient: ['ancient', 'Roman', 'Greek', 'Egyptian', 'Pharaoh', 'temple', 'pyramid', 'gladiator', 'Colosseum', 'Athens', 'Sparta', 'Rome', 'Caesar', 'empire', 'dynasty', 'medieval', 'feudal'],
  modern: ['digital', 'internet', 'computer', 'software', 'startup', 'Silicon Valley', 'smartphone', 'social media', 'streaming', 'app', 'website', 'online', 'wireless', 'satellite', 'robot', 'AI', 'virtual'],
};

// Extract a title from the event text for Wikipedia search
const extractTitle = (text: string): string => {
  // Look for quoted text first (often contains the main subject)
  const quotedMatch = text.match(/"([^"]+)"/);
  if (quotedMatch && quotedMatch[1]) return quotedMatch[1];

  // Look for proper nouns at the start (capitalized words/phrases before first verb)
  const startMatch = text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/);
  if (startMatch && startMatch[1]) {
    const title = startMatch[1];
    // Filter out common starting words
    if (!['The', 'A', 'An', 'In', 'On', 'At'].includes(title)) {
      return title;
    }
  }

  // Look for any proper noun sequence (2-4 capitalized words together)
  const properNounMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/);
  if (properNounMatch && properNounMatch[1]) return properNounMatch[1];

  // Fallback: extract first meaningful phrase (up to first comma, colon, or dash)
  const parts = text.split(/[,:\-\u2013\u2014]/);
  const firstPhrase = parts[0]?.trim() || text;
  // Remove common starting words and take first few words
  const cleaned = firstPhrase
    .replace(/^(The|A|An|In|On|At)\s+/i, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(' ');

  return cleaned || text.substring(0, 40);
};

// Get a random date
const getRandomDate = (): { month: number; day: number } => {
  const month = Math.floor(Math.random() * 12) + 1;
  // Days per month (simplified, not accounting for leap years)
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDay = daysInMonth[month - 1] || 28;
  const day = Math.floor(Math.random() * maxDay) + 1;
  return { month, day };
};

historyRouter.get("/random", async (c) => {
  const apiKey = env.API_NINJAS_KEY;
  if (!apiKey) {
    return c.json(
      { error: { message: "API_NINJAS_KEY not configured", code: "MISSING_API_KEY" } },
      500
    );
  }

  const category = c.req.query('category')?.toLowerCase() || '';

  // Try up to 3 random dates to find a good fact
  for (let attempt = 0; attempt < 3; attempt++) {
    const { month, day } = getRandomDate();

    try {
      const response = await fetch(
        `https://api.api-ninjas.com/v1/historicalevents?month=${month}&day=${day}`,
        { headers: { "X-Api-Key": apiKey } }
      );

      if (!response.ok) {
        console.error("API Ninjas error:", response.status, await response.text());
        continue;
      }

      const events = (await response.json()) as HistoricalEvent[];

      if (!events || events.length === 0) {
        continue;
      }

      // Filter out violent/disturbing events
      const filtered = events.filter((evt) => {
        const lowerEvent = evt.event.toLowerCase();
        return !violentKeywords.some((keyword) => lowerEvent.includes(keyword));
      });

      if (filtered.length === 0) {
        continue;
      }

      // Score events - prefer weird/quirky/interesting ones
      const scored = filtered.map((evt) => {
        const lowerEvent = evt.event.toLowerCase();
        let score = 0;

        // Boost for weird/quirky keywords
        weirdKeywords.forEach((keyword) => {
          if (lowerEvent.includes(keyword)) {
            score += 25;
          }
        });

        // Boost for matching selected category
        if (category && categoryKeywords[category]) {
          categoryKeywords[category].forEach((keyword) => {
            if (lowerEvent.includes(keyword.toLowerCase())) {
              score += 50;
            }
          });
        }

        // Special year boosts for ancient/modern categories
        if (category === 'ancient') {
          const yearNum = parseInt(evt.year, 10);
          if (yearNum < 500) score += 40;
          else if (yearNum < 1000) score += 20;
        } else if (category === 'modern') {
          const yearNum = parseInt(evt.year, 10);
          if (yearNum > 1950) score += 40;
          else if (yearNum > 1900) score += 20;
        }

        // Boost for longer descriptions (more detail = more interesting)
        score += Math.min(evt.event.length / 5, 30);

        // Prefer events from 1800-2000 (more relatable)
        const year = parseInt(evt.year, 10);
        if (year >= 1800 && year <= 2000) {
          score += 15;
        } else if (year > 2000) {
          score += 10;
        }

        return { ...evt, score };
      });

      // Sort by score and pick randomly from top 5
      scored.sort((a, b) => b.score - a.score);
      const topEvents = scored.slice(0, Math.min(5, scored.length));
      const best = topEvents[Math.floor(Math.random() * topEvents.length)];

      if (!best) {
        continue;
      }

      const title = extractTitle(best.event);
      const wikipediaUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}`;

      return c.json({
        data: {
          year: best.year,
          event: best.event,
          month: String(month).padStart(2, '0'),
          day: String(day).padStart(2, '0'),
          title,
          wikipediaUrl,
        },
      });
    } catch (error) {
      console.error("Error fetching historical events:", error);
      continue;
    }
  }

  // Fallback if all attempts fail
  return c.json({
    data: {
      year: "1969",
      event: "Apollo 11 astronauts Neil Armstrong and Buzz Aldrin become the first humans to walk on the Moon.",
      month: "07",
      day: "20",
      title: "Apollo 11",
      wikipediaUrl: "https://en.wikipedia.org/w/index.php?search=Apollo%2011",
    },
  });
});

// Keep the /today endpoint for backwards compatibility
historyRouter.get("/today", async (c) => {
  const apiKey = env.API_NINJAS_KEY;
  if (!apiKey) {
    return c.json(
      { error: { message: "API_NINJAS_KEY not configured", code: "MISSING_API_KEY" } },
      500
    );
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  try {
    const response = await fetch(
      `https://api.api-ninjas.com/v1/historicalevents?month=${month}&day=${day}`,
      { headers: { "X-Api-Key": apiKey } }
    );

    if (!response.ok) {
      console.error("API Ninjas error:", response.status, await response.text());
      return c.json(
        { error: { message: "Failed to fetch historical events", code: "API_ERROR" } },
        502
      );
    }

    const events = (await response.json()) as HistoricalEvent[];

    if (!events || events.length === 0) {
      return c.json({
        data: {
          year: "",
          event: "No historical event found for today.",
          month: String(month),
          day: String(day),
          title: "History",
          wikipediaUrl: "https://en.wikipedia.org",
        },
      });
    }

    // Filter out violent/disturbing events
    const filtered = events.filter((evt) => {
      const lowerEvent = evt.event.toLowerCase();
      return !violentKeywords.some((keyword) => lowerEvent.includes(keyword));
    });

    const eventsToScore = filtered.length > 0 ? filtered : events;

    const scored = eventsToScore.map((evt) => {
      const lengthScore = evt.event.length;
      const yearNum = parseInt(evt.year, 10);
      const recencyScore = Math.abs(yearNum) / 10;
      return { ...evt, score: lengthScore + recencyScore };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    if (!best) {
      return c.json({
        data: {
          year: "",
          event: "No historical event found for today.",
          month: String(month),
          day: String(day),
          title: "History",
          wikipediaUrl: "https://en.wikipedia.org",
        },
      });
    }

    const title = extractTitle(best.event);
    const wikipediaUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}`;

    return c.json({
      data: {
        year: best.year,
        event: best.event,
        month: best.month,
        day: best.day,
        title,
        wikipediaUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching historical events:", error);
    return c.json(
      { error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
      500
    );
  }
});

export { historyRouter };
