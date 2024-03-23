const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../utils/supabase.js");

const isProd = process.env.NODE_ENV === "production";

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
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
    });

    res.cookie("userId", id, {
      httpOnly: false,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
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
    const refreshToken = req.cookies?.refreshToken;
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
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
      });
      res.cookie("expire", exp, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
      });

      res.cookie("userId", id, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
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
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();
    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    return res.status(200).json({
      message: "Successfully get user by id",
      data: user,
    });
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
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (error || !user) {
      return res.status(404).json({
        message: "User not found",
      });
    } else if (user) {
      const { name, email } = req.body;

      if (email === user.email) {
        delete req.body.email;
      }

      await supabase.from("users").update(req.body).eq("id", id).select();

      res.cookie("name", name, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
      });
      res.cookie("email", email, {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
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
    const { data: user, error } = await supabase.from("users").select("*").eq("id", id).single();

    if (user) {
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
