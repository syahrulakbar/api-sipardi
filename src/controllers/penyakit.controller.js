const supabase = require("../utils/supabase");

exports.createPenyakit = async (req, res) => {
  try {
    const { data: response, error } = await supabase.from("penyakits").insert([req.body]).select();
    if (error) {
      return res
        .status(500)
        .json({ message: error?.message || "Error while creating data penyakit" });
    }
    return res.status(201).json({
      message: "data penyakit created successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while creating data penyakit" });
  }
};

exports.getAllPenyakit = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const { data: response, error } = await supabase
      .from("penyakits")
      .select()
      .ilike("nama_penyakit", `%${keyword}%`)
      .order("id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get all data penyakit successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while get data penyakit" });
  }
};

exports.getPenyakitById = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: penyakit, error } = await supabase
      .from("penyakits")
      .select()
      .eq("id", id)
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (penyakit) {
      return res.status(200).json({
        message: "Get data penyakit by id successfully",
        data: penyakit,
      });
    } else {
      return res.status(404).json({
        message: "data penyakit not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ message: error?.message || "Error while get data penyakit by id" });
  }
};

exports.deletePenyakit = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: penyakit, error } = await supabase
      .from("penyakits")
      .select()
      .eq("id", id)
      .single();
    if (error || !penyakit) {
      return res.status(404).json({ message: "Penyakit not found" });
    }
    if (penyakit) {
      await supabase.from("penyakits").delete().eq("id", id);
      return res.status(200).json({
        message: "Delete data penyakit successfully",
      });
    } else {
      return res.status(404).json({
        message: "data penyakit not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: error?.message || "Error while delete data penyakit" });
  }
};

exports.updatePenyakit = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: penyakit, error } = await supabase
      .from("penyakits")
      .select()
      .eq("id", id)
      .single();
    if (error || !penyakit) {
      return res.status(404).json({ message: "Penyakit not found" });
    }
    const { data: response, error: errorData } = await supabase
      .from("penyakits")
      .update(req.body)
      .eq("id", id)
      .select();
    if (errorData) {
      return res
        .status(500)
        .json({ message: errorData?.message || "Error while update data penyakit" });
    }
    return res.status(200).json({
      message: "Update data penyakit successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: "Error while data penyakit" });
  }
};
