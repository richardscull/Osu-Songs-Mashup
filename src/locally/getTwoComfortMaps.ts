import os from "os";
import cluster from "cluster";
import path from "path";
import { Beatmap } from "osu-classes";
import fs from "fs";
import { BeatmapDecoder } from "osu-parsers";
import { StandardRuleset } from "osu-standard-stable";

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
      cluster.on("message", (worker, result) => {
        if (result.length > 0) {
          resolve(result);
          for (var id in cluster.workers) {
            cluster.workers[id]?.kill();
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

    if (process && process.send) process.send(workerResults);
  });
}

/**
 * Gets a random map from all maps, and then
 * will try 10 times to find a suitable couple.
 *
 * If all 10 candidates maps are not suitable,
 * we will try again with another random map as a base.
 */
async function getMostComfortMap(mapPaths: string[]) {
  const decoder = new BeatmapDecoder();
  const workerResults: string[] = [];
  let result: boolean = false;
  for (let i = 0; i < mapPaths.length && !result; i++) {
    const rand = Math.floor(Math.random() * mapPaths.length);
    const map = mapPaths[rand];
    const ruleset = new StandardRuleset();

    mapPaths.splice(rand, 1);

    await Promise.all([
      decoder.decodeFromPath(`${map}`, false).then(async (beatmap: Beatmap) => {
        if (beatmap.mode === 0) {
          const mapOfChoice = beatmap;
          const mapOfChoiceStarRating = ruleset
            .createDifficultyCalculator(beatmap)
            .calculate().starRating;
          for (let i = 1; i < 10 && !result; i++) {
            const randLocal = Math.floor(Math.random() * mapPaths.length);
            const mapLocal = mapPaths[randLocal];
            await decoder
              .decodeFromPath(mapLocal, false)
              .then((beatmapLocal: Beatmap) => {
                if (beatmapLocal.mode === 0) {
                  const candidateStarRate = ruleset
                    .createDifficultyCalculator(beatmapLocal)
                    .calculate().starRating;

                  if (
                    candidateStarRate > mapOfChoiceStarRating - 1 &&
                    candidateStarRate < mapOfChoiceStarRating + 1
                    // Disabled, because we have auto adjusted bpm now
                    //   beatmapLocal.bpm > mapOfChoice.bpm - 20 &&
                    //   beatmapLocal.bpm < mapOfChoice.bpm + 20
                  ) {
                    workerResults.push(map, mapLocal);
                    result = true;
                  }
                }
              });
          }
        }
      }),
    ]);
  }
  return workerResults;
}
