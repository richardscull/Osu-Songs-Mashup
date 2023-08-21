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

export async function setUserSongsFolder(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationSettings = await localization.get("settings");

  printWatermarkAndClear();

  await inquirer
    .prompt([
      {
        name: "Path",
        type: "input",
        message: localizationSettings.setOsuPath,
      },
    ])
    .then(async (path) => {
      if (!fs.existsSync(path.Path)) {
        console.log(localizationSettings.wrongPath);
      } else {
        await config.set("path", path.Path);
        console.log(localizationSettings.correctPath);
      }
    });
}

export async function userConfirmTwoRandomMaps(
  config: Jsoning,
  maps: string[]
) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");

  printWatermarkAndClear();

  const decoder = new BeatmapDecoder();
  const firstMap = await decoder.decodeFromPath(maps[0], false);
  const secondMap = await decoder.decodeFromPath(maps[1], false);

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
        return [
          {
            path: maps[0].split("/").slice(0, -1).join("/"),
            difficulty: firstMap,
          },
          {
            path: maps[1].split("/").slice(0, -1).join("/"),
            difficulty: secondMap,
          },
        ];
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

  printWatermarkAndClear();

  return await inquirer
    .prompt([
      {
        name: "Path",
        type: "input",
        message:
          number == 1
            ? localizationSettings.setFirstMapPath
            : localizationSettings.setSecondMapPath,
      },
    ])
    .then(async (path) => {
      if (!fs.existsSync(path.Path)) {
        console.log(localizationSettings.wrongPath);
        return await backToMenu(config, userChooseMap, number);
      } else {
        const difficulties = fs
          .readdirSync(path.Path, "utf8")
          .filter((file) => file.endsWith(".osu"));

        if (difficulties.length === 0) {
          console.log(localizationSettings.noDifficulties);
          return await backToMenu(config, userChooseMap, number);
        } else {
          const decoder = new BeatmapDecoder();
          const difficultyBeatmaps: Beatmap[] = [];

          await Promise.all(
            difficulties.map(async (difficulty) => {
              const beatmap = await decoder.decodeFromPath(
                `${path.Path}/${difficulty}`,
                false
              );
              if (beatmap.mode === 0) {
                difficultyBeatmaps.push(beatmap);
              }
            })
          );

          if (difficultyBeatmaps.length === 0) {
            console.log(localizationSettings.noDifficulties);
            return await backToMenu(config, userChooseMap, number);
          } else {
            return {
              path: path.Path,
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

  printWatermarkAndClear();

  return await inquirer
    .prompt([
      {
        name: "difficulty",
        type: "list",
        message: localizationSettings.chooseDifficulty,
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
