export const generateId = (type?: string | number) => {
  const id = crypto.randomUUID();
  return type ? `${type}-${id}` : id;
};
