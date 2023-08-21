import { Beatmap } from "osu-classes";

export interface Difficulty {
  difficulty: Beatmap;
  path: string;
}

export interface FilterLocal {
  starRating: {
    min: number;
    max: number;
  };
  BPM: {
    min: number;
    max: number;
  };
  time: {
    min: number;
    max: number;
  };
}
