export const ok = (res, data = null, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

export const created = (res, data = null, message = 'Created') => ok(res, data, message, 201);
