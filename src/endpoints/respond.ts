/** Dạng lỗi thống nhất: { error: { code, message, fields } } (mục 10, 11 blueprint). */
export function apiError(status: number, code: string, message: string, fields?: Record<string, string>, headers?: HeadersInit) {
  return Response.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status, headers })
}

export function apiOk(body: unknown, status = 200) {
  return Response.json(body, { status })
}
