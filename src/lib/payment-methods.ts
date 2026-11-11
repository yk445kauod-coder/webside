// Only InstaPay for now. Wallet methods (Vodafone/Orange/Etisalat Cash, WE Pay) and bank transfer are accepted
// by the database check, so adding one back is a one-line change here.
export const PAYMENT_METHODS = [
  { id: "instapay", label: "InstaPay", hint: "رقم أو عنوان InstaPay، أو رابط الدفع" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const isPaymentMethod = (v: unknown): v is PaymentMethodId =>
  typeof v === "string" && PAYMENT_METHODS.some((m) => m.id === v);

export const paymentLabel = (id: string | null | undefined) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id ?? "";

export type PaymentAccounts = Partial<Record<PaymentMethodId, string>>;
