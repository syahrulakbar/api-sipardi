const supabase = require("../utils/supabase");

exports.createBlog = async (req, res) => {
  const author = req.userId;
  try {
    const { data: response, error } = await supabase
      .from("blogs")
      .insert([{ ...req.body, author }])
      .select();
    if (error) {
      throw new Error(error.message);
    }
    return res.status(201).json({
      message: "Blog created successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while creating blog" });
  }
};

exports.getAllBlog = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const { data: response, error } = await supabase
      .from("blogs")
      .select("*")
      .ilike("title", `%${keyword}%`);
    if (error) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Get all blog successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while get all blog" });
  }
};

exports.getBlogById = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: blog, error } = await supabase.from("blogs").select().eq("id", id).single();

    if (error || !blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }
    return res.status(200).json({
      message: "Get blog successfully",
      data: blog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error?.message || "Error while get blog by id" });
  }
};

exports.deleteBlog = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: blog, error } = await supabase.from("blogs").select("*").eq("id", id).single();
    if (error || !blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }
    await supabase.from("blogs").delete().eq("id", id);

    return res.status(200).json({
      message: "Delete blog successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error?.message || "Error while delete blog" });
  }
};

exports.updateBlog = async (req, res) => {
  const id = req.params.id;
  try {
    const { data: blog, error } = await supabase.from("blogs").select("*").eq("id", id).single();

    if (error || !blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }
    const { data: response, error: errorUpdate } = await supabase
      .from("blogs")
      .update(req.body)
      .eq("id", id)
      .select();

    if (errorUpdate) {
      throw new Error(error.message);
    }
    return res.status(200).json({
      message: "Update blog successfully",
      data: response,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error while update blog" });
  }
};
