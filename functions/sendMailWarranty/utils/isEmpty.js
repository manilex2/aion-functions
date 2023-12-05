const isEmpty = (value) => {
  return (
    value == null || (typeof value === "string" && value.trim().length === 0)
  );
};

module.exports = isEmpty;
