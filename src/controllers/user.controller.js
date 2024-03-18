const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const db = require("../models");
// const { user: User } = db;
// const { Op } = require("sequelize");
const { removeImage } = require("../utils/imageUtils.js");
const supabase = require("../utils/supabase.js");

exports.signUp = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Password and confirm password must be the same",
      });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // const response = await User.create({
    //   ...req.body,
    //   password: hashedPassword,
    // });
    delete req.body.confirmPassword;

    const { data: response, error } = await supabase
      .from("users")
      .insert([{ ...req.body, password: hashedPassword }])
      .select();

    if (error) {
      return res.status(500).json({
        message: error?.message || "Error when signup user",
      });
    }

    return res.status(201).json({
      message: "User created",
      data: {
        id: response.id,
        name,
        email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when signup user",
    });
  }
};

exports.signIn = async (req, res) => {
  try {
    // const user = await User.findOne({
    //   where: {
    //     email: req.body.email,
    //   },
    // });
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", req.body.email)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "Email Not Registered",
      });
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(400).json({
        message: "Wrong Password",
      });
    }

    const { id, name, email, role } = user;
    const accessToken = jwt.sign({ id, name, email, role }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id, name, email, role }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    // await User.update(
    //   {
    //     refresh_token: refreshToken,
    //   },
    //   {
    //     where: {
    //       id,
    //     },
    //   },
    // );

    const { error: updateError } = await supabase
      .from("users")
      .update({ refresh_token: refreshToken })
      .eq("id", id);

    if (updateError) {
      return res.status(500).json({ message: "Error updating refresh token" });
    }

    const currentDate = new Date();
    const exp = currentDate.getTime() + 15 * 60 * 1000;

    res.cookie("expire", exp, {
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: true,
      sameSite: "Strict",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: true,
      sameSite: "Strict",
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      secure: true,
      sameSite: "Strict",
    });

    res.cookie("userId", id, {
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: true,
      sameSite: "Strict",
    });
    return res.status(200).json({
      message: "Successfully logged in",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when signin user",
    });
  }
};

exports.signOut = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token not found",
      });
    }

    // const user = await User.findOne({
    //   where: {
    //     refresh_token: refreshToken,
    //   },
    // });

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("refresh_token", refreshToken)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // await User.update(
    //   {
    //     refresh_token: null,
    //   },
    //   {
    //     where: {
    //       id: user.id,
    //     },
    //   },
    // );

    await supabase.from("users").update({ refresh_token: null }).eq("id", user.id);

    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");
    res.clearCookie("userId");
    res.clearCookie("expire");
    return res.status(200).json({
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when signout user",
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    // const user = await User.findOne({
    //   where: {
    //     refresh_token: refreshToken,
    //   },
    // });
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("refresh_token", refreshToken)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
      if (err) {
        return res.status(403).json({
          message: "Invalid refresh token",
        });
      }
      const { id, name, email, role } = decode;
      const currentDate = new Date();
      const exp = currentDate.getTime() + 15 * 60 * 1000;

      const accessToken = jwt.sign({ id, name, email, role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 minutes
        secure: true,
        sameSite: "Strict",
      });
      res.cookie("expire", exp, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: true,
        sameSite: "Strict",
      });

      res.cookie("userId", id, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: true,
        sameSite: "Strict",
      });

      return res.status(200).json({
        message: "Successfully new token",
        exp,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when refresh token",
    });
  }
};
exports.currentUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        message: "Refresh token not found",
      });
    }

    // const user = await User.findOne({
    //   where: {
    //     refresh_token: refreshToken,
    //   },
    //   attributes: ["id", "name", "email", "role", "profilePicture"],
    // });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role, profilePicture")
      .eq("refresh_token", refreshToken)
      .single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decode) => {
      if (err) {
        return res.status(403).json({
          message: "Invalid refresh token",
        });
      }
      return res.status(200).json({
        message: "Successfully check user",
        data: user,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when refresh token",
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    // const users = await User.findAll({
    //   where: {
    //     [Op.or]: [
    //       { name: { [Op.iLike]: `%${keyword}%` } },
    //       { email: { [Op.iLike]: `%${keyword}%` } },
    //     ],
    //   },
    //   attributes: ["id", "name", "email", "role", "profilePicture"],
    // });

    const { data: users, error } = await supabase
      .from("users")
      .select("id, name, email, role, profilePicture")
      .ilike("name", `%${keyword}%`)
      .ilike("email", `%${keyword}%`);
    return res.status(200).json({
      message: "Successfully get all users",
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when get all users",
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    // const user = await User.findByPk(id);

    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (user) {
      return res.status(200).json({
        message: "Successfully get user by id",
        data: user,
      });
    }
    if (error) {
      return res.status(404).json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when get user by id",
    });
  }
};

exports.updateUserById = async (req, res) => {
  if (req.body.password) {
    req.body.password = bcrypt.hashSync(req.body.password, 8);
  }
  try {
    const id = req.params.id;
    const profilePicture = req.file?.filename;
    if (req.fileValidationError) {
      return res.status(400).json({
        message: req.fileValidationError,
      });
    }

    // const user = await User.findByPk(id);
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    } else if (user) {
      if (profilePicture) {
        if (user.profilePicture) {
          removeImage(user.profilePicture);
        }
      }

      const { name, email } = req.body;

      if (email === user.email) {
        delete req.body.email;
      }

      // await User.update(
      //   { ...req.body, profilePicture },
      //   {
      //     where: {
      //       id,
      //     },
      //   },
      // );

      await supabase
        .from("users")
        .update({ ...req.body, profilePicture })
        .eq("id", id);

      res.cookie("name", name, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: true,
        sameSite: "Strict",
      });
      res.cookie("email", email, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: true,
        sameSite: "Strict",
      });

      return res.status(200).json({
        message: "Successfully update profile",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when update profile",
    });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const id = req.params.id;
    // const user = await User.findByPk(id);
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (user) {
      if (user.profilePicture) {
        removeImage(user.profilePicture);
      }
      // await user.destroy({
      //   where: {
      //     id,
      //   },
      // });
      await supabase.from("users").delete().eq("id", id);
      return res.status(200).json({
        message: "Successfully delete user",
      });
    }
    return res.status(404).json({
      message: "User not found",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error?.message || "Error when delete user",
    });
  }
};
