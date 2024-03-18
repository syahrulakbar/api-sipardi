// const db = require("../models");
// const Blog = db.blog;
const { removeImage } = require("../utils/imageUtils");
// const { Op } = require("sequelize");
const supabase = require("../utils/supabase");

exports.createBlog = async (req, res) => {
  const author = req.userId;
  const image = req.file?.filename;
  if (req.fileValidationError) {
    return res.status(400).send({
      message: req.fileValidationError,
    });
  }

  try {
    // const response = await Blog.create({ ...req.body, image, author });
    const { data: response, error } = await supabase
      .from("blogs")
      .insert([{ ...req.body, image, author }])
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
    removeImage(image);
    res.status(500).send({ message: "Error while creating blog" });
  }
};

exports.getAllBlog = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    // const response = await Blog.findAll({
    //   where: {
    //     title: {
    //       [Op.iLike]: `%${keyword}%`,
    //     },
    //   },
    // });

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
    // const blog = await Blog.findByPk(id);
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
    // const blog = await Blog.findByPk(id);
    const { data: blog, error } = await supabase.from("blogs").select("*").eq("id", id).single();
    if (error || !blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }
    if (blog.image) removeImage(blog.image);
    // await blog.destroy({ where: { id } });
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
  const image = req.file?.filename;
  try {
    // const blog = await Blog.findByPk(id);
    const { data: blog, error } = await supabase.from("blogs").select("*").eq("id", id).single();

    if (error || !blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }
    if (image) {
      removeImage(blog.image);
    }
    // const response = await blog.update({ ...req.body, image }, { where: { id } });
    const { data: response, error: errorUpdate } = await supabase
      .from("blogs")
      .update([{ ...req.body, image }])
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
    removeImage(image);

    res.status(500).send({ message: "Error while update blog" });
  }
};
