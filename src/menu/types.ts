interface Filter {
  useFilter: boolean;
  starRatingMin: number;
  starRatingMax: number;
  bpmMin: number;
  bpmMax: number;
  lengthMin: number;
  lengthMax: number;
  query?: string;
}
