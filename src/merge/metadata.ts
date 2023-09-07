import { Beatmap } from "osu-classes";

function stringifyForWidnows(str: string) {
  return str.replace(/[\\/:*?"<>|]/g, "").slice(0, 255);
}

export const metaSource = "merged_by_osu!SM";

export async function mergeMetadata(
  MergedSong: Beatmap,
  FirstSong: Beatmap,
  SecondSong: Beatmap
) {
  MergedSong.metadata.title = stringifyForWidnows(
    FirstSong.metadata.title + " VS. " + SecondSong.metadata.title
  );

  MergedSong.metadata.title = MergedSong.metadata.title.endsWith(".")
    ? MergedSong.metadata.title.slice(0, -1)
    : MergedSong.metadata.title;

  MergedSong.metadata.artist = stringifyForWidnows(
    FirstSong.metadata.artist + " VS. " + SecondSong.metadata.artist
  );

  MergedSong.metadata.tags = [];
  MergedSong.metadata.tags[0] = metaSource;

  MergedSong.metadata.creator = stringifyForWidnows(
    FirstSong.metadata.creator + " VS. " + SecondSong.metadata.creator
  );

  MergedSong.metadata.version = stringifyForWidnows(
    FirstSong.metadata.version + " VS. " + SecondSong.metadata.version
  );

  MergedSong.general.previewTime = 0;

  MergedSong.general.audioFilename = "merged.mp3";

  MergedSong.events.backgroundPath = "merged.jpg";
}
