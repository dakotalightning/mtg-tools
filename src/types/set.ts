export type TSet = {
  object:          string;
  id:              string;
  code:            string;
  mtgo_code:            string;
  arena_code:            string;
  name:            string;
  uri:             string;
  scryfall_uri:    string;
  search_uri:      string;
  released_at:     string;
  set_type:        string;
  card_count:      number;
  parent_set_code?: string;
  digital:         boolean;
  nonfoil_only:    boolean;
  foil_only:       boolean;
  icon_svg_uri:    string;
  block?:    string;
  childSets?: TSet[]
}
