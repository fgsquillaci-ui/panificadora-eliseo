export const formatCurrency = (value: number | null | undefined) =>
  `$${(value ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
