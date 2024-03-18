// const db = require("../models");
// const Gejala = db.gejala;
// const { Op } = require("sequelize");
const supabase = require("../utils/supabase");

exports.createGejala = async (req, res) => {
  try {
    // const response = await Gejala.create(req.body);
    const { data: response, error } = await supabase.from("gejalas").insert([req.body]).select();
    if (error) {
      throw new Error(error.message);
    }
    return res.status(201).json({
      message: "data gejala created successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while creating data gejala" });
  }
};

exports.dispepsia = async (req, res) => {
  try {
    // const response = await Gejala.findOne({
    //   where: {
    //     mulai: true,
    //   },
    // });
    const { data: response, error } = await supabase
      .from("gejalas")
      .select("*")
      .eq("mulai", true)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get all data gejala successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while get data gejala" });
  }
};
exports.getAllGejala = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    // const response = await Gejala.findAll({
    //   where: {
    //     nama_gejala: {
    //       [Op.iLike]: `%${keyword}%`,
    //     },
    //   },
    //   order: [["id", "ASC"]],
    // });

    const { data: response, error } = await supabase
      .from("gejalas")
      .select("*")
      .ilike("nama_gejala", `%${keyword}%`)
      .order("id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get all data gejala successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while get data gejala" });
  }
};

exports.getGejalaById = async (req, res) => {
  const id = req.params.id;
  try {
    // const gejala = await Gejala.findByPk(id);
    const { data: gejala, error } = await supabase
      .from("gejalas")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (gejala) {
      return res.status(200).json({
        message: "Get data gejala by id successfully",
        data: gejala,
      });
    } else {
      return res.status(404).json({
        message: "data gejala not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: error?.message || "Error while get data gejala by id" });
  }
};

exports.deleteGejala = async (req, res) => {
  const id = req.params.id;
  try {
    // const gejala = await Gejala.findByPk(id);
    const { data: gejala, error } = await supabase
      .from("gejalas")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (gejala) {
      // await gejala.destroy({ where: { id } });
      await supabase.from("gejalas").delete().eq("id", id);
      return res.status(200).json({
        message: "Delete data gejala successfully",
      });
    } else {
      return res.status(404).json({
        message: "data gejala not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: error?.message || "Error while delete data gejala" });
  }
};

exports.updateGejala = async (req, res) => {
  const id = req.params.id;
  try {
    // const gejala = await Gejala.findByPk(id);
    const { data: gejala, error } = await supabase
      .from("gejalas")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (gejala) {
      // const response = await gejala.update(req.body, { where: { id } });
      const { data: response, error } = await supabase
        .from("gejalas")
        .update(req.body)
        .eq("id", id)
        .select();
      if (error) {
        throw new Error(error.message);
      }
      return res.status(200).json({
        message: "Update data gejala successfully",
        data: response,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while data gejala" });
  }
};
