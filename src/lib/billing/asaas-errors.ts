export type AsaasErrorItem = {
  code?: string;
  description?: string;
};

export class AsaasOperationError extends Error {
  readonly httpStatus: number;
  readonly codes: string[];
  readonly descriptions: string[];

  constructor(input: {
    userMessage: string;
    httpStatus: number;
    items: AsaasErrorItem[];
  }) {
    super(input.userMessage);
    this.name = "AsaasOperationError";
    this.httpStatus = input.httpStatus;
    this.codes = input.items.map((e) => e.code).filter(Boolean) as string[];
    this.descriptions = input.items.map((e) => e.description).filter(Boolean) as string[];
  }
}

export function parseAsaasErrors(body: unknown): AsaasErrorItem[] {
  if (!body || typeof body !== "object") return [];
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors)) return [];
  return errors
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      code: typeof item.code === "string" ? item.code : undefined,
      description: typeof item.description === "string" ? item.description : undefined,
    }));
}

const GENERIC_INVALID_OBJECT =
  "Configuração de cobrança inválida no Asaas. A equipe foi notificada nos logs.";

const USER_SAFE_BY_CODE: Record<string, string> = {
  invalid_access_token:
    "Pagamento indisponível: chave Asaas inválida. A equipe precisa revisar ASAAS_API_KEY na Vercel.",
  invalid_customer:
    "Não foi possível vincular sua conta ao Asaas. Tente de novo em instantes ou contate o suporte.",
  invalid_object: GENERIC_INVALID_OBJECT,
  invalid_callback:
    "URL de retorno após pagamento não está liberada no Asaas. Assinatura sem redirecionamento automático.",
  invalid_successUrl:
    "Domínio de retorno após pagamento não está cadastrado no Asaas.",
  invalid_dueDate:
    "Data de vencimento inválida para cobrança. Tente novamente amanhã ou contate o suporte.",
  invalid_nextDueDate:
    "Data da primeira cobrança inválida. Tente novamente em instantes.",
};

export function isMissingCustomerTaxIdError(items: AsaasErrorItem[]): boolean {
  return items.some(
    (e) =>
      e.code === "invalid_object" &&
      /CPF|CNPJ/i.test(e.description ?? ""),
  );
}

function userMessageForItem(item: AsaasErrorItem): string | undefined {
  const code = item.code?.trim();
  const desc = item.description?.trim() ?? "";
  if (isMissingCustomerTaxIdError([item])) {
    return "Informe um CPF ou CNPJ válido para continuar — o Asaas exige esse dado na nota fiscal.";
  }
  if (code && USER_SAFE_BY_CODE[code]) {
    return USER_SAFE_BY_CODE[code];
  }
  if (code === "invalid_object" && /billingType|forma de pagamento/i.test(desc)) {
    return "Forma de pagamento indisponível na conta Asaas. A equipe foi notificada nos logs.";
  }
  return undefined;
}

export function userMessageForAsaasErrors(
  items: AsaasErrorItem[],
  httpStatus: number,
  fallback: string,
): string {
  if (httpStatus === 401) {
    return USER_SAFE_BY_CODE.invalid_access_token;
  }
  for (const item of items) {
    const mapped = userMessageForItem(item);
    if (mapped) return mapped;
  }
  const desc = items.find((e) => e.description?.trim())?.description?.trim();
  if (desc && desc.length <= 160 && !/access_token|api key/i.test(desc)) {
    return desc;
  }
  return fallback;
}

export function logAsaasFailure(
  context: string,
  httpStatus: number,
  items: AsaasErrorItem[],
): void {
  const codes = items.map((e) => e.code).filter(Boolean);
  console.error(`[asaas] ${context}`, {
    httpStatus,
    codes: codes.length ? codes : undefined,
    errors: items.length ? items : undefined,
  });
}

export function throwAsaasFailure(
  context: string,
  httpStatus: number,
  body: unknown,
  fallback: string,
): never {
  const items = parseAsaasErrors(body);
  logAsaasFailure(context, httpStatus, items);
  const userMessage = userMessageForAsaasErrors(items, httpStatus, fallback);
  throw new AsaasOperationError({ userMessage, httpStatus, items });
}

export function isInvalidCustomerError(items: AsaasErrorItem[]): boolean {
  return items.some(
    (e) =>
      e.code === "invalid_customer" ||
      /cliente.*inv[aá]lid/i.test(e.description ?? "") ||
      /customer.*not found/i.test(e.description ?? ""),
  );
}
