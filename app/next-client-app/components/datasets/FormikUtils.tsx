export const FormDataFilterUsers = (array: Users[]) => {
  return array.map((user) => ({
    value: user.id,
    label: user.username,
  }));
};

export const FormDataFilterPartners = (input: DataPartner[] | DataPartner) => {
  const array = Array.isArray(input) ? input : [input];
  return array.map((user) => ({
    value: user.id,
    label: user.name,
  }));
};

export const FormDataFilterProjects = (input: Projects[] | Projects) => {
  const array = Array.isArray(input) ? input : [input];
  return array.map((user) => ({
    value: user.id,
    label: user.name,
  }));
};
