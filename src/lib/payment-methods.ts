export const PAYMENT_METHODS = [
  { id: "instapay", label: "InstaPay", hint: "رقم أو عنوان InstaPay، أو رابط الدفع" },
  { id: "vodafone_cash", label: "فودافون كاش", hint: "رقم المحفظة" },
  { id: "orange_cash", label: "أورنج كاش", hint: "رقم المحفظة" },
  { id: "etisalat_cash", label: "اتصالات كاش", hint: "رقم المحفظة" },
  { id: "we_pay", label: "WE Pay", hint: "رقم المحفظة" },
  { id: "bank_transfer", label: "تحويل بنكي", hint: "اسم البنك ورقم الحساب أو IBAN" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export const isPaymentMethod = (v: unknown): v is PaymentMethodId =>
  typeof v === "string" && PAYMENT_METHODS.some((m) => m.id === v);

export const paymentLabel = (id: string | null | undefined) =>
  PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id ?? "";

export type PaymentAccounts = Partial<Record<PaymentMethodId, string>>;
