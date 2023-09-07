import os from "os";
import cluster from "cluster";
import path from "path";
import { Beatmap } from "osu-classes";
import fs from "fs";
import { BeatmapDecoder } from "osu-parsers";
import { StandardRuleset } from "osu-standard-stable";
import { metaSource } from "../merge/metadata";

export function getTwoComfortMaps(paths: string[]): Promise<string[]> {
  cluster.setupPrimary({
    exec: path.join(__filename),
  });

  return new Promise((resolve, _) => {
    if (cluster.isPrimary) {
      const numCPUs = Math.floor(os.cpus().length);
      const maps: string[] = [];

      for (const path of paths) {
        const localMaps = fs
          .readdirSync(path, "utf8")
          .filter((file: string) => file.endsWith(".osu"))
          .map((file: string) => `${path}/${file}`);

        maps.push(...localMaps);
      }

      if (maps.length === 0) resolve([]);

      if (maps.length < numCPUs) {
        getMostComfortMap(maps).then((result) => {
          resolve(result);
        });
      }

      for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        let currentIndex = i;

        worker.send(
          maps.filter((_, index) => index % numCPUs === currentIndex)
        );
      }

      let completedWorkers = 0;
      const beatmapsFound = [] as string[];
      cluster.on("message", (worker, result) => {
        if (result.length > 0) {
          beatmapsFound.push(...result);

          if (beatmapsFound.length < 2) {
            resolve(beatmapsFound);
            for (var id in cluster.workers) {
              cluster.workers[id]?.kill();
            }
          }
        }

        if (++completedWorkers === numCPUs) {
          cluster.disconnect();
          resolve([]);
        }
      });
    }
  });
}

if (!cluster.isPrimary) {
  process.on("message", async (mapPaths: string[]) => {
    const workerResults = await getMostComfortMap(mapPaths);

    if (process && process.send && process.connected)
      process.send(workerResults);
  });
}

async function getMostComfortMap(mapPaths: string[]) {
  const Jsoning = require("jsoning");
  const config = new Jsoning("config.json");
  const filter = config.get("filters")?.local;

  const decoder = new BeatmapDecoder();
  const workerResults: string[] = [];

  let hasResult: boolean = false;

  for (let i = 0; i < mapPaths.length && !hasResult; i++) {
    const rand = Math.floor(Math.random() * mapPaths.length);
    const map = mapPaths[rand];
    mapPaths.splice(rand, 1);

    await Promise.all([
      decoder
        .decodeFromPath(`${map}`, false)
        .then(async (beatmap: Beatmap) => {
          if (isBeatmapValid(beatmap, filter ?? undefined)) {
            hasResult = true;
            workerResults.push(map);
          }
        })
        .catch(() => {}),
    ]);
  }
  return workerResults;
}

function isBeatmapValid(map: Beatmap, filter?: Filter): boolean {
  if (map.mode !== 0) return false;
  if (map.metadata.tags[0] === metaSource) return false;

  if (filter) {
    const ruleset = new StandardRuleset();

    // +20, +30 and etc. are giving filter a bit of a leeway
    if (filter.useFilter !== true) return false;
    if (filter.bpm && (map.bpm + 20 < filter.bpm || map.bpm - 20 > filter.bpm))
      return false;

    if (filter.starRating) {
      const starRating = ruleset
        .createDifficultyCalculator(map)
        .calculate().starRating;
      if (
        starRating + 0.5 < filter.starRating ||
        starRating - 0.5 > filter.starRating
      )
        return false;
    }
    if (
      filter.length &&
      (map.length + 30 < filter.length || map.length - 30 > filter.length)
    )
      return false;
  }
  return true;
}
