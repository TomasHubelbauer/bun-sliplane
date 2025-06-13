export default new Response(null, {
  status: 401,
  headers: {
    "WWW-Authenticate": "Basic",
  },
});
