interface PickableObject<T> {
  [index: string]: T;
}
export const pickKeysFromObject = <T>({
  object,
  keep,
}: {
  object: PickableObject<T>;
  keep: (arg: T) => boolean;
}) =>
  Object.entries(object).reduce((progress, thisEntry) => {
    if (!keep(thisEntry[1])) return progress; // if not defined to keep, skip this property
    return { ...progress, [thisEntry[0]]: thisEntry[1] }; // otherwise, keep property
  }, {} as { [index: string]: T }); // tslint:disable-line align
