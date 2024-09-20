import type { Options } from "./options";
import type { State } from "./state";

export type Actions = {
  pick: () => void;
};

type ActionParams = {
  state: State;
  options: Options;
};

export const initActions = (state: State, options: Options): Actions => {
  return {
    pick: initPickAction({ state, options }),
  };
};

const initPickAction = ({
  state: { currentUri, picker },
  options,
}: ActionParams) => {
  return () => {};
};
