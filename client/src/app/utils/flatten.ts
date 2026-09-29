export const flatten = ({ children }: any) =>
  children.flatMap(({ children = [], ...rest }) => [
    rest,
    ...flatten({ children }),
  ]);
