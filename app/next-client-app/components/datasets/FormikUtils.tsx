export const FormDataFilter = <
  T extends { id: number; name?: string; username?: string }
>(
  input: T[] | T
) => {
  const array = Array.isArray(input) ? input : [input];
  return array.map((item) => ({
    value: item.id,
    label: item.username || item.name,
  }));
};

export const FindAndFormat = <
  T extends { id: number; name?: string; username?: string }
>(
  data: T[],
  ids: number[]
) => FormDataFilter<T>(data.filter((item) => ids.includes(item.id)));
