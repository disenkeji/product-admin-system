export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(500).json({message: err.message || '服务器内部错误'});
}
