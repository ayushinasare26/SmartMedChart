module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    msg: 'JavaScript serverless function works!',
    time: new Date().toISOString(),
  });
};
