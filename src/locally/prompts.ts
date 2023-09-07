import inquirer from "inquirer";
import Jsoning from "jsoning";
import fs from "fs";
import getLocalizationJson from "../lib/localization/main";
import { showMainMenu } from "../menu/main";
import printWatermarkAndClear from "../lib/watermark";
import { BeatmapDecoder } from "osu-parsers";
import { Beatmap } from "osu-classes";
import { StandardRuleset } from "osu-standard-stable";
import msToMinAndSec from "../lib/msToMin&Sec";

export async function showLocallyExplanation(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");
  const localizationMashup = await localization.get("mashupMethods")
    .localMashup;

  printWatermarkAndClear();

  console.log(localizationMashup.name + "\n" + localizationMashup.description);

  inquirer
    .prompt([
      {
        name: "useThisMethod",
        type: "confirm",
        message: localizationMenu.areYouSureMethod,
      },
    ])
    .then((options) => {
      if (options.useThisMethod) {
        require("./main").default(config);
      } else {
        showMainMenu(config);
      }
    });
}

export async function userConfirmTwoMaps(
  config: Jsoning,
  maps: {
    byPath?: string[];
    byDifficulty?: { path: string; difficulty: Beatmap }[];
  }
) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");

  printWatermarkAndClear();

  const decoder = new BeatmapDecoder();

  if (
    (maps.byPath && maps.byPath.length < 2) ||
    (maps.byDifficulty && maps.byDifficulty.length < 2)
  )
    return [];

  let firstMap = maps.byPath
    ? await decoder.decodeFromPath(maps.byPath[0])
    : maps!.byDifficulty![0].difficulty;
  let secondMap = maps.byPath
    ? await decoder.decodeFromPath(maps.byPath[1])
    : maps!.byDifficulty![1].difficulty;

  console.log(
    `${localizationMenu.twoRandomMaps}\n\n` +
      `[⭐ ${getBeatmapStarRating(firstMap)}] ${
        firstMap.metadata.title
      } ${msToMinAndSec(firstMap.length)}\n` +
      `[⭐ ${getBeatmapStarRating(secondMap)}] ${
        secondMap.metadata.title
      } ${msToMinAndSec(secondMap.length)}\n`
  );

  return await inquirer
    .prompt([
      {
        name: "confirm",
        type: "confirm",
        message: localizationMenu.areYouSureMaps,
      },
    ])
    .then((options) => {
      if (options.confirm) {
        if (maps.byPath) {
          return [
            {
              path: maps.byPath[0].split("/").slice(0, -1).join("/"),
              difficulty: firstMap,
            },
            {
              path: maps.byPath[1].split("/").slice(0, -1).join("/"),
              difficulty: secondMap,
            },
          ];
        } else {
          return maps.byDifficulty ? maps.byDifficulty : [];
        }
      } else {
        return [];
      }
    });
}

export async function userChooseMap(
  config: Jsoning,
  number: 1 | 2
): Promise<{ path: string; difficulty: Beatmap }> {
  const localization = await getLocalizationJson(config);
  const localizationSettings = await localization.get("settings");
  const localizationSetSettings = await localization.get("setSettings");

  printWatermarkAndClear();

  return await inquirer
    .prompt([
      {
        name: "Path",
        type: "input",
        message:
          number == 1
            ? localizationSetSettings.setFirstMapPath
            : localizationSetSettings.setSecondMapPath,
      },
    ])
    .then(async (path) => {
      const filteredPath = path.Path.replace(/[*?"<>|]/g, "");
      if (
        !fs.existsSync(filteredPath) ||
        !fs.lstatSync(filteredPath).isDirectory()
      ) {
        console.log(localizationSettings.wrongPath);
        return await backToMenu(config, userChooseMap, number);
      } else {
        const difficulties = fs
          .readdirSync(filteredPath, "utf8")
          .filter((file) => file.endsWith(".osu"));

        if (difficulties.length === 0) {
          console.log(localizationSetSettings.noDifficulties);
          return await backToMenu(config, userChooseMap, number);
        } else {
          const decoder = new BeatmapDecoder();
          const difficultyBeatmaps: Beatmap[] = [];

          await Promise.all(
            difficulties.map(async (difficulty) => {
              const beatmap = await decoder.decodeFromPath(
                `${filteredPath}/${difficulty}`,
                false
              );
              if (beatmap.mode === 0) {
                difficultyBeatmaps.push(beatmap);
              }
            })
          );

          if (difficultyBeatmaps.length === 0) {
            console.log(localizationSetSettings.noDifficulties);
            return await backToMenu(config, userChooseMap, number);
          } else {
            return {
              path: filteredPath,
              difficulty: await userChooseDifficulty(
                config,
                difficultyBeatmaps
              ),
            };
          }
        }
      }
    });
}

async function userChooseDifficulty(
  config: Jsoning,
  difficulties: Beatmap[]
): Promise<Beatmap> {
  const localization = await getLocalizationJson(config);
  const localizationSettings = await localization.get("settings");
  const localizationSetSettings = await localization.get("setSettings");

  printWatermarkAndClear();

  return await inquirer
    .prompt([
      {
        name: "difficulty",
        type: "list",
        message: localizationSetSettings.chooseDifficulty,
        choices: difficulties.map(
          (difficulty) =>
            `[⭐ ${getBeatmapStarRating(difficulty)}] ${
              difficulty.metadata.version
            }`
        ),
      },
    ])
    .then(async (options) => {
      const difficulty = difficulties.find(
        (difficulty) =>
          difficulty.metadata.version === options.difficulty.split("] ")[1]
      );
      if (!difficulty) {
        return await backToMenu(config, userChooseDifficulty);
      } else {
        return difficulty;
      }
    });
}

async function backToMenu(
  config: Jsoning,
  func: Function,
  addInput?: any
): Promise<any> {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");

  return inquirer
    .prompt([
      {
        name: "backToMenu",
        type: "confirm",
        message: localizationMenu.backToMenu + "?",
      },
    ])
    .then((options) => {
      if (options.backToMenu) {
        require("./main").default(config);
        return;
      } else {
        return func(config, addInput);
      }
    });
}

function getBeatmapStarRating(map: Beatmap) {
  const ruleset = new StandardRuleset();
  return ruleset
    .createDifficultyCalculator(map)
    .calculate()
    .starRating.toFixed(1);
}
