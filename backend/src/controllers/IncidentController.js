const connection = require("../db/connection");

module.exports = {
  async create(req, res) {
    const { title, description, value } = req.body;
    const ong_id = req.headers.authorization;

    const [id] = await connection("incidents").insert({
      title,
      description,
      value,
      ong_id
    });

    res.json({ id });
  },

  async index(req, res) {
    const { page = 1 } = req.query;

    const [count] = await connection("incidents").count();
    console.log(count);

    const incidents = await connection("incidents")
      .join("ongs", "ongs.id", "=", "incidents.ong_id")
      .limit(5)
      .offset((page - 1) * 5)
      .select([
        "incidents.*",
        "ongs.name",
        "ongs.email",
        "ongs.whatsapp",
        "ongs.city",
        "ongs.uf"
      ]);

    res.header("X-Total-Count", count["count(*)"]);
    return res.json({
      incidents,
      pages: {
        current: parseFloat(page),
        total: Math.ceil(count["count(*)"] / 5)
      }
    });
  },

  async delete(req, res) {
    try {
      const ong_id = req.headers.authorization;
      const idToBeDeleted = req.params.id;

      const incident = await connection("incidents")
        .where({
          id: idToBeDeleted
        })
        .select("ong_id")
        .first();

      if (incident.ong_id !== ong_id) {
        return res.status(401).json({ error: "Not allowed" });
      }

      await connection("incidents")
        .where({
          id: idToBeDeleted
        })
        .del();

      return res.status(204).send();
    } catch (error) {
      return res.status(500).send();
    }
  }
};
