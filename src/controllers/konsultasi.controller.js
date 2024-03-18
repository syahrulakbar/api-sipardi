// const db = require("../models");
// const Rule = db.rule;
// const Penyakit = db.penyakit;
// const Gejala = db.gejala;
// const Konsultasi = db.konsultasi;
const supabase = require("../utils/supabase");

exports.createKonsultasi = async (req, res) => {
  try {
    // const response = await Konsultasi.create(req.body);
    const { data: response, error } = await supabase
      .from("konsultasis")
      .insert([req.body])
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return res.status(201).json({
      message: "data konsultasi created successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while creating data konsultasi" });
  }
};

exports.getAllKonsultasi = async (req, res) => {
  try {
    // const response = await Konsultasi.findAll({
    //   where: {
    //     user_id: req.userId,
    //   },
    //   include: [
    //     {
    //       model: Rule,
    //       include: [Penyakit, Gejala],
    //     },
    //   ],
    //   order: [["createdAt", "DESC"]],
    // });

    const { data: response, error } = await supabase
      .from("konsultasis")
      .select(
        `*, 
        rules:rule_id(*, penyakits:penyakit_id(id,solusi,nama_penyakit), gejalas(id,nama_gejala))`,
      )
      .eq("user_id", req.userId)
      .order("createdAt", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get all data konsultasi successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while get data konsultasi" });
  }
};

exports.getKonsultasiById = async (req, res) => {
  const id = req.params.id;
  try {
    // const konsultasi = await Konsultasi.findByPk(id);
    const { data: konsultasi, error } = await supabase
      .from("konsultasis")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (konsultasi) {
      return res.status(200).json({
        message: "Get data konsultasi by id successfully",
        data: konsultasi,
      });
    } else {
      return res.status(404).json({
        message: "data konsultasi not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: error?.message || "Error while get data konsultasi by id" });
  }
};

exports.deleteKonsultasi = async (req, res) => {
  const id = req.params.id;
  try {
    // const konsultasi = await Konsultasi.findByPk(id);
    const { data: konsultasi, error } = await supabase
      .from("konsultasis")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (konsultasi) {
      // await konsultasi.destroy({ where: { id } });
      await supabase.from("konsultasis").delete().eq("id", id);
      return res.status(200).json({
        message: "Delete data konsultasi successfully",
      });
    } else {
      return res.status(404).json({
        message: "data konsultasi not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: error?.message || "Error while delete data konsultasi" });
  }
};

exports.updateKonsultasi = async (req, res) => {
  const id = req.params.id;
  try {
    // const konsultasi = await Konsultasi.findByPk(id);
    const { data: konsultasi, error } = await supabase
      .from("konsultasis")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (konsultasi) {
      // const response = await konsultasi.update(req.body, { where: { id } });
      const { data: response, error } = await supabase
        .from("konsultasis")
        .update(req.body)
        .eq("id", id)
        .select();
      if (error) {
        throw new Error(error.message);
      }
      return res.status(200).json({
        message: "Update data konsultasi successfully",
        data: response,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while data konsultasi" });
  }
};
