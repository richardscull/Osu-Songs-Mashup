import { BeatmapDecoder, BeatmapEncoder } from "osu-parsers";
import { Difficulty } from "../locally/types";
import fs from "fs";
import {
  BeatmapBreakEvent,
  ControlPointGroup,
  HitObject,
  IHasDuration,
} from "osu-classes";
import printWatermarkAndClear from "../lib/watermark";
import Jsoning from "jsoning";
import getLocalizationJson from "../lib/localization/main";
import { mergeMetadata } from "./metadata";
import { MergeAudioAndExport } from "./audio";
import { zip } from "zip-a-folder";
import path from "path";
import { openOsz } from "./propmpts";
import { showMainMenu } from "../menu/main";
import { MergeBackgroundsAndExport } from "./background";

// TODO:
// - [ ] Fix Kiai continues in second half

export default async function main(
  config: Jsoning,
  FirstSong: Difficulty,
  SecondSong: Difficulty
) {
  const localization = await getLocalizationJson(config);
  const localizationMerging = await localization.get("merging");

  printWatermarkAndClear();

  // Start merging
  console.log(localizationMerging.started);

  const MergedSong = FirstSong.difficulty.clone();

  // Merge maps metadata
  console.log(localizationMerging.metadata);
  await mergeMetadata(MergedSong, FirstSong.difficulty, SecondSong.difficulty);

  // Get two hitObjects halfs
  const HitObjectHalfs = getTwoHitObjectHalfs();

  if (!HitObjectHalfs.SecondHalf.length || !HitObjectHalfs.FirstHalf.length) {
    console.log(localizationMerging.error);
    return require("../lib/prompt").default(config, main);
  }

  const endOfFirstHalf =
    HitObjectHalfs.FirstHalf[HitObjectHalfs.FirstHalf.length - 1].startTime;
  const startOfSecondHalf = HitObjectHalfs.SecondHalf[0].startTime;

  console.log(localizationMerging.difficulties);

  // Merge hitObjects
  MergedSong.hitObjects = [
    ...HitObjectHalfs.FirstHalf.slice(0, HitObjectHalfs.FirstHalf.length - 1),
    ...HitObjectHalfs.SecondHalf.map((obj) => {
      const hitObject = obj as HitObject & IHasDuration;
      if ((hitObject.hitType as any) == 12 /* Spinner */) {
        hitObject.endTime += endOfFirstHalf - startOfSecondHalf;
      }
      hitObject.startTime += endOfFirstHalf - startOfSecondHalf;
      return hitObject;
    }),
  ] as HitObject[] & IHasDuration[];

  // Merge controlPoints
  MergedSong.controlPoints.groups = mergeControlPointsGroups();

  // Merge breaks
  MergedSong.events.breaks = mergeBreaks();

  // Add second timing point (to get BPM for second half)
  addSecondTimingPoint();

  // Create Temp folder for temporary files
  if (!fs.existsSync("./Temp")) fs.mkdirSync("./Temp");

  // Create folder for merged map
  if (!fs.existsSync(`./Temp/${MergedSong.metadata.title}`))
    fs.mkdirSync(`./Temp/${MergedSong.metadata.title}`);

  console.log(localizationMerging.audio);

  // Merge audio files and export it
  await MergeAudioAndExport(
    FirstSong,
    SecondSong,
    { endOfFirstHalf, startOfSecondHalf },
    MergedSong.metadata.title
  );

  console.log(localizationMerging.background);

  // Merge background images
  await MergeBackgroundsAndExport(
    FirstSong,
    SecondSong,
    MergedSong.metadata.title
  );

  // Encode merged map to file
  const encoder = new BeatmapEncoder();
  await encoder.encodeToPath(
    `./Temp/${MergedSong.metadata.title}/${MergedSong.metadata.title}(${MergedSong.metadata.version})`,
    MergedSong
  );

  // Create .osz file
  await zip(
    `./Temp/${MergedSong.metadata.title}`,
    `./${MergedSong.metadata.title}.osz`
  );

  // Delete Temp folder
  fs.rmSync("./Temp", { recursive: true });

  console.log(localizationMerging.completed);
  console.log(
    `${localizationMerging.exportedAs} ${path.resolve(
      MergedSong.metadata.title
    )}.osz`
  );

  await openOsz(config, `${path.resolve(MergedSong.metadata.title)}.osz`);
  return showMainMenu(config);

  // Function to merge control points groups
  function mergeControlPointsGroups(): ControlPointGroup[] {
    const firstHalf = FirstSong.difficulty.controlPoints.groups.filter(
      (point) => point.startTime < endOfFirstHalf
    );
    const secondHalf = SecondSong.difficulty.controlPoints.groups
      .filter((point) => point.startTime >= startOfSecondHalf)
      .map((obj) => {
        const point = obj as ControlPointGroup & IHasDuration;
        point.startTime += endOfFirstHalf - startOfSecondHalf;
        point.endTime += endOfFirstHalf - startOfSecondHalf;
        return point;
      });
    const controlPointsGroups = [...firstHalf, ...secondHalf];

    return controlPointsGroups;
  }

  // Function to add second timing point (to get BPM for second half)
  function addSecondTimingPoint() {
    const lastTimingPoint = SecondSong.difficulty.controlPoints.timingPoints
      .filter(
        (p) => p.startTime < HitObjectHalfs.SecondHalf.slice(-1)[0].startTime
      )
      .slice(-1)[0];

    const mergeOffset = endOfFirstHalf - startOfSecondHalf;

    const timeForFullRythmCycle =
      lastTimingPoint.beatLength * lastTimingPoint.timeSignature;

    const mapsOffset =
      lastTimingPoint.startTime < 0
        ? timeForFullRythmCycle +
          (timeForFullRythmCycle + lastTimingPoint.startTime)
        : lastTimingPoint.startTime;

    let newOffset = mergeOffset + mapsOffset;

    while (newOffset + timeForFullRythmCycle < startOfSecondHalf + mergeOffset)
      newOffset += timeForFullRythmCycle;

    MergedSong.controlPoints.add(lastTimingPoint, newOffset);
  }

  function mergeBreaks() {
    const firstHalf = FirstSong.difficulty.events.breaks.filter(
      (point) => point.endTime < endOfFirstHalf
    );
    const secondHalf = SecondSong.difficulty.events.breaks
      .filter((point) => point.startTime > startOfSecondHalf)
      .map((obj) => {
        const point = obj as BeatmapBreakEvent & IHasDuration;
        point.startTime += endOfFirstHalf - startOfSecondHalf;
        point.endTime += endOfFirstHalf - startOfSecondHalf;
        return point;
      });

    const breaks = [...firstHalf, ...secondHalf];
    return breaks;
  }

  // Function to merge hitObject halfs
  function getTwoHitObjectHalfs() {
    const FirstHalf = FirstSong.difficulty.hitObjects.slice(
      0,
      Math.floor(FirstSong.difficulty.hitObjects.length / 2)
    ) as HitObject[] & IHasDuration[];

    const SecondHalf = SecondSong.difficulty.hitObjects.slice(
      Math.floor(SecondSong.difficulty.hitObjects.length / 2)
    ) as HitObject[] & IHasDuration[];

    return { FirstHalf, SecondHalf };
  }
}
